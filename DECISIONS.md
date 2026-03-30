# DECISIONS.md — Architecture Decision Records

> Every significant technical decision lives here with full context.
> When you read code and wonder "why is it done THIS way?" — the answer is here.
> Never delete entries. Superseded decisions get status "Superseded by ADR-NNN".

---

## How to write an ADR

An ADR is written BEFORE the decision is implemented, not after.
It takes 5-10 minutes and prevents weeks of confusion later.

**When to write one:**

- Adding a new library or external service
- Changing the data model or schema
- Modifying a public API contract
- Choosing between two valid technical approaches
- Making any decision that would be hard or costly to reverse

**Template:**

```markdown
## ADR-[NNN]: [Short, descriptive title]

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-NNN
**Author:** [Who made this decision]
**Context:** [What situation or requirement forced this decision?]
**Decision:** [What was chosen and the core reasoning]
**Consequences:** [What becomes easier + what becomes harder or riskier]
**Alternatives considered:**

- [Option A] — rejected because [reason]
- [Option B] — rejected because [reason]
  **Related:** [Links to other ADRs, SPEC sections, or external resources]
```

---

## ◈ DECISION LOG

---

### ADR-001: Tech Stack Baseline — Build MVP in React+JS, Migrate to Next.js+TS in v2

**Date:** 2026-03-28
**Status:** Accepted
**Author:** Claude (AI Agent) + User (Marius)

**Context:**
CoalesceCode project was initialized with a basic React 18 + JavaScript setup using create-react-app. The project's goal is to build a codebase visualization tool for developers. We need to decide whether to:

1. Continue building MVP features in the current JavaScript + React setup
2. Migrate to TypeScript + Next.js first, then build features

The project will eventually need:

- Server-side rendering for SEO (developer tool landing pages)
- API routes for code analysis backend
- TypeScript for code quality (CLAUDE.md mandates strict TypeScript)
- Better performance and scalability

**Decision:**
**Build MVP features (F01-F03) in the current React + JavaScript stack, then migrate to Next.js + TypeScript in v2.0.**

**Reasoning:**

- **MVP validation > perfect tech stack** — need user feedback fast
- **Migration can be incremental** — React → Next.js is straightforward (app router)
- **TypeScript can be added gradually** — rename .js → .ts, add types module-by-module
- **Faster time to MVP = faster user feedback = better product decisions**
- **Less risk** — validate product-market fit before investing in full rewrite

**Tech Stack — Current (v0.x MVP):**

```
Frontend:        React 18.1.0
Language:        JavaScript (ES6+)
Styling:         CSS → Tailwind CSS (to be added)
State:           React useState + useContext (simple for MVP)
Build:           react-scripts (create-react-app)
Package manager: npm (migrate to pnpm in v2 for speed)
Testing:         TBD (add Vitest in v2)
```

**Tech Stack — Planned (v2.0+):**

```
Frontend:        Next.js 15 (app router)
Language:        TypeScript 5+ (strict mode — CLAUDE.md requirement)
Styling:         Tailwind CSS 4
State:           Zustand (simple) + TanStack Query (server state)
API:             Next.js API routes
Database:        PostgreSQL (Supabase)
ORM:             Prisma
Auth:            NextAuth.js (GitHub OAuth provider)
Package manager: pnpm
Testing:         Vitest + Playwright
Deployment:      Vercel
```

**Consequences:**

✅ **Benefits:**

- Faster MVP delivery — no 1-2 week migration delay before features
- Can validate product-market fit before investing in perfect architecture
- Incremental migration path — less risk than big-bang rewrite
- Team learns Next.js/TypeScript gradually while building features
- Less complexity in MVP phase (easier debugging)

⚠️ **Tradeoffs:**

- Technical debt accumulates in v1 (JavaScript instead of TypeScript)
- Refactoring needed in v2 (but planned and budgeted for)
- No SSR/SEO benefits in MVP (acceptable — initial users are direct, not organic search)
- No API routes (MVP can use mock data or external services)
- Code duplication risk if not careful (will be addressed in migration ADR)

**Alternatives considered:**

