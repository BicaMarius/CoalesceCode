# BUSINESS_LOGIC.md — Marketing, SEO, Analytics, Pricing & Business Strategy
> Actualizat la fiecare lansare majoră (MVP v1.0, v2.0 etc.) și când strategia se schimbă.
> Informează agentul despre contextul de business — deciziile tehnice trebuie să alinieze
> cu obiectivele produsului, nu doar cu preferințele de engineering.

---

## ◈ PROFIL PRODUS

```
Tip produs:        SaaS Tool (Web Application)
Piața țintă:       Global (English primary) — focus secundar România
Audiență:          Developers (junior to senior), Engineering teams, Tech companies
Dimensiune piață:  Global developer tools market: $25B+ (growing)
                   Target segment: Code visualization & documentation tools
Regiune lansare:   Global — English language first, Romanian localization in v2
Monetizare:        Freemium (Free tier + Pro subscription)
Preț:              Free: 3 projects, basic diagrams
                   Pro: $9.99/month — unlimited projects, advanced features
Competitori:       Sourcegraph (code search focus), CodeScene (analytics focus)
                   Mermaid Live (manual diagrams), Lucidchart (general diagramming)
Diferențiator:     Automatic generation + Developer-focused + Project-specific context
                   No manual diagram creation needed — instant visualization
```

---

## ◈ ÎNTREBĂRI DE ONBOARDING BUSINESS

Agentul pune aceste întrebări la prima populare a acestei secțiuni, sau la lansare majoră nouă:

```
📊 Business & Marketing — câteva întrebări:

1. Cine este audiența principală și unde se află?
   (ex: "studenți români 18-25" / "proprietari IMM din EU" / "gameri indie globali")

2. Ce atingere îți dorești?
   - Câți useri în primele 3 luni?
   - Câți în primul an?
   - Regiuni geografice prioritare?

3. Care este bugetul de marketing (dacă există)?
   (ex: "€0 — doar organic" / "€200/lună" / "€1000 la lansare")

4. Ai canale de marketing deja configurate?
   (conturi social, audiență existentă, newsletter, comunitate, etc.)

5. Ce model de prețuri ai în minte?
   (sau "nu știu încă — sugerează ceva")

6. Cum arată succesul pentru această lansare?
   (ex: "1000 descărcări în 30 zile" / "€500 MRR în 3 luni" / "10 clienți plătitori")
```

---

## ◈ ANALIZĂ DE PIAȚĂ

**Data cercetării:** [YYYY-MM-DD] — datele de piață expiră, actualizează periodic.

### Piața Românească — Specificități
```
Penetrare internet:     ~88% din populație (una dintre cele mai rapide creșteri din EU)
Utilizatori mobile:     ~65% din trafic de pe mobil
Metode de plată:        Card (Visa/MC), PayPal, Google/Apple Pay — cash încă relevant
App store behavior:     Android ~75%, iOS ~25%
Platforme sociale:      Facebook (dominant 40+), Instagram (18-35), TikTok (Gen Z), LinkedIn (B2B)
Sensibilitate preț:     Ridicată — piața românească e orientată spre preț
Limbi preferate:        Română primary, Engleză acceptată sub 40 ani
Ore de vârf:            19:00–23:00 ora României (gaming mobil / social)
E-commerce growth:      +25% YoY — piață în creștere rapidă
Mobile gaming RO:       Top 10 EU ca timp petrecut per user
```

### Analiză Competitori
| Competitor | Puncte forte | Puncte slabe | De ce câștigăm |
|---|---|---|---|
| [Nume] | [Ce face bine] | [Gap-ul lor] | [Avantajul nostru] |
| [Nume] | [Punct forte] | [Gap] | [Avantaj] |

### Oportunități de Piață
```
Segmente neservite:      [Pe cine ignoră competitorii]
Avantaje de timing:      [De ce acum e momentul bun]
Gap-uri de platformă:    [Ce nu există încă și utilizatorii au nevoie]
```

---

## ◈ SEO STRATEGY — APLICAȚII & JOCURI

> Agentul implementează elementele tehnice SEO ca parte din orice task relevant.
> Această secțiune acoperă atât SEO web, cât și ASO (App Store Optimization).

