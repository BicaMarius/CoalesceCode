# ULTIMATE_SETUP_GUIDE.md — Mașinăria Supremă cu GitHub Copilot Pro
> Setup complet pentru a folosi GitHub Copilot Pro ca agent principal de coding.
> Fără Claude Code CLI. Totul se întâmplă direct în VS Code.
> Citește tot înainte să execuți orice.

---

## ◈ CUM ARATĂ MAȘINĂRIA FINALĂ

```
┌─────────────────────────────────────────────────────────────────┐
│                     TU (Orchestrator)                           │
│  Dai task în Copilot Chat → Aștepți → Aprobi → Push            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │   GITHUB COPILOT AGENT  │
              │   (în VS Code)          │
              │                         │
              │  Model: GPT-4.1 /       │
              │  claude-sonnet          │
              │                         │
              │  Citește fișierele .md  │
              │  Scrie cod              │
              │  Rulează comenzi        │
              │  Actualizează docs      │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │    Fișierele .md         │
              │    (memoria agentului)   │
              │    CLAUDE.md             │
              │    SESSION_LOG.md        │
              │    SPEC.md ... (toate)   │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │    Codul tău + Git       │
              └─────────────────────────┘
```

---

## ◈ PASUL 1 — Extensii VS Code (instalează în ordine)

Deschide VS Code → `Ctrl+Shift+X` → caută și instalează fiecare:

```
1. GitHub Copilot           → publisher: GitHub
2. GitHub Copilot Chat      → publisher: GitHub
3. Markdown All in One      → publisher: Yu Zhang
4. Markdown Preview Mermaid → publisher: Matt Bierner
5. GitLens                  → publisher: GitKraken
6. ESLint                   → publisher: Microsoft
7. Prettier                 → publisher: Prettier
8. Error Lens               → publisher: Alexander
```

**Verificare că Copilot e activ:** În bara de jos a VS Code trebuie să vezi iconița Copilot (un fel de stea / logo GitHub). Dacă e gri → nu ești logat. Click pe ea → Sign in with GitHub.

---

## ◈ PASUL 2 — Configurare VS Code Settings

Apasă `Ctrl+Shift+P` → tastează `Open User Settings JSON` → Enter.

Adaugă/înlocuiește cu:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.inlineSuggest.enabled": true,
  "editor.inlineSuggest.suppressSuggestions": false,

  "github.copilot.enable": {
    "*": true,
    "markdown": true,
    "plaintext": false
  },
  "github.copilot.editor.enableAutoCompletions": true,
  "github.copilot.chat.agent.thinkingTool": true,
  "github.copilot.chat.codesearch.enabled": true,
  "github.copilot.chat.search.semanticTextResults": true,
  "github.copilot.nextEditSuggestions.enabled": true,
  "github.copilot.renameSuggestions.triggerAutomatically": true,

  "chat.agent.maxRequests": 100,
  "chat.editing.confirmEditRequestRemoval": false,

  "explorer.fileNesting.enabled": true,
  "explorer.fileNesting.patterns": {
    "CLAUDE.md": "SPEC.md, ARCHITECTURE.md, DECISIONS.md, SESSION_LOG.md, KNOWN_ISSUES.md, LESSONS_LEARNED.md, IMPROVEMENTS.md, TESTING.md, UI_UX.md, BUSINESS_LOGIC.md, EXTERNAL_SERVICES.md, AI_CHANGELOG.md, WORKFLOW.md",
    "BLUEPRINT_01_KICKOFF.md": "BLUEPRINT_02_PUSH_DOC.md, BLUEPRINT_03_MVP_LAUNCH.md, BLUEPRINT_README.md"
  },

  "markdown.preview.breaks": true,
  "[markdown]": {
    "editor.wordWrap": "on",
    "editor.quickSuggestions": { "other": "off" }
  },

  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,

  "git.confirmSync": false,
  "git.autofetch": true
}
```

Salvează cu `Ctrl+S`.

---

## ◈ PASUL 3 — Configurare workspace (.vscode/ în proiect)

În folderul proiectului tău, creează `.vscode/settings.json`:

```json
{
  "github.copilot.chat.codeGeneration.instructions": [
    {
      "file": "CLAUDE.md"
    }
  ],
  "github.copilot.chat.reviewSelection.instructions": [
    {
      "file": "CLAUDE.md"
    }
  ],
  "github.copilot.chat.testGeneration.instructions": [
    {
      "file": "TESTING.md"
    }
  ],
  "github.copilot.chat.commitMessageGeneration.instructions": [
    {
      "text": "Format: type: description (vX.Y.Z). Types: feat, fix, refactor, test, docs, chore, perf. Keep under 72 chars."
    }
  ]
}
```

**Aceasta este cheia întregului sistem.** Copilot va citi automat CLAUDE.md și TESTING.md la fiecare generare de cod și teste — fără să mai trebuiască să îi dai tu contextul manual de fiecare dată.

---

## ◈ PASUL 4 — Fișierul .github/copilot-instructions.md

Acesta este echivalentul CLAUDE.md dar citit automat de Copilot la fiecare conversație.

Creează `.github/copilot-instructions.md` în root-ul proiectului:

```markdown
# Copilot Instructions — Ultimate Coding Machine

