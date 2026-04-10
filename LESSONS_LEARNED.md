# LESSONS_LEARNED.md — Patterns, Anti-Patterns & Hard-Won Knowledge

> Practical lessons captured from real work on this project.

---

## ◈ ARCHITECTURE LESSONS

### [LL-019] Expected benchmark hints should come from structured sections, not free-text headings

**Category:** Architecture
**Date:** 2026-04-09

**Context:**
ZIP expected parsing produced false service constraints when case-name/title tokens (for example `jwt` in `env-only-mongo-redis-jwt`) leaked into keyword hints.

**Lesson:**
Derive expected keyword hints only from architecture structure (`Nodes`, `Edges`) and treat free-text (`title`, `notes`) as informational, not normative.

**Why it matters:**
Free-text-driven matching can turn naming conventions into synthetic mismatches and inflate review buckets.

**How to apply it:**

1. Parse markdown sections first.
2. Build hints from node id/label/type and edges only.
3. Keep comparator normalization for generic backend wording (`api/routes/server`) to avoid provider-label overfitting.
4. Protect behavior with fixture tests before full reruns.

**Anti-pattern (what NOT to do):**
Applying keyword classification on entire expected documents without structural boundaries.

### [LL-018] Benchmark scoring should normalize technology families before strict matching

**Category:** Architecture
**Date:** 2026-04-09

**Context:**
Remaining PARTIAL repo cases were caused by label drift across equivalent stacks (`neon` vs `postgres`, `planetscale` vs `mysql`, `turso` vs `sqlite`) and by noisy generic tokens.

**Lesson:**
Apply family-level normalization first, then run deterministic category scoring against normalized candidates.

**Why it matters:**
Exact-label matching over heterogeneous repo ecosystems produces false partials and hides real regressions.

**How to apply it:**

1. Maintain alias maps per category (frontend/backend/database/runtime).
2. Score against normalized families, not raw string literals only.
3. Add fixture tests for every alias family added.
4. Avoid ambiguous generic doc tokens when they create cross-framework noise.

**Anti-pattern (what NOT to do):**
Treating vendor-specific labels as unique technologies in benchmark scoring.

### [LL-016] Short keyword matching needs boundary rules in repo-doc inference

**Category:** Architecture
**Date:** 2026-04-09

**Context:**
Repo-doc hints used simple substring checks, which created noisy expected keywords (ex: `go`, `api`) and inflated PARTIAL/FAIL scoring.

**Lesson:**
Use boundary-aware keyword matching and avoid ambiguous short tokens in deterministic expectation inference.

**Why it matters:**
Substring-only matching over docs can turn documentation phrasing into false architecture requirements.

**How to apply it:**

1. Use token boundary checks for short/special keywords.
2. Prefer `golang` over `go` in doc classifiers.
3. Treat generic terms (`api`, `service`, `backend`) as weak signals unless corroborated.

**Anti-pattern (what NOT to do):**
Inferring hard required categories from one noisy doc keyword.

### [LL-017] Do not destroy `latest.*` before validating remote-dependent benchmark runs

**Category:** Process
**Date:** 2026-04-09

**Context:**
Benchmark runs can fail mid-run due GitHub rate limits, and pre-run cleanup of `latest.*` can erase a valid baseline.

**Lesson:**
Write timestamped snapshots first and update `latest.*` only after run-quality validation.

**Why it matters:**
Pre-clean + remote failure creates broken/stale benchmark visibility and false regression perception.

**How to apply it:**

1. Keep prior `latest.*` until new run is validated.
2. Skip latest overwrite when rate-limit failures are detected.
3. Add explicit override flag only for intentional force updates.

**Anti-pattern (what NOT to do):**
Deleting benchmark baselines before knowing the new run is valid.

### [LL-015] Prefer generic technology registries over per-tech booleans

**Category:** Architecture
**Date:** 2026-04-09

**Context:**
Technology detection and reporting were drifting toward one-off booleans (e.g. TypeScript/Tailwind), which made benchmark and UI logic fragile whenever new stacks appeared.

