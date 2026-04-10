# KNOWN_ISSUES.md — Bug Tracker & Tech Debt Register

> Every known bug, intentional limitation, and piece of tech debt lives here.
> Updated to match the current prototype stage (v0.0.1-alpha).

---

## ◈ OPEN BUGS

### BUG-001: Gemini fallback requires explicit API key in client runtime

**Severity:** 🟡 Medium
**Status:** Open
**Reported:** 2026-03-29
**Affects:** F01 architecture detection fallback path
**Found by:** Agent analysis

**Steps to reproduce:**

1. Analyze a repository where core components are missing (frontend/backend/database)
2. Do not provide a Gemini key in environment variables
3. Observe fallback warning in analysis log and unchanged deterministic result

**Expected behavior:** Fallback should execute when needed and enrich missing core detections.
**Actual behavior:** Fallback is skipped when `GEMINI_API_KEY` is unavailable in client runtime.

**Workaround:** Rely on static detection and analysis log inspection.
**Root cause:** No secure backend secret management exists in current architecture.
**Fix target:** v0.1.x
**Related files:** src/features/analyzer/engine.mjs

---

### BUG-002: Several dashboard tabs still use mock/demo data

**Severity:** 🟡 Medium
**Status:** Open
**Reported:** 2026-03-29
**Affects:** Narrative, Entry Points, Tests, User Flow, Code Health tabs
**Found by:** Agent analysis

**Steps to reproduce:**

1. Analyze any real repository
2. Open tabs: Narrative, Entry Points, Tests, User Flow, Code Health
3. Compare displayed values with repository reality

**Expected behavior:** Tabs should show data derived from the analyzed repository.
**Actual behavior:** Some tabs display static mock content with "coming in v2" notices.

**Workaround:** Use Architecture, Dependencies, and Analysis Log tabs for reliable output.
**Root cause:** MVP prototype prioritized architecture/dependency core first.
**Fix target:** v0.1.x
**Related files:** src/App.js

---

### BUG-003: Large repositories can produce partial analysis

**Severity:** 🟡 Medium
**Status:** Open
**Reported:** 2026-03-29
**Affects:** Analysis completeness for large or complex repositories
**Found by:** Agent analysis

**Steps to reproduce:**

1. Analyze a very large repository/monorepo
2. Review analysis log for tree truncation or parse warnings
3. Check missing nodes/dependencies in output

**Expected behavior:** Stable and complete analysis for supported repository sizes.
**Actual behavior:** Latest validated full run reached `27 pass / 0 partial / 0 fail` on the current vector. The issue remains open as a risk category: large/heterogeneous repositories may still regress to partial in future vectors when runtime signals are fragmented across multiple packages/services.

**Workaround:** Re-run with GitHub token, inspect Analysis Log, and use latest benchmark outputs (`docs/benchmarks/latest-git-tests.md`, `docs/benchmarks/latest-git-tests.json`) for rule-priority tuning.
**Root cause:** Client-side analysis is constrained by GitHub API limits and response size.
**Fix target:** v0.1.x
**Related files:** src/features/analyzer/engine.mjs

---

### BUG-004: Export PDF action is currently UI-only

**Severity:** 🟢 Minor
**Status:** Open
**Reported:** 2026-03-29
**Affects:** Dashboard export functionality
**Found by:** Agent analysis

**Steps to reproduce:**

1. Analyze any repository
2. Click "Export PDF"
3. Observe no export flow

**Expected behavior:** Export action should download a PDF report.
**Actual behavior:** Button is currently non-functional placeholder.

**Workaround:** Use screenshots/manual notes.
**Root cause:** Export flow not implemented yet.
**Fix target:** v0.2.x
**Related files:** src/App.js

---

### BUG-005: Benchmark reruns can be invalidated by GitHub API rate limits

**Severity:** 🟡 Medium
**Status:** Open
**Reported:** 2026-03-29
**Affects:** `pnpm benchmark:repos` reliability and `docs/benchmarks/latest.*` artifact quality
**Found by:** Agent benchmark rerun

**Steps to reproduce:**

1. Run benchmark multiple times without a high-limit GitHub token
2. Observe successful first runs followed by fast `rate limit reached` failures on many repos
3. If no valid `latest.*` baseline exists yet, reruns may not refresh `latest.*` due protection rules

**Expected behavior:** Latest benchmark artifacts should represent a valid full run.
**Actual behavior:** Runner now avoids overwriting `latest.*` when rate-limit failures are detected and writes only timestamped snapshot; however, if no prior valid baseline exists, `latest.*` may remain stale/missing until a successful rerun.

**Workaround:** Provide `GITHUB_TOKEN`; rerun `pnpm benchmark:repos` after reset window, or restore `latest.*` from a valid snapshot in `docs/benchmarks/results/`.
**Root cause:** Client-side benchmark depends directly on GitHub API quota; protection prevents invalid overwrite but cannot create a new valid baseline without quota.
**Fix target:** v0.1.x
**Related files:** scripts/run-repo-benchmark.cjs, docs/benchmarks/latest.json

---

## ◈ INTENTIONAL LIMITATIONS

| #     | Limitation                                   | Why it's intentional                                          | Plan to address                                                   | Version |
| ----- | -------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------- | ------- |
| L-001 | Client-side only architecture (no backend)   | Fast prototype validation, low setup overhead                 | Introduce backend proxy/service layer after core UX stabilization | v0.1.x  |
| L-002 | No persistence for analyses/projects         | Current goal is interactive validation, not account workflows | Add DB + auth once architecture/API contracts are stabilized      | v0.2.x  |
| L-003 | Local upload supports only `.zip` archives   | Scope kept focused on a single archive flow                   | Add support for local folder input and additional archive formats | v0.2.x  |
| L-004 | Diagram edit actions are simulation previews | Designed to validate UX before real refactor automation       | Wire actions to real code transformation pipeline later           | v0.3.x  |

---

## ◈ TECH DEBT

| #      | Location                         | What's wrong                                                                                | Correct approach                                                                                  | Priority  | Added      |
| ------ | -------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TD-001 | src/App.js                       | File is monolithic (UI + analyzer + mock data + styles) and hard to maintain                | Split into feature modules: analyzer engine, dashboard tabs, diagram editor, shared UI primitives | 🔴 High   | 2026-03-29 |
| TD-002 | src/features/analyzer/engine.mjs | Detection coverage for some stacks (Go/.NET/Rust-heavy repos) remains heuristic and partial | Add targeted detectors and fixture-driven tests for benchmark fail/partial cases                  | 🔴 High   | 2026-03-29 |
| TD-003 | src/App.js                       | Inline style system and large constant blocks reduce readability/testability                | Extract styles and static catalogs to separate files                                              | 🟡 Medium | 2026-03-29 |
| TD-004 | Project-wide                     | No automated tests currently protect regression-prone logic                                 | Add unit/integration test baseline for analyzer helpers and parsing                               | 🔴 High   | 2026-03-29 |

---

## ◈ RESOLVED (archive)

| Bug ID  | Description                                                                                 | Fixed in     | Fix date   |
| ------- | ------------------------------------------------------------------------------------------- | ------------ | ---------- |
| L-003   | ZIP upload placeholder removed; `.zip` analysis enabled                                     | v0.0.1-alpha | 2026-03-29 |
| BUG-006 | ZIP benchmark false reviews from expected title keyword leakage and generic backend wording | v0.0.1-alpha | 2026-04-09 |
