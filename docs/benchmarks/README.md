# Repo Benchmarking

This folder stores benchmark runs for repository analysis quality.

## Repo Vector

Source file: `scripts/repo-benchmark-vector.cjs`

Format (minimal):

```js
module.exports = [
  ["https://github.com/user/repo", 0],
  [
    "https://github.com/user/repo-with-expected",
    "docs/expected-architecture.md",
  ],
];
```

Rules:

- Position 1: GitHub repo URL.
- Position 2: optional expected diagram path/url.
- Use `0` (or empty) when expected diagram is not provided.
- If expected diagram is missing, runner tries deterministic hints from repo docs and analysis evidence (no LLM needed for benchmark scoring).
- Expected diagram can be `.md` / `.txt` / `.json` / `.yaml` / `.yml` for deterministic parsing.
- Image expected files (`.png`, `.jpg`, etc.) are registered but not parsed deterministically.

## Run

```bash
pnpm benchmark:clean
pnpm benchmark:repos
pnpm benchmark:zip
pnpm benchmark:all
pnpm test:bench
```

- `benchmark:clean`: șterge outputurile benchmark vechi.
- `benchmark:repos`: rulează benchmark-ul pe repo-urile Git din vector.
- `benchmark:zip`: rulează benchmark-ul pe corpusul local ZIP din `docs/benchmarks/Diagrams repo test/`.
- `benchmark:all`: clean + repo benchmark + zip benchmark.
- `test:bench`: rule fixtures pentru scoring pass/partial din repo benchmark.

## Optional environment variables

- `GITHUB_TOKEN`: strongly recommended to avoid low unauthenticated rate limits.
- `BENCHMARK_CONCURRENCY`: number of parallel repo analyses (default `2`).
- `BENCHMARK_LIMIT`: only analyze the first `N` repos from vector.
- `BENCHMARK_REPOS`: comma-separated full repo names to run a subset, example:
  - `BENCHMARK_REPOS=supabase/supabase,vercel/next.js`
- `BENCHMARK_VECTOR_FILE`: override repo vector path (default `scripts/repo-benchmark-vector.cjs`).
- `BENCHMARK_USE_GEMINI`: `1` to allow Gemini fallback, otherwise deterministic-only (default `0`).
- `GEMINI_API_KEY` or `REACT_APP_GEMINI_API_KEY`: used only when fallback is enabled.
- `BENCHMARK_SKIP_VERSION_LOOKUP`: `1` (default) skips package latest-version checks for speed.
- `BENCHMARK_MAX_DEP_CHECKS`: max dependency version checks if lookup is enabled (default `0`).
- `BENCHMARK_KEEP_HISTORY`: `1` keeps old `results/repo-benchmark-*.json` snapshots; default `0` keeps output clean.
- `BENCHMARK_FAIL_ON_FAIL`: `1` to make command exit with error when at least one repo fails.
- `BENCHMARK_FORCE_LATEST_ON_ERROR`: `1` forces overwrite of `latest.*` even when run has rate-limit failures (default `0`).

ZIP-specific:

- `BENCHMARK_ZIP_ROOT`: override path for ZIP corpus folder.
- `BENCHMARK_ZIP_CONCURRENCY`: number of parallel ZIP analyses (default `2`).
- `BENCHMARK_ZIP_LIMIT`: only run first `N` ZIP cases.
- `BENCHMARK_ZIP_CASES`: comma-separated ZIP case selectors (by folder name or numeric id), example:
  - `BENCHMARK_ZIP_CASES=22,41,101`
- `BENCHMARK_ZIP_USE_GEMINI`: `1` to allow Gemini fallback for ZIP analysis (default `0`).
- `BENCHMARK_ZIP_FAIL_ON_FAIL`: `1` to make ZIP command exit with error when at least one case fails/errors.

## Output files

- `docs/benchmarks/latest.json`: latest full machine-readable report.
- `docs/benchmarks/latest-summary.md`: latest human-readable summary table.
- `docs/benchmarks/latest-git-tests.json`: latest Git benchmark report (stable overwrite target).
- `docs/benchmarks/latest-git-tests.md`: latest Git benchmark summary (stable overwrite target).
- `docs/benchmarks/latest-zip-tests.json`: latest ZIP benchmark report (stable overwrite target).
- `docs/benchmarks/latest-zip-tests.md`: latest ZIP benchmark summary (stable overwrite target).
- `docs/benchmarks/results/repo-benchmark-*.json`: historical snapshots.

Note:

- On GitHub rate-limit failures, repo benchmark keeps timestamped snapshot and skips `latest.*` overwrite by default.