**Lesson:**
Keep technology detection schema-driven (`detected.technologies`) and treat special booleans as explicit exceptions only when product semantics require it (Docker in this case).

**Why it matters:**
Boolean-per-tech growth creates hardcoded branches, missed edge cases, and repetitive updates across analyzer/UI/benchmarks.

**How to apply it:**

1. Store each technology as a normalized object with category/sources/evidence.
2. Build summary metrics (`technologyCount`, `technologyHighlights`) from the registry, not from named flags.
3. Keep benchmark inputs configurable through vectors (`[repoUrl, expectedOr0]`) instead of fixed datasets.

**Anti-pattern (what NOT to do):**
Adding a new global boolean every time a new technology needs visibility.

### [LL-011] Benchmark mismatch must be validated against code evidence, not expected docs alone

**Category:** Architecture
**Date:** 2026-04-09

**Context:**
Initial ZIP benchmark pass reported mass failures because expected parsing and strict literal matching treated documentation artifacts and provider-label differences as hard analyzer errors.

**Lesson:**
Architecture benchmark scoring should combine expected diagrams with independent code evidence and semantic equivalence rules.

**Why it matters:**
Literal-only expected matching creates false negatives and drives overfitted detector changes.

**How to apply it:**

1. Parse expected structure section-aware (nodes/edges only).
2. Validate mismatches against deps/source/config/env evidence.
3. Use family-level equivalence where valid (e.g. Turso/SQLite, PlanetScale/MySQL, Neon/PostgreSQL).
4. Keep ambiguous cases as review, not fail.

**Anti-pattern (what NOT to do):**
Treating every expected mismatch as analyzer regression without evidence checks.

### [LL-001] Keep architecture docs synced to implemented state

**Category:** Architecture
**Date:** 2026-03-29

**Context:**
Documentation had moved ahead and described a backend/database/auth stack not yet implemented.

**Lesson:**
Always separate "current state" from "target state" in architecture docs.

**Why it matters:**
If docs describe future architecture as present, planning and task priority become distorted.

**How to apply it:**
For each major section, explicitly label Current vs Planned and update after each meaningful task.

**Anti-pattern (what NOT to do):**
Writing aspirational architecture as if already delivered.

---

## ◈ PERFORMANCE LESSONS

### [LL-002] Client-side analysis needs strict scope control

**Category:** Performance
**Date:** 2026-03-29

**Context:**
Repository analysis in browser is useful quickly but can degrade on large trees and many dependency checks.

**Lesson:**
Bound scanning scope and provide clear fallback/partial-result messaging.

**Why it matters:**
Without explicit limits, users receive slow or inconsistent outputs with little explanation.

**How to apply it:**
Cap scanned files per pass, log truncation explicitly, and show confidence level in UI.

**Anti-pattern:**
Attempting exhaustive deep analysis in one unbounded browser pass.

---

## ◈ TESTING LESSONS

### [LL-003] Prototype speed must not postpone testability boundaries

**Category:** Testing
**Date:** 2026-03-29

**Context:**
Core analyzer logic is currently embedded in a large UI component file.

**Lesson:**
Even in prototype phase, isolate pure functions early to preserve easy test coverage.

**Why it matters:**
Late extraction multiplies refactor risk and slows every future change.

**How to apply it:**
Extract parser/detection helpers first and test them before UI-level refactor.

**Anti-pattern:**
Keeping business logic and view concerns mixed until "later".

---

## ◈ INTEGRATION LESSONS

### [LL-004] External API constraints are product constraints

**Category:** Integration
**Date:** 2026-03-29

**Context:**
GitHub rate limits and API response constraints directly affect analysis quality.

**Lesson:**
Integration limits must be surfaced in UX and roadmap decisions, not treated as hidden implementation details.

**Why it matters:**
Users interpret silent partial output as wrong product behavior.

**How to apply it:**
Expose clear progress/failure states, token guidance, and debug traces in-app.

**Anti-pattern:**
Assuming external APIs behave like internal controlled services.

---

## ◈ PROCESS LESSONS

### [LL-005] Close each task with documentation loop

**Category:** Process
**Date:** 2026-03-29

