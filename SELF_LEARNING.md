# SELF_LEARNING.md — Jurnalul de Învățare al Agentului

> Greșelile agentului, preferințele userului, pattern-uri descoperite.
> Citit ÎNAINTE de planificarea oricărui task.
> Scris DUPĂ orice greșeală, corectare sau descoperire nouă.
> Scopul: să nu repete niciodată aceeași greșeală de două ori.

---

## ◈ CUM SE FOLOSEȘTE

**Agentul citește acest fișier:**

- La Etapa 1 (Context Read) din pipeline
- Când planifică un task similar cu ceva anterior
- Când întâlnește o eroare și vrea să verifice dacă a mai văzut-o

**Agentul scrie în acest fișier:**

- Când face o eroare de syntax sau logică
- Când un test eșuează din cauza implementării sale greșite
- Când userul corectează ceva → preferința/standardul se documentează
- Când userul introduce un pattern nou
- Când un hotfix e necesar după push
- Când identifică o îmbunătățire pentru propriul sistem de lucru

---

## ◈ FORMAT INTRARE

```markdown
## [SL-NNN] Titlu scurt și clar

**Data:** YYYY-MM-DD
**Task afectat:** [ce implementam când s-a întâmplat]
**Tip:** Eroare syntax | Eroare logică | Preferință user | Pattern nou | Îmbunătățire sistem

**Ce s-a întâmplat:**
[Descriere concisă a greșelii sau lecției]

**De ce s-a întâmplat:**
[Cauza rădăcină — nu simptomul]

**Cum să evit data viitoare:**
[Regula exactă de aplicat — acționabilă]

**Verificare:**
[Cum confirm că nu mai apare — check specific]

**Severitate:** 🔴 Critică | 🟡 Medie | 🟢 Minoră
```

---

## ◈ ERORI DE SYNTAX ȘI LOGICĂ

<!-- Adaugă intrări noi deasupra liniei de mai jos -->

### [SL-006] Nu deriva keyword hints expected din tot markdown-ul (titluri/notes incluse)

**Data:** 2026-04-09
**Task afectat:** ZIP expected-suspect closure (149/1 -> 150/0)
**Tip:** Eroare logică

**Ce s-a întâmplat:**
Parserul expected keyword hints analiza tot fișierul markdown, iar tokenii din titlu/case-name (ex: `...-jwt`) deveneau false constraints în comparator.

**De ce s-a întâmplat:**
Clasificarea keyword-urilor era aplicată global pe textul expected, fără delimitare la semnalele structurale (`Nodes`, `Edges`).

**Cum să evit data viitoare:**
Pentru benchmark expected parsing, derivă hints strict din structură (node id/label/type + edges). Ignoră heading-uri, notes și orice text descriptiv liber pentru required matching.

**Verificare:**

1. Fixture test nou trece (`parseExpectedArchitectureText ignores noisy title keywords`).
2. ZIP benchmark full rerun: `Total 150 | Pass 150 | Review 0 | Warn 0 | Fail 0`.

**Severitate:** 🟡 Medie

### [SL-005] Evită tokenii generici ambigui în clasificarea doc-hints

**Data:** 2026-04-09
**Task afectat:** Repo benchmark full-vector closure (partial -> pass)
**Tip:** Eroare logică

**Ce s-a întâmplat:**
Tokenul generic `next` în clasificarea keywords din docs a produs semnale false de Next.js și a distorsionat required-category derivation.

**De ce s-a întâmplat:**
Clasificatorul trata termeni ambigui fără disambiguare semantică (`next` poate apărea în text non-tehnic: "next steps", "next phase").

**Cum să evit data viitoare:**
Permite doar forme specifice de framework pentru astfel de cazuri (`next.js`, `nextjs`) și rulează fixture tests pentru false-positive guard înainte de full benchmark rerun.

**Verificare:**

1. Fixture test dedicat pentru `next` generic trece (`pnpm test:bench`).
2. Rerun benchmark repo complet: `27 pass / 0 partial / 0 fail`.

**Severitate:** 🟡 Medie

### [SL-004] Nu șterge latest artifacts înainte de validarea unui benchmark remote-dependent

**Data:** 2026-04-09
**Task afectat:** Repo benchmark scoring hardening + full rerun verification
**Tip:** Eroare logică

**Ce s-a întâmplat:**
Runner-ul de repo benchmark ștergea `latest.*` la începutul execuției. Când run-ul a fost lovit de GitHub rate limit, artefactele stabile au dispărut sau au fost înlocuite cu output invalid.

**De ce s-a întâmplat:**
Ordinea operațiilor nu proteja baseline-ul: cleanup se făcea înainte de a ști dacă run-ul este valid.

**Cum să evit data viitoare:**
Pentru benchmark-uri dependente de servicii externe, scrie mereu timestamped snapshot, iar `latest.*` actualizează-le doar dacă run-ul trece criteriul de validitate (fără rate-limit failures), sau doar cu override explicit.

**Verificare:**

1. `scripts/run-repo-benchmark.cjs` nu mai șterge `latest.*` la start.
2. Run-urile cu rate limit afișează mesaj de skip pentru `latest.*`.

**Severitate:** 🟡 Medie

---

### [SL-003] Evită escape-uri inutile în regex pentru a nu bloca compilarea pe lint

**Data:** 2026-04-09
**Task afectat:** Analyzer technology display/refinement
**Tip:** Eroare syntax

**Ce s-a întâmplat:**
Regex-ul de split conținea un escape inutil (`/[\/-]/`) și a blocat compilarea în dev prin regula ESLint `no-useless-escape`.

