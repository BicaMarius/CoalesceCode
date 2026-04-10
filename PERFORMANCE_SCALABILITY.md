# PERFORMANCE_SCALABILITY.md — Performanță & Scalabilitate
> Citit automat când task-ul implică: optimizare, infrastructură, creștere de trafic,
> memorie, CPU/GPU/NPU, rețea, baze de date, sau orice discuție despre "merge lent".
> Agentul verifică aceste standarde la fiecare feature nou — nu doar la probleme.

---

## ◈ CÂND SE ACTIVEAZĂ

Automat, fără să fie nevoie să spui tu, când:
- Implementezi un feature nou (verificare proactivă)
- Raportezi că ceva merge lent sau consumă prea mult
- Adaugi o interogare la baza de date
- Integrezi un API extern sau serviciu nou
- Construiești un feature cu date în volum mare (liste, tabele, feed-uri)
- Lucrezi cu imagini, video, fișiere mari
- Adaugi animații sau efecte vizuale complexe
- Scalezi de la un număr mic de useri la mulți

---

## ◈ BUGET DE RESURSE — TARGETS OBLIGATORII

Acestea sunt limitele pe care agentul le verifică la fiecare feature:

### Web / Mobile App
```
Core Web Vitals (Google ranking factor):
  LCP  (Largest Contentful Paint):  < 2.5s   ← imaginea/textul principal apare
  INP  (Interaction to Next Paint):  < 200ms  ← răspuns la click/tap
  CLS  (Cumulative Layout Shift):    < 0.1    ← layout nu sare în timpul încărcării
  FCP  (First Contentful Paint):     < 1.8s   ← ceva apare pe ecran
  TTFB (Time to First Byte):         < 800ms  ← serverul răspunde rapid

Bundle JavaScript:
  First load JS:     < 200KB gzipped  (pagina principală)
  Per-route chunk:   < 100KB gzipped  (lazy loaded)
  Total bundle:      < 1MB gzipped    (hard limit)

CSS:
  Critical CSS inline:  < 14KB       (deasupra fold-ului)
  Total CSS:            < 100KB      (după minificare)

Imagini:
  Hero image:     < 200KB  (WebP/AVIF, lazy load off pentru above fold)
  Thumbnail:      < 30KB   (WebP)
  Icon/SVG:       < 5KB    (inline SVG preferred)
```

### API / Backend
```
Response times (p95 — 95% din request-uri):
  GET simple (fără DB):          < 50ms
  GET cu DB query:               < 200ms
  GET cu join-uri complexe:      < 500ms
  POST/mutații:                  < 1000ms
  Background jobs:               < 30s (cu progress feedback)

Throughput:
  Minimum target (lansare):      100 req/s
  Target creștere (6 luni):      1000 req/s
  Planificat pentru (1 an):      10,000 req/s

Database:
  Query simple (index):          < 10ms
  Query cu join-uri:             < 50ms
  Query aggregate complexe:      < 200ms
  Bulk operations:               < 2s

Memory per process:
  Node.js server:                < 512MB în repaus, < 1GB la peak
  Worker threads:                < 256MB fiecare
```

### Mobile App (React Native / Flutter)
```
App startup:
  Cold start:      < 3s   (de la tap la interactiv)
  Warm start:      < 1s
  Hot start:       < 300ms

Frame rate:        60fps constant (fără jank)
  GPU budget:      < 8ms/frame la 60fps
  JS thread:       < 16ms/frame (nu blochează UI thread)

Memory:
  Idle:            < 100MB RAM
  Active (normal): < 200MB RAM
  Peak:            < 300MB RAM (altfel OS-ul poate kill procesul)

Battery:
  Background:      Zero wake locks inutile
  Foreground:      Nu consuma >5% baterie/oră în utilizare normală
  Location/GPS:    Doar când e necesar, oprit imediat după

Network:
  Initial load:    < 500KB date
  Per acțiune:     < 100KB (unde posibil)
  Offline mode:    Feature-urile critice funcționează fără internet
```