## IDENTITATE PROIECT
Citește CLAUDE.md din root pentru regulile complete ale proiectului.
Citește SESSION_LOG.md înainte de orice task nou.
Citește SPEC.md pentru cerințele produsului.
Citește KNOWN_ISSUES.md înainte de a lucra în zone cu probleme cunoscute.

## WORKFLOW OBLIGATORIU
Urmează pipeline-ul de 9 etape din CLAUDE.md:
STAGE 0: Înțelege task-ul, pune întrebările necesare
STAGE 1: Citește contextul din fișierele .md relevante
STAGE 2: Planifică înainte să scrii cod
STAGE 3: ADR în DECISIONS.md dacă e schimbare arhitecturală
STAGE 4: Implementează cod + teste în paralel
STAGE 5: Verifică — TypeScript, lint, teste, UI checks
STAGE 6: Actualizează SESSION_LOG, AI_CHANGELOG, LESSONS_LEARNED
STAGE 7: Prezintă ce ai făcut și așteaptă aprobare
STAGE 8: Completează Blueprint 02
STAGE 9: Push doar după aprobare explicită

## REGULI NON-NEGOCIABILE
- Nu scrie niciun cod înainte de a înțelege complet task-ul
- Nu folosi `any` în TypeScript
- Nu lăsa `console.log` în cod
- Nu face push fără aprobare explicită de la utilizator
- Scrie teste odată cu codul, nu după
- Actualizează AI_CHANGELOG.md după fiecare task complet
- Dacă ceva e ambiguu, întreabă ÎNAINTE să implementezi

## CÂND SĂ ÎNTREBI
Întreabă înainte de implementare dacă:
- Task-ul poate fi interpretat în două moduri diferite
- O decizie este greu de inversat (data model, API contract, auth)
- Ești pe punctul să atingi modulul de auth sau plăți

## STANDARDE COD
- TypeScript strict — zero `any`, zero `as` fără comentariu explicativ
- Funcții pure unde posibil, side effects la margini
- Fișiere sub 300 linii
- Comentarii explică DE CE, nu CE face codul
- Un test = un motiv de eșec

## ACTUALIZARE FIȘIERE .md
La finalul fiecărui task, actualizează obligatoriu:
- SESSION_LOG.md — ce s-a făcut, unde am rămas, ce urmează
- AI_CHANGELOG.md — intrare completă cu Ce/De ce/Cum/Impact
- KNOWN_ISSUES.md — dacă ai făcut workarounds intenționate
- LESSONS_LEARNED.md — dacă ai descoperit pattern-uri noi
```

---

## ◈ PASUL 5 — Instalare UI UX Pro Max Skill

```bash
# Instalare CLI (necesită Node.js instalat)
npm install -g uipro-cli

# Verificare
uipro --version