- **Option A: Migrate to Next.js + TypeScript immediately (before MVP features)**
  - **Rejected because:** Delays MVP by 1-2 weeks with zero user value delivered
  - **Risk:** Over-engineering before product validation
  - **Only valid if:** We had confirmed demand and paying customers waiting

- **Option B: Migrate to TypeScript only (keep React + CRA)**
  - **Rejected because:** TypeScript migration effort ≈ 50% of Next.js migration effort anyway
  - **Better to:** Do both migrations together in v2 (atomic transition, one codebase state change)
  - **Problem:** CRA limitations (no API routes, no SSR) would still remain

- **Option C: Build in Next.js but keep JavaScript**
  - **Rejected because:** CLAUDE.md mandates TypeScript strict mode for code quality
  - **If migrating to Next.js:** Should go full modern stack (Next.js + TS together)
  - **Half-measure:** Not worth the migration effort without TypeScript benefits

**Migration Strategy (when v2 starts):**

```
Phase 1 — Setup (Week 1):
  1. Create Next.js 15 project (app router) in parallel branch
  2. Set up Tailwind CSS + design system
  3. Add TypeScript (`npx tsc --init`, strict: true)
  4. Set up pnpm workspace

Phase 2 — Component Migration (Week 2-3):
  5. Copy React components from CRA → Next.js `/app/components`
  6. Rename files .js → .tsx incrementally
  7. Add types module-by-module (start with utils, then components, then pages)
  8. Test each component in isolation

Phase 3 — State & Data (Week 4):
  9. Migrate state management to Zustand
  10. Add TanStack Query for server state
  11. Set up Supabase + Prisma ORM
  12. Create database schema (users, projects, diagrams)

Phase 4 — Backend (Week 5):
  13. Add Next.js API routes for code analysis
  14. Integrate GitHub OAuth via NextAuth.js
  15. Connect frontend to real API (replace mock data)

Phase 5 — Polish & Deploy (Week 6):
  16. Add Vitest unit tests (critical paths)
  17. Add Playwright E2E tests (user flows)
  18. Deploy to Vercel
  19. Migrate production data (if any users by then)
```

**Related:**

- ARCHITECTURE.md § Tech Stack
- CLAUDE.md § CODE STANDARDS (TypeScript strict mandate)
- SPEC.md § Features F01-F03 (MVP scope)
- SESSION_LOG.md — 2026-03-28 session

**Review date:** After MVP launch OR after 100 users (whichever comes first) — reassess if migration is needed earlier based on:

- Technical debt accumulation
- Performance issues
- SEO requirements becoming critical
- User feedback demanding features that need API routes

---

### ADR-002: Keep Analysis Engine Client-Side for v0.0.x Prototype

**Date:** 2026-03-29
**Status:** Accepted
**Author:** GitHub Copilot + User (Marius)

**Context:**
Current implementation already delivers core value by analyzing public GitHub repositories directly in the browser. Adding backend/API/database now would increase complexity and setup cost before validating core UX and feature priority for MVP.

Main constraints observed:

- Browser hits GitHub rate limits faster without token
- Some advanced analysis paths (LLM fallback) are fragile in client-only setup
- No persistence for analysis history

**Decision:**
Continue with a client-side analysis architecture for v0.0.x and defer backend introduction until after first product hardening milestone.

The immediate focus remains:

1. Improve reliability of static analysis and UX clarity
2. Reduce mock/demo sections by replacing them with real computed insights
3. Prepare modularization of current monolithic `src/App.js`

**Consequences:**

- ✅ Faster iteration loop and lower infrastructure overhead in current phase
- ✅ Easier local setup (no backend services required)
- ⚠️ Limited scalability and reliability due to browser/API constraints
- ⚠️ No secure server-side secret handling for advanced integrations
- ⚠️ No persistence or multi-project user experience

**Alternatives considered:**

- **Introduce backend immediately (Node/Next API + DB)** — rejected for now because it delays MVP validation and increases implementation scope significantly.
- **Partial backend only for proxying GitHub requests** — postponed because first we need to stabilize current detection quality and product direction.

**Exit criteria for revisiting ADR-002:**

- Frequent user-facing failures from GitHub limits/CORS
- Need for authenticated/private repository analysis
- Need for saved projects, team collaboration, or billing
- Requirement for secure server-side API keys