### Joc (Game)
```
Frame rate target:
  Mobile:          60fps (adaptive: 30fps pe device-uri slabe)
  Desktop:         60-144fps (vsync)
  GPU frame time:  < 8.33ms la 120fps, < 16.67ms la 60fps

Memory:
  Texture budget:  < 256MB VRAM (mobile), < 1GB (desktop)
  RAM total:       < 500MB (mobile), < 2GB (desktop)
  Heap (JS/Lua):   < 50MB (script memory)

Loading times:
  Initial load:    < 5s pe conexiune 4G
  Scene/level:     < 2s
  Asset streaming: Fără freeze vizibil (async loading)

Audio:
  Latency:         < 100ms (feedback la acțiuni)
  Concurrent:      Max 32 surse simultane (mobile), 64 (desktop)
```

---

## ◈ CPU — OPTIMIZARE

### Reguli generale
```
□ Nicio operație grea pe main thread / UI thread
□ Web Workers pentru: crypto, compresie, procesare imagini, parsare date mari
□ Debounce pe: search input (300ms), resize handler (150ms), scroll (100ms)
□ Throttle pe: mouse move, touch move, animații custom
□ requestAnimationFrame pentru animații (nu setTimeout/setInterval)
□ Evită re-render-uri inutile în React (memo, useMemo, useCallback corect)
□ Profilează ÎNAINTE să optimizezi — nu ghici unde e bottleneck-ul
```

### React specific
```typescript
// ✅ Memo doar când props se schimbă rar și componenta e costisitoare
const ExpensiveList = React.memo(({ items, onSelect }) => {
  // 1000+ items, calcule complexe
}, (prev, next) => prev.items === next.items && prev.onSelect === next.onSelect)

// ✅ useMemo pentru calcule costisitoare
const sortedItems = useMemo(
  () => items.sort((a,b) => b.score - a.score),
  [items] // recalculează DOAR când items se schimbă
)

// ✅ useCallback pentru funcții pasate ca props
const handleSelect = useCallback((id: string) => {
  setSelected(id)
}, []) // fără deps = funcție stabilă

// ❌ Nu pune memo pe orice — overhead dacă compararea e mai scumpă decât re-render-ul
const TinyButton = React.memo(() => <button>ok</button>) // inutil
```

### Virtualizare liste mari
```typescript
// ✅ OBLIGATORIU pentru liste cu >100 items
import { useVirtualizer } from '@tanstack/react-virtual'

// Randează doar itemele vizibile (20-30 la un moment dat)
// Indiferent că lista are 100 sau 100,000 items
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 60, // înălțimea estimată a unui item
})
```

### Procesare în background (Web Worker)
```typescript
// worker.ts — rulează pe thread separat, nu blochează UI
self.onmessage = async (e) => {
  const { data, type } = e.data
  if (type === 'PROCESS_LARGE_DATASET') {
    const result = heavyComputation(data) // nu mai freezează UI-ul
    self.postMessage({ type: 'RESULT', result })
  }
}

// Folosire în componentă
const worker = new Worker(new URL('./worker.ts', import.meta.url))
worker.postMessage({ type: 'PROCESS_LARGE_DATASET', data: bigArray })
worker.onmessage = (e) => setResult(e.data.result)
```

---

## ◈ RAM — MANAGEMENT MEMORIE

### Leak-uri comune de evitat
```typescript
// ❌ Event listener neînlăturat = memory leak
useEffect(() => {
  window.addEventListener('resize', handleResize)
  // Fără cleanup → leak la fiecare mount/unmount
})

// ✅ Cleanup obligatoriu
useEffect(() => {
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize) // cleanup
}, [])

// ❌ setInterval neînlăturat
useEffect(() => {
  const id = setInterval(fetchData, 5000)
  // Leak dacă componenta se unmountează
})

// ✅
useEffect(() => {
  const id = setInterval(fetchData, 5000)
  return () => clearInterval(id)
}, [])

// ❌ Subscription neînlăturat (WebSocket, RxJS, etc.)
// ✅ Returnează întotdeauna cleanup în useEffect pentru subscriptions
```