# Instalare în proiect pentru Copilot
cd /calea/spre/proiectul-tau
uipro init --ai copilot

# Generare design system persistent
python3 .copilot/skills/ui-ux-pro-max/scripts/search.py "[tipul proiectului]" --design-system --persist -p "[Numele proiectului]"
```

Dacă nu ai Python: descarcă de la **python.org** → instalare → restart VS Code.

---

## ◈ PASUL 6 — Structura completă de fișiere în proiect

```bash
your-project/
│
├── .github/
│   └── copilot-instructions.md    ← Citit automat de Copilot
│
├── .vscode/
│   ├── settings.json              ← Config Copilot pentru proiect
│   └── extensions.json            ← Extensii recomandate
│
├── .copilot/                      ← Generat de uipro init --ai copilot
│   └── skills/ui-ux-pro-max/
│
├── design-system/
│   ├── MASTER.md                  ← Design system persistent
│   └── pages/                     ← Override per pagină
│
├── docs/
│   ├── pushes/                    ← Blueprint 02 per push
│   │   └── YYYY-MM-DD_vX.Y.Z.md
│   ├── diagrams/                  ← Diagrame Mermaid
│   └── wireframes/                ← Wireframe-uri
│
├── CLAUDE.md                      ← Regulile principale
├── SPEC.md
├── ARCHITECTURE.md
├── DECISIONS.md
├── SESSION_LOG.md
├── KNOWN_ISSUES.md
├── LESSONS_LEARNED.md
├── IMPROVEMENTS.md
├── TESTING.md
├── UI_UX.md
├── BUSINESS_LOGIC.md
├── EXTERNAL_SERVICES.md
├── AI_CHANGELOG.md
├── WORKFLOW.md
│
├── BLUEPRINT_01_KICKOFF.md
├── BLUEPRINT_02_PUSH_DOC.md       ← Template (nu se editează direct)
├── BLUEPRINT_03_MVP_LAUNCH.md
│
└── src/                           ← Codul tău
```

---

## ◈ PASUL 7 — Cum deschizi și folosești Copilot Chat

### Deschidere
- **Shortcut:** `Ctrl+Alt+I` (Windows) sau `Cmd+Alt+I` (Mac)
- **SAU:** Click pe iconița chat din bara laterală stânga

### Selectare model (IMPORTANT)
În partea de sus a ferestrei Copilot Chat, click pe dropdown-ul de model:

```
Pentru task-uri complexe (arhitectură, debugging, refactoring):
→ Selectează: claude-sonnet-4-5  (dacă apare)
→ SAU: GPT-4.1                   (fallback bun)
→ SAU: o4-mini                   (pentru thinking profund)

Pentru task-uri rapide (boilerplate, completări simple):
→ Selectează: GPT-4.1-mini       (mai rapid)

EVITĂ: GPT-3.5 pentru orice task de cod serios
```

### Activare Agent Mode (OBLIGATORIU pentru workflow-ul nostru)
Agent Mode = Copilot poate citi fișiere, edita cod, rula comenzi terminal.
Fără Agent Mode = simplu chatbot, nu face nimic automat.

**Cum activezi:**
1. În Copilot Chat, caută iconița `⚡` sau butonul **"Agent"** în partea de sus
2. Click pe el → se activează Agent Mode
3. SAU scrie `@workspace` la începutul oricărui mesaj

**Verificare că Agent Mode e activ:** Vei vedea că Copilot poate propune editări direct în fișiere, nu doar răspunsuri text.

---

## ◈ PASUL 8 — Prima sesiune: Inițializare proiect

Deschide Copilot Chat în Agent Mode. Copiază și trimite exact acest mesaj:

```
@workspace Suntem la inițializarea proiectului.

Te rog să faci în ordine:

1. Citește CLAUDE.md și confirmă că ai înțeles workflow-ul (3 bullet-uri)
2. Citește .github/copilot-instructions.md și confirmă că le-ai asimilat
3. Pune-mi întrebările de onboarding combinate pentru:
   — BLUEPRINT_01_KICKOFF.md (proiect, echipă, stack, features MVP)
   — BUSINESS_LOGIC.md (audiență, piață, buget marketing)
   — EXTERNAL_SERVICES.md (servicii externe pe care le folosim)
   Pune TOATE întrebările într-un SINGUR mesaj, grupate clar.
4. Pe baza răspunsurilor mele, populează toate fișierele .md cu datele reale
5. Generează design system-ul inițial cu UI UX Pro Max
6. Scrie primul entry în SESSION_LOG.md și AI_CHANGELOG.md

Tipul proiectului: [completează tu — ex: SaaS web app / Mobile game]
Stack-ul dorit: [completează tu — ex: Next.js, TypeScript, Supabase]
```

Agentul va pune întrebările, tu răspunzi, el populează tot.

---

## ◈ PASUL 9 — Fluxul zilnic pentru un task nou

### Metoda 1 — Prompt complet (recomandat pentru task-uri importante)

Deschide Copilot Chat → Agent Mode → trimite:

```
@workspace

CONTEXT: Citește SESSION_LOG.md pentru starea curentă a proiectului.

TASK: [Descrie ce vrei să faci în 1-3 propoziții]

ÎNAINTE SĂ ÎNCEPI:
1. Citește secțiunile relevante din SPEC.md și KNOWN_ISSUES.md
2. Dacă ceva e ambiguu, întreabă-mă ÎNAINTE de implementare
3. Prezintă-mi un Task Brief scurt și așteaptă confirmarea mea

DUPĂ IMPLEMENTARE:
- Rulează verificările (tsc, lint, teste)
- Actualizează SESSION_LOG.md și AI_CHANGELOG.md
- Prezintă Stage 7 cu ce ai făcut și așteaptă "ok" de la mine
```

### Metoda 2 — Prompt rapid (pentru task-uri simple)

```
@workspace [Descrie task-ul scurt].
Urmează CLAUDE.md. Actualizează SESSION_LOG și AI_CHANGELOG după.
```

### Metoda 3 — Inline cu Ctrl+I (pentru editări punctuale)

Click în fișierul de cod → selectează liniile → `Ctrl+I` → descrie modificarea.
Copilot editează direct, fără să deschidă chat-ul.

---

## ◈ PASUL 10 — Cum dai context din fișierele .md

Copilot citește automat `.github/copilot-instructions.md` și fișierele setate în `.vscode/settings.json`. Dar uneori ai nevoie să îi dai context specific:

### Metoda 1 — Atașează fișier (drag & drop)
În Copilot Chat, există un buton `📎` (Attach). Click → selectează fișierul `.md` relevant.

### Metoda 2 — Referință cu #
```
Folosind #SPEC.md și #KNOWN_ISSUES.md, implementează [task].
```

### Metoda 3 — @workspace caută automat
```
@workspace Implementează feature-ul de autentificare conform specificațiilor din proiect.
```
`@workspace` îi permite să caute în TOATE fișierele, inclusiv .md-urile.

### Metoda 4 — Referință directă la secțiune
```
@workspace Citește secțiunea "Auth & Authorization" din ARCHITECTURE.md
și implementează middleware-ul de protecție a rutelor.
```

---

## ◈ PASUL 11 — Workflow complet task: de la zero la push

```
1. TU: Deschizi Copilot Chat → Agent Mode
   ↓
2. TU: Trimiți prompt cu task-ul (Metoda 1 de mai sus)
   ↓
3. COPILOT: Citește SESSION_LOG + SPEC + KNOWN_ISSUES
   ↓
4. COPILOT: Pune întrebări dacă e ceva ambiguu
   ↓
5. TU: Răspunzi la întrebări
   ↓
6. COPILOT: Prezintă Task Brief → aștepți "da, mergi"
   ↓
7. TU: Confirmi
   ↓
8. COPILOT: Implementează cod + teste
   ↓
9. COPILOT: Rulează verificări (tsc, lint, test)
   ↓