**Context:**
Project continuity relies on markdown artifacts across sessions.

**Lesson:**
After every task, update session status, changelog, and affected registers in one pass.

**Why it matters:**
If only code or only docs are updated, the next session starts with mismatch and loses time.

**How to apply it:**
Treat documentation updates as part of the Definition of Done.

---

### [LL-006] Avoid mixed npm/pnpm install states in the same node_modules

**Category:** Process
**Date:** 2026-03-29

**Context:**
`npm install` failed with Arborist `Cannot read properties of null (reading 'matches')` while a previous `pnpm` install layout was present.

**Lesson:**
When switching package managers, clean `node_modules` before installing.

**Why it matters:**
Mixed dependency tree layouts can trigger non-obvious install failures and slow onboarding.

**How to apply it:**
Use one package manager per workspace session or run a clean install (`remove node_modules` then install) when switching.

---

### [LL-007] Proactively flag monolith refactor risk during feature work

**Category:** Process
**Date:** 2026-03-29

**Context:**
Feature velocity remains high, but `src/App.js` continues to centralize UI and analyzer concerns.

**Lesson:**
When a file grows into multiple responsibilities, explicitly report refactor need in task outcomes.

**Why it matters:**
If risk is only tracked silently in backlog, maintainability degrades until changes become expensive.

**How to apply it:**
Call out restructuring need in delivery summary and keep active improvement items tied to concrete split targets.

---

### [LL-008] Treat generic HTTP clients as weak external-API signals

**Category:** Integration
**Date:** 2026-03-29

**Context:**
`axios`/`fetch` presence alone produced noisy external API detections in architecture output.

**Lesson:**
Use stricter evidence for external integrations (provider SDKs, explicit OpenAPI/Swagger usage, or absolute outbound endpoint usage).

**Why it matters:**
Weak signals inflate architecture diagrams with unknown services and reduce trust in output.

**How to apply it:**
Gate generic-client signals behind stronger corroboration and avoid scanning documentation files as authoritative evidence.

---

### [LL-009] Split monolith UI by screen before deep componentization

**Category:** Process
**Date:** 2026-03-29

**Context:**
`src/App.js` was highly coupled and large. A direct deep split into many micro-components would have increased regression risk.

**Lesson:**
Use a two-step refactor: extract full screens first, then decompose each extracted screen into smaller feature components.

**Why it matters:**
This preserves behavior while reducing blast radius per change and keeps validation simple after each phase.

**How to apply it:**
First move large conditional-render blocks into page-level components with prop passthrough. Validate build/tests. Then perform feature-level splits inside each page.

**Anti-pattern:**
Attempting a one-shot refactor that mixes screen extraction and micro-component decomposition in the same change set.

---

### [LL-010] Enable lint gates with React-aware rules from day one

**Category:** Process
**Date:** 2026-03-29

**Context:**
Introducing a plain ESLint baseline in a JSX-heavy codebase produced false positives (`no-unused-vars` on JSX symbols) and delayed pipeline adoption.

**Lesson:**
When adding lint to React code, start with a React-aware config (`eslint-plugin-react`) instead of generic JavaScript-only rules.

**Why it matters:**
False-positive-heavy lint output reduces trust in the gate and slows refactor delivery.

**How to apply it:**
Use `eslint:recommended` + `plugin:react/recommended`, disable only rules that are obsolete for the runtime (`react/react-in-jsx-scope`), then tighten incrementally.

**Anti-pattern:**
Rolling out strict generic lint rules first and fixing dozens of non-actionable JSX warnings.

---

### [LL-011] Keep one analyzer implementation across UI and automation

**Category:** Architecture
**Date:** 2026-03-29

**Context:**
Analyzer logic existed in multiple places, making fixes inconsistent between interactive UI runs and scripted validation.

**Lesson:**
Use a single analyzer module as source of truth and consume it from both product UI and benchmark tooling.

**Why it matters:**
When analysis behavior diverges across entry points, benchmark results are misleading and regressions are harder to spot.

**How to apply it:**
Keep detection/fallback logic in one engine module and expose options for expensive operations (fallback usage, dependency lookups, concurrency).

