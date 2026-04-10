const test = require("node:test");
const assert = require("node:assert/strict");

const {
  categoryMatch,
  resolveRequiredCategories,
  evaluateResult,
} = require("../run-repo-benchmark.cjs");
const {
  buildKeywordSignalsFromAnalysis,
  classifyKeywordsFromText,
  parseExpectedArchitectureText,
} = require("../benchmark-helpers.cjs");

test("categoryMatch treats generic backend keyword as detected backend", () => {
  const matched = categoryMatch(["flask service", "flask"], ["api"]);
  assert.equal(matched, true);
});

test("categoryMatch supports .net aliases", () => {
  const matched = categoryMatch(
    ["@microsoft/dotnet-runtime", "aspnetcore backend"],
    [".net"],
  );
  assert.equal(matched, true);
});

test("resolveRequiredCategories softens weak repo-doc hints", () => {
  const required = resolveRequiredCategories(
    {},
    {
      frontend: ["react"],
      backend: ["api"],
      database: [],
      services: [],
    },
    {
      frontend: [],
      backend: ["flask"],
      database: ["dynamodb"],
      services: [],
    },
    "repo-docs",
  );

  assert.deepEqual(required, ["backend"]);
});

test("resolveRequiredCategories respects explicit required override", () => {
  const required = resolveRequiredCategories(
    { required: ["frontend", "backend"] },
    { frontend: ["next"], backend: [], database: [] },
    { frontend: [], backend: [], database: [] },
    "repo-docs",
  );

  assert.deepEqual(required, ["frontend", "backend"]);
});

test("evaluateResult returns pass for generic backend expectation", () => {
  const evaluated = evaluateResult({
    entry: {
      name: "fixture/repo",
      url: "https://github.com/fixture/repo",
      expectedDiagram: null,
    },
    analysis: {
      detected: {
        backend: { label: "Flask Service", type: "flask", color: "#68D391" },
        technologies: {},
      },
      stats: {
        llmUsed: false,
        fallbackReason: null,
        fallbackChanges: [],
        fallbackTotalTokens: 0,
        fallbackCostUSD: 0,
      },
    },
    durationMs: 123,
    expectedKeywords: {
      frontend: [],
      backend: ["api"],
      database: [],
      services: [],
    },
    expectedSource: "repo-docs",
    expectedMeta: null,
    requiredCategories: ["backend"],
  });

  assert.equal(evaluated.status, "pass");
  assert.equal(evaluated.requiredScore, "1/1");
});

test("buildKeywordSignalsFromAnalysis adds repo identity when core is detected", () => {
  const signals = buildKeywordSignalsFromAnalysis({
    detected: {
      frontend: { label: "Frontend App", type: "frontend-hosted" },
      technologies: {},
    },
    stats: {
      repoName: "next.js",
      repoFullName: "vercel/next.js",
    },
  });

  assert.ok(signals.frontend.includes("next.js"));
  assert.ok(signals.frontend.includes("vercel/next.js"));
});

test("categoryMatch treats neon as postgres family", () => {
  const matched = categoryMatch(
    ["postgresql", "pg", "@payloadcms/db-postgres"],
    ["neon"],
  );
  assert.equal(matched, true);
});

test("classifyKeywordsFromText does not detect next framework from generic next word", () => {
  const hints = classifyKeywordsFromText(
    "In the next release we improve docs, but no web framework is mentioned.",
  );
  assert.equal(hints.frontend.includes("next"), false);
  assert.equal(hints.frontend.includes("next.js"), false);
});

test("buildKeywordSignalsFromAnalysis infers database signal from repo identity", () => {
  const signals = buildKeywordSignalsFromAnalysis({
    detected: {
      backend: { label: "Python Service", type: "python" },
      technologies: {},
    },
    stats: {
      repoName: "mongo",
      repoFullName: "mongodb/mongo",
    },
  });

  assert.ok(signals.database.includes("mongodb"));
});

test("parseExpectedArchitectureText ignores noisy title keywords", () => {
  const parsed = parseExpectedArchitectureText(`
# Expected Architecture — env-only-mongo-redis-jwt

## Nodes

| Position | Node ID | Label | Type |
| --- | --- | --- | --- |
| MIDDLE | \`api\` | Express API | backend |

## Edges

\`\`\`
\`\`\`

## Notes

JWT_SECRET in env vars
`);

  assert.equal(parsed.keywordHints.backend.includes("express"), true);
  assert.equal(parsed.keywordHints.services.includes("jwt"), false);
});
