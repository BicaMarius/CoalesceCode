# SECURITY.md — Protocoale de Securitate
> Citit AUTOMAT când task-ul implică: auth, plăți, date personale, upload fișiere, API extern.
> Rolul SECURITY se activează automat în aceste situații.
> Niciun compromis de securitate fără notificare explicită și documentare.

---

## ◈ CÂND SE ACTIVEAZĂ ROLUL SECURITY

Automat, fără să fie nevoie să spui tu, când:
- Implementezi autentificare sau autorizare
- Lucrezi cu date personale ale utilizatorilor (GDPR relevant)
- Integrezi plăți (Stripe, PayPal, etc.)
- Adaugi upload de fișiere
- Creezi sau modifici endpoint-uri API publice
- Configurezi hosting, DNS, SSL, CDN
- Lucrezi cu variabile de mediu și secrete
- Implementezi orice formular care trimite date la server

---

## ◈ OWASP TOP 10 — VERIFICARE OBLIGATORIE

La fiecare task de securitate, agentul verifică explicit:

### 1. Broken Access Control
```
□ Utilizatorul poate accesa DOAR resursele proprii
□ Admin routes protejate separat de user routes
□ IDOR (Insecure Direct Object Reference) prevenit
  → Nu expui ID-uri secvențiale în URL (/users/1, /users/2)
  → Verifică întotdeauna că resursa aparține userului autentificat
□ JWT/session validat server-side la FIECARE request, nu doar la login
□ Role-based access implementat și testat
```

### 2. Cryptographic Failures
```
□ Zero date sensibile în URL-uri (tokenuri, parole, ID-uri private)
□ HTTPS enforced pe toate rutele (redirect HTTP → HTTPS)
□ Parole hash-uite cu bcrypt/argon2 (minim cost factor 12)
□ Tokens generate criptografic (crypto.randomBytes, nu Math.random)
□ Sensitive data în DB: encrypt la rest dacă e critic (chei CC, SSN)
□ JWT secret: minim 256 bits, rotit periodic
```

### 3. Injection
```
□ Zero string interpolation în SQL queries → parametrizare obligatorie
□ ORM folosit corect (Prisma, Drizzle) — nu raw queries cu input user
□ NoSQL injection verificat dacă folosim MongoDB
□ Command injection: nu execuți comenzi shell cu input user
□ LDAP injection dacă e cazul
```

### 4. Insecure Design
```
□ Threat modeling făcut înainte de implementare feature-uri critice
□ Rate limiting pe: login, register, reset password, toate API-urile publice
□ Account lockout după N încercări eșuate
□ Principiul least privilege: fiecare serviciu are doar permisiunile necesare
```

### 5. Security Misconfiguration
```
□ Zero credențiale hardcodate (nici în cod, nici în comentarii)
□ .env.local în .gitignore — verificat
□ Erori server nu expun stack traces în producție
□ Headers de securitate setate (CSP, HSTS, X-Frame-Options)
□ CORS configurat restrictiv (nu wildcard în producție)
□ Debug mode OFF în producție
```

### 6. Vulnerable Components
```
□ Dependențe la zi (npm audit înainte de push major)
□ Librării cu vulnerabilități cunoscute înlocuite
□ Lock file (package-lock.json / pnpm-lock.yaml) în git
```

### 7. Authentication Failures
```
□ Sesiuni invalidate la logout (server-side)
□ Remember me: token separat, revocabil
□ Password reset: token single-use, expiră în 15-60 min
□ Email verification pentru conturi noi
□ MFA available (opțional pentru useri, recomandat pentru admin)
□ Brute force protection pe login
```

### 8. Software Integrity Failures
```
□ Dependențe din surse verificate
□ CI/CD pipeline cu verificări de securitate
□ Semnătură digitală pentru pachete critice
```

### 9. Security Logging
```
□ Login success/failure logat cu IP și timestamp
□ Acces la resurse sensibile logat
□ Tentative de bypass loggate și alertate
□ Logs nu conțin date sensibile (parole, tokenuri, CC numbers)
□ Logs centralizate (Axiom, Logtail, AWS CloudWatch)
```

### 10. Server-Side Request Forgery (SSRF)
```
□ URL-uri din input user validate și sanitizate
□ Whitelist pentru domenii permise dacă faci fetch cu input user
□ Nu expui metadata cloud (AWS 169.254.169.254)
```

---

## ◈ AUTENTIFICARE — IMPLEMENTARE CORECTĂ

### JWT Setup
```typescript
// ✅ Corect
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET!, // minimum 256-bit secret
  { 
    expiresIn: '15m',        // access token scurt
    algorithm: 'HS256',
    issuer: 'your-app-name'
  }
)

// ✅ Refresh token separat, longev, stocat în DB
const refreshToken = crypto.randomBytes(32).toString('hex')
// Salvează hash(refreshToken) în DB, nu raw

// ❌ Greșit
const token = jwt.sign({ userId }, 'secret123') // secret slab, fără expiry
```

### Session Management
```typescript
// ✅ HttpOnly cookies pentru tokens (protecție XSS)
res.cookie('access_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000 // 15 minute
})

// ❌ Nu stoca tokenuri în localStorage (vulnerabil la XSS)
localStorage.setItem('token', token) // GREȘIT
```