### Cache cu limite
```typescript
// ✅ LRU Cache — limitează memoria folosită
class LRUCache<K, V> {
  private cache = new Map<K, V>()
  constructor(private maxSize: number) {}

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined
    const value = this.cache.get(key)!
    this.cache.delete(key)
    this.cache.set(key, value) // move to end (most recent)
    return value
  }

  set(key: K, value: V) {
    if (this.cache.size >= this.maxSize) {
      this.cache.delete(this.cache.keys().next().value) // evict oldest
    }
    this.cache.set(key, value)
  }
}

// TanStack Query face asta automat — folosește-l pentru server state
```

### Imagini și media
```typescript
// ✅ Eliberează URL-uri object după folosire
const url = URL.createObjectURL(file)
// ... folosire ...
URL.revokeObjectURL(url) // eliberează memoria

// ✅ Lazy loading imagini
<Image loading="lazy" src={src} alt={alt} />

// ✅ Intersection Observer pentru media (video, heavy content)
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadMedia(entry.target)
      observer.unobserve(entry.target)
    }
  })
})
```

---

## ◈ GPU / NPU — ACCELERARE HARDWARE

### CSS — ce se accelerează hardware
```css
/* ✅ Aceste proprietăți folosesc GPU compositor thread (rapid) */
transform: translateX(100px);    /* mișcare */
transform: scale(1.2);           /* zoom */
transform: rotate(45deg);        /* rotire */
opacity: 0.5;                    /* transparență */

/* ❌ Acestea forțează layout recalculation (lent, pe CPU) */
width: 200px;       /* schimbă layout */
height: 100px;      /* schimbă layout */
top/left/right/bottom  /* forțează reflow */
margin/padding         /* forțează reflow */

/* ✅ will-change — pregătește GPU pentru animații */
.animated-element {
  will-change: transform, opacity; /* hint pentru browser */
  /* ⚠️ Folosește cu grijă — fiecare element cu will-change = memorie VRAM */
}
```

### WebGL / GPU Computing (jocuri, vizualizări)
```
□ Batch draw calls — minimizează numărul de GPU calls pe frame
□ Texture atlases — combină texturi mici într-una mare
□ Level of Detail (LOD) — modele mai simple la distanță
□ Frustum culling — nu randa ce nu e vizibil
□ Occlusion culling — nu randa ce e în spatele altor obiecte
□ Instanced rendering — pentru obiecte repetate (iarbă, copaci, particule)
□ Compresie texturi (ASTC mobile, DXT desktop) — redus VRAM
```

### NPU (Neural Processing Unit) — AI pe device
```
Când să folosești NPU în loc de cloud AI:
  ✅ Procesare în timp real (< 50ms latency critică)
  ✅ Privacy — datele nu ies din device
  ✅ Offline functionality
  ✅ Reducere costuri API

Tool-uri:
  Web:          TensorFlow.js (auto-detectează GPU/NPU)
  React Native: RNML / TensorFlow Lite
  iOS:          Core ML (Apple NPU / Neural Engine)
  Android:      ML Kit / NNAPI (NPU dacă există)

Optimizări modele AI pe device:
  □ Quantizare INT8 (de la Float32) → 4x mai mic, 2-4x mai rapid
  □ Pruning — elimină neuroni cu impact mic
  □ Knowledge distillation — model mic care mimează unul mare
  □ ONNX format pentru portabilitate cross-platform
```

---

## ◈ REȚEA — OPTIMIZARE TRAFIC

### HTTP/2 și HTTP/3
```
□ HTTP/2 activat pe server (multiplexing — multiple requests pe o conexiune)
□ HTTP/3 / QUIC pentru latency redus (mai ales mobile)
□ Server Push pentru resurse critice (CSS, fonts above fold)
□ Connection: keep-alive (reutilizare conexiuni)
```

