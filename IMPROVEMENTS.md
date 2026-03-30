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
Latest benchmark rerun (`pnpm benchmark:repos`) over 26 repositories produced `16 pass / 10 partial / 0 fail`.

**Proposed improvement:**
Add deterministic detector rules and fixtures for remaining partial repositories (currently led by monorepo/multi-runtime cases such as `supabase/supabase`, `vercel/next.js`, `nestjs/nest`, `n8n-io/n8n`, `appsmithorg/appsmith`).

**Expected benefit:**
Push pass rate beyond current baseline without increasing LLM cost.

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
`pnpm benchmark:repos` always overwrites `docs/benchmarks/latest.json` and `latest-summary.md`, even when reruns fail due GitHub rate limits.

**Proposed improvement:**
Update benchmark runner to only replace `latest.*` when run quality meets validity criteria (for example: no rate-limit errors, or fail ratio below threshold). Keep failed reruns as timestamped snapshots only.

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

| ID       | Title                                           | Implemented in | Date       |
| -------- | ----------------------------------------------- | -------------- | ---------- |
| IMP-001A | Extract analyzer engine from App monolith       | v0.0.1-alpha   | 2026-03-29 |
| IMP-007A | Deterministic detector upgrade (pass-rate lift) | v0.0.1-alpha   | 2026-03-29 |
