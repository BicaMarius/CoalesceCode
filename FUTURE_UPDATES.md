# FUTURE_UPDATES.md — Roadmap & Idei Viitoare

> Document viu. Se actualizează automat de agent după fiecare task.
> Conține: features sugerate, îmbunătățiri tehnice, idei de business, upgrade-uri de sistem.
> Agentul adaugă sugestii la finalul fiecărui Stage 7 — tu decizi ce și când se face.

---

## ◈ CUM FUNCȚIONEAZĂ

**Agentul adaugă automat în acest fișier când:**

- Termină un task și vede oportunități naturale de extindere
- Observă că o funcție implementată ar putea fi extinsă logic
- Identifică o îmbunătățire tehnică în timp ce lucrează
- Userul menționează o idee fără să o ceară explicit ca task
- Analiza din 3MEK.md sau BUSINESS_LOGIC.md sugerează o direcție

**Tu adaugi manual când:**

- Ai o idee nouă de feature
- Vrei să notezi ceva pentru mai târziu fără să îl faci acum
- Citești feedback de la useri și vrei să îl transpui în planuri

**Regula:** Nicio idee nu se pierde. Dacă e prea mică pentru un task acum, stă aici.

---

## ◈ BACKLOG PRIORITIZAT

### 🔴 HIGH PRIORITY — Următoarele taskuri

> Lucruri care au cel mai mare impact acum și sunt gata de implementat.

| #     | Feature / Îmbunătățire | Tip                      | Motivul             | Estimare       | Adăugat |
| ----- | ---------------------- | ------------------------ | ------------------- | -------------- | ------- |
| F-001 | [descriere]            | Feature/Tech/UX/Business | [de ce e important] | [timp estimat] | [data]  |

---

### 🟡 MEDIUM PRIORITY — Planificate

> Importante, dar pot aștepta câteva versiuni.

| #     | Feature / Îmbunătățire | Tip                      | Motivul | Estimare | Adăugat |
| ----- | ---------------------- | ------------------------ | ------- | -------- | ------- |
| F-002 | [descriere]            | Feature/Tech/UX/Business | [de ce] | [timp]   | [data]  |

---

### 🟢 LOW PRIORITY / NICE TO HAVE

> Idei bune care nu sunt urgente.

| #     | Feature / Îmbunătățire | Tip                      | Motivul | Estimare | Adăugat |
| ----- | ---------------------- | ------------------------ | ------- | -------- | ------- |
| F-003 | [descriere]            | Feature/Tech/UX/Business | [de ce] | [timp]   | [data]  |

---

## ◈ SUGESTII AGENT — Per Task

> Agentul adaugă o secțiune nouă după fiecare task complet.
> Format standard, adăugat automat la Stage 7.

### După task: [TASK-NNN] — [Data]

**Sugestii pentru app:**

```
1. [Idee feature/optimizare direct legată de task-ul tocmai finalizat]
   De ce: [motivul concret]
   Efort estimat: [mic/mediu/mare]
   Impact: [mic/mediu/mare]
   Prioritate sugerată: 🔴/🟡/🟢

2. [A doua sugestie]
   ...
```

**Sugestii tehnice:**

```
1. [Librărie, pattern, abordare mai bună descoperită în timp ce lucram]
   Context: [unde ar ajuta]
   Alternativă la: [ce înlocuiește]

2. [A doua sugestie tehnică]
```

**Sugestii pentru sistemul de agenți:**

```
1. [Cum putem îmbunătăți fișierele .md sau workflow-ul]
   Fișier afectat: [care .md]
   Ce ar îmbunătăți: [concret]
```

**★ Sugestii business (doar pentru proiecte firmă):**

```
1. [Oportunitate de monetizare, marketing, creștere]
   Bazat pe: [ce date sau observații]
   Acțiune concretă: [ce să facem]
```

### După task: [TASK-013] — [2026-04-09]

### După task: [TASK-014] — [2026-04-09]

**Sugestii pentru app:**

```
1. Adaugă un panou "Expected Quality" în benchmark UI (structured vs free-text hints, ambiguity flags)
   De ce: explică transparent de ce anumite expected-uri sunt tratate soft și previne confuzia la triere
   Efort estimat: mediu
   Impact: mare
   Prioritate sugerată: 🔴

2. Adaugă toggle pentru "generic backend equivalence" în comparator debug view
   De ce: permite audit rapid când expected spune "api/routes" iar detectarea e provider-specifică (Remix/tRPC/Hono)
   Efort estimat: mic
   Impact: mediu
   Prioritate sugerată: 🟡
```

**Sugestii tehnice:**

