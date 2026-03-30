#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { performance } = require("node:perf_hooks");

const CORE_CATEGORIES = ["frontend", "backend", "database"];

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

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

function extractSignals(detected, stats) {
  const safeDetected = detected && typeof detected === "object" ? detected : {};

  const pickCore = (category) => {
    const entry = safeDetected[category];
    if (!entry || typeof entry !== "object") return [];

    const signals = [entry.label, entry.type, entry.provider]
      .map(normalize)
      .filter(Boolean);

    const type = normalize(entry.type);
    const label = normalize(entry.label);

    if (category === "frontend") {
      if (type === "next" || label.includes("next")) signals.push("react");
      if (type === "flutter" || label.includes("flutter")) signals.push("dart");
    }

    if (category === "backend") {
      if (
        /next_api|nuxt_server|sveltekit_server|node_/.test(type) ||
        /api routes|nitro|sveltekit/.test(label)
      ) {
        signals.push("node");
      }
      if (type === "nest" || label.includes("nestjs")) {
        signals.push("nestjs", "node");
      }
      if (type === "dotnet" || label.includes(".net")) {
        signals.push(".net", "c#", "asp.net");
      }
      if (type === "go" || label.includes("go service")) {
        signals.push("golang");
      }
    }

    if (category === "database") {
      if (type === "postgresql") signals.push("postgres");
      if (type === "redis") signals.push("cache");
    }

    return [...new Set(signals)];
  };

  const serviceSignals = [];
  for (const [key, value] of Object.entries(safeDetected)) {
    if (CORE_CATEGORIES.includes(key) || key === "orm") continue;
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;

    const values = [key, value.label, value.type, value.provider]
      .map(normalize)
      .filter(Boolean);

    if (values.length > 0) {
      serviceSignals.push(...values);
    }
  }

  const result = {
    frontend: pickCore("frontend"),
    backend: pickCore("backend"),
    database: pickCore("database"),
    services: serviceSignals,
  };

  const languageHint = normalize(stats?.language);
  if (result.backend.length > 0 && languageHint) {
    if (languageHint === "go") result.backend.push("go", "golang");
    if (languageHint === "python") result.backend.push("python");
    if (languageHint === "java") result.backend.push("java");
    if (languageHint === "rust") result.backend.push("rust");
    if (languageHint === "php") result.backend.push("php");
    if (languageHint === "c#") result.backend.push("c#", ".net", "asp.net");
    result.backend = [...new Set(result.backend)];
  }

  return result;
}

function categoryMatch(signals, keywords) {
  if (!Array.isArray(signals) || signals.length === 0) return false;
  if (!Array.isArray(keywords) || keywords.length === 0) return true;

  const normalizedKeywords = keywords.map(normalize).filter(Boolean);
  return normalizedKeywords.some((keyword) =>
    signals.some((signal) => signal.includes(keyword)),
  );
}

function evaluateResult(datasetEntry, analysis, durationMs) {
  const signals = extractSignals(analysis.detected, analysis?.stats);
  const expected = datasetEntry.expectedKeywords || {};
  const requiredCategories = Array.isArray(datasetEntry.required)
    ? datasetEntry.required
    : [];

  const categories = {};
  let requiredPass = 0;
  let requiredDetected = 0;

  for (const category of [
    ...CORE_CATEGORIES,
    ...Object.keys(expected).filter((key) => !CORE_CATEGORIES.includes(key)),
  ]) {
    const detectedSignals = signals[category] || [];
    const detected = detectedSignals.length > 0;
    const keywords = expected[category] || [];
    const matches = categoryMatch(detectedSignals, keywords);
    const isRequired = requiredCategories.includes(category);

    let status = "fail";
    if (detected && matches) status = "pass";
    else if (detected) status = "partial";
    else if (!isRequired && keywords.length === 0) status = "skip";

    categories[category] = {
      status,
      required: isRequired,
      detected,
      matchesExpected: matches,
      detectedSignals,
      expectedKeywords: keywords,
    };

    if (isRequired) {
      if (detected) requiredDetected += 1;
      if (status === "pass") requiredPass += 1;
    }
  }

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
    repo: datasetEntry.name,
    url: datasetEntry.url,
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
    categories,
    error: null,
  };
}

