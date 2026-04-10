#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { performance } = require("node:perf_hooks");
const JSZip = require("jszip");

const {
  normalize,
  formatMillis,
  inferKeywordHintsFromParsedExpected,
  extractLeadingNumber,
  readExpectedDiagramFile,
  buildKeywordSignalsFromAnalysis,
} = require("./benchmark-helpers.cjs");

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
    if (!(key in process.env)) process.env[key] = value;
  }
}

function loadLocalEnv(repoRoot) {
  parseEnvFile(path.join(repoRoot, ".env"));
  parseEnvFile(path.join(repoRoot, ".env.local"));
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function listCaseDirectories(rootDir) {
  return fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => {
      const aNum = extractLeadingNumber(a);
      const bNum = extractLeadingNumber(b);
      if (Number.isFinite(aNum) && Number.isFinite(bNum)) return aNum - bNum;
      return a.localeCompare(b);
    });
}

function selectExpectedFile(caseDir) {
  const candidates = fs
    .readdirSync(caseDir)
    .filter((name) => /^expected[-_].+/i.test(name));

  const preferred = [
    "expected-architecture.md",
    "expected-arhitecture.md",
    "expected-architecture.txt",
    "expected-arhitecture.txt",
  ];

  for (const fileName of preferred) {
    if (candidates.includes(fileName)) return path.join(caseDir, fileName);
  }

  if (candidates.length > 0) {
    const first = candidates.sort((a, b) => a.localeCompare(b))[0];
    return path.join(caseDir, first);
  }

  return null;
}

function selectZipFile(caseDir) {
  const zips = fs
    .readdirSync(caseDir)
    .filter((name) => name.toLowerCase().endsWith(".zip"));
  if (zips.length === 0) return null;
  zips.sort((a, b) => a.localeCompare(b));
  return path.join(caseDir, zips[0]);
}

function createZipFileLike(zipPath, zipBuffer) {
  return {
    name: path.basename(zipPath),
    async arrayBuffer() {
      return zipBuffer.buffer.slice(
        zipBuffer.byteOffset,
        zipBuffer.byteOffset + zipBuffer.byteLength,
      );
    },
  };
}

function keyMatch(signals, keywords) {
  const signalSet = new Set((signals || []).map(normalize));
  return (keywords || []).some((keyword) => {
    const k = normalize(keyword);
    if (!k) return false;
    return Array.from(signalSet).some((signal) => signal.includes(k));
  });
}

function isGenericBackendKeyword(keyword) {
  const token = normalize(keyword);
  return [
    "api",
    "route",
    "routes",
    "server",
    "service",
    "backend",
    "endpoint",
    "endpoints",
  ].includes(token);
}

function extractExpectedDb(preview) {
  if (!preview) return null;
  const lower = normalize(preview);
  if (/(postgres|postgresql|neon)/.test(lower)) return "postgresql";
  if (/(mysql|mariadb|planetscale)/.test(lower)) return "mysql";
  if (/mongodb|mongo/.test(lower)) return "mongodb";
  if (/sqlite|turso/.test(lower)) return "sqlite";
  if (/redis/.test(lower)) return "redis";
  return null;
}

function normalizeDbFamily(value) {
  const lower = normalize(value);
  if (!lower) return null;
  if (/(postgres|postgresql|\bpg\b|neon)/.test(lower)) return "postgresql";
  if (/(mysql|mariadb|planetscale)/.test(lower)) return "mysql";
  if (/(mongodb|mongo)/.test(lower)) return "mongodb";
  if (/(sqlite|turso|libsql)/.test(lower)) return "sqlite";
  if (/redis/.test(lower)) return "redis";
  return null;
}