```
1. Extrage comparatorul ZIP într-un modul pur (`zip-benchmark-scorer.cjs`) cu teste dedicate
   Context: reduce complexitatea runner-ului și permite fixture matrix extins pe reguli individuale
   Alternativă la: validare indirectă doar prin full benchmark runs

2. Introdu "expected parsing contract tests" pe secțiuni markdown (`Nodes`, `Edges`, `Notes`)
   Context: previne regresii în care heading-uri/notes redevin surse de required keywords
   Alternativă la: detectarea regresiilor abia după degradarea pass-rate-ului
```

**Sugestii pentru sistemul de agenți:**

```
1. Adaugă un checkpoint explicit: "după orice modificare la benchmark comparator/parsing -> rulează obligatoriu benchmark:zip + test:bench"
   Fișier afectat: CLAUDE.md
   Ce ar îmbunătăți: reduce riscul de regresie ascunsă între fixture tests și run-ul real de 150 cazuri
```

### După task: [TASK-013] — [2026-04-09]

**Sugestii pentru app:**

```
1. Adaugă în dashboard un "Repo Benchmark Trend" (ultimele N snapshot-uri) cu comparație pass/partial/fail
   De ce: face vizibil imediat dacă o schimbare de scoring îmbunătățește sau degradează stabilitatea
   Efort estimat: mediu
   Impact: mare
   Prioritate sugerată: 🔴

2. Adaugă filtru pe motiv de review/warn în ZIP summary (ex: expected suspect, db label mismatch, backend label mismatch)
   De ce: reduce timpul de triere pentru cele 18 cazuri non-pass
   Efort estimat: mic
   Impact: mediu
   Prioritate sugerată: 🟡
```

**Sugestii tehnice:**

```
1. Creează un script "benchmark:ci" cu praguri configurabile
   Context: poate eșua automat doar la fail/error > 0 și raporta separat review/warn
   Alternativă la: rulare manuală + interpretare manuală a sumarului

2. Adaugă fixture matrix pentru alias families pe categorii
   Context: protejează explicit mapping-urile family-level introduse în scorer
   Alternativă la: detectarea regresiilor doar după rerun complet de benchmark
```

**Sugestii pentru sistemul de agenți:**

```
1. Adaugă în workflow o regulă explicită: "dacă se modifică scripts/*benchmark* -> rulează obligatoriu pnpm test:bench"
   Fișier afectat: CLAUDE.md
   Ce ar îmbunătăți: previne livrarea de schimbări de scoring fără plasă de siguranță fixture-level
```

### După task: [TASK-012] — [2026-04-09]

**Sugestii pentru app:**

```
1. Adaugă în tab-ul de logs un panou "Benchmark Health" (rate-limit, selected repos, pass ratio)
   De ce: oferă context direct când scorurile devin necomparabile între rerun-uri
   Efort estimat: mediu
   Impact: mare
   Prioritate sugerată: 🔴

2. Adaugă preset-uri de benchmark subsets (core-frameworks, infra, database-engines)
   De ce: permite tuning incremental fără rerun full consumator de quota
   Efort estimat: mic
   Impact: mediu
   Prioritate sugerată: 🟡
```

**Sugestii tehnice:**

```
1. Extrage scorer-ul repo într-un modul separat (`repo-benchmark-scorer.cjs`) cu API pur
   Context: reduce cuplarea testelor față de runner-ul I/O
   Alternativă la: testare indirectă prin import din runner monolitic

2. Adaugă "quality gate" în summary JSON (valid / degraded / invalid)
   Context: automatizează decizia de update pentru latest artifacts
   Alternativă la: verificare manuală a mesajelor de eroare
```

**Sugestii pentru sistemul de agenți:**

```
1. Adaugă în checklist-ul Stage 5 o verificare explicită: "rulat pnpm build după fix de lint/syntax blocker"
   Fișier afectat: CLAUDE.md
   Ce ar îmbunătăți: previne închiderea task-ului doar cu lint verde, fără validare compile reală
```

### După task: [TASK-011] — [2026-04-09]

**Sugestii pentru app:**

```
1. Adaugă în UI o secțiune "Detection Confidence" pe categorii (frontend/backend/database/services)
   De ce: explică transparent de ce unele repo-uri rămân în status partial
   Efort estimat: mediu
   Impact: mare
   Prioritate sugerată: 🔴

2. Adaugă filtru benchmark "show only partial repos" + sort după required score
   De ce: scurtează ciclul de tuning pentru repo benchmark
   Efort estimat: mic
   Impact: mediu
   Prioritate sugerată: 🟡
```

**Sugestii tehnice:**

```
1. Creează fixture tests pentru resolveRequiredCategories și evaluateResult din repo benchmark
   Context: protejează împotriva regresiilor la scoring-ul pass/partial
   Alternativă la: validare exclusiv manuală prin rerun complet

2. Adaugă cache local (TTL scurt) pentru doc-hints GitHub raw în benchmark runner
   Context: reduce timp și presiune pe rate limit la rerun-uri repetate
   Alternativă la: refetch complet la fiecare execuție
```

**Sugestii pentru sistemul de agenți:**