### SEO Web (pentru landing page, blog, web app)

#### Cercetare cuvinte cheie — proces
La fiecare feature nou sau pagină nouă, agentul:
1. Identifică intenția de căutare (informațională / navigațională / tranzacțională)
2. Sugerează 3-5 cuvinte cheie principale și 5-10 long-tail
3. Verifică volumul și competiția pentru piața țintă
4. Recomandă structura de conținut optimă

**Tool-uri gratuite recomandate:**
- Google Search Console (gratuit — date reale din Google)
- Google Keyword Planner (gratuit cu cont Google Ads)
- Ubersuggest (3 căutări/zi gratuit)
- Answer The Public (vizualizare întrebări reale ale utilizatorilor)
- Ahrefs Webmaster Tools (gratuit pentru propriul site)

#### Implementare tehnică SEO — checklist per pagină
Agentul verifică acestea la orice task care implică o pagină nouă:

**Meta tags (Next.js Metadata API):**
```typescript
// src/app/[page]/page.tsx
export const metadata: Metadata = {
  title: '[Keyword principal] | [Nume produs]',  // 50-60 caractere
  description: '[Descriere cu keyword, beneficiu clar, CTA]',  // 150-160 caractere
  keywords: ['keyword1', 'keyword2'],  // opțional, impact mic
  openGraph: {
    title: '[OG Title — poate fi diferit de title]',
    description: '[OG Description]',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
    locale: 'ro_RO',
    siteName: '[Nume produs]',
  },
  twitter: {
    card: 'summary_large_image',
    title: '[Twitter Title]',
    description: '[Twitter Description]',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://yourdomain.com/[path]',
    languages: { 'ro': 'https://yourdomain.com/ro/[path]' },
  },
}
```

**Structured Data (Schema.org):**
```typescript
// Pentru SaaS / Web App
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: '[Nume produs]',
  applicationCategory: 'WebApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '150',
  },
}

// Pentru Joc
const gameStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name: '[Nume joc]',
  genre: '[Gen]',
  gamePlatform: ['PC', 'Mobile'],
  applicationCategory: 'Game',
}
```

**Core Web Vitals — targets obligatorii:**
```
LCP (Largest Contentful Paint):  < 2.5s  ← imagine hero sau H1
FID / INP (Interaction):         < 200ms ← răspuns la click
CLS (Cumulative Layout Shift):   < 0.1   ← fără layout shift la încărcare

Verificare: Google PageSpeed Insights + Chrome DevTools Lighthouse
```

**Structură URL:**
```
✅ https://yourdomain.com/features/authentication
✅ https://yourdomain.com/blog/cum-sa-faci-x
✅ https://yourdomain.com/ro/pricing

❌ https://yourdomain.com/page?id=123
❌ https://yourdomain.com/features/auth-v2-final-new
```

**Sitemap și robots.txt:**
```typescript
// src/app/sitemap.ts
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://yourdomain.com', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://yourdomain.com/features', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    // ... toate paginile indexabile
  ]
}

// src/app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/admin/', '/dashboard/'] },
    sitemap: 'https://yourdomain.com/sitemap.xml',
  }
}
```

**Imagini optimizate:**
```typescript
// Folosește întotdeauna next/image — nu <img> raw
import Image from 'next/image'

<Image
  src="/hero.webp"
  alt="[Descriere specifică — nu 'imagine hero']"
  width={1200}
  height={630}
  priority  // pentru imaginea above-the-fold
  placeholder="blur"
/>
```

#### Conținut SEO — strategie blog/landing
```
Tipuri de pagini cu impact mare:
  1. Landing pages per feature (ex: /features/analytics → target "analytics pentru [nișă]")
  2. Comparații (ex: /vs/competitor-name → target "[produs nostru] vs [competitor]")
  3. Tutorial/How-to (ex: /blog/cum-sa-faci-X → target "cum fac X")
  4. Cazuri de utilizare (ex: /use-cases/freelancers → target "tool pentru freelanceri")

Frecvență minimă pentru blog: 1 articol/săptămână (500-1500 cuvinte)
Format optim: H1 cu keyword → intro → 3-5 H2 cu subtopice → CTA → FAQ (Schema.org)
```

