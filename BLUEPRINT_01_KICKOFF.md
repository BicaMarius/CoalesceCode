# 🚀 BLUEPRINT 01 — KICKOFF

> Completat o singura data, la startul proiectului. Document actualizat pe stadiul curent (v0.0.1-alpha).

---

## ◈ META

| Camp                    | Valoare                                 |
| ----------------------- | --------------------------------------- |
| **Nume proiect**        | `CoalesceCode`                          |
| **Tip**                 | `[x] Tool intern / SaaS developer tool` |
| **Versiune initiala**   | `0.0.1-alpha`                           |
| **Data start**          | `28/03/2026`                            |
| **Data estimata MVP**   | `01/06/2026`                            |
| **Durata estimata MVP** | `2 luni`                                |
| **Status**              | `[x] In dezvoltare`                     |

---

## ◈ DESCRIERE

```
CoalesceCode este un tool web care ajuta developerii sa inteleaga rapid un repository.
In stadiul curent, aplicatia analizeaza repo-uri publice GitHub direct din browser
si afiseaza o diagrama de arhitectura, dependinte si log de analiza.
Scopul MVP este validarea rapida a valorii produsului pentru onboarding tehnic.
```

---

## ◈ ECHIPA

| Membru              | Rol                   | Specializare                       | Limbaje principale      | Disponibilitate |
| ------------------- | --------------------- | ---------------------------------- | ----------------------- | --------------- |
| Bica Marius Adrian  | Product + Engineering | Fullstack                          | JavaScript / TypeScript | variabila       |
| Brasoveanu Eduard   | Frontend Engineer     | UI/UX + React                      | JavaScript / TypeScript | variabila       |
| Boros Kevin         | Backend Engineer      | Analyzer, benchmark, data logic    | JavaScript / TypeScript | variabila       |
| GitHub Copilot (AI) | AI Pair Programmer    | Arhitectura, implementare, QA docs | JS/TS, Docs             | per sesiune     |

---

## ◈ BUSINESS

### Monetizare

| Model          | Detalii                                                           | Venit estimat lunar |
| -------------- | ----------------------------------------------------------------- | ------------------- |
| Freemium + Pro | Free: analiza de baza; Pro: proiecte nelimitate + insight avansat | TBD                 |

### Investitie necesara

| Categorie           | Cost estimat        | Note                                 |
| ------------------- | ------------------- | ------------------------------------ |
| Infra / hosting     | mic in faza curenta | Frontend-only prototype              |
| Licente / API-uri   | mic-mediu           | posibil cost LLM in etape ulterioare |
| Design / assets     | minim               | focus pe functionalitate             |
| Marketing / lansare | TBD                 | dupa validare MVP                    |
| **TOTAL**           | **TBD**             |                                      |

### Profit estimat (an 1)

```
Scenariu pesimist:  $300 MRR pana la final de an (adoptie lenta, validare MVP)
Scenariu realist:   $1,200 MRR pana la final de an (conversie organica + iteratii)
Scenariu optimist:  $3,500 MRR pana la final de an (traction B2B dev teams)
```

---

## ◈ RESURSE NECESARE

### Tehnic

| Resursa         | Detalii                             | Responsabil |
| --------------- | ----------------------------------- | ----------- |
| Baze de date    | momentan neinclus; plan PostgreSQL  | Engineering |
| Hosting         | local/prototype; plan Vercel        | Engineering |
| Storage fisiere | neimplementat                       | Engineering |
| Auth            | neimplementat                       | Engineering |
| CI/CD           | neconfigurat in etapa curenta       | Engineering |
| Altele          | integrare GitHub API + npm metadata | Engineering |

### Uman

```
Total ore estimate MVP: 360h
Ore disponibile / saptamana (echipa totala): ~45h
Saptamani necesare: ~8
```

---

## ◈ ARHITECTURA

### Stack

| Layer         | Tehnologie                         | Note                    |
| ------------- | ---------------------------------- | ----------------------- |
| Frontend      | React 18 + JavaScript              | implementat             |
| Backend       | neinclus momentan                  | planificat etapizat     |
| Baza de date  | neinclus momentan                  | planificat etapizat     |
| AI / ML       | fallback optional (prototype path) | partial/mock            |
| Infra / Cloud | local dev                          | productie neconfigurata |
| Altele        | GitHub REST API, jsDelivr metadata | active                  |

### Diagrama arhitecturii

```
[Browser React UI] -> [Analysis Engine in Client]
                        -> [GitHub API]
                        -> [jsDelivr metadata]
                        -> [Anthropic fallback (optional/prototype)]
```

### Repo-uri

| Repo           | Descriere                           | Tehnologie       | Responsabil      |
| -------------- | ----------------------------------- | ---------------- | ---------------- |
| `CoalesceCode` | Aplicatie web + documentatie produs | React + Markdown | Marius + Copilot |

---

## ◈ MVP — FUNCTII INCLUSE

| #   | Functie                            | Descriere                                                 | Prioritate | Status         |
| --- | ---------------------------------- | --------------------------------------------------------- | ---------- | -------------- |
| F01 | Architecture Diagram Visualization | Generare noduri/muchii si vizualizare interactiva de baza | 🔴 Must    | 🔨 In Progress |
| F02 | Dependency Insights                | Inventar dependinte + outdated/risk filters               | 🔴 Must    | 🔨 In Progress |
| F03 | User Flow Diagrams                 | Inferenta flow-uri din cod/rute                           | 🟡 Should  | 📋 Planned     |

### OUT OF SCOPE (MVP curent)

```
- Colaborare real-time
- Persistenta proiectelor/userilor
- Analiza repo-uri private cu autentificare completa
- Mobile app dedicat
```

---

## ◈ ROADMAP POST-MVP

| Versiune | Functii planificate                                       | Termen estimat         |
| -------- | --------------------------------------------------------- | ---------------------- |
| v0.1.x   | Stabilizare analiza, inlocuire tab-uri mock cu date reale | dupa primul task major |
| v0.2.x   | Backend minimal + persistenta + auth baza                 | dupa validarea MVP     |
| v1.0.0   | MVP lansat public                                         | TBD                    |

---

## ◈ RISCURI

| Risc                                | Probabilitate | Impact  | Mitigare                                |
| ----------------------------------- | ------------- | ------- | --------------------------------------- |
| Limitari GitHub API/rate limit      | 🟡 Med        | 🔴 Mare | token optional + proxy backend ulterior |
| Monolit App.js greu de mentinut     | 🔴 Mare       | 🟡 Med  | modularizare incrementala               |
| Functionalitati percepute ca "mock" | 🔴 Mare       | 🟡 Med  | prioritate pe inlocuire cu output real  |

---

## ◈ NOTE & DECIZII IMPORTANTE

```
[28/03/2026] ADR-001: MVP in React+JS, migrare Next.js+TS dupa validare.
[29/03/2026] ADR-002: pastram analiza client-side in v0.0.x, backend ulterior.
```

---

<!-- METADATA_JSON
{
  "blueprint_type": "kickoff",
  "project_name": "CoalesceCode",
  "start_date": "2026-03-28",
  "mvp_deadline": "2026-06-01",
  "team_size": 3,
  "team": [
    "Bica Marius Adrian - Project Manager + Fullstack",
    "Brasoveanu Eduard - AI Engineer + Frontend",
    "Boros Kevin - Fullstack + Data Specialist"
  ],
  "stack": ["React", "JavaScript", "GitHub API"],
  "repos": ["CoalesceCode"],
  "version": "0.0.1-alpha",
  "status": "in-development"
}
-->