```
1. Adaugă în pipeline un checkpoint explicit: "benchmark clean executat înainte de rerun"
   Fișier afectat: CLAUDE.md
   Ce ar îmbunătăți: elimină riscul comparațiilor pe outputuri stale
```

### După task: [TASK-010] — [2026-04-09]

**Sugestii pentru app:**

```
1. Adaugă confidence score pe fiecare nod detectat (frontend/backend/db/services)
   De ce: diferențiază detecții tari de cele inferate
   Efort estimat: mediu
   Impact: mare
   Prioritate sugerată: 🔴

2. Adaugă filtru UI pentru status benchmark (pass/review/warn/fail) + search pe case id
   De ce: triere mai rapidă pe corpus mare
   Efort estimat: mic
   Impact: mediu
   Prioritate sugerată: 🟡
```

**Sugestii tehnice:**

```
1. Introdu fixture tests pentru comparatorul ZIP
   Context: edge path equivalence, db-family normalization, expected section parsing
   Alternativă la: validare exclusiv prin rerun manual benchmark complet

2. Extrage detectFromSourceContent în module de reguli pe domenii (backend/db/auth/ai/styling)
   Context: engine.mjs a crescut și merită modularizat pentru testare locală
   Alternativă la: menținerea unui bloc monolitic greu de verificat
```

**Sugestii pentru sistemul de agenți:**

```
1. Adaugă în CLAUDE.md un checkpoint explicit pentru "benchmark parser scope validation"
   Fișier afectat: CLAUDE.md
   Ce ar îmbunătăți: reduce riscul de false-fail global când expected markdown conține săgeți non-edge
```

---

## ◈ IDEI DIN CONVERSAȚII

> Idei menționate în chat fără să fie taskuri formale.
> Agentul le captează automat când le detectează în conversație.

| Idee   | Menționată când | Context               | Status       |
| ------ | --------------- | --------------------- | ------------ |
| [idee] | [data]          | [contextul discuției] | 📋 Neevaluat |

---

## ◈ FEEDBACK USERI → FEATURES

> ★ Activ pentru proiecte de firmă.
> Feedback real de la useri transformat în potențiale features.

| Feedback           | Sursa                        | Frecvență     | Feature propus     | Prioritate |
| ------------------ | ---------------------------- | ------------- | ------------------ | ---------- |
| [ce au zis userii] | [App Store review/email/etc] | [de câte ori] | [ce am putea face] | 🔴🟡🟢     |

---

## ◈ VERSIUNI PLANIFICATE

> Roadmap la nivel înalt. Se actualizează când taskurile sunt completate sau prioritățile se schimbă.

### Versiunea curentă: [vX.Y.Z]

### v[X.Y+1] — [Nume opțional]

```
Obiectiv: [Ce vrea să realizeze această versiune]
Features principale:
  □ [Feature 1] — [descriere scurtă]
  □ [Feature 2]
  □ [Feature 3]
Îmbunătățiri tehnice:
  □ [Tech debt de rezolvat]
  □ [Optimizare]
★ Business:
  □ [Obiectiv business pentru această versiune]
Estimare: [timp] | Target: [data estimată]
```

### v[X+1.0] — Versiune majoră

```
Obiectiv: [Schimbare majoră sau pivot]
Teme principale:
  - [Tema 1]
  - [Tema 2]
Necesită research: [Да/Nu — ce trebuie cercetat înainte]
Estimare: [timp] | Target: [data estimată]
```

---

## ◈ TECH DEBT PLANIFICAT

> Lucruri știute că nu sunt ideale dar s-au lăsat pentru mai târziu.
> Legate de KNOWN_ISSUES.md (bug-urile) dar distincte — acestea sunt îmbunătățiri dorite, nu bug-uri.

| #      | Datorie         | Unde           | Impactul actual        | Când să fie rezolvată   | Adăugat |
| ------ | --------------- | -------------- | ---------------------- | ----------------------- | ------- |
| TD-001 | [ce nu e ideal] | [fișier/modul] | [ce problemă cauzează] | [v1.x / când avem timp] | [data]  |

---

## ◈ EXPERIMENTE DE TESTAT

> Ipoteze de validat — nu știm dacă vor funcționa, trebuie testate.

| Ipoteză                                   | Cum o testăm                       | Metrică de succes | Status  |
| ----------------------------------------- | ---------------------------------- | ----------------- | ------- |
| [dacă facem X, atunci Y se îmbunătățește] | [A/B test / implementare limitată] | [cum măsurăm]     | 💡 Idee |

---

## ◈ ARHIVĂ — Completate

> Features din acest backlog care au fost implementate.
> Păstrate pentru referință și pentru a vedea evoluția.

| Feature               | Implementat în | Task     | Data   |
| --------------------- | -------------- | -------- | ------ |
| [feature implementat] | v[X.Y.Z]       | TASK-NNN | [data] |