---

### ASO — App Store Optimization (Mobile / Desktop)

#### Google Play Store
```
Titlu (50 caractere):     [Keyword principal] — [beneficiu scurt]
Descriere scurtă (80):    [One-liner cu keyword + beneficiu clar]
Descriere lungă (4000):   Primele 3 rânduri sunt critice (above fold)
                           Keyword density: 2-3% — natural, nu forțat
                           Include: features, use cases, social proof, CTA

Screenshots (8 max):
  1. Hero feature + bold headline
  2. Feature cheie 1 în acțiune
  3. Feature cheie 2
  4. Social proof (rating / număr useri)
  5-8. Alt use cases / features

Video preview (30 sec):  Primele 5 secunde arată valoarea principală
                          Fără voiceover — text suprapus, muzică
                          Arată UI real, nu animații exagerate

Categorie:               Alege cu atenție — afectează căutările in-store
Tag-uri / Cuvinte cheie: Maximum 500 caractere (Google Play)
```

#### Apple App Store
```
Titlu (30 caractere):     Mai scurt — keyword principal
Subtitlu (30 caractere):  Al doilea keyword + beneficiu
Cuvinte cheie (100 car.): Separat prin virgulă, fără spații
                           Nu repeta cuvinte din titlu/subtitlu
Descriere (4000 car.):    Primele 255 caractere sunt "above fold"
                           Nu modifică ranking-ul (Apple nu indexează descrierea)
                           Dar contează pentru conversie

In-App Events:            Folosește pentru a promova updates majore
                           Apar în search results și editorial

App Store Connect metrics:
  Impressions → Product Page Views → Downloads → In-App Purchases
  Fiecare tranziție e o oportunitate de optimizare
```

#### Rating & Reviews — strategie
```
Moment optim pentru cerere rating:  După o acțiune de succes (task completat, nivel trecut)
                                     NU la primul launch
Frecvență:                          Max 3 cereri/an (Apple policy)
Răspuns la review-uri negative:     <24h, specific, cu rezolvare sau ETA

Target rating:
  Sub 3.5 ★  → Produsul este în pericol (app store poate reduce vizibilitatea)
  3.5–4.0 ★  → Decent, dar optimizabil
  4.0–4.5 ★  → Bun — acceptabil pentru lansare
  4.5+ ★     → Excelent — boost semnificativ în ranking
```

---

## ◈ IMPLEMENTARE ANALYTICS

> Fiecare feature care merge în producție include tracking relevant.
> Agentul implementează asta ca parte din Stage 4, nu ca afterthought.

### Stack Recomandat (free/ieftin)

| Tool | Scop | Tier gratuit | Cost |
|---|---|---|---|
| **PostHog** | Product analytics, funnels, session replay | 1M events/lună | Gratuit până la limită |
| **Plausible** | Web analytics privacy-first (GDPR by default) | — | €9/lună |
| **Google Analytics 4** | Insights SEO, surse de trafic | Nelimitat | Gratuit |
| **Google Search Console** | Performance în search Google | Nelimitat | Gratuit |
| **Hotjar** | Heatmaps, session recordings | 35 sesiuni/zi | Gratuit |

**Setup recomandat:** PostHog (principal) + Google Search Console (SEO) + Sentry (erori).

### Evenimente Core (agentul le implementează implicit)
```typescript
// Vizualizare pagini — automat cu PostHog
posthog.capture('page_viewed', { path: window.location.pathname })

// Funnel principal
posthog.capture('signup_started')
posthog.capture('signup_completed', { method: 'email' | 'google' })
posthog.capture('onboarding_completed')
posthog.capture('first_core_action')

// Monetizare
posthog.capture('paywall_shown', { source: 'upgrade_prompt' | 'feature_gate' })
posthog.capture('payment_started', { plan: 'pro', price: 9.99 })
posthog.capture('payment_completed', { plan: 'pro' })
posthog.capture('payment_failed', { error: error.code })
posthog.capture('subscription_cancelled', { reason: 'cancel_survey' })

// SEO / Achiziție
posthog.capture('organic_search_landing', { keyword: utm_term, source: referrer })
posthog.capture('cta_clicked', { location: 'hero' | 'pricing' | 'footer', text: btnText })
```