---

### ADR-004: Prefer Deterministic Inventory Heuristics Before AI Fallback

**Date:** 2026-03-29
**Status:** Accepted
**Author:** GitHub Copilot + User (Marius)

**Context:**
After the first benchmark baseline (`7 pass / 16 partial / 3 fail`), several partial/fail results were caused by deterministic gaps:

- backend fallback from folder structure defaulted to Node.js even for Go/.NET/Rust codebases,
- non-JS repositories (e.g. database engines) lacked package-based detection signals,
- some frontend stacks (e.g. Flutter) were not inferred from file inventory.

Using AI fallback to cover these gaps would increase cost and reduce determinism, while the missing signals were available in repository files.

**Decision:**
Extend deterministic analysis with inventory-level heuristics and language-aware fallback rules:

- infer backend type from file extensions/manifests (not Node.js by default),
- detect key stacks from file inventory (`pubspec.yaml`, `go.mod`, `.csproj`, `Cargo.toml`, etc.),
- add deterministic repo-identity hints for database-centric repositories,
- keep Gemini fallback optional and only after deterministic pass remains incomplete.

**Consequences:**

- ✅ Benchmark quality improved without AI fallback usage (`16 pass / 10 partial / 0 fail`).
- ✅ Detection behavior remains deterministic and reproducible across UI + benchmark runs.
- ✅ Runtime cost remains near-zero in default flow.
- ⚠️ Heuristics must be curated to avoid false positives as dataset grows.

**Alternatives considered:**

- **Enable Gemini fallback broadly for benchmark runs**
  - Rejected because it introduces token cost and hides deterministic rule gaps.

- **Keep generic Node.js folder fallback and tune benchmark scoring only**
  - Rejected because it masks actual detection quality issues.

**Related:**

- `src/features/analyzer/engine.mjs`
- `scripts/run-repo-benchmark.cjs`
- `docs/benchmarks/comparison-latest.md`

---

### ADR-003: Single Analyzer Source of Truth + Deterministic Benchmark Harness

**Date:** 2026-03-29
**Status:** Accepted
**Author:** GitHub Copilot + User (Marius)

**Context:**
The repository had analyzer logic spread across multiple places (UI-layer code and feature files), which increased drift risk and made reliability work harder to validate. The stabilization task required:

- deterministic detection as primary strategy,
- optional Gemini fallback only when core components are missing,
- explicit logging of fallback reason/changes/cost,
- benchmark proof across 20-30 real repositories.

Without a single reusable engine module, benchmark and UI would not be guaranteed to produce the same behavior.

**Decision:**
Adopt `src/features/analyzer/engine.mjs` as the single analyzer implementation for both UI flows and automation tooling.

Additionally, introduce benchmark tooling:

- dataset: `scripts/repo-benchmark-dataset.json` (26 repositories),
- runner: `scripts/run-repo-benchmark.cjs`,
- outputs: `docs/benchmarks/latest.json`, `docs/benchmarks/latest-summary.md`, and timestamped snapshots in `docs/benchmarks/results/`.

Benchmark defaults are deterministic-first and cost-aware (`BENCHMARK_USE_GEMINI=0`, version lookup skipped by default).

**Consequences:**

- ✅ UI and benchmark now share identical analyzer behavior.
- ✅ Fallback usage/tokens/cost are measurable and persisted per run.
- ✅ Large-repo evaluation is reproducible through dataset + scripted execution.
- ⚠️ Current benchmark quality is still constrained by client-side GitHub API access and heuristic coverage.
- ⚠️ Remaining UI code in `src/App.js` still needs further modularization.

**Alternatives considered:**

- **Keep legacy analyzer logic inside `src/App.js` and patch incrementally**
  - Rejected because drift and maintenance cost remain high.

- **Build backend proxy first, then benchmark**
  - Rejected for now because it increases scope and delays stabilization feedback loop.

**Related:**

- `ARCHITECTURE.md`
- `IMPROVEMENTS.md` (modularization and detection-quality backlog)
- `docs/benchmarks/README.md`

---

<!-- Add new ADRs above this line, in reverse chronological order (newest first) -->