### Middleware de autorizare
```typescript
// ✅ Verifică ownership la fiecare request
async function requireOwnership(req, res, next) {
  const resource = await db.resource.findUnique({ where: { id: req.params.id } })
  if (!resource || resource.userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  next()
}
// Nu te baza pe client să trimită userId — extrage din token
```

---

## ◈ VALIDARE INPUT — REGULI STRICTE

```typescript
// ✅ Validare server-side cu Zod (sau Yup/Valibot)
const CreateUserSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100).trim(),
})

// Aplică pe ORICE input user, inclusiv query params și headers

// ✅ Sanitizare output pentru prevenire XSS
// Next.js face asta automat în JSX, dar ai grijă la dangerouslySetInnerHTML
// Folosește DOMPurify dacă afișezi HTML din user input
```

---

## ◈ UPLOAD FIȘIERE — PROTOCOL COMPLET

```typescript
// ✅ Verificări obligatorii la upload
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

// 1. Validare tip pe server (nu doar extension sau MIME din header)
// 2. Scanare magic bytes pentru tip real
// 3. Redenumire fișier (nu păstra numele original — path traversal)
// 4. Stocare în cloud (S3/Supabase), nu pe server local
// 5. URL presigned pentru access (nu expune storage direct)
// 6. Antivirus scan dacă accept orice tip de fișier
```

---

## ◈ HEADERS DE SECURITATE

```typescript
// Next.js — next.config.ts
const headers = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // ajustează pentru librăriile tale
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://api.yourdomain.com",
    ].join('; ')
  }
]
```

---

## ◈ HOSTING, DNS, SSL — BEST PRACTICES

### SSL/TLS
```
□ SSL certificate valid și auto-renew activat
□ TLS 1.2 minimum enforced (TLS 1.3 preferat)
□ HSTS header setat cu preload
□ Mixed content (HTTP în HTTPS) zero
□ Certificate Transparency monitoring
```

### DNS
```
□ DNSSEC activat dacă provider-ul suportă
□ SPF record pentru domeniu email
□ DKIM configurat pentru email provider
□ DMARC policy setat (cel puțin p=none pentru monitoring)
□ Subdomain takeover prevenit (verifică CNAME-uri orfane)
```

### CDN (Cloudflare recomandat)
```
□ DDoS protection activat
□ Bot protection / Turnstile pentru forme
□ Web Application Firewall (WAF) reguli de bază
□ Rate limiting la nivel CDN
□ Cache-Control headers setați corect
□ Sensitive routes excluse din cache
```

### Environment & Secrets
```
□ Secrete în environment variables (nu în cod)
□ Secrets manager în producție (Doppler, AWS Secrets Manager)
□ Rotire regulată a API keys și tokens
□ Minimum permissions pentru fiecare serviciu
□ Zero cross-environment secrets (prod nu partajează cu staging)
```

---

## ◈ GDPR & DATE PERSONALE

```
Date personale = orice informație care identifică sau poate identifica o persoană.
Include: email, nume, IP, cookies tracking, date de comportament cu identificator.

Obligații:
□ Privacy Policy actualizată și accesibilă
□ Consimțământ explicit înainte de cookies non-esențiale
□ Drept de ștergere (delete account = ștergere date, nu doar dezactivare)
□ Drept de export date (JSON cu datele userului la cerere)
□ Data breach notificare în 72h dacă e cazul
□ DPA cu fiecare processor de date (Stripe, Supabase, etc.)
□ Date minime colectate (nu strânge ce nu folosești)
□ Retenție definită (cât timp păstrezi și de ce)
```

---

## ◈ RATE LIMITING — CONFIGURARE

```typescript
// Rate limiting per endpoint (exemplu cu Upstash Redis + Next.js)
const limits = {
  '/api/auth/login':          { requests: 5,   window: '15m' }, // 5 încercări/15min
  '/api/auth/register':       { requests: 3,   window: '1h'  }, // 3 conturi/oră/IP
  '/api/auth/reset-password': { requests: 3,   window: '1h'  },
  '/api/*':                   { requests: 100, window: '1m'  }, // 100 req/min general
  '/api/ai/*':                { requests: 10,  window: '1m'  }, // mai strict pentru AI
}
```

---

## ◈ CHECKLIST PRE-LAUNCH SECURITATE

```
□ npm audit / pnpm audit — zero vulnerabilități high/critical
□ Secrets scan (truffleHog sau git-secrets) în repository
□ Toate endpoint-urile testate cu autentificare lipsă → 401
□ Toate endpoint-urile testate cu autorizare insuficientă → 403
□ SQL injection testat pe toate input-urile care ajung la DB
□ XSS testat pe toate câmpurile care afișează input user
□ Rate limiting verificat funcțional
□ HTTPS enforced și certificat valid
□ Headers de securitate verificate (securityheaders.com)
□ CSP verificat fără 'unsafe-eval'
□ Logs nu conțin date sensibile
□ Backup și recovery plan testat
□ Incident response plan documentat
```

---

## ◈ MONITORIZARE SECURITATE

```
Tool-uri recomandate (free tier):
- Sentry          → error tracking cu context
- Upstash         → rate limiting + audit logs
- Cloudflare      → WAF, DDoS, analytics trafic
- Have I Been Pwned API → verificare email la breach (opțional)

Alerting:
- Rate limit depășit persistent → alert
- Multiple login failures de pe același IP → alert + lockout
- Erori 500 frecvente → alert (pot indica tentativă de exploitation)
- Comportament neobișnuit DB (queries lente, volum mare) → alert
```