### Metrici Cheie de Dashboard
```
Achiziție:
  DAU / WAU / MAU
  Signup-uri pe zi
  Sursa traficului (organic / direct / social / paid / referral)
  Rata conversie app store (impresii → descărcări)
  Keyword rankings top 10 (Search Console)

Activare:
  Signup → prima acțiune core (rata și timpul)
  Rata completare onboarding
  Time to First Value (TTFV)

Retenție:
  Day 1, Day 7, Day 30 retenție
  Lungime medie sesiune
  Rata adopție feature

Monetizare:
  Free → Paid conversie
  MRR (Monthly Recurring Revenue)
  ARPU (Average Revenue Per User)
  Rata churn
  LTV estimat

SEO:
  Impressions, Clicks, CTR, Poziție medie (Search Console)
  Trafic organic MoM
  Pagini indexate vs total pagini
  Core Web Vitals score
```

---

## ◈ STRATEGIE DE PREȚURI

### Prețuri Curente
```
Tier gratuit:        [Ce include — "cârligul"]
[Nume plan]:         [€X/lună — ce deblochează]
[Nume plan]:         [€Y/lună sau one-time — acces complet]
Discount anual:      [% reducere pentru plată anuală — tipic 20-30%]
```

### Principii de Prețuri
**Anchor pricing:** Arată cel mai scump tier primul, apoi mijlocul, apoi gratuit. Mijlocul e ținta.
**Value metric:** Prețul trebuie să scaleze cu valoarea (locuri / storage / apeluri API / features).
**Piața românească:** Sensibilitate la preț ridicată — €9.99/lună este aproape de tavanul psihologic B2C. €4.99/lună are conversie mai bună. Planurile anuale ajută semnificativ.

---

## ◈ MARKETING ROADMAP

### Lansare MVP (v1.0)

**Obiectiv:** [X useri în 30 zile / €Y MRR]
**Buget:** [€Z]

**Canale prioritare:**
1. [Canal principal — de ce e primul pentru acest produs]
2. [Canal secundar]
3. [Canal terțiar]

**Checklist săptămâna lansării:**
- [ ] Product Hunt (cea mai bună zi: Marți–Joi, 12:01am PST)
- [ ] Reddit posts în subreddit-uri relevante
- [ ] Thread Twitter/X de lansare
- [ ] Post LinkedIn (pentru produse B2B)
- [ ] Video demo TikTok (pentru produse consumer în România — ROI ridicat)
- [ ] Postări în grupuri Facebook românești (foarte active)
- [ ] Blast pe lista de email (dacă există audiență)
- [ ] Outreach personal la 10-20 persoane pentru primii utilizatori

---

## ◈ STRATEGIE CONȚINUT & SOCIAL MEDIA

### Strategie pe platforme
| Platformă | Format | Frecvență | Obiectiv |
|---|---|---|---|
| X/Twitter | Code screenshots + diagrams | 4-5x/săpt. | Dev community, virality |
| LinkedIn | Technical deep-dives, case studies | 2-3x/săpt. | B2B, enterprise reach |
| Reddit | r/webdev, r/programming discussions | 2x/săpt. | Community building |
| Dev.to | Technical blog posts | 1x/săpt. | SEO, thought leadership |
| Hacker News | Show HN posts | Monthly | Tech-savvy early adopters |
| YouTube Shorts | Quick feature demos | 2x/săpt. | Discovery, tutorials |
| GitHub | Open source contributions, discussions | Continuous | Credibility, integration |
| Discord/Slack | Developer communities | Continuous | Support, engagement |

