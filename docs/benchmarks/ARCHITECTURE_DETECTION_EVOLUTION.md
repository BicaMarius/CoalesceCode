# Architecture Detection Evolution

This document captures how architecture detection quality evolved during the ZIP + Git benchmark automation work.

## Scope

- Analyzer core: `src/features/analyzer/engine.mjs`
- ZIP benchmark automation: `scripts/run-zip-diagram-benchmark.cjs`
- Shared benchmark parsing: `scripts/benchmark-helpers.cjs`
- Git benchmark runner updates: `scripts/run-repo-benchmark.cjs`

## Starting Point

The objective was to validate architecture detection against a large local ZIP corpus (`150` cases) and Git dataset benchmarks, while avoiding overfit to expected diagrams.

Two constraints were mandatory:

1. Do not blindly trust expected markdown diagrams.
2. Validate mismatches against real code evidence (deps, source, config, env signals).

## Phase 1: Benchmark Infrastructure

### What was added

- New shared helpers for parsing expected architecture files.
- New ZIP benchmark runner that:
  - auto-discovers cases,
  - parses expected nodes/edges,
  - runs analyzer on each ZIP,
  - compares expected vs actual,
  - cross-checks mismatches with independent evidence,
  - classifies status as `pass`, `review`, `warn`, `fail`, `error`.
- Git benchmark runner improvements:
  - supports dataset shape as array or object,
  - optional expected-diagram metadata support,
  - dedicated stable output files.

### Stable outputs now generated

- ZIP:
  - `docs/benchmarks/latest-zip-tests.json`
  - `docs/benchmarks/latest-zip-tests.md`
- Git:
  - `docs/benchmarks/latest-git-tests.json`
  - `docs/benchmarks/latest-git-tests.md`

## Phase 2: First ZIP Run and Root Cause Discovery

Initial raw run reported `150/150 fail`.

This was not a real analyzer collapse. The main root cause was in benchmark parsing:

- edge parser was incorrectly reading arrows from non-edge sections (`Detection Sources`), causing false missing-edge errors (`package.json -> react`, `left -> right`, etc.).

### Fixes applied

- Parse expected edges only from the `## Edges` section.
- Prefer fenced edge block inside that section.
- Ignore layout pseudo-nodes (`left`, `right`, `middle`, etc.).

After parser correction, the suite became meaningful.

## Phase 3: Analyzer Robustness Improvements

### 1) Source-only backend detection (CommonJS)

Problem:

- `require("express")`, `require("koa")`, `require("pg")` in source-only repos were not reliably detected.

Fix:

- Reworked `hasImport` matcher to support both ESM and CommonJS patterns robustly:
  - `from "..."`
  - `require("...")`
- Added explicit `pg/postgres/postgresql/slonik` source import detection.

Impact:

- Source-only failures were resolved for cases like:
  - `22-source-only-backend`
  - `41-minimal-express-mongoose`
  - `101-source-only-express-pg-jwt`
  - `102-source-only-koa-mongo`

### 2) Env-only signal coverage

Problem:

- `.env`-based detection could be missed if env files were excluded from signal scan.

Fix:

- Included `.env*` files in analyzer signal-file selection.

Impact:

- Improved env-only case handling (example: `47-env-detection-only`).

### 3) tRPC and Clerk detection coverage

Fixes:

- Added stronger tRPC source/dependency detection (`@trpc/server`, `initTRPC`, `createTRPCRouter`).
- Expanded Clerk dependency coverage (`@clerk/remix`, `@clerk/clerk-react`, `@clerk/astro`, etc.).
- Added Clerk env/domain signal detection.

Impact:

- Improved detection consistency on tRPC/Clerk mixes in ZIP corpus.

### 4) Tailwind detection and visibility

Fixes:

- Tailwind detection from:
  - config files (`tailwind.config.*`),
  - source directives (`@tailwind`),
  - utility class usage signals.
- Added `tailwind` in computed stats.
- Exposed Tailwind in UI:
  - header badge (`TW`),
  - dedicated Tech Stack card.

Impact:

- Tailwind-heavy benchmark cases now reflect detection in both analysis and UI.

## Phase 4: Comparator Logic Hardening (Non-Overfit)

The benchmark comparator was refined to avoid penalizing analyzer for equivalent or structurally valid outputs.

### 1) Database family equivalence

Added canonical DB family mapping:

- `Neon` -> PostgreSQL family
- `PlanetScale` -> MySQL family
- `Turso` -> SQLite family

This prevents false conflicts where provider-specific labels differ from family-level expected labels.

### 2) Evidence-aware DB conflict severity

DB conflicts are now downgraded when evidence is ambiguous or expected appears unsupported by code evidence.

### 3) Edge path equivalence

If expected has `client -> service` but actual has `client -> api -> service`, edge is accepted as satisfied.

This reduces false negatives for fullstack frameworks where a backend intermediary node exists.

## Measured Progress (ZIP Corpus)

- Run 1 (before parser fix):
  - `Total 150 | Pass 0 | Fail 150`
- Run 2 (after parser fix + early analyzer tweaks):
  - `Total 150 | Pass 105 | Review 18 | Fail 27`
- Run 3 (after source/env/trpc/clerk/tailwind/comparator hardening):
  - `Total 150 | Pass 132 | Review 17 | Warn 1 | Fail 0`
- Run 4 (after stack/noise filtering + evidence and UI refinements):
  - `Total 150 | Pass 149 | Review 1 | Warn 0 | Fail 0`
- Run 5 (after structured expected-hint parsing + generic backend normalization):
  - `Total 150 | Pass 150 | Review 0 | Warn 0 | Fail 0 | Error 0`

## Focused Case Outcomes (requested IDs)

Current statuses:

- Pass: `22, 41, 47, 80, 101, 102, 119, 123, 124, 140, 147, 148, 149, 150`
- Review: none

Interpretation:

- `review` indicates expected-diagram ambiguity or weak expected evidence, not a hard analyzer failure.
- `fail` is now reserved for strong analyzer-side mismatches.

## Git Benchmark Current Snapshot

From latest run:

- `Total 27 | Pass 27 | Partial 0 | Fail 0`
- Stable outputs updated:
  - `docs/benchmarks/latest-git-tests.json`
  - `docs/benchmarks/latest-git-tests.md`

## Why this is safer than overfitting

The pipeline now uses a 3-layer validation strategy:

1. Expected diagram comparison.
2. Analyzer output comparison.
3. Independent evidence from code/deps/config/env.

A mismatch is no longer treated as analyzer fault by default. The report distinguishes likely expected issues (`review`) from true analyzer errors (`fail`).

## Next Refinement Targets

- Add fixture tests for:
  - expected parsing boundaries (`Nodes/Edges` vs title/notes),
  - generic backend keyword equivalence,
  - DB family normalization,
  - edge path equivalence (`client -> api -> service`).
- Add confidence scoring per detected domain (frontend/backend/database/services).
- Split large analyzer and comparator rule blocks into smaller tested modules to reduce regression risk.