function evidenceMatchesDbFamily(evidenceTokens, family) {
  const tokens = (evidenceTokens || []).map(normalize);
  if (!family) return false;
  if (family === "postgresql") {
    return tokens.some((token) =>
      /(postgres|postgresql|\bpg\b|neon)/.test(token),
    );
  }
  if (family === "mysql") {
    return tokens.some((token) => /(mysql|mariadb|planetscale)/.test(token));
  }
  if (family === "mongodb") {
    return tokens.some((token) => /(mongodb|mongo|mongoose)/.test(token));
  }
  if (family === "sqlite") {
    return tokens.some((token) => /(sqlite|turso|libsql)/.test(token));
  }
  if (family === "redis") {
    return tokens.some((token) => /redis/.test(token));
  }
  return false;
}

function collectIndependentEvidence(zipEntries, contentMap) {
  const evidence = {
    frontend: new Set(),
    backend: new Set(),
    database: new Set(),
    services: new Set(),
    notes: [],
  };

  const add = (bucket, token, note) => {
    if (!token) return;
    evidence[bucket].add(normalize(token));
    if (note) evidence.notes.push(note);
  };

  zipEntries.forEach((entry) => {
    const p = normalize(entry);

    if (/tailwind\.config\.(js|ts|mjs|cjs)$/.test(p)) {
      add("frontend", "tailwind", `Config: ${entry}`);
    }
    if (/postcss\.config\.(js|ts|mjs|cjs)$/.test(p)) {
      const text = normalize(contentMap.get(entry));
      if (text.includes("tailwind")) {
        add("frontend", "tailwind", `PostCSS includes tailwind: ${entry}`);
      }
    }

    if (/pnpm-workspace\.yaml$|turbo\.json$|nx\.json$/.test(p)) {
      add("services", "monorepo", `Monorepo config: ${entry}`);
    }
  });

  for (const [filePath, content] of contentMap.entries()) {
    const lower = normalize(content);
    if (!lower) continue;

    if (
      /"dependencies"|"devdependencies"/.test(lower) &&
      /package\.json$/.test(normalize(filePath))
    ) {
      try {
        const pkg = JSON.parse(content);
        const allDeps = {
          ...(pkg.dependencies || {}),
          ...(pkg.devDependencies || {}),
          ...(pkg.peerDependencies || {}),
        };
        const depNames = Object.keys(allDeps).map(normalize);

        depNames.forEach((name) => {
          if (
            ["react", "next", "nuxt", "vue", "svelte", "angular", "astro"].some(
              (token) => name.includes(token),
            )
          ) {
            add("frontend", name, `Dependency ${name} in ${filePath}`);
          }
          if (
            [
              "express",
              "fastify",
              "koa",
              "hono",
              "nestjs",
              "@nestjs/core",
              "trpc",
              "@trpc/server",
              "elysia",
            ].some((token) => name.includes(token))
          ) {
            add("backend", name, `Dependency ${name} in ${filePath}`);
          }
          if (
            [
              "postgres",
              "pg",
              "mysql",
              "mysql2",
              "mongodb",
              "mongoose",
              "sqlite",
              "better-sqlite3",
              "redis",
              "supabase",
              "firebase",
              "turso",
              "neon",
              "prisma",
              "drizzle",
              "typeorm",
              "sequelize",
            ].some((token) => name.includes(token))
          ) {
            add("database", name, `Dependency ${name} in ${filePath}`);
          }
          if (
            ["tailwind", "@tailwindcss"].some((token) => name.includes(token))
          ) {
            add("frontend", "tailwind", `Dependency ${name} in ${filePath}`);
          }
          if (
            [
              "@clerk",
              "next-auth",
              "auth0",
              "lucia",
              "better-auth",
              "jsonwebtoken",
              "jose",
            ].some((token) => name.includes(token))
          ) {
            add("services", name, `Auth dependency ${name} in ${filePath}`);
          }
          if (
            [
              "stripe",
              "cloudinary",
              "resend",
              "sendgrid",
              "openai",
              "anthropic",
              "gemini",
            ].some((token) => name.includes(token))
          ) {
            add("services", name, `Service dependency ${name} in ${filePath}`);
          }
        });
      } catch {
        // Ignore invalid package.json
      }
    }

    if (/createTRPCRouter|initTRPC|@trpc\/server/.test(content)) {
      add("backend", "trpc", `Source tRPC signal in ${filePath}`);
    }
    if (
      /@clerk\//.test(content) ||
      /CLERK_(PUBLISHABLE|SECRET)_KEY/.test(content)
    ) {
      add("services", "clerk", `Source Clerk signal in ${filePath}`);
    }
    if (
      /tailwindcss|@tailwind|className=.*(bg-|text-|border-|p-|m-)/.test(
        content,
      ) &&
      /\.css$|\.tsx$|\.jsx$|\.vue$/.test(filePath)
    ) {
      add("frontend", "tailwind", `Source Tailwind signal in ${filePath}`);
    }

    if (/postgresql?:\/\//.test(content) || /\bpg\b/.test(lower)) {
      add("database", "postgresql", `Connection/driver signal in ${filePath}`);
    }
    if (
      /mysql:\/\//.test(content) ||
      /\bmysql2?\b/.test(lower) ||
      /planetscale/.test(lower)
    ) {
      add("database", "mysql", `Connection/driver signal in ${filePath}`);
    }
    if (/mongodb:\/\//.test(content) || /mongoose/.test(lower)) {
      add("database", "mongodb", `Connection/driver signal in ${filePath}`);
    }
  }

  return {
    frontend: Array.from(evidence.frontend),
    backend: Array.from(evidence.backend),
    database: Array.from(evidence.database),
    services: Array.from(evidence.services),
    notes: evidence.notes.slice(0, 20),
  };
}

