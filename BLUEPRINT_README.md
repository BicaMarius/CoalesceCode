# 📘 BLUEPRINT SYSTEM — Ghid de utilizare

Sistem de documentare pentru echipe mici care lucrează cu AI intensiv.
3 blueprinte + 1 cod evolution map + 1 task calculator.

---

## Structura unui repo

```
your-repo/
├── BLUEPRINT_01_KICKOFF.md        ← o dată, la start (repo principal)
├── docs/
│   └── pushes/
│       ├── 2025-01-15_v0.2.0.md   ← push doc (Blueprint 02), per push
│       ├── 2025-01-20_v0.3.0.md
│       └── ...
├── BLUEPRINT_03_MVP_LAUNCH.md     ← o dată, la lansare (repo principal)
└── ... (codul tău)
```

---

## Când completez ce?

| Blueprint | Când | Frecvență | Cine |
|---|---|---|---|
| 01 Kickoff | La startul proiectului | O singură dată | Tech lead / toată echipa |
| 02 Push Doc | Înainte de fiecare `git push` | La fiecare push | Autorul push-ului |
| 03 MVP Launch | Când lansezi MVP-ul | O singură dată | Toată echipa |

---

## Auto-completare cu AI

Dă-i AI-ului următorul prompt după ce termini de codat:

```
Ești un asistent de documentare. Analizează:
1. Git diff-ul atașat / descrierea modificărilor
2. Structura repo-ului
3. Fișierele modificate

Completează template-ul BLUEPRINT_02_PUSH_DOC.md cu informațiile relevante.
Lasă câmpurile pe care nu le poți deduce marcate cu `?` și o notă.
Nu inventa date (ore, versiuni, date calendaristice) — lasă-le goale.
```

---

## Cum sunt folosite de Code Evolution Map

Fiecare blueprint conține un bloc `<!-- METADATA_JSON ... -->` la final.
Evolution Map-ul parsează aceste blocuri și construiește diagrama vizuală.

**Nu șterge blocul METADATA_JSON** — e invizibil în preview dar critic pentru tool.

---

## Convenție pentru Push Doc filename

```
AAAA-LL-ZZ_vX.Y.Z_descriere-scurta.md
```

Exemple:
```
2025-01-15_v0.2.0_auth-system.md
2025-01-20_v0.3.0_dashboard-ui.md
2025-02-01_v1.0.0_mvp-launch.md
```

---

## Versionare (SemVer simplificat)

```
MAJOR.MINOR.PATCH

v0.x.x  = pre-MVP (în dezvoltare)
v1.0.0  = MVP lansat
v1.x.x  = updates post-MVP
v2.0.0  = versiune majoră nouă
```

| Tip schimbare | Bump |
|---|---|
| Bug fix mic | PATCH (0.2.3 → 0.2.4) |
| Funcție nouă | MINOR (0.2.3 → 0.3.0) |
| Breaking change / redesign major | MAJOR (0.2.3 → 1.0.0) |