### Formule Hook Care Funcționează
```
Hook-uri vizuale:
  — "Before vs After" split screen
  — "POV: tocmai ai descoperit [produs]"
  — Interacțiune UI satisfăcătoare în slow motion
  — Dashboard cu cifre impresionante

Hook-uri text:
  — "Am construit X în Y zile cu [tool]"
  — "Oprește-te din [lucru dureros]. Există o variantă mai bună."
  — "Dacă [problemă], trebuie să vezi asta"
  — Întrebări: "Ești încă [lucru ineficient]?"

Hook-uri emoționale:
  — Frustrare → soluție (arată durerea, apoi ușurarea)
  — Timp economisit (arată cronometrul, apoi arată 10 secunde cu tool-ul tău)
  — Social proof (testimoniale reale ale utilizatorilor, scurte și specifice)
```

### Tool-uri AI pentru Creare Conținut
| Tool | Utilizare | Cost |
|---|---|---|
| **Claude / ChatGPT** | Copy, caption-uri, articole blog | Gratuit / Paid |
| **Canva** | Grafice social, banere, postere | Gratuit / €12/lună Pro |
| **CapCut** | Editare video + caption-uri auto | Gratuit |
| **Buffer / Later** | Planificare postări multi-platformă | Tier gratuit / €15/lună |
| **Opus Clip** | Taie video lungi în clipuri automat | Tier gratuit |
| **ElevenLabs** | Voiceover AI pentru video-uri | Tier gratuit |

---

## ◈ GHID ACTIVE VIZUALE

### Screenshot-uri App Store (Mobile)
```
Screen 1: Hero — propunere de valoare + screenshot curat al app-ului + headline bold
Screen 2: Feature 1 — feature cheie în acțiune
Screen 3: Feature 2 — al doilea diferențiator
Screen 4: Social proof — rating, număr useri, testimonial
Screen 5: CTA — "Descarcă gratuit" / "Începe acum"

Dimensiuni: 1290×2796px (iPhone 15 Pro Max) · 1242×2688px (iPhone 11 Pro Max)
```

### Principii Design Bannere Publicitare
```
Regula celor 3: Imagine · Titlu · CTA (orice altceva e zgomot)
Titlu: Maximum 6 cuvinte. Beneficiu, nu feature.
Buton CTA: Culoare contrastantă, verb imperativ ("Încearcă gratuit" / "Descarcă acum")
Font size: Titlu ≥ 40px echivalent la dimensiunea finală
```

---

## ◈ ALOCARE BUGET MARKETING

### Pentru €0 (Organic only)
```
Focus 100% pe:
  — Developer-focused content (X/Twitter, LinkedIn, Reddit, Dev.to)
  — Open source contributions and GitHub presence
  — Technical blog posts (SEO for "code visualization", "architecture diagrams", "dependency graph")
  — Hacker News Show HN + Product Hunt launch
  — Developer Discord/Slack communities (engagement, not spam)
  — Free tier with clear upgrade path to convert power users

Timeline la tracțiune: 3-6 luni cu efort consistent
Target: 500 free users → 20 paid conversions ($200 MRR) în 3 luni
```

### Pentru €100-500/lună
```
Alocare:
  40% — Developer-focused ads (Twitter Ads targeting developers, LinkedIn B2B)
  30% — Content creation tools (technical screencast tools, diagram assets)
  20% — Sponsorship în tech newsletters (JavaScript Weekly, Frontend Focus)
  10% — SEO tools (Ahrefs/Semrush basic tier)

Return așteptat: Focus pe brand awareness, not immediate ROI
Target: 2,000 free users → 100 paid conversions ($1,000 MRR) în 6 luni
```

### Pentru €500-2000/lună
```
Alocare:
  50% — Reclame social plătite (pe canalele deja dovedite)
  20% — Micro-influencer partnerships (nișă, nu celebritate)
  15% — Creare conținut SEO (freelanceri)
  10% — Campanii retargeting (cel mai bun ROI pentru audiențe calde)
   5% — Tool-uri și automatizare
```

---

## ◈ LOG LANSĂRI

| Versiune | Data lansare | Obiectiv | Rezultat real | Buget marketing | Lecții |
|---|---|---|---|---|---|
| v1.0 (MVP) | [Data] | [X useri] | [Actual] | [€X] | [Lecții] |
| v1.1 | [Data] | [Obiectiv] | [Actual] | [€X] | [Lecții] |
| v2.0 | [Data] | [Obiectiv] | [Actual] | [€X] | [Lecții] |