function compareCase({ caseName, expectedInfo, analysis, evidence }) {
  const issues = [];
  const actualNodes = analysis?.nodes || [];
  const actualEdges = analysis?.edges || [];
  const actualSignals = buildKeywordSignalsFromAnalysis(analysis);
  const expectedParsed = expectedInfo?.parsed || {
    nodes: [],
    edges: [],
    keywordHints: {},
  };
  const expectedHints = inferKeywordHintsFromParsedExpected(expectedParsed);

  const expectedNodes = expectedParsed.nodes || [];
  const expectedEdges = expectedParsed.edges || [];

  const backendNodeIds = new Set(
    actualNodes
      .filter((node) => normalize(node.type) === "backend")
      .map((node) => normalize(node.id))
      .filter(Boolean),
  );

  if (!expectedInfo) {
    issues.push({
      code: "expected_missing",
      severity: "warning",
      message: "Expected diagram file missing.",
      expectedLikelyWrong: false,
    });
  }

  expectedNodes.forEach((expectedNode) => {
    const actual = actualNodes.find(
      (node) => normalize(node.id) === normalize(expectedNode.id),
    );
    if (!actual) {
      issues.push({
        code: "missing_node",
        severity: "error",
        message: `Missing node ${expectedNode.id} (${expectedNode.label}).`,
        expectedLikelyWrong: false,
      });
      return;
    }

    const words = (expectedNode.keywords || []).filter(
      (token) => token.length >= 3,
    );
    const actualLabel = normalize(actual.label);
    if (words.length > 0 && !words.some((word) => actualLabel.includes(word))) {
      const expectedNodeId = normalize(expectedNode.id);
      const actualNodeType = normalize(actual.type);
      const genericApiWords = words.every((word) =>
        ["api", "route", "routes", "server", "service", "backend"].includes(
          normalize(word),
        ),
      );

      if (
        expectedNodeId === "api" &&
        genericApiWords &&
        actualNodeType.includes("backend")
      ) {
        return;
      }

      issues.push({
        code: "label_mismatch",
        severity: "warning",
        message: `Node ${expectedNode.id} label differs (expected contains: ${words.join(", ")}; actual: ${actual.label}).`,
        expectedLikelyWrong: false,
      });
    }
  });

  const edgeSet = new Set(
    actualEdges.map((edge) => `${normalize(edge.from)}->${normalize(edge.to)}`),
  );
  const hasEdge = (from, to) =>
    edgeSet.has(`${normalize(from)}->${normalize(to)}`);
  expectedEdges.forEach((edge) => {
    const key = `${normalize(edge.from)}->${normalize(edge.to)}`;
    if (!edgeSet.has(key)) {
      const viaBackendSatisfied =
        normalize(edge.from) === "client" &&
        Array.from(backendNodeIds).some(
          (backendId) =>
            hasEdge(edge.from, backendId) && hasEdge(backendId, edge.to),
        );

      if (viaBackendSatisfied) {
        return;
      }

      issues.push({
        code: "missing_edge",
        severity: "error",
        message: `Missing edge ${edge.from} -> ${edge.to}.`,
        expectedLikelyWrong: false,
      });
    }
  });

  ["frontend", "backend", "database", "services"].forEach((bucket) => {
    const expectedKeywords = expectedHints[bucket] || [];
    if (expectedKeywords.length === 0) return;

    if (
      bucket === "backend" &&
      expectedKeywords.every((keyword) => isGenericBackendKeyword(keyword)) &&
      (actualSignals.backend.length > 0 || analysis?.detected?.backend)
    ) {
      return;
    }

    const matched = keyMatch(actualSignals[bucket], expectedKeywords);
    if (matched) return;

    const evidenceMatches = keyMatch(evidence[bucket], expectedKeywords);
    const issue = {
      code: `${bucket}_keyword_mismatch`,
      severity: bucket === "services" ? "warning" : "error",
      message: `Expected ${bucket} keywords not matched by analyzer (${expectedKeywords.join(", ")}).`,
      expectedLikelyWrong: false,
    };

    if (!evidenceMatches) {
      issue.severity = "warning";
      issue.expectedLikelyWrong = true;
      issue.message +=
        " Evidence from code does not strongly support expected diagram.";
    }

    issues.push(issue);
  });

  const expectedDb = normalizeDbFamily(
    extractExpectedDb(expectedInfo?.content || ""),
  );
  const actualDbRaw =
    analysis?.detected?.database?.type || analysis?.detected?.database?.label;
  const actualDb = normalizeDbFamily(actualDbRaw);

  if (expectedDb && actualDb && expectedDb !== actualDb) {
    const evidenceSupportsExpected = evidenceMatchesDbFamily(
      evidence.database,
      expectedDb,
    );
    const evidenceSupportsActual = evidenceMatchesDbFamily(
      evidence.database,
      actualDb,
    );
    const expectedLikelyWrong =
      !evidenceSupportsExpected &&
      (evidenceSupportsActual || !evidenceSupportsExpected);
    const ambiguousEvidence =
      !evidenceSupportsExpected && !evidenceSupportsActual;

    issues.push({
      code: "database_conflict",
      severity: ambiguousEvidence ? "warning" : "error",
      message: `Database mismatch: expected ${expectedDb}, analyzer ${actualDb}.`,
      expectedLikelyWrong,
    });
  }

  const analyzerErrors = issues.filter(
    (issue) => issue.severity === "error" && !issue.expectedLikelyWrong,
  );
  const expectedSuspects = issues.filter((issue) => issue.expectedLikelyWrong);

  let status = "pass";
  if (analyzerErrors.length > 0) {
    status = "fail";
  } else if (issues.length > 0) {
    status = expectedSuspects.length > 0 ? "review" : "warn";
  }

  const caseId = extractLeadingNumber(caseName);
  return {
    caseName,
    caseId,
    status,
    expectedFile: expectedInfo?.path || null,
    zipFile: null,
    stats: {
      nodes: actualNodes.length,
      edges: actualEdges.length,
      requiredNodes: expectedNodes.length,
      requiredEdges: expectedEdges.length,
    },
    detected: {
      frontend: analysis?.detected?.frontend?.label || null,
      backend: analysis?.detected?.backend?.label || null,
      database: analysis?.detected?.database?.label || null,
      auth: analysis?.detected?.auth?.label || null,
      ai: analysis?.detected?.ai?.label || null,
      technologyCount: Object.keys(analysis?.detected?.technologies || {})
        .length,
      technologyHighlights: Object.values(
        analysis?.detected?.technologies || {},
      )
        .filter((entry) => entry && typeof entry === "object")
        .sort((a, b) => Number(b.hits || 0) - Number(a.hits || 0))
        .slice(0, 4)
        .map((entry) => entry.label || entry.id),
    },
    issues,
    evidence,
  };
}