### Compresie
```
□ Gzip sau Brotli pe toate răspunsurile text (HTML, CSS, JS, JSON)
  Brotli e cu ~20% mai bun decât Gzip
□ WebP/AVIF pentru imagini (vs PNG/JPEG)
  WebP: ~30% mai mic decât JPEG la aceeași calitate
  AVIF: ~50% mai mic decât JPEG
□ Video: H.265/HEVC sau AV1 (vs H.264)
□ Audio: Opus (vs MP3) pentru streaming
```

### Strategii de caching
```
Immutable assets (hash în filename):
  Cache-Control: public, max-age=31536000, immutable
  Ex: main.a3f2b1.js → cacheable 1 an (hash se schimbă cu conținutul)

HTML și API responses:
  Cache-Control: no-cache (verifică cu serverul la fiecare request)
  SAU: max-age=60 pentru date care se schimbă rar

API cu CDN:
  Cache-Control: s-maxage=300, stale-while-revalidate=60
  Stale-while-revalidate: servește din cache + actualizează în background

Strategii per tip de date:
  Date user private:     no-store (niciodată în cache)
  Date publice statice:  max-age=86400 (1 zi)
  Date publice dinamice: max-age=60, stale-while-revalidate=300
  Assets cu hash:        max-age=31536000, immutable
```

### Reducere payload API
```typescript
// ✅ Selectează DOAR câmpurile necesare
// Prisma
const users = await db.user.findMany({
  select: { id: true, name: true, avatar: true }
  // Nu: include: { posts, comments, likes, ... }
})

// GraphQL — clientul cere exact ce vrea
query { user(id: "1") { name avatar } } // nu toată schema

// ✅ Paginare pe TOATE listele
const items = await db.item.findMany({
  take: 20,
  skip: page * 20,
  cursor: lastItemId ? { id: lastItemId } : undefined // cursor pagination e mai eficient
})

// ✅ Compresie răspunsuri mari
// Next.js face asta automat. Express:
import compression from 'compression'
app.use(compression()) // Gzip automat pentru >1KB
```

### CDN și Edge
```
□ CDN pentru: imagini, video, CSS, JS, fonturi
□ Edge Functions pentru: redirecturi, auth checks, A/B testing, geo-routing
□ Preconnect pentru domenii externe critice:
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="dns-prefetch" href="https://api.yourdomain.com">
□ Preload pentru resurse critice above fold:
  <link rel="preload" as="image" href="/hero.webp">
  <link rel="preload" as="font" href="/fonts/Inter.woff2" crossorigin>
```

---

## ◈ DATABASE — SCALABILITATE

### Indexuri — regula de aur
```sql
-- Indexează ORICE coloană folosită în:
-- WHERE, ORDER BY, JOIN ON, GROUP BY

-- ✅ Index simplu
CREATE INDEX idx_users_email ON users(email);

-- ✅ Index compus (ordinea contează!)
-- Pentru query: WHERE user_id = ? AND created_at > ?
CREATE INDEX idx_posts_user_date ON posts(user_id, created_at DESC);

-- ✅ Partial index (mai mic, mai rapid)
-- Indexează doar rândurile active
CREATE INDEX idx_active_subscriptions ON subscriptions(user_id)
WHERE status = 'active';

-- ✅ Index pentru full-text search
CREATE INDEX idx_posts_search ON posts USING gin(to_tsvector('english', title || ' ' || content));

-- Verifică că indexurile sunt folosite:
EXPLAIN ANALYZE SELECT * FROM posts WHERE user_id = 1;
-- Caută "Index Scan" în output, nu "Seq Scan"
```