function formatMillis(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

async function runWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let index = 0;

  async function runWorker() {
    while (true) {
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
    const errorText = repo.error ? ` | error: ${repo.error}` : "";

    console.log(
      `- ${repo.status.toUpperCase()} | ${repo.repo} | required ${repo.requiredScore} | ${formatMillis(repo.durationMs)} | fallback ${fallback}${errorText}`,
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
    "| Status | Repo | Required | Duration | Fallback |",
    "|---|---|---|---:|---|",
  ];

  for (const repo of summary.repos) {
    const fallback = repo.llmUsed
      ? `yes (${repo.fallbackTokens} / $${repo.fallbackCostUSD.toFixed(4)})`
      : "no";

    lines.push(
      `| ${repo.status} | ${repo.repo} | ${repo.requiredScore} | ${repo.durationMs}ms | ${fallback} |`,
    );
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  const repoRoot = path.resolve(__dirname, "..");
  loadLocalEnv(repoRoot);

  const datasetPath = path.join(
    repoRoot,
    "scripts",
    "repo-benchmark-dataset.json",
  );
  if (!fs.existsSync(datasetPath)) {
    throw new Error(`Dataset missing: ${datasetPath}`);
  }

  const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8"));
  if (!Array.isArray(dataset) || dataset.length === 0) {
    throw new Error("Dataset is empty.");
  }

  const includeFilter = normalize(process.env.BENCHMARK_REPOS);
  const includeSet = includeFilter
    ? new Set(
        includeFilter
          .split(",")
          .map((value) => normalize(value))
          .filter(Boolean),
      )
    : null;

  let selectedRepos = dataset;
  if (includeSet && includeSet.size > 0) {
    selectedRepos = dataset.filter((entry) =>
      includeSet.has(normalize(entry.name)),
    );
  }

  const limit = parseNumber(process.env.BENCHMARK_LIMIT, selectedRepos.length);
  selectedRepos = selectedRepos.slice(0, Math.max(0, limit));

  if (selectedRepos.length === 0) {
    throw new Error("No repositories selected for benchmark.");
  }

  const concurrency = parseNumber(process.env.BENCHMARK_CONCURRENCY, 2);
  const useGemini = parseBoolean(process.env.BENCHMARK_USE_GEMINI, false);
  const skipVersionLookup = parseBoolean(
    process.env.BENCHMARK_SKIP_VERSION_LOOKUP,
    true,
  );
  const maxDepChecks = parseNumber(process.env.BENCHMARK_MAX_DEP_CHECKS, 0);

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
  const { analyzeGitHubRepo, parseGitHubUrl } = engineModule;

  if (
    typeof analyzeGitHubRepo !== "function" ||
    typeof parseGitHubUrl !== "function"
  ) {
    throw new Error("Analyzer engine exports are invalid.");
  }

  console.log(
    `[benchmark] Starting ${selectedRepos.length} repositories (concurrency=${concurrency}, gemini=${useGemini ? "on" : "off"}, skipVersionLookup=${skipVersionLookup}, maxDepChecks=${maxDepChecks})`,
  );

  const startedAt = new Date();

  const repoResults = await runWithConcurrency(
    selectedRepos,
    concurrency,
    async (entry, index) => {
      const repoLabel = `${index + 1}/${selectedRepos.length} ${entry.name}`;
      console.log(`[benchmark] ${repoLabel} -> analyzing`);

      const parsed = parseGitHubUrl(entry.url);
      if (!parsed) {
        return {
          repo: entry.name,
          url: entry.url,
          status: "fail",
          requiredScore: "0/0",
          durationMs: 0,
          detectedCore: { frontend: null, backend: null, database: null },
          llmUsed: false,
          fallbackReason: null,
          fallbackChanges: [],
          fallbackTokens: 0,
          fallbackCostUSD: 0,
          categories: {},
          error: "Invalid GitHub URL",
        };
      }

      const started = performance.now();
      try {
        const analysis = await analyzeGitHubRepo(
          parsed.owner,
          parsed.repo,
          null,
          githubToken,
          {
            enableGeminiFallback: useGemini,
            geminiApiKey,
            skipVersionLookup,
            maxDepVersionChecks: Math.max(0, maxDepChecks),
          },
        );

        const durationMs = performance.now() - started;
        const evaluated = evaluateResult(entry, analysis, durationMs);
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
          requiredScore: `0/${Array.isArray(entry.required) ? entry.required.length : 0}`,
          durationMs,
          detectedCore: { frontend: null, backend: null, database: null },
          llmUsed: false,
          fallbackReason: null,
          fallbackChanges: [],
          fallbackTokens: 0,
          fallbackCostUSD: 0,
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
      dataset: "scripts/repo-benchmark-dataset.json",
      selectedCount: selectedRepos.length,
    },
    totals,
    repos: repoResults,
  };

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

  fs.writeFileSync(resultPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    latestJsonPath,
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8",
  );
  fs.writeFileSync(latestSummaryPath, buildMarkdownSummary(summary), "utf8");

  printSummary(summary);
  console.log(
    `\n[benchmark] Wrote detailed result: ${path.relative(repoRoot, resultPath)}`,
  );
  console.log(`[benchmark] Updated: docs/benchmarks/latest.json`);
  console.log(`[benchmark] Updated: docs/benchmarks/latest-summary.md`);

  if (
    totals.fail > 0 &&
    parseBoolean(process.env.BENCHMARK_FAIL_ON_FAIL, false)
  ) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`[benchmark] Fatal error: ${error.message}`);
  process.exitCode = 1;
});
