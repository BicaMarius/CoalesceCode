# Repo Benchmarking

This folder stores benchmark runs for repository analysis quality.

## Dataset

Source file: `scripts/repo-benchmark-dataset.json`

- Current size: 26 repositories.
- Coverage: frontend-only, backend-only, database-centric, and full-stack projects.
- Includes examples from the stabilization request (`supabase`, `ory/kratos`, `dapr`, `localstack`, `AppFlowy`, `netmaker`, `standardnotes`, `meilisearch`).

## Run

```bash
pnpm benchmark:repos
```

## Optional environment variables

- `GITHUB_TOKEN`: strongly recommended to avoid low unauthenticated rate limits.
- `BENCHMARK_CONCURRENCY`: number of parallel repo analyses (default `2`).
- `BENCHMARK_LIMIT`: only analyze the first `N` repos from dataset.
- `BENCHMARK_REPOS`: comma-separated full repo names to run a subset, example:
  - `BENCHMARK_REPOS=supabase/supabase,vercel/next.js`
- `BENCHMARK_USE_GEMINI`: `1` to allow Gemini fallback, otherwise deterministic-only (default `0`).
- `GEMINI_API_KEY` or `REACT_APP_GEMINI_API_KEY`: used only when fallback is enabled.
- `BENCHMARK_SKIP_VERSION_LOOKUP`: `1` (default) skips package latest-version checks for speed.
- `BENCHMARK_MAX_DEP_CHECKS`: max dependency version checks if lookup is enabled (default `0`).
- `BENCHMARK_FAIL_ON_FAIL`: `1` to make command exit with error when at least one repo fails.

## Output files

- `docs/benchmarks/latest.json`: latest full machine-readable report.
- `docs/benchmarks/latest-summary.md`: latest human-readable summary table.
- `docs/benchmarks/comparison-latest.md`: baseline vs latest rerun delta summary.
- `docs/benchmarks/results/repo-benchmark-*.json`: historical snapshots.