function buildMarkdown(results, config) {
  const totals = {
    total: results.length,
    pass: results.filter((result) => result.status === "pass").length,
    fail: results.filter((result) => result.status === "fail").length,
    review: results.filter((result) => result.status === "review").length,
    warn: results.filter((result) => result.status === "warn").length,
    error: results.filter((result) => result.status === "error").length,
  };

  const lines = [
    "# ZIP Diagram Benchmark — Latest Run",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Corpus path: ${config.corpusPath}`,
    `Selected cases: ${results.length}`,
    "",
    `- Total: ${totals.total}`,
    `- Pass: ${totals.pass}`,
    `- Review (expected suspect): ${totals.review}`,
    `- Warn: ${totals.warn}`,
    `- Fail: ${totals.fail}`,
    "",
    "| Case | Status | Nodes | Edges | Frontend | Backend | Database | Notes |",
    "|---|---|---:|---:|---|---|---|---|",
  ];

  results.forEach((result) => {
    const shortIssue = result.issues[0]?.message || "ok";
    lines.push(
      `| ${result.caseName} | ${result.status} | ${result.stats.nodes}/${result.stats.requiredNodes} | ${result.stats.edges}/${result.stats.requiredEdges} | ${result.detected.frontend || "-"} | ${result.detected.backend || "-"} | ${result.detected.database || "-"} | ${shortIssue.replace(/\|/g, "\\|")} |`,
    );
  });

  const problematic = results.filter((result) => result.status !== "pass");
  if (problematic.length > 0) {
    lines.push("", "## Detailed Findings", "");
    problematic.forEach((result) => {
      lines.push(`### ${result.caseName} — ${result.status}`);
      lines.push(
        `Detected: frontend=${result.detected.frontend || "-"}, backend=${result.detected.backend || "-"}, database=${result.detected.database || "-"}, technologies=${result.detected.technologyCount || 0}`,
      );
      result.issues.forEach((issue) => {
        const prefix = issue.expectedLikelyWrong ? "[expected?]" : "[analyzer]";
        lines.push(`- ${prefix} ${issue.message}`);
      });
      if (result.evidence.notes.length > 0) {
        lines.push("- Evidence sample:");
        result.evidence.notes.slice(0, 5).forEach((note) => {
          lines.push(`  - ${note}`);
        });
      }
      lines.push("");
    });
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  const repoRoot = path.resolve(__dirname, "..");
  loadLocalEnv(repoRoot);

  const defaultCorpus = path.join(
    repoRoot,
    "docs",
    "benchmarks",
    "Diagrams repo test",
  );
  const corpusPath = process.env.BENCHMARK_ZIP_ROOT
    ? path.resolve(repoRoot, process.env.BENCHMARK_ZIP_ROOT)
    : defaultCorpus;

  const latestJsonPath = path.join(
    repoRoot,
    "docs",
    "benchmarks",
    "latest-zip-tests.json",
  );
  const latestMdPath = path.join(
    repoRoot,
    "docs",
    "benchmarks",
    "latest-zip-tests.md",
  );
  ensureDir(latestJsonPath);
  ensureDir(latestMdPath);

  if (!fs.existsSync(corpusPath)) {
    const empty = {
      generatedAt: new Date().toISOString(),
      corpusPath,
      note: "ZIP corpus folder not found. Tests were skipped.",
      totals: { total: 0, pass: 0, review: 0, warn: 0, fail: 0 },
      results: [],
    };
    fs.writeFileSync(
      latestJsonPath,
      `${JSON.stringify(empty, null, 2)}\n`,
      "utf8",
    );
    fs.writeFileSync(
      latestMdPath,
      `# ZIP Diagram Benchmark — Latest Run\n\nGenerated: ${empty.generatedAt}\n\nCorpus path not found: ${corpusPath}\n\nNo ZIP tests executed.\n`,
      "utf8",
    );
    console.log(`[zip-benchmark] Corpus missing, skipped: ${corpusPath}`);
    return;
  }

  const caseFilters = normalize(process.env.BENCHMARK_ZIP_CASES)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const caseFilterSet = caseFilters.length > 0 ? new Set(caseFilters) : null;

  const limit = parseNumber(
    process.env.BENCHMARK_ZIP_LIMIT,
    Number.MAX_SAFE_INTEGER,
  );
  const concurrency = Math.max(
    1,
    parseNumber(process.env.BENCHMARK_ZIP_CONCURRENCY, 2),
  );

  const useGemini = parseBoolean(process.env.BENCHMARK_ZIP_USE_GEMINI, false);
  const skipVersionLookup = parseBoolean(
    process.env.BENCHMARK_SKIP_VERSION_LOOKUP,
    true,
  );
  const maxDepChecks = Math.max(
    0,
    parseNumber(process.env.BENCHMARK_MAX_DEP_CHECKS, 0),
  );

  const geminiApiKey =
    process.env.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY || "";

  const engineModulePath = path.join(
    repoRoot,
    "src",
    "features",
    "analyzer",
    "engine.mjs",
  );
  const engineModule = await import(pathToFileURL(engineModulePath).href);
  const { analyzeZipArchive } = engineModule;

  if (typeof analyzeZipArchive !== "function") {
    throw new Error(
      "analyzeZipArchive export is missing from analyzer engine.",
    );
  }

  let cases = listCaseDirectories(corpusPath);
  if (caseFilterSet) {
    cases = cases.filter((caseName) => {
      const caseId = extractLeadingNumber(caseName);
      return (
        caseFilterSet.has(normalize(caseName)) ||
        (Number.isFinite(caseId) && caseFilterSet.has(String(caseId)))
      );
    });
  }
  cases = cases.slice(0, Math.max(0, limit));

  if (cases.length === 0) {
    throw new Error("No ZIP benchmark cases selected.");
  }

  console.log(
    `[zip-benchmark] Running ${cases.length} cases (concurrency=${concurrency}, gemini=${useGemini ? "on" : "off"})`,
  );

  const selectedResults = new Array(cases.length);
  let index = 0;

  const runCase = async (caseName) => {
    const caseDir = path.join(corpusPath, caseName);
    const zipPath = selectZipFile(caseDir);
    const expectedPath = selectExpectedFile(caseDir);

    const started = performance.now();

    if (!zipPath) {
      return {
        caseName,
        caseId: extractLeadingNumber(caseName),
        status: "error",
        stats: { nodes: 0, edges: 0, requiredNodes: 0, requiredEdges: 0 },
        detected: {},
        issues: [
          {
            code: "missing_zip",
            severity: "error",
            message: "No .zip project found in case folder.",
            expectedLikelyWrong: false,
          },
        ],
        evidence: {
          frontend: [],
          backend: [],
          database: [],
          services: [],
          notes: [],
        },
        durationMs: Math.round(performance.now() - started),
      };
    }

    let expectedInfo = null;
    if (expectedPath && fs.existsSync(expectedPath)) {
      expectedInfo = readExpectedDiagramFile(expectedPath);
    }

    const zipBuffer = fs.readFileSync(zipPath);
    const zipLike = createZipFileLike(zipPath, zipBuffer);

    const analysis = await analyzeZipArchive(zipLike, null, {
      enableGeminiFallback: useGemini,
      geminiApiKey,
      skipVersionLookup,
      maxDepVersionChecks: maxDepChecks,
    });

    const zip = await JSZip.loadAsync(
      zipBuffer.buffer.slice(
        zipBuffer.byteOffset,
        zipBuffer.byteOffset + zipBuffer.byteLength,
      ),
    );

    const entries = Object.values(zip.files || {})
      .filter((entry) => !entry.dir)
      .map((entry) => entry.name.replace(/\\/g, "/"));

    const contentMap = new Map();
    const textCandidates = entries.filter((entry) =>
      /\.(json|md|txt|ya?ml|toml|ini|env|js|jsx|ts|tsx|mjs|cjs|py|go|rs|java|kt|kts|cs|php|rb|vue|css|scss)$/.test(
        entry.toLowerCase(),
      ),
    );

    const readLimit = Math.min(textCandidates.length, 180);
    for (let i = 0; i < readLimit; i += 1) {
      const entryName = textCandidates[i];
      const zipEntry = zip.file(entryName);
      if (!zipEntry) continue;
      try {
        const text = await zipEntry.async("string");
        if (text && text.length > 0) {
          contentMap.set(entryName, text.slice(0, 300000));
        }
      } catch {
        // Ignore decoding issues.
      }
    }

    const evidence = collectIndependentEvidence(entries, contentMap);
    const compared = compareCase({
      caseName,
      expectedInfo,
      analysis,
      evidence,
    });

    compared.zipFile = zipPath;
    compared.durationMs = Math.round(performance.now() - started);
    return compared;
  };

  async function worker() {
    while (index < cases.length) {
      const current = index;
      index += 1;
      if (current >= cases.length) return;
      const caseName = cases[current];
      try {
        console.log(
          `[zip-benchmark] ${current + 1}/${cases.length} ${caseName}`,
        );
        selectedResults[current] = await runCase(caseName);
        console.log(
          `[zip-benchmark] ${caseName} -> ${selectedResults[current].status.toUpperCase()} (${formatMillis(
            selectedResults[current].durationMs,
          )})`,
        );
      } catch (error) {
        selectedResults[current] = {
          caseName,
          caseId: extractLeadingNumber(caseName),
          status: "error",
          stats: { nodes: 0, edges: 0, requiredNodes: 0, requiredEdges: 0 },
          detected: {},
          issues: [
            {
              code: "case_error",
              severity: "error",
              message: error.message,
              expectedLikelyWrong: false,
            },
          ],
          evidence: {
            frontend: [],
            backend: [],
            database: [],
            services: [],
            notes: [],
          },
          durationMs: 0,
        };
        console.log(`[zip-benchmark] ${caseName} -> ERROR: ${error.message}`);
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, cases.length) },
    () => worker(),
  );
  await Promise.all(workers);

  const totals = {
    total: selectedResults.length,
    pass: selectedResults.filter((result) => result.status === "pass").length,
    review: selectedResults.filter((result) => result.status === "review")
      .length,
    warn: selectedResults.filter((result) => result.status === "warn").length,
    fail: selectedResults.filter((result) => result.status === "fail").length,
    error: selectedResults.filter((result) => result.status === "error").length,
  };

  const payload = {
    generatedAt: new Date().toISOString(),
    corpusPath,
    config: {
      selectedCount: selectedResults.length,
      concurrency,
      useGemini,
      skipVersionLookup,
      maxDepChecks,
    },
    totals,
    results: selectedResults,
  };

  fs.writeFileSync(
    latestJsonPath,
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8",
  );
  fs.writeFileSync(
    latestMdPath,
    buildMarkdown(selectedResults, { corpusPath }),
    "utf8",
  );

  console.log("\n[zip-benchmark] Summary");
  console.log(
    `[zip-benchmark] Total ${totals.total} | Pass ${totals.pass} | Review ${totals.review} | Warn ${totals.warn} | Fail ${totals.fail} | Error ${totals.error}`,
  );
  console.log(
    `[zip-benchmark] Updated: ${path.relative(repoRoot, latestJsonPath)}`,
  );
  console.log(
    `[zip-benchmark] Updated: ${path.relative(repoRoot, latestMdPath)}`,
  );

  if (parseBoolean(process.env.BENCHMARK_ZIP_FAIL_ON_FAIL, false)) {
    if (totals.fail > 0 || totals.error > 0) {
      process.exitCode = 1;
    }
  }
}

main().catch((error) => {
  console.error(`[zip-benchmark] Fatal error: ${error.message}`);
  process.exitCode = 1;
});