### N+1 — cel mai comun killer de performanță
```typescript
// ❌ N+1: 1 query pentru users + N queries pentru posts
const users = await db.user.findMany() // 1 query
for (const user of users) {
  user.posts = await db.post.findMany({ where: { userId: user.id } }) // N queries!
}

// ✅ 1 query cu JOIN
const users = await db.user.findMany({
  include: { posts: true } // Prisma face JOIN automat
})

// ✅ SAU DataLoader (pentru GraphQL — batching)
const userLoader = new DataLoader(async (ids) => {
  const users = await db.user.findMany({ where: { id: { in: ids } } })
  return ids.map(id => users.find(u => u.id === id))
})
```

### Connection Pooling
```typescript
// ✅ PgBouncer sau connection pool la nivel de ORM
// Prisma
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
  // DATABASE_URL cu ?pgbouncer=true&connection_limit=10
})

// Supabase: activează PgBouncer din dashboard (Transaction mode)
// Număr conexiuni = (CPU cores × 2) + număr disk-uri (regula simplă)
// Pentru serverless: connection_limit=1 per instanță + PgBouncer extern
```

### Read Replicas (pentru scale-out)
```typescript
// Separă read-uri de write-uri
const dbWrite = new PrismaClient({ datasources: { db: { url: WRITE_URL } } })
const dbRead  = new PrismaClient({ datasources: { db: { url: READ_REPLICA_URL } } })

// Write-urile merg la primary
await dbWrite.post.create({ data: newPost })

// Read-urile (>80% din trafic) merg la replica
const posts = await dbRead.post.findMany()
```

### Strategii cache DB
```typescript
// Redis pentru: results frecvente, sesiuni, rate limiting, leaderboards
import { Redis } from '@upstash/redis'
const redis = new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN })

async function getUserWithCache(id: string) {
  const cacheKey = `user:${id}`

  // 1. Check cache
  const cached = await redis.get(cacheKey)
  if (cached) return cached

  // 2. DB query
  const user = await db.user.findUnique({ where: { id } })

  // 3. Salvează în cache (TTL 5 minute)
  await redis.setex(cacheKey, 300, JSON.stringify(user))

  return user
}

// Invalidare cache la update
async function updateUser(id: string, data: Partial<User>) {
  const updated = await db.user.update({ where: { id }, data })
  await redis.del(`user:${id}`) // invalidează cache
  return updated
}
```

---

## ◈ SCALABILITATE ARHITECTURALĂ

### Scalare verticală vs orizontală
```
Verticală (scale up):   Mai mult CPU/RAM pe același server
  → Simplu, fără schimbări în cod
  → Limitat: nu poți adăuga RAM la infinit
  → Downtime la upgrade

Orizontală (scale out): Mai multe instanțe identice
  → Necesită: stateless servers, shared cache (Redis), shared storage (S3)
  → Unlimited scale teoretic
  → Complexitate mai mare
  → Zero downtime cu load balancer

Recomandare pentru start:
  Phase 1 (0-10k useri):   1 server mediu, verticală
  Phase 2 (10k-100k):      Adaugă Redis cache, CDN, read replica
  Phase 3 (100k+):         Load balancer + multiple instances, queue system
```

### Stateless servers (obligatoriu pentru scale-out)
```
✅ Sesiunile în Redis (nu pe server local)
✅ Fișierele în S3/cloud storage (nu pe disk server)
✅ Configurația din env variables (nu hardcodată)
✅ Orice server poate servi orice request

❌ Nu stoca în memorie de proces: sesiuni, uploads temporare, cache local
❌ Nu stoca pe disk local: fișiere upload, logs (use CloudWatch/Axiom)
```

### Queue System (pentru operații lente)
```typescript
// ✅ Operații > 2s → queue, nu request sincronic
// Exemple: email sending, PDF generation, image processing, AI calls

// BullMQ cu Redis
import { Queue, Worker } from 'bullmq'
const emailQueue = new Queue('emails', { connection: redisConfig })

// Producer — returnează instant
await emailQueue.add('welcome', { userId, email })
// User primește răspuns imediat, emailul se trimite asincron

// Consumer — rulează pe worker separat
const worker = new Worker('emails', async (job) => {
  await sendEmail(job.data.email, 'Welcome!')
}, { connection: redisConfig })
```