**De ce s-a întâmplat:**
Pattern-ul a fost scris defensiv fără verificare lint imediată după edit.

**Cum să evit data viitoare:**
După orice editare regex în cod runtime, rulez imediat `pnpm lint` înainte de a continua alte schimbări și folosesc forma minimă validă (`/[/-]/`).

**Verificare:**

1. `pnpm lint` trece fără erori.
2. `pnpm build` compilează cu succes.

**Severitate:** 🟡 Medie

---

### [SL-002] Nu trata orice sageata din expected.md ca edge de arhitectura

**Data:** 2026-04-09
**Task afectat:** ZIP benchmark automation + analyzer refinement
**Tip:** Eroare logică

**Ce s-a întâmplat:**
Parserul benchmark pentru expected architecture a extras muchii din secțiuni descriptive (`Detection Sources`, text orientativ), ceea ce a produs `150/150 fail` fals la primul run.

**De ce s-a întâmplat:**
Regex-ul de edge parsing era aplicat global pe conținutul fișierului în loc să fie limitat la secțiunea `## Edges`.

**Cum să evit data viitoare:**
La parsare markdown structurată, extrage mai întâi secțiunea semantică corectă (heading-scoped parsing), apoi aplică regex doar în acea zonă.

**Verificare:**

1. Benchmark rerun după fix:
   `Total 150 | Pass 132 | Review 17 | Warn 1 | Fail 0`.
2. Confirmare că nu mai apar muchii false de tip `package.json -> dep` sau `left -> right`.

**Severitate:** 🟡 Medie

---

### [SL-001] Template — Prima intrare (exemplu)

**Data:** YYYY-MM-DD
**Task afectat:** [task name]
**Tip:** Eroare syntax

**Ce s-a întâmplat:**
[Descriere]

**De ce s-a întâmplat:**
[Cauza]

**Cum să evit:**
[Regula]

**Verificare:**
[Check]

**Severitate:** 🟢 Minoră

---

## ◈ PREFERINȚE USER (aplicate de acum înainte în TOATE sesiunile)

> Când userul corectează sau preferă ceva specific, se adaugă aici.
> Acestea devin reguli permanente pentru acest proiect.

| #     | Preferință                                                                                                                              | Context                                                        | Data adăugării |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------- |
| P-002 | Detectarea tehnologiilor se face generic (`detected.technologies`), nu prin booleeni hardcodați (excepție: Docker poate rămâne boolean) | Analyzer core + UI metrics + benchmark reporting               | 2026-04-09     |
| P-003 | Benchmark-ul de repo-uri folosește vector editabil de URL-uri cu tuple-style `[repoUrl, expectedOr0]`                                   | `scripts/repo-benchmark-vector.cjs` + `run-repo-benchmark.cjs` | 2026-04-09     |
| P-001 | [descriere preferință]                                                                                                                  | [când se aplică]                                               | YYYY-MM-DD     |

---

## ◈ PATTERN-URI NOI INTRODUSE DE USER

> Când userul introduce un mod de a face ceva care nu era în sistemul anterior.
> Se adaugă automat și în LESSONS_LEARNED.md.

| #      | Pattern                                  | Cum se aplică                                                                                    | Data       |
| ------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------- |
| PN-002 | Deterministic-first benchmark validation | expected configurat -> doc hints -> inferență din analiză; fallback LLM opțional, nu obligatoriu | 2026-04-09 |
| PN-001 | [descriere]                              | [când și cum]                                                                                    | YYYY-MM-DD |

---

## ◈ ÎMBUNĂTĂȚIRI PENTRU SISTEMUL DE AGENȚI

> Sugestii identificate de agent pentru a îmbunătăți propriile fișiere .md,
> workflow-ul, sau abordarea generală.

| #      | Sugestie   | Fișier afectat  | Prioritate | Status            |
| ------ | ---------- | --------------- | ---------- | ----------------- |
| IS-001 | [sugestie] | [CLAUDE.md etc] | 🔴🟡🟢     | Pending / Aplicat |

---

## ◈ STATISTICI (auto-calculate)

```
Total erori syntax:    1
Total erori logică:    4
Total preferințe user: 2
Total pattern-uri noi: 1
Ultimul update:        2026-04-09
Task cu cele mai multe greșeli: Benchmark automation
```

---

## ◈ INDEX RAPID — Greșeli per Categorie

### TypeScript

- [SL-NNN] [Titlu scurt] — [data]

### React / Components

- [SL-NNN] [Titlu scurt] — [data]

### Database / Queries

- [SL-NNN] [Titlu scurt] — [data]

### API / Endpoints

- [SL-NNN] [Titlu scurt] — [data]

### Testing

- [SL-006] Nu deriva keyword hints expected din tot markdown-ul (titluri/notes incluse) — 2026-04-09
- [SL-005] Evită tokenii generici ambigui în clasificarea doc-hints — 2026-04-09
- [SL-004] Nu șterge latest artifacts înainte de validarea unui benchmark remote-dependent — 2026-04-09
- [SL-002] Nu trata orice sageata din expected.md ca edge de arhitectura — 2026-04-09

### CSS / UI

- [SL-NNN] [Titlu scurt] — [data]

### Git / Deploy

- [SL-NNN] [Titlu scurt] — [data]

### Logică Business

- [SL-NNN] [Titlu scurt] — [data]

### Securitate

- [SL-NNN] [Titlu scurt] — [data]

### Syntax / Lint

- [SL-003] Evită escape-uri inutile în regex pentru a nu bloca compilarea pe lint — 2026-04-09