**Anti-pattern:**
Maintaining near-duplicate analyzer implementations in separate files.

---

### [LL-012] Benchmark deterministic mode first, then enable fallback selectively

**Category:** Reliability
**Date:** 2026-03-29

**Context:**
Large multi-repo benchmarking can become noisy and expensive if fallback AI and version lookups are always on.

**Lesson:**
Run benchmarks in deterministic-first mode by default, then re-run targeted subsets with fallback enabled only where needed.

**Why it matters:**
This isolates real detector quality gaps and prevents avoidable token/cost spend.

**How to apply it:**
Default benchmark options to `BENCHMARK_USE_GEMINI=0` and `BENCHMARK_SKIP_VERSION_LOOKUP=1`; enable heavier checks only for focused investigations.

---

### [LL-013] Backend folder fallback must be language-aware

**Category:** Reliability
**Date:** 2026-03-29

**Context:**
Fallback backend detection from folder structure was defaulting to Node.js even for Go/.NET/Rust repositories, lowering benchmark quality.

**Lesson:**
When inferring backend from structure, derive runtime from file extensions/manifests before assigning a backend label.

**Why it matters:**
Generic fallback labels hide real stack signals and create avoidable partial classifications.

**How to apply it:**
Use extension and inventory heuristics (`go.mod`, `.csproj`, `Cargo.toml`, `.py`) to pick backend type; keep Node.js only as true fallback.

---

### [LL-014] Start UI modularization with whole-screen extraction

**Category:** Process
**Date:** 2026-03-29

**Context:**
`src/App.js` remained very large. Extracting complete screen blocks first reduced risk without forcing deep prop contract changes in one step.

**Lesson:**
Begin monolith UI split by moving self-contained screens (upload/loading) into page components, then continue with dashboard/diagram sections.

**Why it matters:**
This gives immediate structural progress while preserving behavior and keeping review/rollback simple.

**How to apply it:**
Extract one screen at a time, keep props explicit, run benchmark/lint/dev after each extraction.

---

### [LL-015] Treat rate-limited benchmark reruns as non-canonical

**Category:** Reliability
**Date:** 2026-03-29

**Context:**
An additional rerun hit GitHub API rate limits and produced transient failures that overwrote `docs/benchmarks/latest.*`.

**Lesson:**
Only promote benchmark outputs to `latest.*` when run health is valid and comparable.

**Why it matters:**
Quota-related failures can look like detector regressions and distort prioritization.

**How to apply it:**
Keep reruns as timestamped snapshots, and if a rerun is rate-limited restore `latest.*` from the last valid full run.

---

### [LL-016] Suppress analyzer-rule sources in service inference

**Category:** Reliability
**Date:** 2026-03-30

**Context:**
Repository analysis on `BicaMarius/CoalesceCode` produced false positives (`redis`, `cloudinary`, `stripe`, `elasticsearch`) because scanner rules matched keyword catalogs from analyzer-like source sections rather than real runtime integrations.

**Lesson:**
Analyzer-rule or keyword-catalog files must be treated as high-noise evidence and excluded (or strongly down-weighted) unless corroborated by runtime-context signals.

**Why it matters:**
Without suppression and context gating, architecture output loses trust: external services appear in diagrams even when they are not actually used in application runtime.

**How to apply it:**
Detect analyzer-rule patterns by path/content markers, then require stronger runtime evidence (SDK imports, endpoint usage, connection strings, execution context) before promoting service detections.

**Anti-pattern:**
Treating static keyword lists and rule dictionaries as if they were proof of live integration usage.

---

## ◈ QUICK REFERENCE — Pattern Cheat Sheet

```
Architecture:       Current-state-first docs, target-state explicitly marked as planned.
Analysis runtime:   Client-side fetch + parse + merge, with explicit error handling and logs.
Error handling:     Show user-facing error + keep internal debug trace for diagnosis.
State management:   Local React state for prototype; extract domain state before scaling.
Refactor strategy:  Extract pure analyzer helpers, then split by screen, then split pages by feature/tab.
Testing strategy:   Prioritize unit tests for parser/detection/graph-building functions.
```
