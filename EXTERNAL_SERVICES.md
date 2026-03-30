# EXTERNAL_SERVICES.md — External Services & Integrations Registry

> Current-stage registry (v0.0.1-alpha prototype).

---

## ◈ ACTIVE INTEGRATIONS (CURRENT)

### GitHub REST API

```
Service:         GitHub API v3
Purpose:         Repository metadata, tree, and file content analysis
Usage:           Direct browser requests during Analyze flow
Auth mode:       Optional Personal Access Token provided by user in UI
Criticality:     High (core analysis depends on it)
Failure mode:    Analysis fails or becomes partial; UI shows error/debug info
Owner:           Product/Engineering
```

### jsDelivr npm metadata

```
Service:         jsDelivr package metadata endpoint
Purpose:         Resolve latest dependency versions for outdated checks
Usage:           Browser request per dependency package
Auth mode:       Public endpoint (no key)
Criticality:     Medium
Failure mode:    Latest version may fallback to current version
Owner:           Product/Engineering
```

### Google Gemini API (prototype fallback path)

```
Service:         Google Generative Language API (Gemini)
Purpose:         Optional low-confidence stack detection fallback
Usage:           Called only in fallback scenario from client code path
Auth mode:       Not production-ready in current architecture
Criticality:     Medium
Failure mode:    Fallback disabled/fails; static detection result remains
Owner:           Product/Engineering
```

---

## ◈ NOT YET IMPLEMENTED (PLANNED)

```
- Internal backend/API proxy
- Internal database persistence
- Authentication provider for user/project accounts
- Error monitoring platform (Sentry or equivalent)
- Product analytics platform (PostHog or equivalent)
- Payment/email integrations
```

---

## ◈ ENVIRONMENT VARIABLES — CURRENT MAP

```bash
# Optional for better GitHub API limits (provided by user in UI, not stored server-side)
GITHUB_TOKEN

# Planned for future secure backend integration (not active in production flow)
GEMINI_API_KEY
REACT_APP_GEMINI_API_KEY

# Benchmark controls (local automation)
BENCHMARK_USE_GEMINI
BENCHMARK_SKIP_VERSION_LOOKUP
BENCHMARK_MAX_DEP_CHECKS
BENCHMARK_CONCURRENCY
```

---

## ◈ SERVICE STATUS & DEPENDENCIES

| Service goes down | Impact                               | Has fallback?                         |
| ----------------- | ------------------------------------ | ------------------------------------- |
| GitHub API        | 🔴 Core analysis unavailable/partial | Limited (manual retry + token)        |
| jsDelivr metadata | 🟡 Version freshness reduced         | Yes (use current version as fallback) |
| Gemini API        | 🟢 Optional fallback unavailable     | Yes (static detection remains)        |

---

## ◈ SECURITY NOTES (CURRENT STAGE)

```
- No backend secret management exists yet.
- Do not rely on client-side API key flows for production-grade secure integrations.
- Backend proxy is required before enabling mandatory authenticated AI features.
```
