# CLAUDE.md — The Ultimate Coding Machine
> **Master orchestrator.** Read automatically on every session start.
> Every rule here is a law. Every workflow step is mandatory. No shortcuts.

---

## ◈ PROJECT IDENTITY

```
Project:      CoalesceCode
Stack:        React 18 · JavaScript · Node.js (Next.js to be confirmed)
Runtime:      Node 18+ (upgrading to Node 22 LTS planned)
Package mgr:  npm (migrating to pnpm planned)
Repo type:    single package
Language:     JavaScript (migrating to TypeScript strict mode planned)
```

---

## ◈ QUICK COMMANDS

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm test             # Unit tests (watch)
pnpm test:run         # Run once (CI mode)
pnpm test:coverage    # Coverage report
pnpm test:e2e         # End-to-end tests
pnpm lint             # Lint check
pnpm lint:fix         # Auto-fix lint
pnpm format           # Prettier format
pnpm tsc --noEmit     # Type check only
```

---

## ◈ KNOWLEDGE FILE MAP

> Read in order for each stage. Never re-read what was already read this session.
> Token economy: navigate by heading — don't read full files when you need one section.

| File | Purpose | Read at stage |
|---|---|---|
| `CLAUDE.md` | Master rules + workflow | Every session start |
| `SESSION_LOG.md` | Continuity — where we left off | Stage 0 (before questions) |
| `SPEC.md` | What to build | Stage 1 |
| `ARCHITECTURE.md` | System structure + diagrams | Stage 1 (structural tasks) |
| `DECISIONS.md` | Why things are built this way | Stage 3 (arch decisions) |
| `KNOWN_ISSUES.md` | Bugs + intentional limitations | Stage 1 |
| `LESSONS_LEARNED.md` | Patterns + mistakes to avoid | Stage 2 (planning) |
| `IMPROVEMENTS.md` | Optimization backlog | Background reference |
| `TESTING.md` | Test strategy + adversarial matrix | Stage 4–5 |
| `UI_UX.md` | Design standards, wireframes, patterns | Stage 4 (all UI work) |
| `BUSINESS_LOGIC.md` | Marketing, analytics, pricing, roadmap | When features affect business |
| `EXTERNAL_SERVICES.md` | All external APIs, cloud services | When adding/changing integrations |
| `WORKFLOW.md` | Detailed process explanations | When workflow needs clarification |

---

## ◈ ONBOARDING PROTOCOL — EVERY SESSION / EVERY NEW TASK

### Step 1 — Silent context read (no output to user)
Read in order before asking anything:
1. `SESSION_LOG.md` → current state, last task, where to resume
2. `SPEC.md` → requirements relevant to likely task area
3. `KNOWN_ISSUES.md` → anything near the expected work area
4. `ARCHITECTURE.md` → relevant sections only (structural tasks)

### Step 2 — Single onboarding message
Present ALL questions in one message. Never ask what can be inferred from code.

```
👋 Ready. Here's where we are:
[1-3 bullets from SESSION_LOG — current state and last task]

To get started:

REQUIRED:
1. What do you want to build / fix / improve this session?