10. COPILOT: Prezintă Stage 7 — ce a făcut, ce teste, ce limitări
    ↓
11. TU: Verifici în browser / editor că totul arată bine
    ↓
12. TU: Spui "ok, mergi la blueprint"
    ↓
13. COPILOT: Completează Blueprint 02 + actualizează AI_CHANGELOG
    ↓
14. COPILOT: Întreabă timestamp-uri + version bump
    ↓
15. TU: Răspunzi + spui "push"
    ↓
16. COPILOT: git add → git commit → git push
```

---

## ◈ PROMPTS GATA DE FOLOSIT (copy-paste)

Salvează-le undeva la îndemână:

### Prompt: Task nou standard
```
@workspace

Citește SESSION_LOG.md pentru context.

Task: [DESCRIE TASK-UL]

Înainte să implementezi:
- Dacă e ceva ambiguu, întreabă-mă
- Prezintă Task Brief și așteaptă confirmarea mea

După implementare:
- Rulează tsc + lint + teste
- Actualizează SESSION_LOG.md, AI_CHANGELOG.md
- Prezintă Stage 7 și așteaptă "ok" de la mine
```

### Prompt: Review cod existent
```
@workspace

Fă un review al codului din [fișier/folder].
Verifică:
1. Respectă standardele din CLAUDE.md?
2. Există vulnerabilități de securitate?
3. Există code smell sau anti-pattern-uri?
4. Testele acoperă cazurile edge?

Adaugă găsirile în KNOWN_ISSUES.md și IMPROVEMENTS.md.
```

### Prompt: Generare teste
```
@workspace

Generează teste pentru [fișier/funcție/feature].
Urmează TESTING.md — identifică tipul de feature și aplică matricea corespunzătoare.
Include: unit tests, integration tests, cazuri edge, adversarial inputs.
Marchează cu ⚠️ ce necesită verificare manuală.
```

### Prompt: Update arhitectură + diagrame
```
@workspace

Am adăugat [ce s-a schimbat].
Te rog:
1. Actualizează ARCHITECTURE.md cu noua structură
2. Regenerează diagrama Mermaid afectată
3. Adaugă ADR în DECISIONS.md dacă e decizie semnificativă
4. Actualizează EXTERNAL_SERVICES.md dacă am adăugat servicii noi
```

### Prompt: Status proiect
```
@workspace

Dă-mi un raport de status în maxim 10 linii:
1. Starea curentă din SESSION_LOG.md (3 bullet-uri)
2. Buguri critice/high din KNOWN_ISSUES.md
3. Top 3 îmbunătățiri din IMPROVEMENTS.md
4. Primul task din SESSION_LOG pentru sesiunea curentă
```

### Prompt: Push + Blueprint
```
@workspace

Task-ul e aprobat. Te rog:
1. Completează Blueprint 02 în docs/pushes/[YYYY-MM-DD_vX.Y.Z_slug].md
   (completează tot ce știi din sesiune, întreabă-mă pentru timestamps și version bump)
2. Actualizează AI_CHANGELOG.md cu intrarea completă
3. git add . → git status → arată-mi ce se va comite
4. Generează mesajul de commit (format: type: description vX.Y.Z)
5. Așteaptă "da, push" de la mine înainte de git push
```

### Prompt: Design UI nou feature
```
@workspace

Implementează UI pentru [feature].
Înainte de cod:
1. Citește design-system/MASTER.md pentru stilul proiectului
2. Citește UI_UX.md pentru principii și checklist
3. Dacă am preferințe de design specifice: [descrie sau lasă gol]
4. Generează mai întâi wireframe text, arată-mi înainte de implementare

