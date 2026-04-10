const fs = require("node:fs");
const path = require("node:path");

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function formatMillis(ms) {
  if (!Number.isFinite(ms)) return "0ms";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function splitMarkdownRow(rowLine) {
  return rowLine
    .split("|")
    .map((cell) => cell.trim())
    .filter((cell, index, arr) => {
      if (index === 0 && cell === "") return false;
      if (index === arr.length - 1 && cell === "") return false;
      return true;
    });
}

function extractSectionBody(content, headingRegex) {
  const lines = String(content || "").split(/\r?\n/);
  const startIndex = lines.findIndex((line) => headingRegex.test(line.trim()));
  if (startIndex === -1) return "";

  let endIndex = lines.length;
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    if (/^##\s+/.test(lines[i].trim())) {
      endIndex = i;
      break;
    }
  }

  return lines.slice(startIndex + 1, endIndex).join("\n");
}

function isSeparatorRow(cells) {
  return cells.every((cell) => /^:?-{2,}:?$/.test(cell));
}

function stripCodeFences(text) {
  return String(text || "").replace(/```[a-z]*\n?|```/gi, "");
}

function tokenizeLabel(label) {
  return String(label || "")
    .replace(/[`*_#]/g, " ")
    .toLowerCase()
    .split(/[^a-z0-9.+#-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function parseExpectedNodes(content) {
  const nodesSection = extractSectionBody(content, /^##\s+nodes\b/i);
  const lines = String(nodesSection || "").split(/\r?\n/);
  const nodes = [];

  let inNodeTable = false;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (inNodeTable) break;
      continue;
    }

    if (!inNodeTable) {
      if (/^\|/i.test(line) && /node\s*id/i.test(line) && /label/i.test(line)) {
        inNodeTable = true;
      }
      continue;
    }

    if (!/^\|/.test(line)) break;

    const cells = splitMarkdownRow(line);
    if (cells.length < 3 || isSeparatorRow(cells)) continue;

    const idCell = cells[1] || "";
    const labelCell = cells[2] || "";
    const typeCell = cells[3] || "";
    const colorCell = cells[4] || "";

    const nodeId = normalize(idCell.replace(/`/g, ""));
    if (!nodeId) continue;

    nodes.push({
      id: nodeId,
      label: labelCell.replace(/`/g, "").trim(),
      type: normalize(typeCell.replace(/`/g, "")),
      color: colorCell.replace(/`/g, "").trim(),
      keywords: tokenizeLabel(labelCell),
    });
  }

  return nodes;
}

function parseExpectedEdges(content) {
  const edgesSection = extractSectionBody(content, /^##\s+edges\b/i);
  const fencedMatch = String(edgesSection || "").match(
    /```[^\n]*\n([\s\S]*?)```/i,
  );
  const edgeSourceText = fencedMatch ? fencedMatch[1] : edgesSection;
  const cleaned = stripCodeFences(edgeSourceText);
  const edges = [];
  const ignoredNodeIds = new Set([
    "left",
    "right",
    "middle",
    "center",
    "top",
    "bottom",
  ]);
  const edgeRe =
    /`?([a-zA-Z][a-zA-Z0-9_-]*)`?\s*(?:->|→)\s*`?([a-zA-Z][a-zA-Z0-9_-]*)`?/g;
  let match = edgeRe.exec(cleaned);
  while (match) {
    const from = normalize(match[1]);
    const to = normalize(match[2]);
    if (ignoredNodeIds.has(from) || ignoredNodeIds.has(to)) {
      match = edgeRe.exec(cleaned);
      continue;
    }
    edges.push({ from, to });
    match = edgeRe.exec(cleaned);
  }

  const unique = new Map();
  edges.forEach((edge) => {
    unique.set(`${edge.from}->${edge.to}`, edge);
  });
  return Array.from(unique.values());
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function textIncludesKeyword(text, rawKeyword) {
  const keyword = normalize(rawKeyword);
  if (!keyword) return false;

  const escaped = escapeRegExp(keyword);
  const shouldUseBoundary = keyword.length <= 4 || /[.+#]/.test(keyword);

  if (shouldUseBoundary) {
    const re = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
    return re.test(text);
  }

  return text.includes(keyword);
}

function classifyKeywordsFromText(content) {
  const lower = normalize(content);
  const keywords = {
    frontend: new Set(),
    backend: new Set(),
    database: new Set(),
    services: new Set(),
  };

  const bucket = (type, token) => {
    if (!token) return;
    keywords[type].add(normalize(token));
  };

  [
    [
      "frontend",
      [
        "react",
        "next.js",
        "nextjs",
        "nuxt",
        "angular",
        "vue",
        "svelte",
        "astro",
        "tailwind",
        "typescript",
      ],
    ],
    [
      "backend",
      [
        "express",
        "nestjs",
        "nest",
        "fastify",
        "koa",
        "hono",
        "trpc",
        "node",
        "api",
        "django",
        "flask",
        "spring",
        "golang",
        "rust",
        ".net",
        "dotnet",
        "asp.net",
        "aspnetcore",
        "c#",
        "php",
      ],
    ],
    [
      "database",
      [
        "postgres",
        "postgresql",
        "mysql",
        "mariadb",
        "mongodb",
        "sqlite",
        "redis",
        "supabase",
        "firebase",
        "turso",
        "neon",
        "planetscale",
      ],
    ],
    [
      "services",
      [
        "clerk",
        "auth0",
        "lucia",
        "better auth",
        "jwt",
        "stripe",
        "cloudinary",
        "s3",
        "resend",
        "sendgrid",
        "openai",
        "gemini",
        "anthropic",
        "langchain",
        "meilisearch",
        "elasticsearch",
        "rabbitmq",
        "kafka",
      ],
    ],
  ].forEach(([type, tokens]) => {
    tokens.forEach((token) => {
      if (textIncludesKeyword(lower, token)) bucket(type, token);
    });
  });

  return {
    frontend: Array.from(keywords.frontend),
    backend: Array.from(keywords.backend),
    database: Array.from(keywords.database),
    services: Array.from(keywords.services),
  };
}

function parseExpectedArchitectureText(content) {
  const nodes = parseExpectedNodes(content);
  const edges = parseExpectedEdges(content);
  const structuredSignalText = [
    ...nodes.map((node) => `${node.id} ${node.label} ${node.type}`),
    ...edges.map((edge) => `${edge.from} ${edge.to}`),
  ].join("\n");
  const keywordHints = classifyKeywordsFromText(structuredSignalText);

  return {
    nodes,
    edges,
    keywordHints,
  };
}

function inferKeywordHintsFromParsedExpected(parsedExpected) {
  const hints = {
    frontend: new Set(parsedExpected.keywordHints?.frontend || []),
    backend: new Set(parsedExpected.keywordHints?.backend || []),
    database: new Set(parsedExpected.keywordHints?.database || []),
    services: new Set(parsedExpected.keywordHints?.services || []),
  };

  (parsedExpected.nodes || []).forEach((node) => {
    const id = normalize(node.id);
    const tokens = node.keywords || [];
    if (id === "client" || /frontend/.test(node.type)) {
      tokens.forEach((token) => hints.frontend.add(token));
      return;
    }
    if (id === "api" || /backend/.test(node.type)) {
      tokens.forEach((token) => hints.backend.add(token));
      return;
    }
    if (id === "db" || /database/.test(node.type)) {
      tokens.forEach((token) => hints.database.add(token));
      return;
    }
    tokens.forEach((token) => hints.services.add(token));
  });

  return {
    frontend: Array.from(hints.frontend),
    backend: Array.from(hints.backend),
    database: Array.from(hints.database),
    services: Array.from(hints.services),
  };
}

function extractLeadingNumber(value) {
  const m = String(value || "").match(/^(\d+)/);
  return m ? Number.parseInt(m[1], 10) : null;
}

function readExpectedDiagramFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const textLike = new Set([".md", ".txt", ".json", ".yaml", ".yml"]);
  if (!textLike.has(ext)) {
    return {
      path: filePath,
      ext,
      parsable: false,
      content: null,
      parsed: { nodes: [], edges: [], keywordHints: {} },
      parseNote: `Unsupported expected diagram format: ${ext || "unknown"}`,
    };
  }

  const content = fs.readFileSync(filePath, "utf8");
  const parsed = parseExpectedArchitectureText(content);

  return {
    path: filePath,
    ext,
    parsable: true,
    content,
    parsed,
    parseNote: null,
  };
}

function buildKeywordSignalsFromAnalysis(analysis) {
  const detected = analysis?.detected || {};
  const signals = {
    frontend: [],
    backend: [],
    database: [],
    services: [],
  };

  const pick = (entry) => {
    if (!entry || typeof entry !== "object") return [];
    return [entry.label, entry.type, entry.provider]
      .map((value) => normalize(value))
      .filter(Boolean);
  };

  signals.frontend = pick(detected.frontend);
  signals.backend = pick(detected.backend);
  signals.database = pick(detected.database);

  const repoIdentitySignals = [
    normalize(analysis?.stats?.repoName),
    normalize(analysis?.stats?.repoFullName),
  ].filter(Boolean);

  if (repoIdentitySignals.length > 0) {
    if (signals.frontend.length > 0) {
      signals.frontend.push(...repoIdentitySignals);
    }
    if (signals.backend.length > 0) {
      signals.backend.push(...repoIdentitySignals);
    }

    if (signals.database.length === 0) {
      const identityText = repoIdentitySignals.join(" ");
      const addRepoDb = (...values) => {
        values
          .map((value) => normalize(value))
          .filter(Boolean)
          .forEach((value) => signals.database.push(value));
      };

      if (
        /(^|[^a-z0-9])mongodb([^a-z0-9]|$)|(^|[^a-z0-9])mongo([^a-z0-9]|$)/.test(
          identityText,
        )
      ) {
        addRepoDb("mongodb", "mongo");
      } else if (
        /(^|[^a-z0-9])postgres([^a-z0-9]|$)|(^|[^a-z0-9])postgresql([^a-z0-9]|$)/.test(
          identityText,
        )
      ) {
        addRepoDb("postgres", "postgresql", "pg");
      } else if (/(^|[^a-z0-9])redis([^a-z0-9]|$)/.test(identityText)) {
        addRepoDb("redis");
      } else if (
        /(^|[^a-z0-9])mysql([^a-z0-9]|$)|(^|[^a-z0-9])mariadb([^a-z0-9]|$)/.test(
          identityText,
        )
      ) {
        addRepoDb("mysql", "mariadb");
      } else if (
        /(^|[^a-z0-9])sqlite([^a-z0-9]|$)|(^|[^a-z0-9])turso([^a-z0-9]|$)/.test(
          identityText,
        )
      ) {
        addRepoDb("sqlite", "turso");
      }
    }
  }

  const technologies = detected.technologies;
  if (technologies && typeof technologies === "object") {
    Object.values(technologies).forEach((tech) => {
      if (!tech || typeof tech !== "object") return;
      const values = [tech.id, tech.type, tech.label]
        .map((value) => normalize(value))
        .filter(Boolean);
      if (values.length === 0) return;

      const category = normalize(tech.category);
      if (
        category === "frontend" ||
        category === "language" ||
        category === "styling"
      ) {
        signals.frontend.push(...values);
        return;
      }

      if (category === "backend") {
        signals.backend.push(...values);
        return;
      }

      if (category === "database") {
        signals.database.push(...values);
        return;
      }

      signals.services.push(...values);
    });
  }

  Object.entries(detected).forEach(([key, value]) => {
    if (
      [
        "frontend",
        "backend",
        "database",
        "orm",
        "docker",
        "technologies",
      ].includes(key)
    ) {
      return;
    }
    if (!value || typeof value !== "object") return;
    signals.services.push(...pick(value), normalize(key));
  });

  signals.frontend = [...new Set(signals.frontend.filter(Boolean))];
  signals.backend = [...new Set(signals.backend.filter(Boolean))];
  signals.database = [...new Set(signals.database.filter(Boolean))];
  signals.services = [...new Set(signals.services.filter(Boolean))];
  return signals;
}

module.exports = {
  normalize,
  formatMillis,
  parseExpectedArchitectureText,
  classifyKeywordsFromText,
  inferKeywordHintsFromParsedExpected,
  extractLeadingNumber,
  readExpectedDiagramFile,
  buildKeywordSignalsFromAnalysis,
};
