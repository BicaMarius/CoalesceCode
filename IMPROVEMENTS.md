# IMPROVEMENTS.md — Optimization Backlog

> Prioritized backlog for improving reliability, maintainability, and product value.

---

## ◈ HIGH PRIORITY

### IMP-001: Modularize monolithic App implementation

**Category:** Maintainability
**Impact:** 🔴 High
**Effort:** 🔴 Large (days)
**Added:** 2026-03-29
**Added by:** GitHub Copilot

**Current state:**
Analyzer logic was extracted to `src/features/analyzer/engine.mjs`, but UI state, mock datasets, and tab rendering are still centralized in `src/App.js`.

**Proposed improvement:**
Split into dedicated modules/components:

- src/features/dashboard/\*
- src/features/diagram-editor/\*
- src/shared/ui/\*
- src/constants/\* for static catalogs and mock placeholders

**Expected benefit:**
Lower bug risk, easier testing, faster iteration per feature.

**Dependencies:**
None.

**Notes:**
Phase 1 completed: analysis helpers are already extracted to `src/features/analyzer/engine.mjs`.

---

### IMP-007: Improve detector coverage based on benchmark failures

**Category:** Reliability
**Impact:** 🔴 High
**Effort:** 🟡 Medium (hours)
**Added:** 2026-03-29
**Added by:** GitHub Copilot

**Current state:**
Latest validated full reruns are fully green:

- Repo vector: `27 pass / 0 partial / 0 fail`
- ZIP corpus: `150 pass / 0 review / 0 warn / 0 fail`

Previously remaining partial/review sets are now closed.

**Proposed improvement:**
Stabilize the new all-green baseline by expanding fixture coverage for:

- expected parsing section boundaries (`Nodes/Edges` vs title/notes)
- generic-backend semantic matching (`api/routes/server`)
- alias-family normalization across repo and ZIP scorers

Also add drift checks when the repo vector or ZIP corpus changes.

**Expected benefit:**
Preserve `27/27` + `150/150` benchmark quality across future changes and catch comparator/parser regressions before full-suite degradation.

**Dependencies:**
Benchmark harness and dataset are already available.

---

### IMP-008: Protect latest benchmark artifacts from transient rerun failures

**Category:** Reliability / Tooling
**Impact:** 🟡 Medium
**Effort:** 🟡 Medium (hours)
**Added:** 2026-03-29
**Added by:** GitHub Copilot

**Current state:**
Implemented in `scripts/run-repo-benchmark.cjs`:

- rate-limited runs skip `latest.*` overwrite
- timestamped snapshot is always preserved
- `latest.*` is no longer deleted at run start
- optional override available: `BENCHMARK_FORCE_LATEST_ON_ERROR=1`

**Proposed improvement:**
Refine with a validation policy layer (for example: treat high fail ratio without explicit rate-limit as non-latest-eligible) and emit a quality verdict in summary.

**Expected benefit:**
Prevents false regression signals in docs and keeps trend comparisons stable.

**Dependencies:**
Changes in `scripts/run-repo-benchmark.cjs` output policy.

---

### IMP-002: Add backend proxy for external API calls

**Category:** Reliability / Security
**Impact:** 🔴 High
**Effort:** 🔴 Large (days)
**Added:** 2026-03-29
**Added by:** GitHub Copilot

**Current state:**
Browser calls GitHub/jsDelivr directly; fallback LLM path is fragile in client-only runtime.

**Proposed improvement:**
Introduce minimal backend/API proxy for:

- GitHub requests (rate-limit handling, retries)
- Package metadata requests
- LLM fallback orchestration with secure key handling

**Expected benefit:**
Higher analysis reliability, secure integration path, better observability.

**Dependencies:**
ADR approval for backend introduction.

---

### IMP-003: Replace mock dashboard tabs with real computed insights

**Category:** Product Value
**Impact:** 🔴 High
**Effort:** 🟡 Medium (hours)
**Added:** 2026-03-29
**Added by:** GitHub Copilot

**Current state:**
Multiple tabs are partially demo/placeholder.

**Proposed improvement:**
Implement real data pipelines for Narrative, Entry Points, Tests, User Flow, and Code Health.

**Expected benefit:**
Higher trust in output and clearer MVP value.

**Dependencies:**
Analyzer refactor and stable intermediate result model.

---

## ◈ MEDIUM PRIORITY

### IMP-004: Add baseline automated test suite

**Category:** Testing / DX
**Impact:** 🟡 Medium
**Effort:** 🟡 Medium (hours)
**Added:** 2026-03-29

**Current state:**
No unit/integration coverage for parser and detector logic.

**Proposed improvement:**
Set up Vitest and add tests for:

- parseGitHubUrl
- dependency classification
- version comparison
- graph building and merge logic

**Expected benefit:**
Regression safety during refactor.

---

### IMP-005: Implement export (SVG/PDF) for architecture results

**Category:** UX
**Impact:** 🟡 Medium
**Effort:** 🟡 Medium (hours)
**Added:** 2026-03-29

**Current state:**
Export button is present but not wired.

**Proposed improvement:**
Support architecture snapshot export as SVG and optional PDF report.

**Expected benefit:**
Immediate practical value for users sharing analysis output.

---

## ◈ LOW PRIORITY / NICE TO HAVE

### IMP-006: Improve accessibility and mobile adaptation

**Category:** UX / Accessibility
**Impact:** 🟢 Low
**Effort:** 🟡 Medium (hours)
**Added:** 2026-03-29

**Current state:**
Prototype UI is desktop-first with partial accessibility coverage.

**Proposed improvement:**
Add keyboard flow checks, contrast pass, responsive polish for narrow viewports.

**Expected benefit:**
Better inclusivity and readiness for broader audience.

---

## ◈ COMPLETED (archive)

| ID       | Title                                            | Implemented in | Date       |
| -------- | ------------------------------------------------ | -------------- | ---------- |
| IMP-001A | Extract analyzer engine from App monolith        | v0.0.1-alpha   | 2026-03-29 |
| IMP-007A | Deterministic detector upgrade (pass-rate lift)  | v0.0.1-alpha   | 2026-03-29 |
| IMP-008A | Rate-limit-safe latest benchmark artifact policy | v0.0.1-alpha   | 2026-04-09 |