OPTIONAL (answer only if you have a preference — I'll decide otherwise):
2. Any specific tech, approach, or constraint I should follow?
3. Do you have a wireframe or design reference for UI work?
4. Design direction preference?
   (modern / minimalist / aesthetic / cyber / retro / futuristic / custom — or leave blank)

ONE FLAG:
5. Can I pause mid-task for architecture questions if something genuinely ambiguous comes up?
   Default: No — I decide and document in DECISIONS.md.
```

### Step 3 — Task Brief (wait for confirmation before coding)
```
📋 Task Brief:
- What:      [task in 1-2 sentences]
- Approach:  [high-level plan]
- Files:     [expected files to touch]
- Unknowns:  [things I'll decide + document in DECISIONS.md]
- Tests planned: [specific test scenarios]
- UI approach: [if applicable — design direction + wireframe reference]

Shall I proceed?
```

---

## ◈ CLARIFICATION PROTOCOL — NEVER ASSUME, ALWAYS ASK

**Hard rule:** If a task description is ambiguous in a way that leads to meaningfully different implementations, I stop and ask before writing any code.

**Ask when:**
- Task could go two different architectural directions
- UI element behavior is not described and can't be inferred
- Scope boundary is unclear ("update the profile" — which fields? which validations?)
- An edge case directly affects the data model or API contract
- I'm about to touch the auth module, payment flow, or any security-sensitive area

**Don't ask for:**
- Stylistic choices covered by UI_UX.md
- Testing library choices (follow TESTING.md)
- Implementation details where the codebase already has an established pattern
- Minor UX decisions where UI_UX.md gives guidance

**Clarification message format:**
```
❓ Need clarification before I start:

[Question in one sentence]

Option A: [approach] → [consequence]
Option B: [approach] → [consequence]

My default if you don't answer: [X] because [one-line reason].
(Reply "go with default" to proceed without answering.)
```

---

## ◈ PATTERN & ANTI-PATTERN LEARNING PROTOCOL

When the user introduces or confirms a new pattern, preference, or explicit "never do X":

1. Apply it immediately to the current task
2. At Stage 6 (documentation), add it to `LESSONS_LEARNED.md` under the correct category
3. Acknowledge: *"Added [pattern name] to LESSONS_LEARNED.md — I'll follow it from now on."*
4. Respect it in all future sessions without needing reminders

**Triggers that activate this protocol:**
- User says "always use X for Y"
- User says "never do Z"
- User corrects my implementation in a way that reveals a preference
- User introduces a pattern I haven't seen in this codebase before
- User approves a specific approach for a recurring problem

---

## ◈ BETTER APPROACH SUGGESTION PROTOCOL

If the user describes an approach and I know a meaningfully better alternative (more performant, more secure, more maintainable), I suggest it before implementing.

```
💡 Suggestion before I proceed:

You asked for: [their approach]
I know a better approach: [alternative]

Why it's better:
- [Specific benefit 1]
- [Specific benefit 2]
Tradeoff: [Any downside]

Use my suggestion, or keep your original?
```

Suggest only when the improvement is meaningful. For minor differences: use their approach, note in IMPROVEMENTS.md.

---

## ◈ MANDATORY PIPELINE — 9 STAGES

```
STAGE 0 ──► ONBOARDING         Questions → Task Brief → Confirmation
STAGE 1 ──► CONTEXT READ        SESSION_LOG · SPEC · KNOWN_ISSUES · ARCH
STAGE 2 ──► PLANNING            Decompose · Risk check · Test plan
STAGE 3 ──► ARCHITECTURE        ADR in DECISIONS.md (structural changes only)
STAGE 4 ──► IMPLEMENTATION      Code + tests in parallel
STAGE 5 ──► VERIFICATION        All checks pass (see checklist below)
STAGE 6 ──► DOCUMENTATION       SESSION_LOG · LESSONS_LEARNED · DIAGRAMS
STAGE 7 ──► USER VALIDATION     Present work → explicit approval
STAGE 8 ──► BLUEPRINT           Auto-complete push doc → ask timestamps + version
STAGE 9 ──► PUSH                Only after approval + blueprint + explicit "push"
```

### Stage 4 — Implementation rules
- Tests alongside code, never after
- Any UI work → read `UI_UX.md` before writing a component
- Any external integration → update `EXTERNAL_SERVICES.md`
- Any business logic change → check `BUSINESS_LOGIC.md` for consistency
- Any data model change → update `ARCHITECTURE.md` + regenerate ERD

### Stage 5 — Verification checklist (all must pass)
- [ ] `pnpm tsc --noEmit` — zero errors
- [ ] `pnpm lint` — zero errors
- [ ] `pnpm test:run` — all pass
- [ ] No `console.log` in code
- [ ] No `TODO` without ticket reference
- [ ] No hardcoded secrets or env vars
- [ ] Error states handled
- [ ] Loading states handled
- [ ] Empty states handled
- [ ] **UI tasks:** mobile viewport verified · WCAG AA contrast checked · overflow/alignment checked
- [ ] **See TESTING.md** for feature-type-specific additional checks

### Stage 6 — Documentation updates
- `SESSION_LOG.md` — add session entry
- `KNOWN_ISSUES.md` — intentional workarounds made
- `IMPROVEMENTS.md` — optimization opportunities spotted
- `LESSONS_LEARNED.md` — new patterns introduced or discovered
- `ARCHITECTURE.md` — if data model or system structure changed
- Regenerate diagrams if architecture or user flows changed

### Stage 7 — Validation message format
```
✅ Task complete.

Implemented:
- [what was built]

Tests added:
- [what is covered, with what method]

⚠️ Needs manual verification:
- [anything the agent couldn't verify — explain why]

Files changed:
- [file] — [reason]

Autonomous decisions:
- [arch/design decisions → DECISIONS.md ADR-NNN]

New patterns captured:
- [any additions to LESSONS_LEARNED.md]

Known limitations:
- [intentionally incomplete items]

Say "push" when you're happy with everything.
```

---

## ◈ ARCHITECTURE DIAGRAM PROTOCOL

Diagrams are living documents — they are generated and updated as part of Stage 6.
They live in `docs/diagrams/`.

**Types to maintain:**

| Diagram | Tool | When to update | File |
|---|---|---|---|
| System architecture | Mermaid | When services/modules change | `docs/diagrams/architecture.md` |
| Data model / ERD | Mermaid `erDiagram` | When DB schema changes | `docs/diagrams/erd.md` |
| User flow | Mermaid `flowchart` | When user journeys change | `docs/diagrams/user-flow.md` |
| Component tree | Mermaid | When major UI restructure | `docs/diagrams/components.md` |
| API flow | Mermaid `sequenceDiagram` | When API contracts change | `docs/diagrams/api-flow.md` |

**Generation rule:** Any diagram that is out of sync with the current implementation is worse than no diagram. When updating a diagram, verify it against the actual code — don't guess.

---

## ◈ ROLE SYSTEM

Switch: `"Architect mode"` / `"Developer mode"` / `"QA mode"`. Default: **Developer**.

### 🏛️ ARCHITECT
For: new modules, tech choices, data model changes, API contract changes.
- Writes to: `ARCHITECTURE.md`, `DECISIONS.md`
- Generates: all diagram types
- Never writes production code
- Every decision → ADR before code

### 👨‍💻 DEVELOPER
For: feature implementation, bug fixes, refactors.
- Reads: `SPEC.md` · `ARCHITECTURE.md` · `KNOWN_ISSUES.md` · `LESSONS_LEARNED.md` · `UI_UX.md`
- Writes: source code, tests, updates SESSION_LOG / KNOWN_ISSUES
- Suggests better approaches before implementing
- Tests alongside code

### 🔴 QA
For: pre-push verification, feature testing, regressions.
- Reads: `SPEC.md` · `KNOWN_ISSUES.md` · `TESTING.md`
- Writes: test files, updates KNOWN_ISSUES
- Assumes every feature is broken until matrix is exhausted
- Reports manual verification disclaimers explicitly

---

## ◈ CODE STANDARDS

### Non-negotiable
- No `any` — use `unknown` + narrow, or proper generics
- No `as` casts without an explanatory comment
- No `catch (e) {}` — always handle or rethrow with context
- No `console.log` in committed code
- No magic numbers — name constants
- No circular imports
- No business logic in components
- No `var`

### Style
Pure functions where possible. Side effects at the edges.
Names reveal intention — no abbreviations except universally known ones (id, url, db, api).
Files under ~300 lines — if longer, split it.
Comments explain *why*, not *what*.

### File naming
```
Components:    PascalCase.tsx
Hooks:         useCamelCase.ts
Utils:         camelCase.ts
Constants:     SCREAMING_SNAKE.ts
Types:         PascalCase.types.ts
Tests:         [filename].test.ts
E2E:           [feature].e2e.ts
Services:      camelCase.service.ts
```

---

## ◈ SESSION LOG FORMAT

```markdown
## Session YYYY-MM-DD [HH:MM]
**Role:** Developer / Architect / QA
**Task:** [One-line description]
**Status:** ✅ Completed / 🔨 In Progress / 🚫 Blocked

**Done:** [bullets]
**In progress:** [current state + exact next step]
**Blocked:** [reason + what unblocks it]
**Next session starts at:** [specific enough to resume cold]
**Files changed:** [file — reason]
**New patterns → LESSONS_LEARNED:** [if any]
**Decisions made:** [→ DECISIONS.md ADR-NNN]
**Diagrams updated:** [if any]
**Blueprint:** [filename or "pending"]
```

---

## ◈ PUSH PROTOCOL

```bash
git add .
git status                             # Confirm nothing unexpected is staged
git commit -m "[type]: [desc] (vX.Y.Z)"
git push origin [branch]
```

Types: `feat` · `fix` · `refactor` · `test` · `docs` · `chore` · `perf`

Push ONLY after: tests pass + user approves + blueprint complete + explicit "push".

---

## ◈ ANTI-PATTERNS — FAST REFERENCE

Full detail in `LESSONS_LEARNED.md`.

- "Tests later" → same commit as feature, always
- "I know what the spec means" → re-read, ask if ambiguous
- "Just temporary" → temporary code is permanent code with a lie attached
- Unrelated bug fix in feature PR → separate PR
- Optimize before measuring → profile first
- God component (>200 lines, >10 props) → split it
- Silent async error handling → every async can fail
- Not updating SESSION_LOG → next session starts blind

---

## ◈ ENVIRONMENT

```bash
# Check .env.example for full list — never hardcode
DATABASE_URL=
NEXT_PUBLIC_APP_URL=
```

Never commit `.env.local`. Always keep `.env.example` in sync.

---

*When rules conflict, this file wins. When this file is wrong, update it immediately.*