### Feature Flags (deploy fără risc)
```typescript
// ✅ Lansează features gradual fără redeployment
// PostHog / LaunchDarkly / Unleash

const isNewDashboardEnabled = await posthog.isFeatureEnabled(
  'new-dashboard',
  userId
)

if (isNewDashboardEnabled) {
  return <NewDashboard />
} else {
  return <OldDashboard />
}

// Rollout strategie:
// 1% users → 10% → 50% → 100% → remove flag
// Rollback instant dacă apar probleme: toggle off în dashboard
```

---

## ◈ MONITORIZARE PERFORMANȚĂ

### Tool-uri (free tier sau cheap)
```
Frontend:
  Vercel Analytics    → Core Web Vitals real users (free cu Vercel)
  Lighthouse CI       → Automated checks în CI/CD (free)
  web-vitals npm      → Colectare metrici custom (free)
  Sentry Performance  → Traces, slow transactions (free tier 5k/lună)

Backend:
  Axiom              → Logs + traces (free 500GB/lună)
  Upstash Redis      → Latency monitoring (free tier)
  PlanetScale        → Query insights (free tier)
  Supabase Dashboard → Slow queries, DB performance (free)

Infrastructure:
  Vercel/Railway     → CPU, memory, requests (built-in)
  UptimeRobot        → Uptime monitoring (free 50 monitors)
  Better Uptime      → Alerting + status page (free tier)
```

### Alerturi obligatorii
```
□ Response time p95 > 1000ms → alert
□ Error rate > 1% → alert imediat
□ Memory usage > 80% → alert
□ CPU usage > 70% sustained (5min) → alert
□ DB connections > 80% din pool → alert
□ Cache hit rate < 50% → investigate
□ Core Web Vitals degradare > 20% → alert
```

### Profiling înainte de optimizare
```bash
# Node.js profiling
node --prof server.js
node --prof-process isolate-*.log > profile.txt

# Chrome DevTools pentru frontend:
# Performance tab → Record → Reproduce problema → Stop
# Caută: Long Tasks (> 50ms), Layout Thrashing, Paint storms

# React DevTools Profiler:
# Activează "Record why each component rendered"
# Caută: componente care re-randează frecvent fără motiv

# Database:
EXPLAIN ANALYZE <query>    # PostgreSQL
# Caută: Seq Scan pe tabele mari, Sort pe coloane neindexate

# Regula: nu optimiza ce nu ai măsurat
```

---

## ◈ CHECKLIST PERFORMANȚĂ — PER TIP DE TASK

### La orice feature nou
```
□ Query-urile DB au indexuri pe coloanele WHERE/JOIN?
□ Există risc de N+1?
□ Lista poate crește mare? → virtualizare implementată?
□ Există operații > 2s? → queue sau background job?
□ Imaginile sunt optimizate și lazy loaded?
□ Nicio logică grea pe main/UI thread?
□ Memory leaks posibile? (event listeners, subscriptions, timers)
```

### Pre-launch
```
□ Lighthouse score: Performance > 90, Accessibility > 90
□ Bundle size verificat (webpack-bundle-analyzer sau Next.js analyze)
□ Core Web Vitals măsurate cu useri reali (Vercel Analytics sau CrUX)
□ Load test minimal (k6, Artillery) la 2x traficul așteptat
□ DB queries lente identificate (pg_stat_statements)
□ CDN configurat pentru assets statice
□ Gzip/Brotli activat
□ Caching headers setate corect
```

### La scalare (de la X useri la 10X)
```
□ Bottleneck identificat prin monitoring (nu ghicit)
□ Connection pooling activ (PgBouncer sau Prisma Accelerate)
□ Redis cache implementat pentru datele accesate frecvent
□ Read replica adăugată dacă DB e bottleneck
□ CDN extins pentru conținut dinamic (Cloudflare Workers)
□ Queue system pentru operații asincrone
□ Horizontală: serverele sunt stateless?
```
