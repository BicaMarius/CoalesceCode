#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { performance } = require("node:perf_hooks");

const {
  normalize,
  formatMillis,
  parseExpectedArchitectureText,
  classifyKeywordsFromText,
  inferKeywordHintsFromParsedExpected,
  readExpectedDiagramFile,
  buildKeywordSignalsFromAnalysis,
} = require("./benchmark-helpers.cjs");

const CORE_CATEGORIES = ["frontend", "backend", "database"];
const GENERIC_EXPECTED_KEYWORDS = new Set([
  "api",
  "backend",
  "server",
  "service",
  "services",
  "frontend",
  "client",
  "ui",
  "app",
  "web",
]);
const BENCHMARK_VECTOR_DEFAULT = "scripts/repo-benchmark-vector.cjs";
const DOC_HINT_CANDIDATES = [
  "README.md",
  "readme.md",
  "docs/README.md",
  "ARCHITECTURE.md",
  "architecture.md",
  "docs/architecture.md",
  "docs/ARCHITECTURE.md",
  "docs/system-design.md",
  "SYSTEM_DESIGN.md",
];

function parseNumber(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = normalize(value);
  if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
  return fallback;
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eqIdx = line.indexOf("=");
    if (eqIdx <= 0) continue;

    const key = line.slice(0, eqIdx).trim();
    let value = line.slice(eqIdx + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function loadLocalEnv(repoRoot) {
  parseEnvFile(path.join(repoRoot, ".env"));
  parseEnvFile(path.join(repoRoot, ".env.local"));
}

function mergeKeywordHints(base, extra) {
  const merged = {
    frontend: new Set(base?.frontend || []),
    backend: new Set(base?.backend || []),
    database: new Set(base?.database || []),
    services: new Set(base?.services || []),
  };

  ["frontend", "backend", "database", "services"].forEach((key) => {
    (extra?.[key] || []).forEach((item) => {
      const normalized = normalize(item);
      if (normalized) merged[key].add(normalized);
    });
  });

  return {
    frontend: Array.from(merged.frontend),
    backend: Array.from(merged.backend),
    database: Array.from(merged.database),
    services: Array.from(merged.services),
  };
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeExpectedKeyword(keyword) {
  return normalize(keyword).replace(/\s+/g, " ").trim();
}

function isGenericExpectedKeyword(keyword) {
  return GENERIC_EXPECTED_KEYWORDS.has(normalizeExpectedKeyword(keyword));
}

function getKeywordCandidates(keyword) {
  const normalized = normalizeExpectedKeyword(keyword);
  if (!normalized) return [];

  if (["neon", "postgres", "postgresql", "pg"].includes(normalized)) {
    return ["neon", "postgres", "postgresql", "pg"];
  }

  if (["planetscale", "mysql", "mariadb"].includes(normalized)) {
    return ["planetscale", "mysql", "mariadb"];
  }

  if (["turso", "sqlite", "libsql"].includes(normalized)) {
    return ["turso", "sqlite", "libsql"];
  }

  if (["mongo", "mongodb", "mongoose"].includes(normalized)) {
    return ["mongo", "mongodb", "mongoose"];
  }

  if (
    [".net", "dotnet", "asp.net", "aspnetcore", "c#", "csharp"].includes(
      normalized,
    )
  ) {
    return ["dotnet", "asp.net", "aspnetcore", ".net", "c#", "csharp"];
  }

  if (["next", "next.js", "nextjs"].includes(normalized)) {
    return ["next", "next.js", "nextjs"];
  }

  if (["node", "node.js", "nodejs"].includes(normalized)) {
    return ["node", "node.js", "nodejs"];
  }

  if (["golang", "go"].includes(normalized)) {
    return ["golang", "go"];
  }

  return [normalized];
}

function signalMatchesToken(signal, token) {
  const signalText = normalize(signal);
  const tokenText = normalizeExpectedKeyword(token);
  if (!signalText || !tokenText) return false;

  if (tokenText.length <= 3 || /[.+#]/.test(tokenText)) {
    const escaped = escapeRegExp(tokenText);
    const re = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
    return re.test(signalText);
  }

  return signalText.includes(tokenText);
}

function normalizeExpectedDiagramValue(value) {
  if (
    value === undefined ||
    value === null ||
    value === false ||
    value === 0 ||
    String(value).trim() === "0" ||
    String(value).trim() === ""
  ) {
    return null;
  }
  return String(value).trim();
}

function parseGitHubUrlLike(url) {
  const cleaned = String(url || "")
    .trim()
    .replace(/\.git$/i, "")
    .replace(/\/+$/, "");
  const m = cleaned.match(/github\.com[/:]+([^/]+)\/([^/\s]+)/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2], name: `${m[1]}/${m[2]}` };
}

function normalizeVectorEntry(entry, index) {
  const base = {
    id: index + 1,
    url: null,
    expectedDiagram: null,
    required: null,
    name: null,
  };

  if (Array.isArray(entry)) {
    const [url, expectedDiagram, options] = entry;
    base.url = String(url || "").trim();
    base.expectedDiagram = normalizeExpectedDiagramValue(expectedDiagram);
    if (options && typeof options === "object" && !Array.isArray(options)) {
      base.required = Array.isArray(options.required)
        ? options.required.map((value) => normalize(value)).filter(Boolean)
        : null;
      base.name = options.name ? String(options.name).trim() : null;
    }
  } else if (typeof entry === "string") {
    base.url = entry.trim();
  } else if (entry && typeof entry === "object") {
    base.url = String(entry.url || "").trim();
    base.expectedDiagram = normalizeExpectedDiagramValue(entry.expectedDiagram);
    base.required = Array.isArray(entry.required)
      ? entry.required.map((value) => normalize(value)).filter(Boolean)
      : null;
    base.name = entry.name ? String(entry.name).trim() : null;
  }

  if (!base.url) return null;

  const parsed = parseGitHubUrlLike(base.url);
  if (!parsed) return null;

  return {
    ...base,
    owner: parsed.owner,
    repo: parsed.repo,
    name: base.name || parsed.name,
  };
}

function loadBenchmarkVector(repoRoot) {
  const vectorFile = process.env.BENCHMARK_VECTOR_FILE
    ? path.resolve(repoRoot, process.env.BENCHMARK_VECTOR_FILE)
    : path.join(repoRoot, BENCHMARK_VECTOR_DEFAULT);

  if (!fs.existsSync(vectorFile)) {
    throw new Error(`Benchmark vector missing: ${vectorFile}`);
  }

  delete require.cache[require.resolve(vectorFile)];
  const rawVector = require(vectorFile);

  if (!Array.isArray(rawVector) || rawVector.length === 0) {
    throw new Error(`Benchmark vector is empty: ${vectorFile}`);
  }

  const entries = rawVector
    .map((entry, index) => normalizeVectorEntry(entry, index))
    .filter(Boolean);

  if (entries.length === 0) {
    throw new Error("No valid GitHub entries were found in benchmark vector.");
  }

  return {
    vectorFile,
    entries,
  };
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function clearGitBenchmarkOutputs(repoRoot, keepHistory) {
  if (keepHistory) return;

  const resultsDir = path.join(repoRoot, "docs", "benchmarks", "results");
  if (!fs.existsSync(resultsDir)) return;

  fs.readdirSync(resultsDir)
    .filter((name) => name.toLowerCase().startsWith("repo-benchmark-"))
    .forEach((name) => {
      fs.unlinkSync(path.join(resultsDir, name));
    });
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchRemoteText(url, githubToken) {
  try {
    const headers = {};
    if (githubToken && /github\.com/i.test(url)) {
      headers.Authorization = `Bearer ${githubToken}`;
    }
    const response = await fetchWithTimeout(url, { headers }, 18000);
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

async function resolveConfiguredExpected(entry, repoRoot, githubToken) {
  if (!entry.expectedDiagram) {
    return {
      expectedKeywords: {
        frontend: [],
        backend: [],
        database: [],
        services: [],
      },
      expectedMeta: null,
      expectedSource: null,
    };
  }

  const configured = entry.expectedDiagram;
  const isRemote = /^https?:\/\//i.test(configured);

  if (isRemote) {
    if (!/\.(md|txt|json|ya?ml)$/i.test(configured)) {
      return {
        expectedKeywords: {
          frontend: [],
          backend: [],
          database: [],
          services: [],
        },
        expectedMeta: {
          path: configured,
          parsable: false,
          parseNote:
            "Expected diagram is remote non-text content; deterministic parsing skipped.",
        },
        expectedSource: "configured",
      };
    }

    const content = await fetchRemoteText(configured, githubToken);
    if (!content) {
      return {
        expectedKeywords: {
          frontend: [],
          backend: [],
          database: [],
          services: [],
        },
        expectedMeta: {
          path: configured,
          parsable: false,
          parseNote: "Remote expected diagram could not be downloaded.",
        },
        expectedSource: "configured",
      };
    }

    const parsed = parseExpectedArchitectureText(content);
    return {
      expectedKeywords: inferKeywordHintsFromParsedExpected(parsed),
      expectedMeta: {
        path: configured,
        parsable: true,
        parseNote: null,
      },
      expectedSource: "configured",
    };
  }

  const absolutePath = path.isAbsolute(configured)
    ? configured
    : path.resolve(repoRoot, configured);

  if (!fs.existsSync(absolutePath)) {
    return {
      expectedKeywords: {
        frontend: [],
        backend: [],
        database: [],
        services: [],
      },
      expectedMeta: {
        path: configured,
        parsable: false,
        parseNote: "Configured expected diagram file not found.",
      },
      expectedSource: "configured",
    };
  }

  const expectedInfo = readExpectedDiagramFile(absolutePath);
  return {
    expectedKeywords: inferKeywordHintsFromParsedExpected(expectedInfo.parsed),
    expectedMeta: {
      path: configured,
      parsable: expectedInfo.parsable,
      parseNote: expectedInfo.parseNote,
    },
    expectedSource: "configured",
  };
}

async function collectRepoDocHints(entry, githubToken) {
  const hints = { frontend: [], backend: [], database: [], services: [] };
  const usedFiles = [];

  for (const relativePath of DOC_HINT_CANDIDATES) {
    const rawUrl = `https://raw.githubusercontent.com/${entry.owner}/${entry.repo}/HEAD/${relativePath}`;
    const content = await fetchRemoteText(rawUrl, githubToken);
    if (!content) continue;

    const classified = classifyKeywordsFromText(content);
    Object.assign(hints, mergeKeywordHints(hints, classified));
    usedFiles.push(relativePath);
  }

  return {
    hints,
    usedFiles,
  };
}

function inferKeywordsFromAnalysis(analysis) {
  const hints = {
    frontend: new Set(),
    backend: new Set(),
    database: new Set(),
    services: new Set(),
  };

  const add = (bucket, value) => {
    const normalized = normalize(value);
    if (!normalized) return;
    hints[bucket].add(normalized);
  };

  const deps = Array.isArray(analysis?.deps) ? analysis.deps : [];
  deps.forEach((dep) => {
    const name = normalize(dep?.name);
    if (!name) return;

    if (
      /(react|next|nuxt|vue|angular|svelte|astro|tailwind|solid|preact|remix)/.test(
        name,
      )
    ) {
      add("frontend", name);
    }

    if (
      /(express|nestjs|nest|fastify|koa|hono|trpc|elysia|django|flask|fastapi|spring|laravel|asp\.net|dotnet|php|ruby|go|rust|java)/.test(
        name,
      )
    ) {
      add("backend", name);
    }

    if (
      /(postgres|pg|mysql|mariadb|mongodb|mongoose|sqlite|libsql|prisma|drizzle|sequelize|typeorm|knex|supabase|firebase|redis|turso|neon|planetscale|dynamo|cosmos|cassandra|neo4j|surreal)/.test(
        name,
      )
    ) {
      add("database", name);
    }

    if (
      /(auth|jwt|clerk|auth0|lucia|stripe|cloudinary|openai|anthropic|gemini|langchain|resend|sendgrid|kafka|rabbit|sentry|posthog|mixpanel)/.test(
        name,
      )
    ) {
      add("services", name);
    }
  });

  const detected = analysis?.detected || {};
  ["frontend", "backend", "database"].forEach((bucket) => {
    const node = detected[bucket];
    if (!node || typeof node !== "object") return;
    add(bucket, node.label);
    add(bucket, node.type);
  });

  Object.entries(detected.technologies || {}).forEach(([, technology]) => {
    if (!technology || typeof technology !== "object") return;

    const scopes = Array.isArray(technology.scopes)
      ? technology.scopes.map((scope) => normalize(scope)).filter(Boolean)
      : [];
    const isDevOrToolingOnly =
      scopes.length > 0 &&
      scopes.every((scope) => ["dev", "tooling", "language"].includes(scope));
    if (isDevOrToolingOnly) return;

    const category = normalize(technology.category);
    if (category === "frontend")
      add("frontend", technology.label || technology.id);
    else if (category === "backend")
      add("backend", technology.label || technology.id);
    else if (category === "database")
      add("database", technology.label || technology.id);
    else add("services", technology.label || technology.id);
  });

  return {
    frontend: Array.from(hints.frontend),
    backend: Array.from(hints.backend),
    database: Array.from(hints.database),
    services: Array.from(hints.services),
  };
}

function categoryMatch(signals, keywords) {
  const normalizedSignals = (signals || []).map(normalize).filter(Boolean);
  if (!Array.isArray(keywords) || keywords.length === 0) return true;
  if (normalizedSignals.length === 0) return false;

  return keywords
    .map((keyword) => normalizeExpectedKeyword(keyword))
    .filter(Boolean)
    .some((keyword) => {
      if (isGenericExpectedKeyword(keyword)) return true;
      const candidates = getKeywordCandidates(keyword);
      return normalizedSignals.some((signal) =>
        candidates.some((candidate) => signalMatchesToken(signal, candidate)),
      );
    });
}

function resolveRequiredCategories(
  entry,
  expectedKeywords,
  inferredKeywords,
  expectedSource,
) {
  if (Array.isArray(entry.required) && entry.required.length > 0) {
    return entry.required;
  }

  const requiredFromExpected = CORE_CATEGORIES.filter(
    (category) => (expectedKeywords?.[category] || []).length > 0,
  );
  if (requiredFromExpected.length > 0) {
    if (expectedSource === "repo-docs") {
      const inferredCategorySet = CORE_CATEGORIES.filter(
        (category) => (inferredKeywords?.[category] || []).length > 0,
      );

      if (inferredCategorySet.length > 0) {
        const inferredAligned = requiredFromExpected.filter((category) =>
          inferredCategorySet.includes(category),
        );
        if (inferredAligned.length > 0) return inferredAligned;
        return inferredCategorySet;
      }

      const filtered = requiredFromExpected.filter((category) => {
        const strongKeywordCount = (expectedKeywords?.[category] || [])
          .map((keyword) => normalizeExpectedKeyword(keyword))
          .filter(Boolean)
          .filter((keyword) => !isGenericExpectedKeyword(keyword)).length;

        return strongKeywordCount >= 2;
      });

      if (filtered.length > 0) return filtered;

      const requiredFromInferenceFallback = CORE_CATEGORIES.filter(
        (category) => (inferredKeywords?.[category] || []).length > 0,
      );
      if (requiredFromInferenceFallback.length > 0) {
        return requiredFromInferenceFallback;
      }
    }

    return requiredFromExpected;
  }

  const requiredFromInference = CORE_CATEGORIES.filter(
    (category) => (inferredKeywords?.[category] || []).length > 0,
  );
  if (requiredFromInference.length > 0) return requiredFromInference;

  return CORE_CATEGORIES;
}

function evaluateResult({
  entry,
  analysis,
  durationMs,
  expectedKeywords,
  expectedSource,
  expectedMeta,
  requiredCategories,
}) {
  const signals = buildKeywordSignalsFromAnalysis(analysis);
  const categories = {};

  let requiredPass = 0;
  let requiredDetected = 0;

  const allCategories = [
    ...CORE_CATEGORIES,
    ...Object.keys(expectedKeywords || {}).filter(
      (key) => !CORE_CATEGORIES.includes(key),
    ),
  ];

  allCategories.forEach((category) => {
    const detectedSignals = signals[category] || [];
    const expected = expectedKeywords?.[category] || [];
    const isRequired = requiredCategories.includes(category);
    const detected = detectedSignals.length > 0;
    const matchesExpected = categoryMatch(detectedSignals, expected);

    let status = "fail";
    if (detected && matchesExpected) status = "pass";
    else if (detected) status = "partial";
    else if (!isRequired && expected.length === 0) status = "skip";

    categories[category] = {
      status,
      required: isRequired,
      detected,
      matchesExpected,
      detectedSignals,
      expectedKeywords: expected,
    };

    if (isRequired) {
      if (detected) requiredDetected += 1;
      if (status === "pass") requiredPass += 1;
    }
  });

  let overallStatus = "fail";
  if (requiredCategories.length === 0) {
    overallStatus = Object.values(categories).some(
      (category) => category.status === "pass",
    )
      ? "pass"
      : "partial";
  } else if (requiredPass === requiredCategories.length) {
    overallStatus = "pass";
  } else if (requiredDetected > 0) {
    overallStatus = "partial";
  }

  return {
    repo: entry.name,
    url: entry.url,
    status: overallStatus,
    requiredScore: `${requiredPass}/${requiredCategories.length}`,
    durationMs: Math.round(durationMs),
    detectedCore: {
      frontend: analysis?.detected?.frontend?.label || null,
      backend: analysis?.detected?.backend?.label || null,
      database: analysis?.detected?.database?.label || null,
    },
    llmUsed: Boolean(analysis?.stats?.llmUsed),
    fallbackReason: analysis?.stats?.fallbackReason || null,
    fallbackChanges: analysis?.stats?.fallbackChanges || [],
    fallbackTokens: analysis?.stats?.fallbackTotalTokens || 0,
    fallbackCostUSD: Number(analysis?.stats?.fallbackCostUSD || 0),
    expectedSource,
    expectedDiagram: entry.expectedDiagram || null,
    expectedDiagramMeta: expectedMeta || null,
    technologyCount: Number(analysis?.stats?.technologyCount || 0),
    technologyHighlights: Array.isArray(analysis?.stats?.technologyHighlights)
      ? analysis.stats.technologyHighlights
      : [],
    categories,
    error: null,
  };
}

async function runWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let index = 0;

  async function runWorker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      if (current >= items.length) return;
      results[current] = await worker(items[current], current);
    }
  }

  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));
  return results;
}

function printSummary(summary) {
  const { totals, repos } = summary;
  console.log("\n=== Repo Benchmark Summary ===");
  console.log(
    `Total: ${totals.total} | Pass: ${totals.pass} | Partial: ${totals.partial} | Fail: ${totals.fail}`,
  );
  console.log(
    `Fallback Gemini used: ${totals.llmUsedRepos} repos | Tokens: ${totals.totalFallbackTokens} | Cost: $${totals.totalFallbackCostUSD.toFixed(4)}`,
  );

  console.log("\nPer repo:");
  for (const repo of repos) {
    const fallback = repo.llmUsed
      ? `yes (${repo.fallbackTokens} tokens, $${repo.fallbackCostUSD.toFixed(4)})`
      : "no";
    const expected = repo.expectedSource || "inferred";
    const errorText = repo.error ? ` | error: ${repo.error}` : "";

    console.log(
      `- ${repo.status.toUpperCase()} | ${repo.repo} | required ${repo.requiredScore} | ${formatMillis(repo.durationMs)} | expected ${expected} | fallback ${fallback}${errorText}`,
    );
  }
}

function buildMarkdownSummary(summary) {
  const lines = [
    "# Repo Benchmark Results",
    "",
    `Generated: ${summary.generatedAt}`,
    "",
    `- Total: ${summary.totals.total}`,
    `- Pass: ${summary.totals.pass}`,
    `- Partial: ${summary.totals.partial}`,
    `- Fail: ${summary.totals.fail}`,
    `- Gemini fallback repos: ${summary.totals.llmUsedRepos}`,
    `- Gemini total tokens: ${summary.totals.totalFallbackTokens}`,
    `- Gemini total cost: $${summary.totals.totalFallbackCostUSD.toFixed(4)}`,
    "",
    "| Status | Repo | Required | Expected Source | Tech | Duration | Fallback |",
    "|---|---|---|---|---:|---:|---|",
  ];

  for (const repo of summary.repos) {
    const fallback = repo.llmUsed
      ? `yes (${repo.fallbackTokens} / $${repo.fallbackCostUSD.toFixed(4)})`
      : "no";

    lines.push(
      `| ${repo.status} | ${repo.repo} | ${repo.requiredScore} | ${repo.expectedSource || "inferred"} | ${repo.technologyCount || 0} | ${repo.durationMs}ms | ${fallback} |`,
    );

    if (repo.expectedDiagramMeta?.parseNote) {
      lines.push(
        `| note | ${repo.repo} | expected-diagram | - | - | - | ${repo.expectedDiagramMeta.parseNote.replace(/\|/g, "\\|")} |`,
      );
    }
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  const repoRoot = path.resolve(__dirname, "..");
  loadLocalEnv(repoRoot);

  const { vectorFile, entries } = loadBenchmarkVector(repoRoot);

  const includeFilter = normalize(process.env.BENCHMARK_REPOS);
  const includeSet = includeFilter
    ? new Set(
        includeFilter
          .split(",")
          .map((value) => normalize(value))
          .filter(Boolean),
      )
    : null;

  let selectedRepos = entries;
  if (includeSet && includeSet.size > 0) {
    selectedRepos = entries.filter((entry) => {
      return (
        includeSet.has(normalize(entry.name)) ||
        includeSet.has(normalize(entry.url))
      );
    });
  }

  const limit = parseNumber(process.env.BENCHMARK_LIMIT, selectedRepos.length);
  selectedRepos = selectedRepos.slice(0, Math.max(0, limit));

  if (selectedRepos.length === 0) {
    throw new Error("No repositories selected for benchmark.");
  }

  const concurrency = Math.max(
    1,
    parseNumber(process.env.BENCHMARK_CONCURRENCY, 2),
  );
  const useGemini = parseBoolean(process.env.BENCHMARK_USE_GEMINI, false);
  const skipVersionLookup = parseBoolean(
    process.env.BENCHMARK_SKIP_VERSION_LOOKUP,
    true,
  );
  const maxDepChecks = parseNumber(process.env.BENCHMARK_MAX_DEP_CHECKS, 0);
  const keepHistory = parseBoolean(process.env.BENCHMARK_KEEP_HISTORY, false);

  const githubToken =
    process.env.GITHUB_TOKEN || process.env.REACT_APP_GITHUB_TOKEN || "";
  const geminiApiKey =
    process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY || "";

  if (!githubToken) {
    console.warn(
      "[benchmark] GITHUB_TOKEN is missing. Rate limits may reduce benchmark quality.",
    );
  }
  if (useGemini && !geminiApiKey) {
    console.warn(
      "[benchmark] BENCHMARK_USE_GEMINI=1 but no Gemini API key was found. Fallback calls will be skipped.",
    );
  }

  const engineModulePath = path.join(
    repoRoot,
    "src",
    "features",
    "analyzer",
    "engine.mjs",
  );
  const engineModule = await import(pathToFileURL(engineModulePath).href);
  const { analyzeGitHubRepo } = engineModule;

  if (typeof analyzeGitHubRepo !== "function") {
    throw new Error("Analyzer engine exports are invalid.");
  }

  clearGitBenchmarkOutputs(repoRoot, keepHistory);

  console.log(
    `[benchmark] Starting ${selectedRepos.length} repositories from vector (${path.relative(
      repoRoot,
      vectorFile,
    )}) (concurrency=${concurrency}, gemini=${
      useGemini ? "on" : "off"
    }, skipVersionLookup=${skipVersionLookup}, maxDepChecks=${maxDepChecks})`,
  );

  const startedAt = new Date();

  const repoResults = await runWithConcurrency(
    selectedRepos,
    concurrency,
    async (entry, index) => {
      const repoLabel = `${index + 1}/${selectedRepos.length} ${entry.name}`;
      console.log(`[benchmark] ${repoLabel} -> analyzing`);

      const started = performance.now();
      try {
        const analysis = await analyzeGitHubRepo(
          entry.owner,
          entry.repo,
          null,
          githubToken,
          {
            enableGeminiFallback: useGemini,
            geminiApiKey,
            skipVersionLookup,
            maxDepVersionChecks: Math.max(0, maxDepChecks),
          },
        );

        const configuredExpected = await resolveConfiguredExpected(
          entry,
          repoRoot,
          githubToken,
        );
        let expectedKeywords = configuredExpected.expectedKeywords;
        let expectedSource = configuredExpected.expectedSource;
        let expectedMeta = configuredExpected.expectedMeta;

        if (
          !expectedSource ||
          CORE_CATEGORIES.every(
            (category) => (expectedKeywords?.[category] || []).length === 0,
          )
        ) {
          const docHints = await collectRepoDocHints(entry, githubToken);
          if (docHints.usedFiles.length > 0) {
            expectedKeywords = mergeKeywordHints(
              expectedKeywords,
              docHints.hints,
            );
            expectedSource = "repo-docs";
            expectedMeta = {
              path: "repo-docs",
              parsable: true,
              parseNote: `Doc hints used: ${docHints.usedFiles.join(", ")}`,
            };
          }
        }

        const inferredKeywords = inferKeywordsFromAnalysis(analysis);
        if (
          !expectedSource ||
          CORE_CATEGORIES.every(
            (category) => (expectedKeywords?.[category] || []).length === 0,
          )
        ) {
          expectedKeywords = mergeKeywordHints(
            expectedKeywords,
            inferredKeywords,
          );
          if (!expectedSource) expectedSource = "inferred-from-analysis";
        }

        const requiredCategories = resolveRequiredCategories(
          entry,
          expectedKeywords,
          inferredKeywords,
          expectedSource,
        );

        const evaluated = evaluateResult({
          entry,
          analysis,
          durationMs: performance.now() - started,
          expectedKeywords,
          expectedSource,
          expectedMeta,
          requiredCategories,
        });

        console.log(
          `[benchmark] ${repoLabel} -> ${evaluated.status.toUpperCase()} (required ${evaluated.requiredScore}, ${formatMillis(evaluated.durationMs)})`,
        );
        return evaluated;
      } catch (error) {
        const durationMs = Math.round(performance.now() - started);
        console.log(
          `[benchmark] ${repoLabel} -> FAIL (${formatMillis(durationMs)}): ${error.message}`,
        );

        return {
          repo: entry.name,
          url: entry.url,
          status: "fail",
          requiredScore: "0/0",
          durationMs,
          detectedCore: { frontend: null, backend: null, database: null },
          llmUsed: false,
          fallbackReason: null,
          fallbackChanges: [],
          fallbackTokens: 0,
          fallbackCostUSD: 0,
          expectedSource: "error",
          expectedDiagram: entry.expectedDiagram || null,
          expectedDiagramMeta: null,
          technologyCount: 0,
          technologyHighlights: [],
          categories: {},
          error: error.message,
        };
      }
    },
  );

  const totals = {
    total: repoResults.length,
    pass: repoResults.filter((repo) => repo.status === "pass").length,
    partial: repoResults.filter((repo) => repo.status === "partial").length,
    fail: repoResults.filter((repo) => repo.status === "fail").length,
    llmUsedRepos: repoResults.filter((repo) => repo.llmUsed).length,
    totalFallbackTokens: repoResults.reduce(
      (sum, repo) => sum + Number(repo.fallbackTokens || 0),
      0,
    ),
    totalFallbackCostUSD: repoResults.reduce(
      (sum, repo) => sum + Number(repo.fallbackCostUSD || 0),
      0,
    ),
  };

  const finishedAt = new Date();

  const summary = {
    generatedAt: finishedAt.toISOString(),
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    config: {
      concurrency,
      useGemini,
      skipVersionLookup,
      maxDepChecks,
      vectorFile: path.relative(repoRoot, vectorFile),
      selectedCount: selectedRepos.length,
      keepHistory,
    },
    totals,
    repos: repoResults,
  };

  const hasRateLimitFailures = repoResults.some((repo) =>
    /rate limit/i.test(String(repo.error || "")),
  );
  const forceLatestOnError = parseBoolean(
    process.env.BENCHMARK_FORCE_LATEST_ON_ERROR,
    false,
  );

  const resultsDir = path.join(repoRoot, "docs", "benchmarks", "results");
  fs.mkdirSync(resultsDir, { recursive: true });

  const stamp = summary.generatedAt.replace(/[.:]/g, "-");
  const resultFileName = `repo-benchmark-${stamp}.json`;
  const resultPath = path.join(resultsDir, resultFileName);
  const latestJsonPath = path.join(
    repoRoot,
    "docs",
    "benchmarks",
    "latest.json",
  );
  const latestSummaryPath = path.join(
    repoRoot,
    "docs",
    "benchmarks",
    "latest-summary.md",
  );
  const latestGitJsonPath = path.join(
    repoRoot,
    "docs",
    "benchmarks",
    "latest-git-tests.json",
  );
  const latestGitSummaryPath = path.join(
    repoRoot,
    "docs",
    "benchmarks",
    "latest-git-tests.md",
  );

  ensureDir(resultPath);
  ensureDir(latestJsonPath);
  ensureDir(latestSummaryPath);
  ensureDir(latestGitJsonPath);
  ensureDir(latestGitSummaryPath);

  fs.writeFileSync(resultPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  const shouldUpdateLatest = !hasRateLimitFailures || forceLatestOnError;

  if (shouldUpdateLatest) {
    fs.writeFileSync(
      latestJsonPath,
      `${JSON.stringify(summary, null, 2)}\n`,
      "utf8",
    );
    fs.writeFileSync(
      latestGitJsonPath,
      `${JSON.stringify(summary, null, 2)}\n`,
      "utf8",
    );
    fs.writeFileSync(latestSummaryPath, buildMarkdownSummary(summary), "utf8");
    fs.writeFileSync(
      latestGitSummaryPath,
      buildMarkdownSummary(summary),
      "utf8",
    );
  }

  printSummary(summary);
  console.log(
    `\n[benchmark] Wrote detailed result: ${path.relative(repoRoot, resultPath)}`,
  );
  if (shouldUpdateLatest) {
    console.log(`[benchmark] Updated: docs/benchmarks/latest.json`);
    console.log(`[benchmark] Updated: docs/benchmarks/latest-summary.md`);
    console.log(`[benchmark] Updated: docs/benchmarks/latest-git-tests.json`);
    console.log(`[benchmark] Updated: docs/benchmarks/latest-git-tests.md`);
  } else {
    console.log(
      "[benchmark] Skipped updating latest.* because run hit GitHub rate limits. Use the timestamped result file or rerun with token after reset.",
    );
  }

  if (
    totals.fail > 0 &&
    parseBoolean(process.env.BENCHMARK_FAIL_ON_FAIL, false)
  ) {
    process.exitCode = 1;
  }
}

module.exports = {
  categoryMatch,
  resolveRequiredCategories,
  evaluateResult,
  buildMarkdownSummary,
};

if (require.main === module) {
  main().catch((error) => {
    console.error(`[benchmark] Fatal error: ${error.message}`);
    process.exitCode = 1;
  });
}
