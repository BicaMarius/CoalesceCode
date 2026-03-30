# Copilot Instructions

## Proiect și context

Citește `CLAUDE.md` din root pentru regulile complete ale proiectului.
Citește `SESSION_LOG.md` înainte de orice task nou — acolo e starea curentă.
Citește `SPEC.md` pentru cerințele produsului.
Citește `KNOWN_ISSUES.md` înainte să lucrezi în zone cu probleme cunoscute.

## Workflow obligatoriu — 9 etape

Urmează pipeline-ul din CLAUDE.md pentru fiecare task:

1. Înțelege task-ul complet — dacă e ambiguu, întreabă ÎNAINTE de implementare
2. Citește contextul din fișierele .md relevante
3. Planifică înainte să scrii cod — prezintă Task Brief și așteaptă confirmare
4. Dacă e schimbare arhitecturală → scrie ADR în DECISIONS.md înainte de cod
5. Implementează cod + teste în paralel, niciodată după
6. Verifică: `pnpm tsc --noEmit` + `pnpm lint` + `pnpm test:run` — toate trebuie să treacă
7. Prezintă ce ai făcut și așteaptă aprobare explicită
8. Completează Blueprint 02 în docs/pushes/
9. Push DOAR după "push" sau "da, push" explicit de la utilizator

## Reguli non-negociabile

- Nu scrie niciun cod înainte de a înțelege complet task-ul
- Nu folosi `any` în TypeScript — niciodată
- Nu lăsa `console.log` în cod
- Nu face `git push` fără aprobare explicită
- Scrie teste odată cu codul, nu după
- Actualizează `SESSION_LOG.md` și `AI_CHANGELOG.md` după fiecare task

## Când să întrebi obligatoriu

- Task-ul poate fi interpretat în două moduri diferite
- O decizie este greu de inversat (data model, API contract, auth)
- Ești pe punctul să modifici modulul de auth, plăți sau orice date sensibile

## Standarde cod

- TypeScript strict: zero `any`, zero `as` fără comentariu explicativ
- Funcții pure unde posibil, side effects la margini (IO, DB, API)
- Fișiere sub 300 linii — dacă e mai lung, are prea multe responsabilități
- Comentariile explică DE CE, nu CE face codul
- Un test = un motiv de eșec, niciodată mai multe

## Actualizare fișiere .md (obligatoriu după fiecare task)

- `SESSION_LOG.md` — ce s-a făcut, unde am rămas, ce urmează exact
- `AI_CHANGELOG.md` — intrare completă: Ce / De ce / Cum / Impact
- `KNOWN_ISSUES.md` — dacă ai făcut workarounds intenționate
- `LESSONS_LEARNED.md` — dacă ai descoperit pattern-uri noi sau utilizatorul a introdus unul
