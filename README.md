# CoalesceCode

CoalesceCode is a codebase visualization tool focused on fast developer onboarding.
It analyzes repositories and generates architecture views, dependency insights, and contextual node details in an interactive editor.

## Core capabilities

- Repository analysis from GitHub URL or ZIP upload
- Architecture diagram with node details and fullscreen mode
- Dependency and stack insight tabs in a modular dashboard
- Benchmark tooling for detector quality validation

## Quick start

1. Install dependencies:

```bash
pnpm install
```

2. Create local environment file:

```bash
cp .env.example .env
```

3. Set required keys:

```bash
REACT_APP_GITHUB_TOKEN=your_github_token
REACT_APP_GEMINI_API_KEY=your_gemini_api_key
```

4. Run locally:

```bash
pnpm dev
```

## Scripts

- `pnpm dev` - start local app
- `pnpm build` - production build
- `pnpm lint` - lint source files
- `pnpm test:run` - run tests once (passWithNoTests enabled)
- `pnpm benchmark:repos` - run repository benchmark suite

## Environment notes

- `REACT_APP_GITHUB_TOKEN` is optional for public repositories, but strongly recommended to avoid GitHub API rate limits.
- `REACT_APP_GEMINI_API_KEY` is used as fallback for stack detection when deterministic analysis has incomplete evidence.

## Project documentation

- Architecture and diagrams: `ARCHITECTURE.md`, `docs/diagrams/`
- Product spec: `SPEC.md`
- Session continuity: `SESSION_LOG.md`
- Testing strategy: `TESTING.md`
- Push documentation: `docs/pushes/`