La implementare:
- Aplică design system-ul existent
- Verifică: overflow, alinieri, contrast, mobile viewport
- Adaugă ⚠️ pentru orice necesită verificare vizuală manuală
```

---

## ◈ SETĂRI AVANSATE COPILOT

### Auto-accept sugestii (opțional — dacă ai încredere în agent)
În `.vscode/settings.json` adaugă:
```json
"chat.editing.confirmEditRequestRemoval": false,
"chat.editing.alwaysSaveWithGeneratedChanges": false
```

### Exclude fișiere de la indexare Copilot
Creează `.copilotignore` în root:
```
node_modules/
.env*
*.key
*.pem
dist/
build/
.next/
coverage/
```

### Keyboard shortcuts utile
```
Ctrl+Alt+I    → Deschide/închide Copilot Chat
Ctrl+I        → Inline edit în fișier curent
Alt+\         → Trigger manual autocomplete
Tab           → Acceptă sugestie autocomplete
Esc           → Respinge sugestie
```

---

## ◈ TROUBLESHOOTING

**Copilot nu citește CLAUDE.md automat:**
Verifică că `.github/copilot-instructions.md` există și că `.vscode/settings.json` are `github.copilot.chat.codeGeneration.instructions` cu referința la CLAUDE.md.

**Agent Mode nu apare:**
Actualizează extensia Copilot Chat la ultima versiune. Agent Mode e disponibil în versiunile recente cu Copilot Pro.

**Copilot nu poate edita fișiere:**
Ești în Chat Mode, nu Agent Mode. Caută butonul `⚡` sau scrie `@workspace` la început.

**Copilot ignoră instrucțiunile din .md:**
Fișierul `.github/copilot-instructions.md` are o limită de context. Dacă e prea lung, Copilot îl ignoră parțial. Menține-l sub 8000 caractere — detaliile rămân în CLAUDE.md la care faci referire.

**Push s-a executat fără aprobare:**
Copilot nu poate face push autonom dacă nu îi dai explicit comanda. Dacă s-a întâmplat, revizuiește prompts-urile și adaugă mereu "Așteaptă 'push' de la mine" la finalul instrucțiunilor.

**Testele nu se rulează automat:**
Copilot Agent poate rula comenzi în terminal integrat VS Code. Dacă nu o face, adaugă explicit în prompt: "Rulează `pnpm test:run` în terminal și arată-mi outputul."

---

## ◈ CHECKLIST SETUP COMPLET

Bifează fiecare item:

- [ ] Extensiile instalate (Copilot, Copilot Chat, GitLens, etc.)
- [ ] Copilot activ în status bar (nu gri)
- [ ] User Settings JSON configurat
- [ ] `.vscode/settings.json` creat în proiect
- [ ] `.github/copilot-instructions.md` creat
- [ ] Toate fișierele `.md` copiate în root-ul proiectului
- [ ] UI UX Pro Max instalat (`uipro --version` funcționează)
- [ ] `design-system/MASTER.md` generat
- [ ] Agent Mode funcționează (test: `@workspace ce fișiere .md există în proiect?`)
- [ ] Model selectat în Copilot Chat (GPT-4.1 sau claude-sonnet)
- [ ] Prima sesiune de inițializare completată
- [ ] BLUEPRINT_01 populat cu datele proiectului
- [ ] SESSION_LOG.md are primul entry
- [ ] Test end-to-end: un task mic completat prin pipeline complet

---

## ◈ DIFERENȚA FAȚĂ DE COPILOT OBIȘNUIT

| Fără sistem | Cu sistemul nostru |
|---|---|
| Copilot uită contextul la fiecare sesiune | SESSION_LOG.md = memorie permanentă |
| Trebuie să explici proiectul de fiecare dată | `.github/copilot-instructions.md` = context automat |
| Decizii arhitecturale se pierd | DECISIONS.md = paper trail complet |
| Bug-urile se repetă | KNOWN_ISSUES.md = nu uită ce e stricat |
| Push direct, fără documentare | Blueprint 02 + AI_CHANGELOG la fiecare push |
| Teste improvizate | TESTING.md = strategie per tip de feature |
| Design inconsistent | design-system/MASTER.md = consistență garantată |
| Nu știi ce a făcut agentul | AI_CHANGELOG.md = jurnal complet |

Sistemul transformă Copilot dintr-un autocomplete avansat într-un agent care înțelege proiectul, ține minte tot, și lucrează metodic.
