# Repo Benchmark Comparison

Generated: 2026-03-29T18:59:35.915Z

## Baseline vs Current

- Baseline run: `docs/benchmarks/results/baseline-before-passrate-improvements.json`
- Current run: `docs/benchmarks/latest.json`

| Metric                | Baseline | Current |  Delta |
| --------------------- | -------: | ------: | -----: |
| Pass                  |        7 |      16 |     +9 |
| Partial               |       16 |      10 |     -6 |
| Fail                  |        3 |       0 |     -3 |
| Gemini fallback repos |        0 |       0 |      0 |
| Gemini tokens         |        0 |       0 |      0 |
| Gemini cost (USD)     |   0.0000 |  0.0000 | 0.0000 |

## Status Changes

- AppFlowy-IO/AppFlowy: fail -> pass
- calcom/cal.com: partial -> pass
- dapr/dapr: partial -> pass
- dotnet/aspnetcore: partial -> pass
- localstack/localstack: partial -> pass
- ory/kratos: partial -> pass
- payloadcms/payload: partial -> pass
- postgres/postgres: fail -> pass
- redis/redis: fail -> pass

## Notes

- Improvements came from deterministic heuristics (file inventory signals and language-aware backend inference), not from AI fallback.
- Remaining partial cases are primarily mixed/monorepo stacks with incomplete core coverage in current rules.
