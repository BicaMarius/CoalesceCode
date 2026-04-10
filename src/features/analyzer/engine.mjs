import JSZip from "jszip";
import { buildNodeDetailsFromAnalysis } from "./nodeDetailsTemplates.mjs";

const ANALYSIS_LIMITS = {
  MAX_FILES_FOR_DETECTION: 25000,
  MAX_PACKAGE_JSON_FILES: 30,
  MAX_SOURCE_FILES: 90,
  MAX_SIGNAL_FILES: 60,
  MAX_STACK_TECH_ENTRIES: 28,
  MAX_TECHNOLOGY_ENTRIES: 240,
  MAX_DEP_VERSION_CHECKS: 180,
  FILE_READ_CONCURRENCY: 6,
  VERSION_FETCH_CONCURRENCY: 10,
  MAX_TEXT_FILE_SIZE: 450000,
};

const ENV_FILE_RE = /(^|\/)\.env(\.[^/]+)?$/i;

const CORE_COMPONENT_KEYS = ["frontend", "backend", "database"];
const TEXT_ANALYSIS_EXT_RE =
  /\.(js|jsx|ts|tsx|mjs|cjs|json|md|txt|toml|ya?ml|xml|ini|conf|py|go|rs|java|kt|kts|cs|php|rb|scala|sh|prisma)$/i;
const PATH_IGNORE_RE =
  /(^|\/)(node_modules|dist|build|coverage|\.next|\.nuxt|\.git|vendor|target|out)(\/|$)/;
const ANALYSIS_NOISE_RE =
  /(^|\/)(docs?|benchmarks?|scripts?|fixtures?|samples?|examples?|tests?|__tests__|\.github|\.vscode|wireframes?)(\/|$)/i;
const CONFIG_LIKE_PATH_RE =
  /(^|\/)(package(-lock)?\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb|tsconfig(\.[^/]+)?\.json|.*config\.(js|cjs|mjs|ts|json|ya?ml)|\.env(\.[^/]+)?|dockerfile(\.[^/]+)?|docker-compose(\.[^/]+)?\.ya?ml|chart\.ya?ml|kustomization\.ya?ml)$/i;

const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_PRICING = {
  inputPerMillionUSD: 0.1,
  outputPerMillionUSD: 0.4,
};
function parseGitHubUrl(raw) {
  const cleaned = raw
    .trim()
    .replace(/\.git$/, "")
    .replace(/\/$/, "");
  const m = cleaned.match(/github\.com[/:]+([^/]+)\/([^/\s]+)/);
  return m ? { owner: m[1], repo: m[2] } : null;
}

const latestVersionCache = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function isRetryableStatus(status) {
  return status === 429 || status >= 500;
}

function isLikelyTransientError(error) {
  const m = String(error?.message || "").toLowerCase();
  return (
    error?.name === "AbortError" ||
    /network|timeout|failed to fetch|temporar/.test(m)
  );
}

function minutesUntilReset(resetEpochSeconds) {
  if (!resetEpochSeconds) return null;
  const nowSec = Math.floor(Date.now() / 1000);
  const diffSec = Math.max(0, Number(resetEpochSeconds) - nowSec);
  return Math.ceil(diffSec / 60);
}

async function ghFetch(url, token, options = {}) {
  const {
    retries = 2,
    timeoutMs = 22000,
    allowNotFound = false,
    addLog,
  } = options;
  const headers = { Accept: "application/vnd.github.v3+json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const r = await fetchWithTimeout(url, { headers }, timeoutMs);

      if (r.status === 404 && allowNotFound) return null;
      if (r.status === 404) throw new Error("Repository resource not found.");

      if (r.status === 403) {
        const remaining = r.headers.get("x-ratelimit-remaining");
        const reset = r.headers.get("x-ratelimit-reset");
        if (remaining === "0") {
          const mins = minutesUntilReset(reset);
          throw new Error(
            mins
              ? `GitHub rate limit reached. Retry in ~${mins} min or add token.`
              : "GitHub rate limit reached. Add token or retry later.",
          );
        }
      }

      if (isRetryableStatus(r.status) && attempt < retries) {
        const waitMs = 600 * (attempt + 1);
        addLog?.("warning", `GitHub ${r.status} retry in ${waitMs}ms`);
        await sleep(waitMs);
        continue;
      }

      if (!r.ok) throw new Error(`GitHub API error ${r.status}`);
      return await r.json();
    } catch (error) {
      if (attempt < retries && isLikelyTransientError(error)) {
        const waitMs = 600 * (attempt + 1);
        addLog?.("warning", `Transient GitHub error, retry in ${waitMs}ms`);
        await sleep(waitMs);
        continue;
      }
      throw error;
    }
  }

  throw new Error("GitHub request failed after retries.");
}

async function ghFetchText(url, token, options = {}) {
  const {
    retries = 2,
    timeoutMs = 22000,
    allowNotFound = true,
    addLog,
  } = options;
  const headers = { Accept: "application/vnd.github.v3.raw" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const r = await fetchWithTimeout(url, { headers }, timeoutMs);
      if (r.status === 404 && allowNotFound) return null;

      if (isRetryableStatus(r.status) && attempt < retries) {
        const waitMs = 500 * (attempt + 1);
        addLog?.("warning", `Raw content ${r.status} retry in ${waitMs}ms`);
        await sleep(waitMs);
        continue;
      }

      if (!r.ok) return null;
      return await r.text();
    } catch (error) {
      if (attempt < retries && isLikelyTransientError(error)) {
        const waitMs = 500 * (attempt + 1);
        addLog?.("warning", `Transient raw fetch error, retry in ${waitMs}ms`);
        await sleep(waitMs);
        continue;
      }
      return null;
    }
  }

  return null;
}

async function fetchLatestVersion(name) {
  if (latestVersionCache.has(name)) return latestVersionCache.get(name);
  try {
    const r = await fetchWithTimeout(
      `https://cdn.jsdelivr.net/npm/${encodeURIComponent(name)}/package.json`,
      {},
      12000,
    );
    if (!r.ok) {
      latestVersionCache.set(name, null);
      return null;
    }
    const version = (await r.json()).version || null;
    latestVersionCache.set(name, version);
    return version;
  } catch {
    latestVersionCache.set(name, null);
    return null;
  }
}

async function mapWithConcurrency(items, limit, mapper) {
  if (!items.length) return [];
  const safeLimit = Math.max(1, Math.min(limit, items.length));
  const results = new Array(items.length);
  let index = 0;

  const worker = async () => {
    while (index < items.length) {
      const current = index;
      index += 1;
      if (current >= items.length) break;
      try {
        results[current] = await mapper(items[current], current);
      } catch (error) {
        results[current] = { error };
      }
    }
  };

  await Promise.all(Array.from({ length: safeLimit }, worker));
  return results;
}

function isOutdated(cur, lat) {
  if (!cur || !lat) return false;
  const n = (v) =>
    v
      .replace(/^[^0-9]*/, "")
      .split("-")[0]
      .split(".")
      .map((x) => parseInt(x, 10) || 0);
  const [cA, cB, cC] = n(cur),
    [lA, lB, lC] = n(lat);
  if (lA !== cA) return lA > cA;
  if (lB !== cB) return lB > cB;
  return lC > cC;
}

function classifyDep(name) {
  if (
    /jest|vitest|mocha|chai|cypress|playwright|testing-library|supertest/.test(
      name,
    )
  )
    return "dev";
  if (
    /eslint|prettier|typescript|babel|webpack|vite|rollup|esbuild|nodemon|ts-node|tsx|concurrently|rimraf/.test(
      name,
    )
  )
    return "dev";
  if (
    /passport|bcrypt|jsonwebtoken|helmet|cors|csrf|sanitize|validator|jose|argon2/.test(
      name,
    )
  )
    return "security";
  return "runtime";
}

const DETECTED_KEY_TO_NODE_ID = {
  frontend: "client",
  backend: "api",
  auth: "auth",
  database: "db",
  cache: "cache",
  queue: "queue",
  ai: "ai",
  email: "email",
  storage: "storage",
  payment: "payment",
  search: "search",
  messaging: "messaging",
  analytics: "analytics",
  monitoring: "monitoring",
  externalApi: "externalApi",
};

function normalizeTechnologyId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^npm:/, "")
    .replace(/^workspace:/, "")
    .replace(/^link:/, "")
    .replace(/\s+/g, "-");
}

function technologyLabelFromId(techId) {
  const id = String(techId || "").trim();
  if (!id) return "Technology";
  if (id === "typescript") return "TypeScript";
  if (id === "tailwindcss") return "Tailwind CSS";
  if (id === "next-auth") return "NextAuth.js";
  if (id.startsWith("@")) return id;
  return id
    .split(/[/-]/)
    .map((part) => {
      if (!part) return part;
      if (part.length <= 2) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function inferTechnologyCategory(techId) {
  const id = normalizeTechnologyId(techId);
  if (!id) return "library";

  if (/(docker|kubernetes|k8s|helm)/.test(id)) {
    return "container";
  }

  if (
    /(react|next|nuxt|vue|angular|svelte|astro|remix|solid|preact|qwik|tailwind|sass|less|emotion|styled-components|postcss)/.test(
      id,
    )
  ) {
    return "frontend";
  }

  if (
    /(express|nestjs|nest|fastify|koa|hono|trpc|elysia|hapi|node|django|flask|fastapi|spring|laravel|asp\.net|dotnet|php|ruby|go|rust|java)/.test(
      id,
    )
  ) {
    return "backend";
  }

  if (
    /(postgres|pg|mysql|mariadb|mongodb|mongoose|sqlite|libsql|supabase|firebase|redis|turso|neon|planetscale|dynamodb|cosmos|cassandra|neo4j|surreal|cockroach)/.test(
      id,
    )
  ) {
    return "database";
  }

  if (/(prisma|drizzle|sequelize|typeorm|knex|mikro-orm)/.test(id)) {
    return "orm";
  }

  if (/(clerk|auth0|next-auth|lucia|better-auth|passport|jwt|jose)/.test(id)) {
    return "auth";
  }

  if (
    /(openai|anthropic|gemini|groq|huggingface|langchain|vercel-ai|generative-ai)/.test(
      id,
    )
  ) {
    return "ai";
  }

  if (/(redis|memcached|upstash)/.test(id)) {
    return "cache";
  }

  if (
    /(bull|bullmq|rabbitmq|amqp|kafka|nats|sqs|pubsub|queue|worker)/.test(id)
  ) {
    return "queue";
  }

  if (
    /(cloudinary|uploadthing|storage|blob|s3|google-cloud\/storage|aws-sdk\/client-s3|azure\/storage-blob)/.test(
      id,
    )
  ) {
    return "storage";
  }

  if (/(stripe|paypal|paddle|braintree|razorpay|adyen)/.test(id)) {
    return "payment";
  }

  if (/(meilisearch|algolia|elasticsearch|opensearch|search)/.test(id)) {
    return "search";
  }

  if (/(twilio|slack|discord|pusher|messaging|socket\.io)/.test(id)) {
    return "messaging";
  }

  if (/(posthog|mixpanel|amplitude|plausible|analytics|ga4)/.test(id)) {
    return "analytics";
  }

  if (
    /(sentry|datadog|newrelic|opentelemetry|prometheus|grafana|monitoring)/.test(
      id,
    )
  ) {
    return "monitoring";
  }

  if (
    /(typescript|javascript|node|python|go|rust|java|kotlin|scala|php|ruby|c#|dotnet)/.test(
      id,
    )
  ) {
    return "language";
  }

  if (
    /(eslint|prettier|babel|webpack|vite|rollup|esbuild|ts-node|tsx|jest|vitest|cypress|playwright|storybook)/.test(
      id,
    )
  ) {
    return "tooling";
  }

  return "library";
}

function colorForTechnologyCategory(category) {
  const key = String(category || "").toLowerCase();
  if (key === "frontend") return "#60A5FA";
  if (key === "backend") return "#68D391";
  if (key === "database") return "#F59E0B";
  if (key === "orm") return "#22D3EE";
  if (key === "auth") return "#F6AD55";
  if (key === "ai") return "#74AA9C";
  if (key === "cache") return "#D82C20";
  if (key === "queue") return "#F59E0B";
  if (key === "storage") return "#FF9900";
  if (key === "payment") return "#635BFF";
  if (key === "search") return "#2EC4B6";
  if (key === "messaging") return "#F59E0B";
  if (key === "analytics") return "#7C3AED";
  if (key === "monitoring") return "#EF4444";
  if (key === "container") return "#38BDF8";
  if (key === "language") return "#A78BFA";
  if (key === "tooling") return "#22D3EE";
  return "#94A3B8";
}

function normalizeStringArray(values) {
  const seen = new Set();
  const out = [];
  (values || []).forEach((value) => {
    const normalized = String(value || "").trim();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    out.push(normalized);
  });
  return out;
}

function isStackTechnologyCategory(category) {
  const key = normalizeTechnologyId(category);
  if (!key) return false;
  return !["library", "tooling"].includes(key);
}

function shouldTrackDependencyTechnology(depName) {
  const category = inferTechnologyCategory(depName);
  return isStackTechnologyCategory(category);
}

function isConfigLikeFilePath(filePath) {
  const normalized = String(filePath || "").replace(/\\/g, "/");
  return CONFIG_LIKE_PATH_RE.test(normalized);
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isLikelyToolingDependency(depName) {
  const name = normalizeTechnologyId(depName);
  if (!name) return false;
  return /(eslint|prettier|typescript|babel|webpack|vite|rollup|esbuild|ts-node|tsx|jest|vitest|mocha|chai|cypress|playwright|storybook|husky|lint-staged|commitlint|semantic-release|rimraf|concurrently|nodemon)/.test(
    name,
  );
}

function normalizeImportSpecifierToPackage(specifier) {
  const raw = String(specifier || "").trim();
  if (!raw) return "";
  if (raw.startsWith(".") || raw.startsWith("/") || raw.startsWith("#")) {
    return "";
  }

  if (raw.startsWith("@")) {
    const parts = raw.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]}`;
    }
    return raw;
  }

  return raw.split("/")[0] || "";
}

function extractImportedPackagesFromText(content) {
  const text = String(content || "");
  const packages = new Set();

  const patterns = [
    /(?:import|export)\s+[\s\S]*?from\s*["'`]([^"'`]+)["'`]/g,
    /import\s*["'`]([^"'`]+)["'`]/g,
    /require\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g,
    /import\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g,
  ];

  patterns.forEach((pattern) => {
    for (const match of text.matchAll(pattern)) {
      const pkg = normalizeImportSpecifierToPackage(match?.[1]);
      if (pkg) packages.add(pkg);
    }
  });

  return Array.from(packages);
}

function buildDependencyUsageIndex(scannedTextByFile) {
  const usage = new Map();

  (scannedTextByFile || new Map()).forEach((content, filePath) => {
    if (!content || !filePath) return;
    const importedPackages = extractImportedPackagesFromText(content);
    importedPackages.forEach((pkgName) => {
      if (!usage.has(pkgName)) usage.set(pkgName, new Set());
      usage.get(pkgName).add(filePath);
    });
  });

  return usage;
}

function buildDependencyConfigReferenceIndex(
  scannedTextByFile,
  dependencyNames,
) {
  const refs = {};
  const configEntries = Array.from(scannedTextByFile || new Map()).filter(
    ([filePath]) => isConfigLikeFilePath(filePath),
  );

  dependencyNames.forEach((depName) => {
    const escaped = escapeRegExp(depName);
    if (!escaped) return;
    const mentionRe = new RegExp(
      `(^|[^a-z0-9@_/-])${escaped}([^a-z0-9@_/-]|$)`,
      "i",
    );
    const files = [];

    configEntries.forEach(([filePath, content]) => {
      if (!content || /package(-lock)?\.json$/i.test(filePath)) return;
      if (mentionRe.test(String(content))) {
        files.push(filePath);
      }
    });

    refs[depName] = normalizeStringArray(files).slice(0, 6);
  });

  return refs;
}

function isLanguageCategory(category) {
  return normalizeTechnologyId(category) === "language";
}

function getDetectedPrimaryTechnologyIds(detected) {
  const keys = [
    "frontend",
    "backend",
    "database",
    "orm",
    "auth",
    "ai",
    "cache",
    "queue",
    "storage",
    "payment",
    "search",
    "messaging",
    "analytics",
    "monitoring",
  ];

  return new Set(
    keys
      .map((key) => normalizeTechnologyId(detected?.[key]?.type))
      .filter(Boolean),
  );
}

const STACK_RULES = {
  language: [
    /^(typescript|javascript|python|go|golang|rust|java|kotlin|scala|php|ruby|dart|c#|csharp|dotnet)$/,
  ],
  frontend: [
    /^(react|next|nextjs|nuxt|vue|angular|svelte|astro|remix|solid|preact|qwik|tailwindcss)$/,
  ],
  backend: [
    /^(express|nestjs|nest|fastify|koa|hono|trpc|elysia|node|node_next_api|node_nuxt_server|node_sveltekit_server|node_remix_server|django|flask|fastapi|spring|go|rust|dotnet|php|java)$/,
  ],
  database: [
    /^(postgres|postgresql|mysql|mariadb|mongodb|mongo|sqlite|redis|supabase|firebase|firestore|turso|neon|planetscale|dynamodb|cosmosdb|cockroachdb)$/,
  ],
  orm: [/^(prisma|drizzle|sequelize|typeorm|knex)$/],
  auth: [
    /^(next-auth|nextauth|clerk|auth0|passport|jwt|jose|lucia|better-auth)$/,
  ],
  ai: [
    /^(openai|anthropic|google|gemini|groq|hf|huggingface|langchain|vercel_ai|ai)$/,
  ],
  cache: [/^(redis|memcached|upstash)$/],
  queue: [/^(queue|bull|bullmq|rabbitmq|kafka|nats|sqs|pubsub)$/],
  storage: [/^(storage|s3|cloudinary|uploadthing|blob)$/],
  payment: [/^(stripe|paypal|paddle|braintree|razorpay|adyen|payment)$/],
  search: [/^(search|meilisearch|algolia|elasticsearch|opensearch)$/],
  messaging: [/^(messaging|twilio|slack|discord|pusher|socket\.io)$/],
  analytics: [/^(analytics|posthog|mixpanel|amplitude|plausible)$/],
  monitoring: [
    /^(monitoring|sentry|datadog|newrelic|opentelemetry|prometheus|grafana)$/,
  ],
  container: [/^(docker|kubernetes)$/],
};

function stackTechMatchesRule(entry) {
  const category = normalizeTechnologyId(entry?.category);
  const id = normalizeTechnologyId(entry?.id || entry?.type || entry?.label);
  const rules = STACK_RULES[category] || [];
  if (!rules.length || !id) return false;
  return rules.some((rule) => rule.test(id));
}

function stackPriority(entry) {
  const category = normalizeTechnologyId(entry?.category);
  const order = {
    language: 100,
    frontend: 96,
    backend: 95,
    database: 94,
    orm: 90,
    auth: 88,
    ai: 87,
    cache: 86,
    queue: 85,
    container: 84,
    storage: 82,
    payment: 81,
    search: 80,
    messaging: 79,
    analytics: 78,
    monitoring: 77,
  };
  return order[category] || 10;
}

function buildStackTechnologyProjection(technologies, detected) {
  const entries = Object.values(technologies || {}).filter(
    (entry) => entry && typeof entry === "object",
  );
  if (!entries.length) return {};

  const primaryTechIds = getDetectedPrimaryTechnologyIds(detected);
  const selected = entries
    .filter((entry) => {
      const category = normalizeTechnologyId(entry?.category);
      if (!category) return false;
      if (!isStackTechnologyCategory(category)) return false;

      const techId = normalizeTechnologyId(entry?.id || entry?.type);
      if (primaryTechIds.has(techId)) return true;
      if ((entry?.sources || []).includes("detected")) return true;
      return stackTechMatchesRule(entry);
    })
    .map((entry) => {
      const normalized = { ...entry };
      if (isLanguageCategory(normalized.category)) {
        normalized.status = "active";
        normalized.warning = false;
        normalized.statusReason =
          "Language detected from repository files and tooling context.";
      }
      return normalized;
    })
    .sort((a, b) => {
      const priorityDiff = stackPriority(b) - stackPriority(a);
      if (priorityDiff !== 0) return priorityDiff;
      return technologyPriorityScore(b) - technologyPriorityScore(a);
    });

  const projected = {};
  selected.slice(0, ANALYSIS_LIMITS.MAX_STACK_TECH_ENTRIES).forEach((entry) => {
    projected[entry.id] = entry;
  });

  return projected;
}

function isLikelyFilePath(value) {
  const raw = String(value || "").trim();
  if (!raw) return false;
  return (
    /[\\/]/.test(raw) ||
    /\.(js|jsx|ts|tsx|mjs|cjs|json|md|txt|ya?ml|toml|ini|py|go|rs|java|kt|kts|cs|php|rb|scala|sh|prisma)$/i.test(
      raw,
    )
  );
}

function extractEvidenceFilePath(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^(dependency|devdependency):/i.test(raw)) return "";
  if (!isLikelyFilePath(raw)) return "";
  return raw.replace(/^file:/i, "");
}

function getTechnologyEvidenceGroups(entry) {
  const evidenceFiles = normalizeStringArray(
    (entry?.evidence || []).map(extractEvidenceFilePath).filter(Boolean),
  );

  const definitionFiles = evidenceFiles.filter((filePath) =>
    CONFIG_LIKE_PATH_RE.test(filePath),
  );
  const usageFiles = evidenceFiles.filter(
    (filePath) => !CONFIG_LIKE_PATH_RE.test(filePath),
  );

  return { evidenceFiles, definitionFiles, usageFiles };
}

function finalizeTechnologyEntry(entry) {
  const sources = normalizeStringArray(entry?.sources || []);
  const scopes = normalizeStringArray(entry?.scopes || []);
  const { evidenceFiles, definitionFiles, usageFiles } =
    getTechnologyEvidenceGroups(entry);

  const hasRuntimeSignal =
    usageFiles.length > 0 ||
    sources.includes("detected") ||
    sources.includes("file");

  const status = hasRuntimeSignal ? "active" : "declared-only";
  const statusReason =
    status === "active"
      ? "Runtime usage evidence found in project files."
      : "Declared in dependencies/config, but runtime usage was not detected.";

  return {
    ...entry,
    category:
      entry?.category || inferTechnologyCategory(entry?.id || entry?.type),
    sources,
    scopes,
    evidence: normalizeStringArray(entry?.evidence || []).slice(0, 12),
    evidenceFiles: evidenceFiles.slice(0, 12),
    definitionFiles: definitionFiles.slice(0, 8),
    usageFiles: usageFiles.slice(0, 8),
    status,
    statusReason,
    warning: status !== "active",
  };
}

function ensureTechnologyMap(target) {
  if (!target || typeof target !== "object") return {};
  if (
    !target.technologies ||
    typeof target.technologies !== "object" ||
    Array.isArray(target.technologies)
  ) {
    target.technologies = {};
  }
  return target.technologies;
}

function addTechnologyDetection(target, rawTechId, options = {}) {
  const techId = normalizeTechnologyId(rawTechId);
  if (!techId || techId.startsWith("@types/")) return null;

  const map = ensureTechnologyMap(target);
  const existing = map[techId] || null;

  const category =
    normalizeTechnologyId(options.category) || inferTechnologyCategory(techId);
  if (!options.allowLibrary && !isStackTechnologyCategory(category))
    return null;

  const label =
    options.label || existing?.label || technologyLabelFromId(techId);

  const mergedSources = normalizeStringArray([
    ...(existing?.sources || []),
    options.source || "detected",
  ]);
  const mergedScopes = normalizeStringArray([
    ...(existing?.scopes || []),
    options.scope || "runtime",
  ]);
  const mergedEvidence = normalizeStringArray([
    ...(existing?.evidence || []),
    options.evidence || "",
  ]);

  const entry = {
    id: techId,
    type: techId,
    label,
    category,
    color:
      options.color || existing?.color || colorForTechnologyCategory(category),
    sources: mergedSources,
    scopes: mergedScopes,
    evidence: mergedEvidence.slice(0, 8),
    hits: Number(existing?.hits || 0) + 1,
  };

  map[techId] = entry;
  return entry;
}

function mergeTechnologyMaps(baseMap, nextMap) {
  const target = { technologies: { ...(baseMap || {}) } };
  if (!nextMap || typeof nextMap !== "object") return target.technologies;

  Object.values(nextMap).forEach((entry) => {
    if (!entry || typeof entry !== "object") return;
    addTechnologyDetection(target, entry.id || entry.type || entry.label, {
      label: entry.label,
      category: entry.category,
      color: entry.color,
      source: (entry.sources || [])[0] || "detected",
      scope: (entry.scopes || [])[0] || "runtime",
      evidence: (entry.evidence || [])[0] || "",
    });
    const techId = normalizeTechnologyId(entry.id || entry.type || entry.label);
    const current = target.technologies[techId];
    if (!current) return;
    current.sources = normalizeStringArray([
      ...(current.sources || []),
      ...(entry.sources || []),
    ]);
    current.scopes = normalizeStringArray([
      ...(current.scopes || []),
      ...(entry.scopes || []),
    ]);
    current.evidence = normalizeStringArray([
      ...(current.evidence || []),
      ...(entry.evidence || []),
    ]).slice(0, 8);
    current.hits = Math.max(current.hits || 1, Number(entry.hits || 1));
  });

  return target.technologies;
}

function technologyPriorityScore(entry) {
  const scopes = entry?.scopes || [];
  const sources = entry?.sources || [];
  let score = Number(entry?.hits || 0);
  if (entry?.status === "active") score += 6;
  if (entry?.status === "declared-only") score -= 2;
  if (scopes.includes("runtime")) score += 5;
  if (sources.includes("file")) score += 4;
  if (sources.includes("detected")) score += 3;
  if (sources.includes("dependency")) score += 2;
  if (entry?.category === "frontend") score += 2;
  if (entry?.category === "backend") score += 2;
  if (entry?.category === "database") score += 2;
  return score;
}

function limitTechnologyMap(technologies, maxEntries) {
  if (!technologies || typeof technologies !== "object") return {};
  const sorted = Object.values(technologies)
    .filter((entry) => entry && typeof entry === "object")
    .sort((a, b) => technologyPriorityScore(b) - technologyPriorityScore(a));

  const limited = {};
  sorted.slice(0, Math.max(1, maxEntries)).forEach((entry) => {
    limited[entry.id] = entry;
  });
  return limited;
}

function buildDetectedTechnologies({
  allDeps,
  allDevDeps,
  filesForDetection,
  sourceResults,
  configResults,
  detected,
  packageDeclarations,
  sourceSignals,
}) {
  const collector = { technologies: {} };
  const runtimeDeclarations = packageDeclarations?.runtime || {};
  const devDeclarations = packageDeclarations?.dev || {};

  const addDependencyTechnology = (depName, scope, declarationMap) => {
    if (!shouldTrackDependencyTechnology(depName)) return;

    const declaredInFiles = normalizeStringArray(
      declarationMap?.[depName] || [],
    ).slice(0, 4);

    if (!declaredInFiles.length) {
      addTechnologyDetection(collector, depName, {
        source: "dependency",
        scope,
        evidence: `${scope === "dev" ? "devDependency" : "dependency"}:${depName}`,
      });
      return;
    }

    declaredInFiles.forEach((filePath) => {
      addTechnologyDetection(collector, depName, {
        source: "dependency",
        scope,
        evidence: filePath,
      });
    });
  };

  const sourceEvidenceByNode = sourceSignals?.evidenceByNode || {};
  const getNodeEvidenceFiles = (nodeId) => {
    const raw = sourceEvidenceByNode?.[nodeId];
    if (Array.isArray(raw)) return raw;
    if (raw instanceof Set) return Array.from(raw);
    return [];
  };

  Object.keys(allDeps || {}).forEach((dep) => {
    addDependencyTechnology(dep, "runtime", runtimeDeclarations);
  });

  Object.keys(allDevDeps || {}).forEach((dep) => {
    addDependencyTechnology(dep, "dev", devDeclarations);
  });

  const hasTsFiles = (filesForDetection || []).some((path) =>
    /(^|\/)tsconfig(\.[^/]+)?\.json$|\.(ts|tsx)$/i.test(path),
  );
  if (hasTsFiles) {
    addTechnologyDetection(collector, "typescript", {
      source: "file",
      scope: "language",
      evidence: "tsconfig-or-ts-files",
      category: "language",
      color: "#3178C6",
      label: "TypeScript",
    });
  }

  const hasTailwindFiles = (filesForDetection || []).some((path) =>
    /tailwind\.config\.(js|ts|mjs|cjs)$/.test(String(path || "").toLowerCase()),
  );
  if (hasTailwindFiles) {
    addTechnologyDetection(collector, "tailwindcss", {
      source: "file",
      scope: "frontend",
      evidence: "tailwind-config",
      category: "frontend",
      color: "#38BDF8",
      label: "Tailwind CSS",
    });
  }

  [...(sourceResults || []), ...(configResults || [])].forEach((result) => {
    if (result?.technologies) {
      collector.technologies = mergeTechnologyMaps(
        collector.technologies,
        result.technologies,
      );
    }
  });

  const dockerEvidence = (filesForDetection || [])
    .filter((filePath) =>
      /^dockerfile(\.|$)|^docker-compose(\.|$)/i.test(
        String(filePath || "")
          .split("/")
          .pop(),
      ),
    )
    .slice(0, 4);
  const kubernetesEvidence = (filesForDetection || [])
    .filter((filePath) => {
      const p = String(filePath || "").toLowerCase();
      return (
        /(^|\/)(k8s|kubernetes|helm|charts?)\//.test(p) ||
        /(^|\/)(kustomization|chart)\.ya?ml$/.test(p)
      );
    })
    .slice(0, 4);

  if (detected?.docker) {
    const dockerHints = dockerEvidence.length ? dockerEvidence : ["Dockerfile"];
    dockerHints.forEach((evidencePath) => {
      addTechnologyDetection(collector, "docker", {
        source: "detected",
        scope: "runtime",
        category: "container",
        label: "Docker",
        color: "#38BDF8",
        evidence: evidencePath,
      });
    });
  }

  if (detected?.kubernetes) {
    const k8sHints = kubernetesEvidence.length
      ? kubernetesEvidence
      : ["k8s-manifest"];
    k8sHints.forEach((evidencePath) => {
      addTechnologyDetection(collector, "kubernetes", {
        source: "detected",
        scope: "runtime",
        category: "container",
        label: "Kubernetes",
        color: "#326CE5",
        evidence: evidencePath,
      });
    });
  }

  Object.entries(detected || {}).forEach(([key, value]) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return;
    if (key === "technologies") return;
    const techId = value.type || key;
    const category =
      key === "frontend" || key === "backend" || key === "database"
        ? key
        : inferTechnologyCategory(techId);

    const nodeId = DETECTED_KEY_TO_NODE_ID[key];
    const usageEvidence = nodeId
      ? getNodeEvidenceFiles(nodeId).slice(0, 6)
      : [];

    if (!usageEvidence.length) {
      addTechnologyDetection(collector, techId, {
        source: "detected",
        scope: "runtime",
        category,
        label: value.label,
        color: value.color,
        evidence: `${key}:${value.label || value.type || "detected"}`,
      });
      return;
    }

    usageEvidence.forEach((filePath) => {
      addTechnologyDetection(collector, techId, {
        source: "detected",
        scope: "runtime",
        category,
        label: value.label,
        color: value.color,
        evidence: filePath,
      });
    });
  });

  const finalized = {};
  Object.values(collector.technologies || {}).forEach((entry) => {
    const normalized = finalizeTechnologyEntry(entry);
    if (!isStackTechnologyCategory(normalized.category)) return;
    finalized[normalized.id] = normalized;
  });

  return limitTechnologyMap(finalized, ANALYSIS_LIMITS.MAX_TECHNOLOGY_ENTRIES);
}

function createSourceSignals() {
  return {
    authTokenTtls: new Set(),
    authRefresh: false,
    auth2fa: false,
    aiProviders: new Set(),
    aiModes: new Set(),
    aiModels: new Set(),
    evidenceByNode: {
      client: new Set(),
      api: new Set(),
      auth: new Set(),
      db: new Set(),
      cache: new Set(),
      queue: new Set(),
      ai: new Set(),
      email: new Set(),
      storage: new Set(),
      payment: new Set(),
      search: new Set(),
      messaging: new Set(),
      analytics: new Set(),
      monitoring: new Set(),
      externalApi: new Set(),
    },
  };
}

function addNodeEvidence(sourceSignals, nodeId, filePath) {
  if (!sourceSignals || !nodeId || !filePath) return;
  if (!sourceSignals.evidenceByNode[nodeId]) {
    sourceSignals.evidenceByNode[nodeId] = new Set();
  }
  sourceSignals.evidenceByNode[nodeId].add(filePath);
}

function collectSourceSignalsFromContent(content, filePath, sourceSignals) {
  const text = String(content || "");
  const lower = text.toLowerCase();

  const remember = (nodeId) => addNodeEvidence(sourceSignals, nodeId, filePath);

  if (/react|next\.js|vue|angular|svelte|frontend|ui/i.test(lower)) {
    remember("client");
  }

  if (
    /express|fastify|koa|hono|nestjs|api\/|routes?|controllers?|server|backend/i.test(
      lower,
    )
  ) {
    remember("api");
  }

  if (
    /auth|jwt|passport|next-auth|clerk|auth0|lucia|better-auth/i.test(lower)
  ) {
    remember("auth");
  }

  if (
    /postgres|mysql|mongodb|sqlite|prisma|sequelize|typeorm|drizzle|database/i.test(
      lower,
    )
  ) {
    remember("db");
  }

  if (/redis|cache/i.test(lower)) {
    remember("cache");
  }

  if (/bullmq|queue|rabbitmq|kafka|nats|pubsub|sqs/i.test(lower)) {
    remember("queue");
  }

  if (
    /openai|anthropic|claude|gemini|generativelanguage\.googleapis\.com|llm|ai model/i.test(
      lower,
    )
  ) {
    remember("ai");
  }

  if (/stripe|paypal|paddle|razorpay|braintree|adyen/i.test(lower)) {
    remember("payment");
  }

  if (/cloudinary|s3|storage|blob|uploadthing|gcs/i.test(lower)) {
    remember("storage");
  }

  if (/meilisearch|algolia|elasticsearch|opensearch|search/i.test(lower)) {
    remember("search");
  }

  if (/resend|sendgrid|mailgun|postmark|smtp|ses/i.test(lower)) {
    remember("email");
  }

  if (/twilio|slack|discord|pusher|messaging/i.test(lower)) {
    remember("messaging");
  }

  if (/posthog|mixpanel|amplitude|analytics|ga4|plausible/i.test(lower)) {
    remember("analytics");
  }

  if (
    /sentry|datadog|new relic|opentelemetry|prometheus|grafana|monitoring/i.test(
      lower,
    )
  ) {
    remember("monitoring");
  }

  if (
    /openapi|swagger|api\.github\.com|external api|third_party/i.test(lower)
  ) {
    remember("externalApi");
  }

  const ttlMatches = [
    ...text.matchAll(
      /(?:token|jwt|session|access)[^\n]{0,60}(?:ttl|expir(?:y|es?|ation)|max_?age|expiresIn)\s*[:=]\s*['"`]?([0-9]+\s*(?:ms|s|m|h|d|days?|hours?|minutes?)?)/gi,
    ),
  ];
  ttlMatches.forEach((match) => {
    const value = String(match?.[1] || "").trim();
    if (value) sourceSignals.authTokenTtls.add(value);
  });

  if (/refresh[_-]?token|token[_-]?refresh|rotate[_-]?refresh/i.test(lower)) {
    sourceSignals.authRefresh = true;
  }
  if (/\b2fa\b|two[-_ ]factor|\botp\b|totp/i.test(lower)) {
    sourceSignals.auth2fa = true;
  }

  const markAiProvider = (providerLabel) => {
    if (!providerLabel) return;
    sourceSignals.aiProviders.add(providerLabel);
    remember("ai");
  };

  if (
    /generativelanguage\.googleapis\.com|gemini-[\w.-]+|@google\/generative-ai/i.test(
      lower,
    )
  ) {
    markAiProvider("Gemini");
  }
  if (/api\.openai\.com|\bgpt-[\w.-]+|\bopenai\b/i.test(lower)) {
    markAiProvider("OpenAI");
  }
  if (/api\.anthropic\.com|\bclaude-[\w.-]+|@anthropic-ai\/sdk/i.test(lower)) {
    markAiProvider("Anthropic");
  }

  if (
    /fetch\s*\(|axios\.(get|post|put|patch|delete|request)\s*\(/i.test(lower)
  ) {
    if (
      /generativelanguage\.googleapis\.com|api\.openai\.com|api\.anthropic\.com/i.test(
        lower,
      )
    ) {
      sourceSignals.aiModes.add("REST API");
    }
  }

  if (
    /@google\/generative-ai|\bopenai\b|@anthropic-ai\/sdk|\blangchain\b/i.test(
      lower,
    )
  ) {
    sourceSignals.aiModes.add("SDK");
  }

  const modelMatches = [
    ...text.matchAll(/(gemini-[\w.-]+|gpt-[\w.-]+|claude-[\w.-]+)/gi),
  ];
  modelMatches.forEach((match) => {
    const model = String(match?.[1] || "").trim();
    if (model) sourceSignals.aiModels.add(model);
  });
}

function toPlainSignals(sourceSignals) {
  return {
    authTokenTtls: Array.from(sourceSignals.authTokenTtls || []),
    authRefresh: !!sourceSignals.authRefresh,
    auth2fa: !!sourceSignals.auth2fa,
    aiProviders: Array.from(sourceSignals.aiProviders || []),
    aiModes: Array.from(sourceSignals.aiModes || []),
    aiModels: Array.from(sourceSignals.aiModels || []),
    evidenceByNode: Object.fromEntries(
      Object.entries(sourceSignals.evidenceByNode || {}).map(([key, value]) => [
        key,
        Array.from(value || []),
      ]),
    ),
  };
}

// --- DOCKER-COMPOSE PARSER -------------------------------------------------
function parseDockerCompose(content, addLog) {
  const found = {},
    lower = content.toLowerCase();
  const imgs = [...lower.matchAll(/image:\s*["']?([^\s"'\n]+)/g)];
  imgs.forEach((m) => {
    const img = m[1].split(":")[0];
    if (/redis/.test(img)) {
      found.redis = true;
      addLog("detect", "docker-compose: Redis");
    }
    if (/mongo/.test(img)) {
      found.mongodb = true;
      addLog("detect", "docker-compose: MongoDB");
    }
    if (/postgres/.test(img)) {
      found.postgresql = true;
      addLog("detect", "docker-compose: PostgreSQL");
    }
    if (/mysql|mariadb/.test(img)) {
      found.mysql = true;
      addLog("detect", "docker-compose: MySQL/MariaDB");
    }
    if (/rabbitmq/.test(img)) {
      found.rabbitmq = true;
      addLog("detect", "docker-compose: RabbitMQ");
    }
    if (/kafka|zookeeper/.test(img)) {
      found.kafka = true;
      addLog("detect", "docker-compose: Kafka");
    }
    if (/elasticsearch/.test(img)) {
      found.elasticsearch = true;
      addLog("detect", "docker-compose: Elasticsearch");
    }
    if (/nginx/.test(img)) {
      found.nginx = true;
      addLog("detect", "docker-compose: Nginx");
    }
  });
  // Service name hints
  [...lower.matchAll(/^\s{0,4}([a-z][a-z0-9_-]+):\s*$/gm)].forEach((m) => {
    const s = m[1];
    if (/^redis/.test(s)) found.redis = true;
    if (/^mongo/.test(s)) found.mongodb = true;
    if (/^postgres/.test(s)) found.postgresql = true;
    if (/^mysql/.test(s)) found.mysql = true;
    if (/^rabbit/.test(s)) found.rabbitmq = true;
    if (/^kafka/.test(s)) found.kafka = true;
  });
  // Env var hints
  if (/redis_url|redis_host/.test(lower)) found.redis = true;
  if (/mongo_url|mongodb_uri/.test(lower)) found.mongodb = true;
  if (/postgres_url|database_url.*postgres/.test(lower))
    found.postgresql = true;
  if (/mysql_host|mysql_database/.test(lower)) found.mysql = true;
  return found;
}

// --- SOURCE FILE IMPORT SCANNER --------------------------------------------
// Scans actual source file content for import/require statements
// Used when a backend exists (folder present) but has no package.json
function detectFromSourceContent(content, filePath, addLog) {
  const found = {};

  // Normalize: handle both import/require patterns
  const escapeRegExp = (value) =>
    String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const hasImport = (...patterns) =>
    patterns.some((p) => {
      const escaped = escapeRegExp(p);
      const re = new RegExp(
        `(?:from\\s*['"\`]|require\\s*\\(\\s*['"\`])${escaped}`,
        "i",
      );
      return re.test(content);
    });

  const isDocLikeFile = /\.(md|txt|rst|adoc)$/i.test(filePath);
  const hasAbsoluteExternalCall =
    /(axios\.(get|post|put|patch|delete|request)\s*\(\s*['"`]https?:\/\/|fetch\(\s*['"`]https?:\/\/|baseURL\s*:\s*['"`]https?:\/\/|EXTERNAL_API|THIRD_PARTY|API_BASE_URL|API_URL)/i.test(
      content,
    );
  const lowerPath = String(filePath || "").toLowerCase();
  const isAnalyzerRuleFile =
    /function\s+detectFromSourceContent\s*\(|function\s+detectFromDeps\s*\(/i.test(
      content,
    );
  const skipBroadServiceRegex =
    isAnalyzerRuleFile ||
    /(^|\/)(src\/features\/analyzer\/engine\.(mjs|js|ts)|scripts\/run-repo-benchmark\.cjs)$/i.test(
      lowerPath,
    );

  const hasSearchRuntimeSignal =
    /(import\s.+from\s+['"`].*(meilisearch|algoliasearch|@elastic\/elasticsearch|@opensearch-project\/opensearch)|require\(\s*['"`].*(meilisearch|algoliasearch|@elastic\/elasticsearch|@opensearch-project\/opensearch)|process\.env\.[A-Z0-9_]*(MEILI|ALGOLIA|ELASTIC|OPENSEARCH)|https?:\/\/[^'"`\s]*(meili|algolia|elastic|opensearch))/i.test(
      content,
    );
  const hasPaymentRuntimeSignal =
    /(import\s.+from\s+['"`].*(stripe|paypal|lemonsqueezy|paddle|braintree|razorpay|adyen)|require\(\s*['"`].*(stripe|paypal|lemonsqueezy|paddle|braintree|razorpay|adyen)|process\.env\.[A-Z0-9_]*(STRIPE|PAYPAL|PADDLE|BRAINTREE|RAZORPAY|ADYEN)|https?:\/\/[^'"`\s]*(stripe|paypal|lemonsqueezy|paddle|braintree|razorpay|adyen))/i.test(
      content,
    );
  const hasStorageRuntimeSignal =
    /(import\s.+from\s+['"`].*(cloudinary|@aws-sdk\/client-s3|@google-cloud\/storage|@azure\/storage-blob|uploadthing)|require\(\s*['"`].*(cloudinary|@aws-sdk\/client-s3|@google-cloud\/storage|@azure\/storage-blob|uploadthing)|process\.env\.[A-Z0-9_]*(CLOUDINARY|S3|BLOB|STORAGE)|https?:\/\/[^'"`\s]*(cloudinary|s3|storage\.googleapis\.com|blob\.core\.windows\.net))/i.test(
      content,
    );
  const hasEmailRuntimeSignal =
    /(import\s.+from\s+['"`].*(resend|sendgrid|mailgun|postmark|nodemailer)|require\(\s*['"`].*(resend|sendgrid|mailgun|postmark|nodemailer)|process\.env\.[A-Z0-9_]*(RESEND|SENDGRID|MAILGUN|POSTMARK|SMTP|SES)|smtp:\/\/|https?:\/\/[^'"`\s]*(resend|sendgrid|mailgun|postmark))/i.test(
      content,
    );
  const hasMessagingRuntimeSignal =
    /(import\s.+from\s+['"`].*(twilio|@slack\/web-api|discord\.js|pusher|amqplib|kafkajs|nats|socket\.io)|require\(\s*['"`].*(twilio|@slack\/web-api|discord\.js|pusher|amqplib|kafkajs|nats|socket\.io)|process\.env\.[A-Z0-9_]*(TWILIO|SLACK|DISCORD|PUSHER|RABBITMQ|KAFKA|NATS)|amqp:\/\/|kafka:\/\/)/i.test(
      content,
    );

  if (/\.(ts|tsx)$/.test(lowerPath)) {
    addTechnologyDetection(found, "typescript", {
      source: "file",
      scope: "language",
      category: "language",
      color: "#3178C6",
      label: "TypeScript",
      evidence: filePath,
    });
  }

  // Backend frameworks
  if (
    hasImport("@trpc/server") ||
    /\binittrpc\b|createtrpcrouter|\btrpc\.router\b|\bt\.router\(/i.test(
      content,
    )
  ) {
    found.backend = { type: "trpc", label: "tRPC Server", color: "#398CCB" };
    addLog("detect", `[${filePath}] trpc backend`);
  } else if (hasImport("express")) {
    found.backend = { type: "express", label: "Express API", color: "#68D391" };
    addLog("detect", `[${filePath}] import express`);
  }
  if (hasImport("@nestjs/core", "@nestjs/common")) {
    found.backend = { type: "nest", label: "NestJS API", color: "#E0234E" };
    addLog("detect", `[${filePath}] nestjs`);
  }
  if (hasImport("fastify")) {
    found.backend = { type: "fastify", label: "Fastify API", color: "#808080" };
    addLog("detect", `[${filePath}] fastify`);
  }
  if (hasImport("koa")) {
    found.backend = { type: "koa", label: "Koa API", color: "#33333D" };
    addLog("detect", `[${filePath}] koa`);
  }
  if (hasImport("hono")) {
    found.backend = { type: "hono", label: "Hono API", color: "#E36002" };
    addLog("detect", `[${filePath}] hono`);
  }
  if (
    !isDocLikeFile &&
    !found.backend &&
    /(from|require)\s*['"`]node:(fs|path|url|http|https|stream|crypto)/i.test(
      content,
    )
  ) {
    found.backend = {
      type: "node",
      label: "Node.js Service",
      color: "#68D391",
    };
    addLog("detect", `[${filePath}] node:* runtime modules`);
  }
  if (
    !isDocLikeFile &&
    !found.backend &&
    /analyzegithubrepo|analyzeziparchive|ghfetch|api\.github\.com\/repos/i.test(
      content,
    )
  ) {
    found.backend = {
      type: "node",
      label: "Node.js Service",
      color: "#68D391",
    };
    addLog("detect", `[${filePath}] analysis engine backend signals`);
  }

  // Database drivers/ORMs
  if (hasImport("sequelize", "sequelize-typescript")) {
    found.orm = { type: "sequelize", label: "Sequelize" };
    addLog("detect", `[${filePath}] sequelize`);
  }
  if (hasImport("typeorm", "@typeorm")) {
    found.orm = { type: "typeorm", label: "TypeORM" };
    addLog("detect", `[${filePath}] typeorm`);
  }
  if (hasImport("prisma/@prisma", "@prisma/client")) {
    found.orm = { type: "prisma", label: "Prisma" };
    addLog("detect", `[${filePath}] prisma`);
  }
  if (hasImport("drizzle-orm")) {
    found.orm = { type: "drizzle", label: "Drizzle" };
    addLog("detect", `[${filePath}] drizzle-orm`);
  }
  if (hasImport("mongoose")) {
    found.database = { type: "mongodb", label: "MongoDB", color: "#4DB33D" };
    addLog("detect", `[${filePath}] mongoose -> MongoDB`);
  }
  if (hasImport("mysql2", "mysql")) {
    found.database = { type: "mysql", label: "MySQL", color: "#F29111" };
    addLog("detect", `[${filePath}] mysql2 -> MySQL`);
  }
  if (hasImport("pg", "postgres", "postgresql", "slonik")) {
    found.database = {
      type: "postgresql",
      label: "PostgreSQL",
      color: "#336791",
    };
    addLog("detect", `[${filePath}] pg -> PostgreSQL`);
  }
  if (hasImport("better-sqlite3", "sqlite3")) {
    found.database = { type: "sqlite", label: "SQLite", color: "#0F80CC" };
    addLog("detect", `[${filePath}] sqlite`);
  }
  if (hasImport("ioredis", "redis")) {
    found.cache = { type: "redis", label: "Redis Cache", color: "#D82C20" };
    addLog("detect", `[${filePath}] redis`);
  }
  if (hasImport("firebase", "firebase-admin", "@firebase/app")) {
    found.firebase = {
      type: "firebase",
      label: "Firebase",
      color: "#FF6D00",
    };
    addLog("detect", `[${filePath}] firebase`);
  }
  if (hasImport("@supabase/supabase-js")) {
    found.database = { type: "supabase", label: "Supabase", color: "#3ECF8E" };
    addLog("detect", `[${filePath}] supabase`);
  }

  if (/schema\.prisma$/i.test(lowerPath)) {
    const providerMatch = content.match(
      /provider\s*=\s*["'](postgresql|postgres|mysql|sqlite|mongodb|cockroachdb|sqlserver)["']/i,
    );
    const provider = normalizeTechnologyId(providerMatch?.[1] || "");
    if (provider) {
      const providerMap = {
        postgresql: {
          type: "postgresql",
          label: "PostgreSQL",
          color: "#336791",
        },
        postgres: {
          type: "postgresql",
          label: "PostgreSQL",
          color: "#336791",
        },
        mysql: { type: "mysql", label: "MySQL", color: "#F29111" },
        sqlite: { type: "sqlite", label: "SQLite", color: "#0F80CC" },
        mongodb: { type: "mongodb", label: "MongoDB", color: "#4DB33D" },
        cockroachdb: {
          type: "cockroachdb",
          label: "CockroachDB",
          color: "#00B4D8",
        },
        sqlserver: {
          type: "sqlserver",
          label: "SQL Server",
          color: "#CC2927",
        },
      };

      if (providerMap[provider]) {
        found.database = providerMap[provider];
        addLog("detect", `[${filePath}] prisma provider -> ${provider}`);
      }
    }
  }

  // Auth
  if (hasImport("passport")) {
    found.auth = { type: "passport", label: "Passport.js", color: "#35DF79" };
    addLog("detect", `[${filePath}] passport`);
  }
  if (hasImport("jsonwebtoken", "jose")) {
    found.auth = { type: "jwt", label: "JWT Auth", color: "#F6AD55" };
    addLog("detect", `[${filePath}] jsonwebtoken`);
  }
  if (hasImport("next-auth", "@auth/core")) {
    found.auth = { type: "nextauth", label: "NextAuth.js", color: "#6C47FF" };
    addLog("detect", `[${filePath}] next-auth`);
  }
  if (hasImport("@clerk/")) {
    found.auth = { type: "clerk", label: "Clerk Auth", color: "#6C47FF" };
    addLog("detect", `[${filePath}] clerk`);
  }
  if (
    !found.auth &&
    /CLERK_(PUBLISHABLE|SECRET)_KEY|NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY|clerk\.com/i.test(
      content,
    )
  ) {
    found.auth = { type: "clerk", label: "Clerk Auth", color: "#6C47FF" };
    addLog("detect", `[${filePath}] clerk env/domain signals`);
  }
  if (hasImport("express-openid-connect", "@auth0/")) {
    found.auth = { type: "auth0", label: "Auth0", color: "#EB5424" };
    addLog("detect", `[${filePath}] auth0`);
  }

  // AI
  if (hasImport("openai")) {
    found.ai = { type: "openai", label: "OpenAI API", color: "#74AA9C" };
    addLog("detect", `[${filePath}] openai`);
  }
  if (hasImport("@anthropic-ai/sdk")) {
    found.ai = { type: "anthropic", label: "Anthropic API", color: "#C49A6C" };
    addLog("detect", `[${filePath}] anthropic`);
  }
  if (hasImport("@google/generative-ai")) {
    found.ai = { type: "google", label: "Gemini API", color: "#4285F4" };
    addLog("detect", `[${filePath}] gemini`);
  }

  const hasNearbyHttpClientCall = (hostPattern) =>
    new RegExp(
      `(fetch\\s*\\(|axios\\.(get|post|put|patch|delete|request)\\s*\\()[\\s\\S]{0,260}${hostPattern}|${hostPattern}[\\s\\S]{0,260}(fetch\\s*\\(|axios\\.(get|post|put|patch|delete|request)\\s*\\()`,
      "i",
    ).test(content);

  const hasGeminiRestCall = hasNearbyHttpClientCall(
    "generativelanguage\\.googleapis\\.com",
  );
  const hasOpenAiRestCall = hasNearbyHttpClientCall("api\\.openai\\.com\\/v1");
  const hasAnthropicRestCall = hasNearbyHttpClientCall(
    "api\\.anthropic\\.com\\/v1",
  );

  if (!isDocLikeFile && !found.ai) {
    if (hasGeminiRestCall) {
      found.ai = { type: "google", label: "Gemini API", color: "#4285F4" };
      addLog("detect", `[${filePath}] Gemini REST endpoint`);
    } else if (hasOpenAiRestCall) {
      found.ai = { type: "openai", label: "OpenAI API", color: "#74AA9C" };
      addLog("detect", `[${filePath}] OpenAI REST endpoint`);
    } else if (hasAnthropicRestCall) {
      found.ai = {
        type: "anthropic",
        label: "Anthropic API",
        color: "#C49A6C",
      };
      addLog("detect", `[${filePath}] Anthropic REST endpoint`);
    }
  }

  if (!isDocLikeFile && !found.ai) {
    if (/gemini-[\w.-]+|@google\/generative-ai/i.test(content)) {
      found.ai = { type: "google", label: "Gemini API", color: "#4285F4" };
      addLog("detect", `[${filePath}] gemini model/sdk hints`);
    } else if (/\bgpt-[\w.-]+\b|\bopenai\b/i.test(content)) {
      found.ai = { type: "openai", label: "OpenAI API", color: "#74AA9C" };
      addLog("detect", `[${filePath}] openai model/sdk hints`);
    } else if (/\bclaude-[\w.-]+\b|@anthropic-ai\/sdk/i.test(content)) {
      found.ai = {
        type: "anthropic",
        label: "Anthropic API",
        color: "#C49A6C",
      };
      addLog("detect", `[${filePath}] anthropic model/sdk hints`);
    }
  }

  if (
    isAnalyzerRuleFile &&
    /gemini-[\w.-]+|GEMINI_API_KEY|REACT_APP_GEMINI_API_KEY|generativelanguage\.googleapis\.com/i.test(
      content,
    )
  ) {
    found.ai = { type: "google", label: "Gemini API", color: "#4285F4" };
    addLog(
      "detect",
      `[${filePath}] analyzer-rule file: prefer Gemini provider`,
    );
  }

  // Look for DB connection strings in content
  if (
    !isDocLikeFile &&
    !skipBroadServiceRegex &&
    /(mysql:\/\/[^\s'"`]+|process\.env\.[A-Z0-9_]*(MYSQL|DB_HOST|DB_NAME))/i.test(
      content,
    )
  ) {
    if (!found.database)
      found.database = { type: "mysql", label: "MySQL", color: "#F29111" };
  }
  if (
    !isDocLikeFile &&
    !skipBroadServiceRegex &&
    /(mongodb:\/\/[^\s'"`]+|process\.env\.[A-Z0-9_]*(MONGO|MONGODB))/i.test(
      content,
    )
  ) {
    if (!found.database)
      found.database = { type: "mongodb", label: "MongoDB", color: "#4DB33D" };
  }
  if (
    !isDocLikeFile &&
    !skipBroadServiceRegex &&
    /(redis:\/\/[^\s'"`]+|process\.env\.[A-Z0-9_]*REDIS)/i.test(content)
  ) {
    if (!found.cache)
      found.cache = { type: "redis", label: "Redis Cache", color: "#D82C20" };
  }
  if (
    !isDocLikeFile &&
    !skipBroadServiceRegex &&
    /(postgresql?:\/\/[^\s'"`]+|process\.env\.[A-Z0-9_]*(POSTGRES|DATABASE_URL|DB_URL))/i.test(
      content,
    )
  ) {
    if (!found.database)
      found.database = {
        type: "postgresql",
        label: "PostgreSQL",
        color: "#336791",
      };
  }

  if (
    !isDocLikeFile &&
    /tailwindcss|@tailwind\s+(base|components|utilities)|tailwind\.config\.(js|ts|mjs|cjs)|class(name)?\s*=\s*['"`][^'"`]*(bg-|text-|border-|p-|m-|flex|grid)/i.test(
      content,
    )
  ) {
    addTechnologyDetection(found, "tailwindcss", {
      source: "file",
      scope: "frontend",
      category: "frontend",
      label: "Tailwind CSS",
      color: "#38BDF8",
      evidence: filePath,
    });
    addLog("detect", `[${filePath}] tailwind usage signals`);
  }

  // Cross-language framework and service signals from code/docs/config text
  if (!isDocLikeFile && !found.frontend) {
    if (/next\.js|app router|getserverSideProps|next\/config/i.test(content)) {
      found.frontend = { type: "next", label: "Next.js", color: "#E2E8F0" };
    } else if (/nuxt|nitro\.config|nuxt\.config/i.test(content)) {
      found.frontend = { type: "nuxt", label: "Nuxt.js", color: "#00DC82" };
    } else if (/sveltekit|@sveltejs\/kit/i.test(content)) {
      found.frontend = {
        type: "sveltekit",
        label: "SvelteKit",
        color: "#FF3E00",
      };
    }
  }

  if (!isDocLikeFile && !found.backend) {
    if (/fastapi|uvicorn|starlette|gunicorn/i.test(content)) {
      found.backend = {
        type: "fastapi",
        label: "FastAPI Service",
        color: "#009688",
      };
    } else if (/django|wsgi\.py|asgi\.py/i.test(content)) {
      found.backend = {
        type: "django",
        label: "Django Service",
        color: "#1B5E20",
      };
    } else if (/flask|quart/i.test(content)) {
      found.backend = {
        type: "flask",
        label: "Flask Service",
        color: "#424242",
      };
    } else if (
      /spring boot|springframework|@springbootapplication/i.test(content)
    ) {
      found.backend = {
        type: "spring",
        label: "Spring Boot Service",
        color: "#6DB33F",
      };
    } else if (/gin-gonic|fiber\.new\(|echo\.new\(/i.test(content)) {
      found.backend = {
        type: "go",
        label: "Go Service",
        color: "#00ADD8",
      };
    } else if (/actix-web|tokio|rocket::/i.test(content)) {
      found.backend = {
        type: "rust",
        label: "Rust Service",
        color: "#DEA584",
      };
    }
  }

  if (!isDocLikeFile && !skipBroadServiceRegex && !found.database) {
    if (/cockroachdb|cockroach/i.test(content)) {
      found.database = {
        type: "cockroachdb",
        label: "CockroachDB",
        color: "#00B4D8",
      };
    } else if (/dynamodb|aws.*dynamo/i.test(content)) {
      found.database = {
        type: "dynamodb",
        label: "DynamoDB",
        color: "#4053D6",
      };
    } else if (/firestore|google cloud firestore/i.test(content)) {
      found.database = {
        type: "firestore",
        label: "Firestore",
        color: "#FF6D00",
      };
    } else if (/cosmos ?db|azure cosmos/i.test(content)) {
      found.database = {
        type: "cosmosdb",
        label: "Azure Cosmos DB",
        color: "#0078D4",
      };
    } else if (/cassandra|scylladb/i.test(content)) {
      found.database = {
        type: "cassandra",
        label: "Cassandra",
        color: "#1287B1",
      };
    } else if (/neo4j/i.test(content)) {
      found.database = { type: "neo4j", label: "Neo4j", color: "#4581C3" };
    }
  }

  if (
    !isDocLikeFile &&
    !skipBroadServiceRegex &&
    !found.search &&
    hasSearchRuntimeSignal
  ) {
    found.search = {
      type: "search",
      label: /meilisearch/i.test(content)
        ? "Meilisearch"
        : /algolia/i.test(content)
          ? "Algolia"
          : /opensearch/i.test(content)
            ? "OpenSearch"
            : "Elasticsearch",
      color: "#2EC4B6",
    };
  }

  if (
    !isDocLikeFile &&
    !skipBroadServiceRegex &&
    !found.payment &&
    hasPaymentRuntimeSignal
  ) {
    found.payment = {
      label: /paypal/i.test(content)
        ? "PayPal"
        : /paddle/i.test(content)
          ? "Paddle"
          : /lemonsqueezy/i.test(content)
            ? "Lemon Squeezy"
            : "Stripe",
      color: "#635BFF",
    };
  }

  if (
    !isDocLikeFile &&
    !skipBroadServiceRegex &&
    !found.storage &&
    hasStorageRuntimeSignal
  ) {
    found.storage = {
      label: /cloudinary/i.test(content)
        ? "Cloudinary"
        : /azure blob/i.test(content)
          ? "Azure Blob Storage"
          : /google cloud storage/i.test(content)
            ? "Google Cloud Storage"
            : "Object Storage",
      color: "#FF9900",
    };
  }

  if (
    !isDocLikeFile &&
    !skipBroadServiceRegex &&
    !found.email &&
    hasEmailRuntimeSignal
  ) {
    found.email = {
      label: /resend/i.test(content)
        ? "Resend"
        : /sendgrid/i.test(content)
          ? "SendGrid"
          : /postmark/i.test(content)
            ? "Postmark"
            : "Email Service",
      color: "#63B3ED",
    };
  }

  if (
    !isDocLikeFile &&
    !skipBroadServiceRegex &&
    !found.messaging &&
    hasMessagingRuntimeSignal
  ) {
    found.messaging = {
      type: "messaging",
      label: /twilio/i.test(content)
        ? "Twilio"
        : /rabbitmq/i.test(content)
          ? "RabbitMQ"
          : /kafka/i.test(content)
            ? "Kafka"
            : /nats/i.test(content)
              ? "NATS"
              : "Messaging API",
      color: "#F59E0B",
    };
  }

  if (
    !isDocLikeFile &&
    !found.analytics &&
    /posthog|mixpanel|amplitude|google analytics|ga4|plausible/i.test(content)
  ) {
    found.analytics = {
      type: "analytics",
      label: /posthog/i.test(content)
        ? "PostHog"
        : /mixpanel/i.test(content)
          ? "Mixpanel"
          : /amplitude/i.test(content)
            ? "Amplitude"
            : "Analytics",
      color: "#7C3AED",
    };
  }

  if (
    !isDocLikeFile &&
    !found.monitoring &&
    /sentry|datadog|new relic|opentelemetry|prometheus|grafana/i.test(content)
  ) {
    found.monitoring = {
      type: "monitoring",
      label: /sentry/i.test(content)
        ? "Sentry"
        : /datadog/i.test(content)
          ? "Datadog"
          : /grafana/i.test(content)
            ? "Grafana"
            : "Monitoring",
      color: "#EF4444",
    };
  }

  const hasGenericExternalClient =
    /axios|fetch\(|graphql-request|apollo client|@apollo\/client/i.test(
      content,
    );
  const hasContractClientSignal = /openapi|swagger/i.test(content);
  const hasSpecializedServiceSignal = Boolean(
    found.ai ||
    found.email ||
    found.storage ||
    found.payment ||
    found.search ||
    found.messaging ||
    found.analytics ||
    found.monitoring,
  );

  if (
    !found.externalApi &&
    !isDocLikeFile &&
    !hasSpecializedServiceSignal &&
    (hasContractClientSignal ||
      (hasGenericExternalClient && hasAbsoluteExternalCall))
  ) {
    found.externalApi = {
      type: "external-api",
      label: "External API Integrations",
      color: "#38BDF8",
    };
  }

  return found;
}

// --- CONFIG FILE SCANNER ---------------------------------------------------
// Checks for ORM config files, prisma schema, etc - no package.json needed
function detectFromConfigFilename(filePath, addLog) {
  const f = filePath.toLowerCase();
  const found = {};
  if (/tsconfig(\.[^/]+)?\.json$/.test(f)) {
    addTechnologyDetection(found, "typescript", {
      source: "file",
      scope: "language",
      category: "language",
      color: "#3178C6",
      label: "TypeScript",
      evidence: filePath,
    });
    addLog("detect", `Config file: ${filePath} -> TypeScript`);
  }
  if (/\.sequelizerc$|sequelize\.config\.(js|ts|json)$/.test(f)) {
    found.orm = { type: "sequelize", label: "Sequelize" };
    addLog("detect", `Config file: ${filePath} -> Sequelize`);
  }
  if (/ormconfig\.(json|js|ts|yml|yaml)$/.test(f)) {
    found.orm = { type: "typeorm", label: "TypeORM" };
    addLog("detect", `Config file: ${filePath} -> TypeORM`);
  }
  if (/prisma\/schema\.prisma$/.test(f)) {
    found.orm = { type: "prisma", label: "Prisma" };
    addLog("detect", `Config file: ${filePath} -> Prisma schema`);
  }
  if (/drizzle\.config\.(ts|js)$/.test(f)) {
    found.orm = { type: "drizzle", label: "Drizzle" };
    addLog("detect", `Config file: ${filePath} -> Drizzle`);
  }
  if (/knexfile\.(ts|js)$/.test(f)) {
    found.orm = { type: "knex", label: "Knex.js" };
    addLog("detect", `Config file: ${filePath} -> Knex`);
  }
  if (/firebase\.(json|rc)$|\.firebaserc$/.test(f)) {
    found.firebase = {
      type: "firebase",
      label: "Firebase",
      color: "#FF6D00",
    };
    addLog("detect", `Config file: ${filePath} -> Firebase`);
  }
  if (/mongoose\.config|mongo\.config/.test(f)) {
    found.database = { type: "mongodb", label: "MongoDB", color: "#4DB33D" };
    addLog("detect", `Config file: ${filePath} -> MongoDB`);
  }
  if (/go\.mod$/.test(f)) {
    found.backend = { type: "go", label: "Go Service", color: "#00ADD8" };
    addLog("detect", `Config file: ${filePath} -> Go backend`);
  }
  if (
    /requirements(\.dev)?\.txt$|pyproject\.toml$|poetry\.lock$|pipfile$/i.test(
      f,
    )
  ) {
    found.backend = {
      type: "python",
      label: "Python Service",
      color: "#3776AB",
    };
    addLog("detect", `Config file: ${filePath} -> Python backend`);
  }
  if (/cargo\.toml$/.test(f)) {
    found.backend = { type: "rust", label: "Rust Service", color: "#DEA584" };
    addLog("detect", `Config file: ${filePath} -> Rust backend`);
  }
  if (/pom\.xml$|build\.gradle$|build\.gradle\.kts$/i.test(f)) {
    found.backend = {
      type: "java",
      label: "Java Service",
      color: "#EA2D2E",
    };
    addLog("detect", `Config file: ${filePath} -> Java backend`);
  }
  if (/\.csproj$|\.sln$/.test(f)) {
    found.backend = { type: "dotnet", label: ".NET Service", color: "#512BD4" };
    addLog("detect", `Config file: ${filePath} -> .NET backend`);
  }
  if (/composer\.json$/.test(f)) {
    found.backend = { type: "php", label: "PHP Service", color: "#777BB4" };
    addLog("detect", `Config file: ${filePath} -> PHP backend`);
  }
  if (/dockerfile$|docker-compose(\.\w+)?\.ya?ml$/.test(f)) {
    found.docker = true;
  }
  if (
    /(^|\/)(k8s|kubernetes|helm|charts?)\//.test(f) ||
    /(^|\/)(kustomization|chart)\.ya?ml$/.test(f)
  ) {
    found.kubernetes = true;
  }
  if (/tailwind\.config\.(js|ts|mjs|cjs)$/.test(f)) {
    addTechnologyDetection(found, "tailwindcss", {
      source: "file",
      scope: "frontend",
      category: "frontend",
      label: "Tailwind CSS",
      color: "#38BDF8",
      evidence: filePath,
    });
    addLog("detect", `Config file: ${filePath} -> Tailwind`);
  }
  if (/vercel\.json$|netlify\.toml$/.test(f)) {
    found.frontend = {
      type: "frontend-hosted",
      label: "Frontend App",
      color: "#61DAFB",
    };
  }
  return found;
}

// --- DETECT FROM SINGLE DEPS OBJECT ---------------------------------------
function detectFromDeps(deps, devDeps, context, addLog) {
  const all = { ...deps, ...devDeps };
  const has = (...libs) => libs.find((l) => all[l]);
  const det = {};

  Object.keys(deps || {}).forEach((depName) => {
    addTechnologyDetection(det, depName, {
      source: "dependency",
      scope: "runtime",
      evidence: `${context}:dep:${depName}`,
    });
  });

  Object.keys(devDeps || {}).forEach((depName) => {
    addTechnologyDetection(det, depName, {
      source: "dependency",
      scope: "dev",
      evidence: `${context}:devDep:${depName}`,
    });
  });

  // Frontend
  if (has("next")) {
    det.frontend = {
      type: "next",
      lib: "next",
      ver: all["next"],
      label: "Next.js",
      color: "#E2E8F0",
    };
    addLog("detect", `[${context}] next@${all["next"] || "?"}`);
  } else if (has("@remix-run/react")) {
    det.frontend = { type: "remix", label: "Remix", color: "#E8F4FF" };
    addLog("detect", `[${context}] remix`);
  } else if (has("nuxt", "@nuxt/core")) {
    det.frontend = { type: "nuxt", label: "Nuxt.js", color: "#00DC82" };
    addLog("detect", `[${context}] nuxt`);
  } else if (has("@sveltejs/kit")) {
    det.frontend = {
      type: "sveltekit",
      label: "SvelteKit",
      color: "#FF3E00",
    };
    addLog("detect", `[${context}] sveltekit`);
  } else if (has("react", "react-dom")) {
    det.frontend = {
      type: "react",
      lib: "react",
      ver: all["react"],
      label: "React Client",
      color: "#61DAFB",
    };
    addLog("detect", `[${context}] react@${all["react"] || "?"}`);
  } else if (has("vue", "@vue/core")) {
    det.frontend = { type: "vue", label: "Vue Client", color: "#42B883" };
    addLog("detect", `[${context}] vue`);
  } else if (has("@angular/core")) {
    det.frontend = { type: "angular", label: "Angular App", color: "#DD0031" };
    addLog("detect", `[${context}] angular`);
  } else if (has("solid-js", "@solidjs/router")) {
    det.frontend = { type: "solid", label: "SolidJS App", color: "#2C4F7C" };
    addLog("detect", `[${context}] solid-js`);
  } else if (has("preact")) {
    det.frontend = { type: "preact", label: "Preact App", color: "#673AB8" };
    addLog("detect", `[${context}] preact`);
  } else if (has("@builder.io/qwik")) {
    det.frontend = { type: "qwik", label: "Qwik App", color: "#AC7EF4" };
    addLog("detect", `[${context}] qwik`);
  } else if (has("svelte")) {
    det.frontend = { type: "svelte", label: "Svelte App", color: "#FF3E00" };
    addLog("detect", `[${context}] svelte`);
  } else if (has("astro")) {
    det.frontend = { type: "astro", label: "Astro Site", color: "#FF5D01" };
    addLog("detect", `[${context}] astro`);
  }

  // Backend - only if not fullstack
  const trpcServerLib = has("@trpc/server");

  if (trpcServerLib) {
    det.backend = { type: "trpc", label: "tRPC Server", color: "#398CCB" };
    addLog("detect", `[${context}] ${trpcServerLib} -> tRPC backend`);
  }

  if (
    !det.backend &&
    !["next", "remix", "nuxt", "sveltekit"].includes(det.frontend?.type)
  ) {
    if (has("@nestjs/core")) {
      det.backend = {
        type: "nest",
        lib: "@nestjs/core",
        label: "NestJS API",
        color: "#E0234E",
      };
      addLog("detect", `[${context}] nestjs`);
    } else if (has("express")) {
      det.backend = {
        type: "express",
        lib: "express",
        ver: all["express"],
        label: "Express API",
        color: "#68D391",
      };
      addLog("detect", `[${context}] express@${all["express"] || "?"}`);
    } else if (has("fastify")) {
      det.backend = { type: "fastify", label: "Fastify API", color: "#808080" };
      addLog("detect", `[${context}] fastify`);
    } else if (has("koa")) {
      det.backend = { type: "koa", label: "Koa API", color: "#33333D" };
      addLog("detect", `[${context}] koa`);
    } else if (has("hono")) {
      det.backend = { type: "hono", label: "Hono API", color: "#E36002" };
      addLog("detect", `[${context}] hono`);
    } else if (has("@hapi/hapi")) {
      det.backend = { type: "hapi", label: "Hapi API", color: "#263238" };
      addLog("detect", `[${context}] hapi`);
    } else if (has("elysia")) {
      det.backend = { type: "elysia", label: "Elysia API", color: "#B966E7" };
      addLog("detect", `[${context}] elysia`);
    } else if (has("@adonisjs/core")) {
      det.backend = {
        type: "adonis",
        label: "AdonisJS API",
        color: "#5A45FF",
      };
      addLog("detect", `[${context}] adonisjs`);
    } else if (has("meteor")) {
      det.backend = {
        type: "meteor",
        label: "Meteor App",
        color: "#DE4F4F",
      };
      addLog("detect", `[${context}] meteor`);
    }
  }

  // Database
  if (has("@supabase/supabase-js")) {
    det.database = { type: "supabase", label: "Supabase", color: "#3ECF8E" };
    addLog("detect", `[${context}] supabase`);
  } else if (has("@google-cloud/firestore")) {
    det.database = { type: "firestore", label: "Firestore", color: "#FF6D00" };
    addLog("detect", `[${context}] firestore`);
  } else if (has("@aws-sdk/client-dynamodb", "dynamodb-toolbox")) {
    det.database = { type: "dynamodb", label: "DynamoDB", color: "#4053D6" };
    addLog("detect", `[${context}] dynamodb`);
  } else if (has("@azure/cosmos")) {
    det.database = {
      type: "cosmosdb",
      label: "Azure Cosmos DB",
      color: "#0078D4",
    };
    addLog("detect", `[${context}] cosmosdb`);
  } else if (has("@neondatabase/serverless")) {
    det.database = { type: "neon", label: "Neon DB", color: "#00E5BF" };
    addLog("detect", `[${context}] neon`);
  } else if (has("mongoose", "mongodb")) {
    const l = has("mongoose", "mongodb");
    det.database = { type: "mongodb", label: "MongoDB", color: "#4DB33D" };
    addLog("detect", `[${context}] ${l} -> MongoDB`);
  } else if (has("mysql2", "mysql")) {
    det.database = { type: "mysql", label: "MySQL", color: "#F29111" };
    addLog("detect", `[${context}] mysql`);
  } else if (has("better-sqlite3", "sqlite3")) {
    det.database = { type: "sqlite", label: "SQLite", color: "#0F80CC" };
    addLog("detect", `[${context}] sqlite`);
  } else if (has("@libsql/client")) {
    det.database = { type: "turso", label: "Turso", color: "#4FF8D2" };
    addLog("detect", `[${context}] turso`);
  } else if (has("@planetscale/database")) {
    det.database = {
      type: "planetscale",
      label: "PlanetScale",
      color: "#F8F8F8",
    };
    addLog("detect", `[${context}] planetscale`);
  } else if (has("cassandra-driver", "scylladb")) {
    det.database = { type: "cassandra", label: "Cassandra", color: "#1287B1" };
    addLog("detect", `[${context}] cassandra`);
  } else if (has("neo4j-driver")) {
    det.database = { type: "neo4j", label: "Neo4j", color: "#4581C3" };
    addLog("detect", `[${context}] neo4j`);
  } else if (has("surrealdb.js")) {
    det.database = { type: "surrealdb", label: "SurrealDB", color: "#FF5B5B" };
    addLog("detect", `[${context}] surrealdb`);
  }

  const ormLib = has("@prisma/client", "prisma")
    ? "prisma"
    : has("drizzle-orm")
      ? "drizzle"
      : has("sequelize", "sequelize-typescript")
        ? "sequelize"
        : has("typeorm", "@typeorm/core")
          ? "typeorm"
          : has("objection", "knex")
            ? "knex"
            : null;
  if (ormLib) {
    det.orm = {
      type: ormLib,
      label: ormLib.charAt(0).toUpperCase() + ormLib.slice(1),
    };
    addLog("detect", `[${context}] ${ormLib} ORM`);
  }
  if (!det.database && ormLib && ormLib !== "knex") {
    det.database = {
      type: "postgresql",
      label: "PostgreSQL",
      color: "#336791",
      inferred: true,
    };
    addLog("detect", `[${context}] Inferred PostgreSQL from ${ormLib}`);
  }
  if (!det.database && has("p" + "g", "postgres", "@vercel/postgres")) {
    const l = has("p" + "g", "postgres", "@vercel/postgres");
    det.database = {
      type: "postgresql",
      label: "PostgreSQL",
      color: "#336791",
    };
    addLog("detect", `[${context}] ${l} -> PostgreSQL`);
  }

  // Infer DB type from ORM + specific driver combos
  if (
    det.orm?.type === "sequelize" &&
    has("mysql2", "mysql") &&
    !det.database?.type
  ) {
    det.database = { type: "mysql", label: "MySQL", color: "#F29111" };
    addLog("detect", `[${context}] Sequelize + mysql2 -> MySQL`);
  }
  if (det.orm?.type === "sequelize" && has("p" + "g") && !det.database?.type) {
    det.database = {
      type: "postgresql",
      label: "PostgreSQL",
      color: "#336791",
    };
    addLog("detect", `[${context}] Sequelize + postgres-driver -> PostgreSQL`);
  }

  // Cache/Queue
  if (has("ioredis", "redis", "@upstash/redis", "@redis/client")) {
    const l = has("ioredis", "redis", "@upstash/redis", "@redis/client");
    det.cache = { type: "redis", label: "Redis Cache", color: "#D82C20" };
    addLog("detect", `[${context}] ${l} -> Redis`);
  } else if (has("memcached")) {
    det.cache = {
      type: "memcached",
      label: "Memcached",
      color: "#8D6E63",
    };
    addLog("detect", `[${context}] memcached`);
  }
  if (
    has(
      "bull",
      "bullmq",
      "amqplib",
      "amqp-connection-manager",
      "kafkajs",
      "nats",
      "@google-cloud/pubsub",
      "@aws-sdk/client-sqs",
    )
  ) {
    const l = has(
      "bull",
      "bullmq",
      "amqplib",
      "kafkajs",
      "nats",
      "@google-cloud/pubsub",
      "@aws-sdk/client-sqs",
    );
    const ql =
      l === "kafkajs"
        ? "Kafka"
        : l === "nats"
          ? "NATS"
          : l === "@google-cloud/pubsub"
            ? "Google Pub/Sub"
            : l === "@aws-sdk/client-sqs"
              ? "AWS SQS"
              : l?.includes("amqp")
                ? "RabbitMQ"
                : "Bull Queue";
    det.queue = { type: "queue", label: ql, color: "#F59E0B" };
    addLog("detect", `[${context}] ${l} -> ${ql}`);
  }

  // AI
  if (has("openai")) {
    det.ai = { type: "openai", label: "OpenAI API", color: "#74AA9C" };
    addLog("detect", `[${context}] openai`);
  } else if (has("@anthropic-ai/sdk")) {
    det.ai = { type: "anthropic", label: "Anthropic API", color: "#C49A6C" };
    addLog("detect", `[${context}] anthropic`);
  } else if (has("@google/generative-ai")) {
    det.ai = { type: "google", label: "Gemini API", color: "#4285F4" };
    addLog("detect", `[${context}] gemini`);
  } else if (has("ai")) {
    det.ai = { type: "vercel_ai", label: "Vercel AI SDK", color: "#8B8B8B" };
    addLog("detect", `[${context}] vercel ai`);
  } else if (has("langchain", "@langchain/core")) {
    det.ai = { type: "langchain", label: "LangChain", color: "#1C3C3C" };
    addLog("detect", `[${context}] langchain`);
  } else if (has("groq-sdk", "groq")) {
    det.ai = { type: "groq", label: "Groq API", color: "#F55036" };
    addLog("detect", `[${context}] groq`);
  } else if (has("@huggingface/inference")) {
    det.ai = { type: "hf", label: "HuggingFace", color: "#FFD21E" };
    addLog("detect", `[${context}] huggingface`);
  }

  // Auth
  if (has("next-auth", "@auth/core", "@auth/nextjs")) {
    det.auth = { type: "nextauth", label: "NextAuth.js", color: "#6C47FF" };
    addLog("detect", `[${context}] next-auth`);
  } else if (
    has(
      "@clerk/nextjs",
      "@clerk/remix",
      "@clerk/clerk-react",
      "@clerk/astro",
      "@clerk/vue",
      "@clerk/clerk-sdk-node",
      "@clerk/backend",
      "@clerk/express",
    )
  ) {
    det.auth = { type: "clerk", label: "Clerk Auth", color: "#6C47FF" };
    addLog("detect", `[${context}] clerk`);
  } else if (
    has(
      "@auth0/nextjs-auth0",
      "@auth0/auth0-react",
      "express-openid-connect",
      "@auth0/express",
    )
  ) {
    det.auth = { type: "auth0", label: "Auth0", color: "#EB5424" };
    addLog("detect", `[${context}] auth0`);
  } else if (has("passport")) {
    det.auth = { type: "passport", label: "Passport.js", color: "#35DF79" };
    addLog("detect", `[${context}] passport`);
  } else if (has("lucia")) {
    det.auth = { type: "lucia", label: "Lucia Auth", color: "#5F9EA0" };
    addLog("detect", `[${context}] lucia`);
  } else if (has("better-auth")) {
    det.auth = { type: "better-auth", label: "Better Auth", color: "#7C3AED" };
    addLog("detect", `[${context}] better-auth`);
  } else if (has("jsonwebtoken", "jose")) {
    det.auth = { type: "jwt", label: "JWT Auth", color: "#F6AD55" };
    addLog("detect", `[${context}] jsonwebtoken -> JWT`);
  }

  // Firebase (covers DB+Auth+Storage)
  if (has("firebase", "firebase-admin", "@firebase/app")) {
    const l = has("firebase", "firebase-admin", "@firebase/app");
    det.firebase = {
      type: "firebase",
      label: "Firebase",
      color: "#FF6D00",
    };
    addLog("detect", `[${context}] ${l} -> Firebase`);
    if (!det.database) {
      det.database = {
        type: "firestore",
        label: "Firestore",
        color: "#FF6D00",
        inferred: true,
      };
      addLog("detect", `[${context}] Inferred Firestore from Firebase`);
    }
    if (!det.auth) {
      det.auth = {
        type: "firebase_auth",
        label: "Firebase Auth",
        color: "#FF6D00",
      };
      addLog("detect", `[${context}] Inferred Firebase Auth`);
    }
  }

  // Extra services
  if (has("@aws-sdk/client-s3", "@aws-sdk/s3-client")) {
    det.storage = { label: "AWS S3", color: "#FF9900" };
    addLog("detect", `[${context}] aws s3`);
  } else if (has("@google-cloud/storage")) {
    det.storage = { label: "Google Cloud Storage", color: "#4285F4" };
    addLog("detect", `[${context}] gcs`);
  } else if (has("@azure/storage-blob")) {
    det.storage = { label: "Azure Blob Storage", color: "#0078D4" };
    addLog("detect", `[${context}] azure blob`);
  } else if (has("cloudinary")) {
    det.storage = { label: "Cloudinary", color: "#3448C5" };
    addLog("detect", `[${context}] cloudinary`);
  } else if (has("uploadthing")) {
    det.storage = { label: "UploadThing", color: "#EF4444" };
    addLog("detect", `[${context}] uploadthing`);
  }
  if (
    has(
      "stripe",
      "@stripe/stripe-js",
      "paypal-rest-sdk",
      "@paypal/checkout-server-sdk",
      "@paddle/paddle-node-sdk",
      "razorpay",
      "braintree",
      "@adyen/api-library",
    )
  ) {
    const p = has(
      "stripe",
      "@stripe/stripe-js",
      "paypal-rest-sdk",
      "@paypal/checkout-server-sdk",
      "@paddle/paddle-node-sdk",
      "razorpay",
      "braintree",
      "@adyen/api-library",
    );
    det.payment = {
      label:
        p === "paypal-rest-sdk" || p === "@paypal/checkout-server-sdk"
          ? "PayPal"
          : p === "@paddle/paddle-node-sdk"
            ? "Paddle"
            : p === "razorpay"
              ? "Razorpay"
              : p === "braintree"
                ? "Braintree"
                : p === "@adyen/api-library"
                  ? "Adyen"
                  : "Stripe",
      color: "#635BFF",
    };
    addLog("detect", `[${context}] ${p} -> payment`);
  }
  if (has("resend", "@sendgrid/mail", "nodemailer", "postmark")) {
    const l = has("resend", "@sendgrid/mail", "nodemailer", "postmark");
    det.email = {
      label:
        l === "resend"
          ? "Resend"
          : l === "nodemailer"
            ? "Nodemailer"
            : l?.includes("sendgrid")
              ? "SendGrid"
              : "Email",
      color: "#63B3ED",
    };
    addLog("detect", `[${context}] ${l} -> Email`);
  }

  if (
    has(
      "meilisearch",
      "@meilisearch/instant-meilisearch",
      "@elastic/elasticsearch",
      "algoliasearch",
      "@opensearch-project/opensearch",
    )
  ) {
    const s = has(
      "meilisearch",
      "@meilisearch/instant-meilisearch",
      "@elastic/elasticsearch",
      "algoliasearch",
      "@opensearch-project/opensearch",
    );
    det.search = {
      type: "search",
      label:
        s === "meilisearch" || s === "@meilisearch/instant-meilisearch"
          ? "Meilisearch"
          : s === "algoliasearch"
            ? "Algolia"
            : s === "@opensearch-project/opensearch"
              ? "OpenSearch"
              : "Elasticsearch",
      color: "#2EC4B6",
    };
    addLog("detect", `[${context}] ${s} -> search`);
  }

  if (
    has(
      "twilio",
      "@slack/web-api",
      "discord.js",
      "pusher",
      "socket.io",
      "nats",
      "kafkajs",
    )
  ) {
    const m = has(
      "twilio",
      "@slack/web-api",
      "discord.js",
      "pusher",
      "socket.io",
      "nats",
      "kafkajs",
    );
    det.messaging = {
      type: "messaging",
      label:
        m === "twilio"
          ? "Twilio"
          : m === "@slack/web-api"
            ? "Slack API"
            : m === "discord.js"
              ? "Discord API"
              : m === "pusher"
                ? "Pusher"
                : m === "socket.io"
                  ? "Socket.IO"
                  : m === "nats"
                    ? "NATS"
                    : "Kafka",
      color: "#F59E0B",
    };
    addLog("detect", `[${context}] ${m} -> messaging`);
  }

  if (
    has(
      "posthog-js",
      "posthog-node",
      "mixpanel",
      "@amplitude/analytics-node",
      "amplitude-js",
      "plausible-tracker",
    )
  ) {
    const a = has(
      "posthog-js",
      "posthog-node",
      "mixpanel",
      "@amplitude/analytics-node",
      "amplitude-js",
      "plausible-tracker",
    );
    det.analytics = {
      type: "analytics",
      label:
        a === "posthog-js" || a === "posthog-node"
          ? "PostHog"
          : a === "mixpanel"
            ? "Mixpanel"
            : a === "plausible-tracker"
              ? "Plausible"
              : "Amplitude",
      color: "#7C3AED",
    };
    addLog("detect", `[${context}] ${a} -> analytics`);
  }

  if (
    has(
      "@sentry/react",
      "@sentry/node",
      "@sentry/browser",
      "newrelic",
      "dd-trace",
    )
  ) {
    const m = has(
      "@sentry/react",
      "@sentry/node",
      "@sentry/browser",
      "newrelic",
      "dd-trace",
    );
    det.monitoring = {
      type: "monitoring",
      label:
        m === "newrelic"
          ? "New Relic"
          : m === "dd-trace"
            ? "Datadog"
            : "Sentry",
      color: "#EF4444",
    };
    addLog("detect", `[${context}] ${m} -> monitoring`);
  }

  const hasSpecializedServiceSignal = Boolean(
    det.ai ||
    det.email ||
    det.storage ||
    det.payment ||
    det.search ||
    det.messaging ||
    det.analytics ||
    det.monitoring,
  );
  const genericExternalClient = has(
    "openapi-types",
    "swagger-client",
    "@octokit/rest",
    "googleapis",
    "@notionhq/client",
  );

  if (!hasSpecializedServiceSignal && genericExternalClient) {
    det.externalApi = {
      type: "external-api",
      label: "External API Integrations",
      color: "#38BDF8",
    };
    addLog(
      "detect",
      `[${context}] ${genericExternalClient} -> external API usage`,
    );
  }
  return det;
}

// --- SMART MERGE ----------------------------------------------------------
function mergeDetected(results, addLog) {
  const merged = {};
  results.forEach((r) => {
    Object.entries(r).forEach(([k, v]) => {
      if (v === undefined || v === null) return;

      if (k === "technologies" && typeof v === "object") {
        merged.technologies = mergeTechnologyMaps(merged.technologies, v);
        return;
      }

      if (!merged[k]) {
        merged[k] = v;
        return;
      }

      // Keep boolean merge only for containerization markers.
      if (typeof v === "boolean") {
        if (k === "docker" || k === "kubernetes") {
          merged[k] = merged[k] || v;
        }
        return;
      }
      // Backend: explicit beats api-routes inference
      if (
        k === "backend" &&
        merged[k]?.type?.endsWith("_api") &&
        !v?.type?.endsWith("_api")
      ) {
        addLog("detect", `Upgraded backend: API Routes -> ${v.label}`);
        merged[k] = v;
        return;
      }
      // Database: non-inferred beats inferred
      if (k === "database" && merged[k]?.inferred && !v?.inferred) {
        addLog("detect", `Upgraded DB: inferred -> ${v.label}`);
        merged[k] = v;
        return;
      }
      // ORM: keep first
    });
  });
  return merged;
}

// --- BUILD GRAPH ----------------------------------------------------------
function estimateNodeSize(label, subtitle = "") {
  const labelText = String(label || "").trim();
  const subtitleText = String(subtitle || "").trim();
  const estLabelChars =
    labelText.length > 18 ? Math.ceil(labelText.length / 2) : labelText.length;
  const longest = Math.max(estLabelChars, subtitleText.length, 8);
  const width = Math.max(124, Math.min(220, 82 + longest * 5.4));
  const height = subtitleText ? 62 : 52;
  return {
    w: Math.round(width),
    h: height,
  };
}

function buildGraph(detected, addLog) {
  const nodes = [];
  const edges = [];
  const COL = { left: 35, mid: 250, right: 470 };
  const centerY = 205;

  if (detected.frontend) {
    const isFS = ["next", "remix", "nuxt"].includes(detected.frontend.type);
    const size = estimateNodeSize(detected.frontend.label);
    nodes.push({
      id: "client",
      x: COL.left,
      y: centerY,
      w: size.w,
      h: size.h,
      label: detected.frontend.label,
      color: detected.frontend.color,
      type: isFS ? "fullstack" : "frontend",
    });
    addLog("graph", `Node: "${detected.frontend.label}" -> LEFT`);
  }

  if (detected.backend) {
    const size = estimateNodeSize(detected.backend.label);
    nodes.push({
      id: "api",
      x: COL.mid,
      y: centerY,
      w: size.w,
      h: size.h,
      label: detected.backend.label,
      color: detected.backend.color,
      type: "backend",
    });
    addLog("graph", `Node: "${detected.backend.label}" -> MIDDLE`);
  }

  const svcs = [
    detected.auth && {
      id: "auth",
      label: detected.auth.label,
      color: detected.auth.color,
      type: "service",
    },
    detected.database && {
      id: "db",
      label: detected.database.label,
      color: detected.database.color,
      type: "database",
      editable: true,
      orm: detected.orm?.label,
      subtitle: detected.orm?.label ? `via ${detected.orm.label}` : "",
    },
    detected.cache && {
      id: "cache",
      label: detected.cache.label,
      color: detected.cache.color,
      type: "cache",
    },
    detected.queue && {
      id: "queue",
      label: detected.queue.label,
      color: detected.queue.color,
      type: "queue",
    },
    detected.ai && {
      id: "ai",
      label: detected.ai.label,
      color: detected.ai.color,
      type: "ai",
      editable: true,
    },
    detected.email && {
      id: "email",
      label: detected.email.label,
      color: detected.email.color,
      type: "service",
    },
    detected.storage && {
      id: "storage",
      label: detected.storage.label,
      color: detected.storage.color,
      type: "storage",
    },
    detected.payment && {
      id: "payment",
      label: detected.payment.label,
      color: detected.payment.color,
      type: "payment",
    },
    detected.search && {
      id: "search",
      label: detected.search.label,
      color: detected.search.color,
      type: "search",
    },
    detected.messaging && {
      id: "messaging",
      label: detected.messaging.label,
      color: detected.messaging.color,
      type: "messaging",
    },
    detected.analytics && {
      id: "analytics",
      label: detected.analytics.label,
      color: detected.analytics.color,
      type: "analytics",
    },
    detected.monitoring && {
      id: "monitoring",
      label: detected.monitoring.label,
      color: detected.monitoring.color,
      type: "monitoring",
    },
    detected.externalApi && {
      id: "externalApi",
      label: detected.externalApi.label,
      color: detected.externalApi.color,
      type: "external-api",
    },
  ].filter(Boolean);

  const serviceColumns = svcs.length > 9 ? 3 : svcs.length > 4 ? 2 : 1;
  const colGap = 220;
  const rowGap = 94;
  const startY = 88;

  svcs.forEach((service, index) => {
    const col = index % serviceColumns;
    const row = Math.floor(index / serviceColumns);
    const size = estimateNodeSize(service.label, service.subtitle);

    nodes.push({
      ...service,
      x: COL.right + col * colGap,
      y: startY + row * rowGap,
      w: size.w,
      h: size.h,
    });
    addLog("graph", `Node: "${service.label}" -> RIGHT col=${col} row=${row}`);
  });

  const hasNode = (id) => nodes.find((node) => node.id === id);
  if (hasNode("client") && hasNode("api")) {
    edges.push({ from: "client", to: "api" });
    addLog("edge", "client -> api");
  }

  [
    "auth",
    "db",
    "cache",
    "queue",
    "ai",
    "email",
    "storage",
    "payment",
    "search",
    "messaging",
    "analytics",
    "monitoring",
    "externalApi",
  ].forEach((id) => {
    if (hasNode("api") && hasNode(id)) {
      edges.push({ from: "api", to: id });
      addLog("edge", `api -> ${id}`);
    } else if (hasNode("client") && hasNode(id) && !hasNode("api")) {
      edges.push({ from: "client", to: id });
      addLog("edge", `client -> ${id}`);
    }
  });

  addLog("info", `Graph: ${nodes.length} nodes, ${edges.length} edges`);
  return { nodes, edges };
}

// --- MODULE DETECTION -----------------------------------------------------
function detectModules(allFiles, addLog) {
  const IGNORE = new Set([
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    ".nuxt",
    "out",
    ".vercel",
    ".turbo",
    "coverage",
    ".cache",
    "public",
    "static",
    "assets",
    "images",
    "fonts",
    ".github",
    ".vscode",
    "vendor",
  ]);
  const MONO = new Set([
    "src",
    "app",
    "packages",
    "libs",
    "modules",
    "apps",
    "services",
    "projects",
  ]);
  const KNOWN = new Set([
    "components",
    "pages",
    "hooks",
    "utils",
    "lib",
    "api",
    "routes",
    "controllers",
    "models",
    "services",
    "middleware",
    "config",
    "store",
    "context",
    "layouts",
    "views",
    "features",
    "helpers",
    "types",
    "schemas",
    "validators",
    "guards",
    "filters",
    "resolvers",
    "adapters",
    "dto",
    "entities",
    "repositories",
    "jobs",
    "tasks",
    "queues",
    "events",
    "migrations",
    "seeders",
    "tests",
    "__tests__",
    "spec",
    "e2e",
    "mocks",
    "core",
    "shared",
    "common",
  ]);
  const src = allFiles.filter(
    (p) =>
      /\.(js|jsx|ts|tsx|mjs|cjs)$/.test(p) &&
      !/(node_modules|\/dist\/|\/build\/|\.min\.|\/coverage\/|\/\.next\/)/.test(
        p,
      ),
  );
  const map = {};
  const add = (k) => {
    map[k] = (map[k] || 0) + 1;
  };
  src.forEach((path) => {
    const parts = path.split("/");
    if (parts.length < 2) return;
    const top = parts[0];
    if (IGNORE.has(top)) return;
    add(top);
    if (MONO.has(top) && parts.length >= 3) {
      const sub = parts[1];
      if (!IGNORE.has(sub)) add(`${top}/${sub}`);
    }
    for (let i = 1; i < Math.min(parts.length - 1, 4); i++) {
      if (KNOWN.has(parts[i]) && !IGNORE.has(parts[i]))
        add(parts.slice(0, i + 1).join("/"));
    }
  });
  const sorted = Object.entries(map)
    .filter(([, c]) => c >= 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24);
  addLog(
    "info",
    `Modules (${sorted.length}): ${sorted
      .slice(0, 8)
      .map(([n, c]) => `${n}(${c})`)
      .join(", ")}`,
  );
  return sorted;
}

function updateProgress(onProgress, message, percent) {
  if (typeof onProgress === "function") onProgress(message, percent);
}

function getMissingCoreComponents(detected) {
  return CORE_COMPONENT_KEYS.filter((key) => !detected?.[key]);
}

function describeDetectionChanges(before, after) {
  const keys = new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {}),
  ]);
  const changes = [];
  keys.forEach((key) => {
    if (key.startsWith("_")) return;
    const b = before?.[key];
    const a = after?.[key];
    const bLabel = b?.label || (typeof b === "boolean" ? String(b) : null);
    const aLabel = a?.label || (typeof a === "boolean" ? String(a) : null);
    if (!bLabel && aLabel) {
      changes.push(`${key}: +${aLabel}`);
    } else if (bLabel && aLabel && bLabel !== aLabel) {
      changes.push(`${key}: ${bLabel} -> ${aLabel}`);
    }
  });
  return changes;
}

function categorizePackagePath(path) {
  if (path === "package.json") return "root";
  const firstSegment = path.split("/")[0]?.toLowerCase() || "";
  if (/(client|frontend|web|ui|app|next)/.test(firstSegment)) return "frontend";
  if (/(server|backend|api|service|express)/.test(firstSegment))
    return "backend";
  return "other";
}

function countPathMatches(paths, re) {
  let count = 0;
  paths.forEach((path) => {
    if (re.test(path)) count += 1;
  });
  return count;
}

function inferBackendFromPaths(paths) {
  if (!Array.isArray(paths) || paths.length === 0) return null;

  const scores = {
    node: 0,
    python: 0,
    go: 0,
    rust: 0,
    java: 0,
    dotnet: 0,
    php: 0,
    ruby: 0,
  };

  paths.forEach((path) => {
    const p = String(path || "").toLowerCase();
    if (/\.(js|jsx|mjs|cjs|ts|tsx)$/.test(p)) scores.node += 1;
    if (/\.py$/.test(p)) scores.python += 1;
    if (/\.go$/.test(p)) scores.go += 1;
    if (/\.rs$/.test(p)) scores.rust += 1;
    if (/\.(java|kt|kts)$/.test(p)) scores.java += 1;
    if (/\.cs$/.test(p)) scores.dotnet += 1;
    if (/\.php$/.test(p)) scores.php += 1;
    if (/\.rb$/.test(p)) scores.ruby += 1;
  });

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topKey, topScore] = ranked[0] || [];
  if (!topKey || !topScore) return null;

  const byKey = {
    node: { type: "node", label: "Node.js Server", color: "#68D391" },
    python: { type: "python", label: "Python Service", color: "#3776AB" },
    go: { type: "go", label: "Go Service", color: "#00ADD8" },
    rust: { type: "rust", label: "Rust Service", color: "#DEA584" },
    java: { type: "java", label: "Java Service", color: "#EA2D2E" },
    dotnet: { type: "dotnet", label: ".NET Service", color: "#512BD4" },
    php: { type: "php", label: "PHP Service", color: "#777BB4" },
    ruby: { type: "ruby", label: "Ruby Service", color: "#CC342D" },
  };

  return byKey[topKey] || null;
}

function detectFromFileInventory(allFiles, projectMeta, addLog) {
  const paths = (allFiles || [])
    .map((path) => String(path || "").toLowerCase())
    .filter(Boolean);
  const hasPath = (re) => paths.some((path) => re.test(path));
  const countByExt = (re) => countPathMatches(paths, re);

  const repoName = String(projectMeta?.name || "").toLowerCase();
  const repoFullName = String(projectMeta?.fullName || "").toLowerCase();
  const projectLanguage = String(projectMeta?.language || "").toLowerCase();

  const hints = {};

  if (hasPath(/(^|\/)pubspec\.ya?ml$/) || countByExt(/\.dart$/) >= 20) {
    hints.frontend = {
      type: "flutter",
      label: "Flutter App",
      color: "#42A5F5",
    };
    addLog("detect", "File inventory: Flutter frontend signals detected");
  } else if (
    hasPath(/(^|\/)next\.config\.(js|mjs|ts)$/) ||
    hasPath(/(^|\/)app\/layout\.(js|jsx|ts|tsx)$/)
  ) {
    hints.frontend = { type: "next", label: "Next.js", color: "#E2E8F0" };
    addLog("detect", "File inventory: Next.js frontend signals detected");
  } else if (hasPath(/(^|\/)nuxt\.config\.(js|ts|mjs)$/)) {
    hints.frontend = { type: "nuxt", label: "Nuxt.js", color: "#00DC82" };
    addLog("detect", "File inventory: Nuxt frontend signals detected");
  } else if (hasPath(/(^|\/)angular\.json$/)) {
    hints.frontend = {
      type: "angular",
      label: "Angular App",
      color: "#DD0031",
    };
    addLog("detect", "File inventory: Angular frontend signals detected");
  }

  if (hasPath(/(^|\/)go\.mod$/)) {
    hints.backend = { type: "go", label: "Go Service", color: "#00ADD8" };
    addLog("detect", "File inventory: Go backend signals detected");
  } else if (
    hasPath(
      /(^|\/)(requirements(\.dev)?\.txt|pyproject\.toml|poetry\.lock|pipfile)$/,
    ) ||
    countByExt(/\.py$/) >= 30
  ) {
    hints.backend = {
      type: "python",
      label: "Python Service",
      color: "#3776AB",
    };
    addLog("detect", "File inventory: Python backend signals detected");
  } else if (hasPath(/(^|\/)cargo\.toml$/) || countByExt(/\.rs$/) >= 25) {
    hints.backend = {
      type: "rust",
      label: "Rust Service",
      color: "#DEA584",
    };
    addLog("detect", "File inventory: Rust backend signals detected");
  } else if (
    hasPath(/(^|\/)(pom\.xml|build\.gradle(\.kts)?)$/) ||
    countByExt(/\.(java|kt|kts)$/) >= 30
  ) {
    hints.backend = {
      type: "java",
      label: "Java Service",
      color: "#EA2D2E",
    };
    addLog("detect", "File inventory: Java backend signals detected");
  } else if (hasPath(/\.(sln|csproj)$/) || countByExt(/\.cs$/) >= 30) {
    hints.backend = {
      type: "dotnet",
      label: ".NET Service",
      color: "#512BD4",
    };
    addLog("detect", "File inventory: .NET backend signals detected");
  } else if (hasPath(/(^|\/)composer\.json$/) || countByExt(/\.php$/) >= 30) {
    hints.backend = {
      type: "php",
      label: "PHP Service",
      color: "#777BB4",
    };
    addLog("detect", "File inventory: PHP backend signals detected");
  } else if (projectLanguage === "go") {
    hints.backend = { type: "go", label: "Go Service", color: "#00ADD8" };
    addLog("detect", "Repo language hint: Go backend inferred");
  } else if (projectLanguage === "python") {
    hints.backend = {
      type: "python",
      label: "Python Service",
      color: "#3776AB",
    };
    addLog("detect", "Repo language hint: Python backend inferred");
  }

  if (!hints.backend) {
    const hasAnalyzerEngine = paths.some((path) =>
      /features\/analyzer\/engine\.(mjs|js|ts)$/i.test(path),
    );
    const nodeServiceFiles = paths.filter(
      (path) =>
        /(^|\/)(server|backend|api|services|cmd|internal|scripts|features\/analyzer)\//.test(
          path,
        ) && /\.(js|jsx|mjs|cjs|ts|tsx)$/i.test(path),
    );
    if (
      nodeServiceFiles.length >= 3 ||
      (hasAnalyzerEngine && nodeServiceFiles.length >= 1)
    ) {
      hints.backend = {
        type: "node",
        label: "Node.js Service",
        color: "#68D391",
      };
      addLog(
        "detect",
        `File inventory: inferred Node backend from ${nodeServiceFiles.length} service files`,
      );
    }
  }

  const isRedisRepo = repoName === "redis" || /\/redis$/.test(repoFullName);
  const isPostgresRepo =
    repoName === "postgres" ||
    repoName === "postgresql" ||
    /\/postgres$/.test(repoFullName);

  if (isRedisRepo) {
    hints.database = { type: "redis", label: "Redis", color: "#D82C20" };
    addLog("detect", "Repo identity hint: Redis database inferred");
  } else if (isPostgresRepo) {
    hints.database = {
      type: "postgresql",
      label: "PostgreSQL",
      color: "#336791",
    };
    addLog("detect", "Repo identity hint: PostgreSQL database inferred");
  }

  return hints;
}

function scoreSignalPath(path) {
  const p = path.toLowerCase();
  let score = 0;
  if (PATH_IGNORE_RE.test(p)) score -= 30;
  if (ANALYSIS_NOISE_RE.test(p)) score -= 20;
  if (
    /(^|\/)(src|app|server|backend|api|services|controllers|routes|config|lib|core|cmd|internal|pkg)\//.test(
      p,
    )
  )
    score += 10;
  if (
    /(^|\/)(readme\.md|package\.json|pnpm-workspace\.yaml|turbo\.json|nx\.json|docker-compose(\.[a-z]+)?\.ya?ml|dockerfile(\..+)?|\.env\.example|\.env\.sample|requirements\.txt|pyproject\.toml|go\.mod|cargo\.toml|pom\.xml|build\.gradle(\.kts)?|composer\.json)$/.test(
      p,
    )
  )
    score += 12;
  if (
    /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|kt|kts|cs|php|rb|md|toml|ya?ml|json|txt|ini|conf)$/.test(
      p,
    )
  )
    score += 5;
  if (/(test|spec|__tests__|fixtures|mocks|snapshots)/.test(p)) score -= 6;
  return score;
}

function selectSignalFiles(
  allFiles,
  maxFiles = ANALYSIS_LIMITS.MAX_SIGNAL_FILES,
) {
  return allFiles
    .filter(
      (path) =>
        (TEXT_ANALYSIS_EXT_RE.test(path) || ENV_FILE_RE.test(path)) &&
        !PATH_IGNORE_RE.test(path) &&
        !ANALYSIS_NOISE_RE.test(path),
    )
    .map((path) => ({ path, score: scoreSignalPath(path) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.path.length - b.path.length)
    .slice(0, maxFiles)
    .map((item) => item.path);
}

function selectDependencyUsageFiles(
  allFiles,
  maxFiles = ANALYSIS_LIMITS.MAX_SOURCE_FILES,
) {
  return allFiles
    .filter(
      (path) =>
        TEXT_ANALYSIS_EXT_RE.test(path) &&
        !PATH_IGNORE_RE.test(path) &&
        !ANALYSIS_NOISE_RE.test(path),
    )
    .map((path) => ({ path, score: scoreSignalPath(path) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.path.length - b.path.length)
    .slice(0, maxFiles)
    .map((item) => item.path);
}

function estimateGeminiCostUSD(inputTokens, outputTokens) {
  return (
    (inputTokens * GEMINI_PRICING.inputPerMillionUSD +
      outputTokens * GEMINI_PRICING.outputPerMillionUSD) /
    1_000_000
  );
}

function extractJsonObjectFromText(text) {
  const cleaned = String(text || "")
    .replace(/```json|```/gi, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return cleaned.slice(start, end + 1);
  }
  return cleaned;
}

function normalizeZipFileEntries(zip) {
  const rawEntries = Object.values(zip.files || {}).filter(
    (entry) => !entry.dir,
  );
  const normalizedNames = rawEntries
    .map((entry) => entry.name.replace(/\\/g, "/").replace(/^\/+/, ""))
    .filter(Boolean);

  const firstSegments = new Set(
    normalizedNames.map((name) => name.split("/")[0]).filter(Boolean),
  );
  const hasTopLevelFiles = normalizedNames.some((name) => !name.includes("/"));
  const commonRoot =
    !hasTopLevelFiles && firstSegments.size === 1
      ? `${[...firstSegments][0]}/`
      : "";

  const result = [];
  const seen = new Set();
  rawEntries.forEach((entry) => {
    const full = entry.name.replace(/\\/g, "/").replace(/^\/+/, "");
    let normalized = full;
    if (commonRoot && normalized.startsWith(commonRoot)) {
      normalized = normalized.slice(commonRoot.length);
    }
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    result.push({ path: normalized, entry });
  });
  return result;
}

function isLikelyBinaryBytes(bytes) {
  if (!bytes || !bytes.length) return false;
  const sampleSize = Math.min(bytes.length, 8000);
  let suspicious = 0;
  for (let i = 0; i < sampleSize; i += 1) {
    const c = bytes[i];
    if (c === 0) {
      suspicious += 3;
      continue;
    }
    if ((c >= 1 && c <= 6) || (c >= 14 && c <= 31)) suspicious += 1;
  }
  return suspicious / sampleSize > 0.2;
}

async function geminiFallback(
  {
    repoLabel,
    repoDescription,
    language,
    allFiles,
    allDeps,
    missingCore,
    geminiApiKey,
  },
  addLog,
) {
  const env = typeof process !== "undefined" ? process.env || {} : {};
  const resolvedGeminiApiKey =
    geminiApiKey ||
    env.GEMINI_API_KEY ||
    env.REACT_APP_GEMINI_API_KEY ||
    env.NEXT_PUBLIC_GEMINI_API_KEY ||
    "";

  if (!resolvedGeminiApiKey) {
    addLog("warning", "Gemini fallback skipped: missing API key");
    return null;
  }

  addLog(
    "info",
    `Gemini fallback triggered (missing core: ${missingCore.join(", ")})`,
  );

  const relevantFiles = allFiles
    .filter((file) => !PATH_IGNORE_RE.test(file))
    .slice(0, ANALYSIS_LIMITS.MAX_SIGNAL_FILES);
  const depsList = Object.keys(allDeps).slice(0, 120).join(", ") || "(none)";
  const filesSummary = relevantFiles.join("\n");

  const prompt = `You are validating a deterministic architecture detection result.

Project: ${repoLabel}
Description: ${repoDescription || "(none)"}
Primary language: ${language || "unknown"}
Missing core components: ${missingCore.join(", ")}

Relevant file paths:
${filesSummary}

Dependencies:
${depsList}

Return ONLY valid JSON with no markdown:
{
  "frontend": null or {"label": "React Client", "type": "react", "color": "#61DAFB"},
  "backend": null or {"label": "Express API", "type": "express", "color": "#68D391"},
  "database": null or {"label": "PostgreSQL", "type": "postgresql", "color": "#336791"},
  "cache": null,
  "queue": null,
  "auth": null,
  "ai": null,
  "email": null,
  "storage": null,
  "payment": null,
  "search": null,
  "messaging": null,
  "analytics": null,
  "monitoring": null,
  "externalApi": null,
  "reasoning": "brief evidence-based summary"
}

Rules:
- Add only technologies supported by clear evidence from files/dependencies.
- Prefer null instead of guessing.
- Keep labels concise.`;

  const t0 = Date.now();
  try {
    const response = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(
        resolvedGeminiApiKey,
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.05,
            maxOutputTokens: 900,
            responseMimeType: "application/json",
          },
        }),
      },
      30000,
    );

    if (!response.ok) {
      const bodyText = await response.text();
      addLog(
        "warning",
        `Gemini API error ${response.status}: ${bodyText.slice(0, 180)}`,
      );
      return null;
    }

    const data = await response.json();
    const elapsedMs = Date.now() - t0;
    const usage = data.usageMetadata || {};
    const inputTokens = Number(
      usage.promptTokenCount || usage.inputTokenCount || 0,
    );
    const outputTokens = Number(
      usage.candidatesTokenCount || usage.outputTokenCount || 0,
    );
    const totalTokens = Number(
      usage.totalTokenCount || inputTokens + outputTokens,
    );
    const costUSD = estimateGeminiCostUSD(inputTokens, outputTokens);

    const responseText = (data.candidates || [])
      .flatMap((candidate) => candidate?.content?.parts || [])
      .map((part) => part?.text || "")
      .join("\n");

    if (!responseText.trim()) {
      addLog("warning", "Gemini fallback returned empty content");
      return null;
    }

    const parsed = JSON.parse(extractJsonObjectFromText(responseText));

    const colorByType = {
      react: "#61DAFB",
      next: "#E2E8F0",
      vue: "#42B883",
      angular: "#DD0031",
      svelte: "#FF3E00",
      express: "#68D391",
      nest: "#E0234E",
      fastify: "#808080",
      koa: "#33333D",
      hono: "#E36002",
      postgresql: "#336791",
      mongodb: "#4DB33D",
      mysql: "#F29111",
      sqlite: "#0F80CC",
      redis: "#D82C20",
      rabbitmq: "#FF6600",
      kafka: "#231F20",
      jwt: "#F6AD55",
      auth0: "#EB5424",
      openai: "#74AA9C",
      google: "#4285F4",
      anthropic: "#C49A6C",
    };
    const colorByKey = {
      payment: "#635BFF",
      email: "#63B3ED",
      storage: "#FF9900",
      search: "#2EC4B6",
      messaging: "#F59E0B",
      analytics: "#7C3AED",
      monitoring: "#EF4444",
      externalApi: "#38BDF8",
    };

    const allowedKeys = [
      "frontend",
      "backend",
      "database",
      "cache",
      "queue",
      "auth",
      "ai",
      "email",
      "storage",
      "payment",
      "search",
      "messaging",
      "analytics",
      "monitoring",
      "externalApi",
    ];
    const fallbackDetected = {};

    allowedKeys.forEach((key) => {
      const value = parsed?.[key];
      if (!value || typeof value !== "object" || Array.isArray(value)) return;
      const normalized = { ...value };
      if (!normalized.color) {
        normalized.color =
          colorByKey[key] || colorByType[normalized.type] || "#94A3B8";
      }
      fallbackDetected[key] = normalized;
      addLog(
        "detect",
        `Gemini detected ${key}: ${normalized.label || "unknown"}`,
      );
    });

    addLog("detect", `Gemini reasoning: ${parsed.reasoning || "(none)"}`);
    addLog(
      "info",
      `Gemini usage: ${inputTokens} in + ${outputTokens} out = ${totalTokens} tokens, cost $${costUSD.toFixed(
        6,
      )}, ${elapsedMs}ms`,
    );

    return {
      detected: fallbackDetected,
      usage: { inputTokens, outputTokens, totalTokens, costUSD, elapsedMs },
      reasoning: parsed.reasoning || "",
    };
  } catch (error) {
    addLog("warning", `Gemini fallback failed: ${error.message}`);
    return null;
  }
}

async function analyzeIndexedProject({
  projectMeta,
  allFiles,
  readTextFile,
  onProgress,
  addLog,
  analysisOptions = {},
}) {
  const uniqueFiles = Array.from(
    new Set(
      (allFiles || [])
        .map((f) =>
          String(f || "")
            .replace(/\\/g, "/")
            .replace(/^\/+/, ""),
        )
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const prioritizedForDetection = uniqueFiles
    .map((path) => ({ path, score: scoreSignalPath(path) }))
    .sort((a, b) => b.score - a.score || a.path.length - b.path.length)
    .map((item) => item.path);

  const filesForDetection = prioritizedForDetection.slice(
    0,
    ANALYSIS_LIMITS.MAX_FILES_FOR_DETECTION,
  );
  if (uniqueFiles.length > filesForDetection.length) {
    addLog(
      "warning",
      `Large repository detected (${uniqueFiles.length} files). Capped deterministic scan to ${filesForDetection.length} high-signal files.`,
    );
  }

  updateProgress(onProgress, "Reading all package.json files...", 28);

  const pkgPaths = filesForDetection
    .filter(
      (path) =>
        path.endsWith("package.json") &&
        !path.endsWith("package-lock.json") &&
        !PATH_IGNORE_RE.test(path) &&
        !ANALYSIS_NOISE_RE.test(path) &&
        path.split("/").length <= 7,
    )
    .slice(0, ANALYSIS_LIMITS.MAX_PACKAGE_JSON_FILES);

  addLog(
    "info",
    `package.json files selected (${pkgPaths.length}): ${
      pkgPaths.join(", ") || "none"
    }`,
  );

  const allDeps = {};
  const allDevDeps = {};
  const packageDeclarations = { runtime: {}, dev: {} };
  const pkgMeta = [];
  const perPkgResults = [];

  const pkgReads = await mapWithConcurrency(
    pkgPaths,
    ANALYSIS_LIMITS.FILE_READ_CONCURRENCY,
    async (pkgPath) => {
      const text = await readTextFile(pkgPath);
      if (!text) return null;
      const pkg = JSON.parse(text);
      const deps = pkg.dependencies || {};
      const devDeps = pkg.devDependencies || {};
      if (Object.keys(deps).length === 0 && Object.keys(devDeps).length === 0) {
        addLog("found", `${pkgPath} has no deps/devDeps; skipped`);
        return null;
      }
      return { pkgPath, pkg, deps, devDeps };
    },
  );

  pkgReads.forEach((item) => {
    if (!item || item.error) return;
    try {
      const { pkgPath, pkg, deps, devDeps } = item;
      Object.assign(allDeps, deps);
      Object.assign(allDevDeps, devDeps);

      Object.keys(deps || {}).forEach((depName) => {
        if (!packageDeclarations.runtime[depName]) {
          packageDeclarations.runtime[depName] = [];
        }
        packageDeclarations.runtime[depName].push(pkgPath);
      });

      Object.keys(devDeps || {}).forEach((depName) => {
        if (!packageDeclarations.dev[depName]) {
          packageDeclarations.dev[depName] = [];
        }
        packageDeclarations.dev[depName].push(pkgPath);
      });

      pkgMeta.push({ name: pkg.name, version: pkg.version, path: pkgPath });
      const category = categorizePackagePath(pkgPath);
      addLog(
        "found",
        `${pkgPath} [${category}] -> ${Object.keys(deps).length} deps, ${
          Object.keys(devDeps).length
        } devDeps`,
      );
      const partial = detectFromDeps(deps, devDeps, pkgPath, addLog);
      partial._cat = category;
      perPkgResults.push(partial);
    } catch (error) {
      addLog("warning", `package.json processing failed: ${error.message}`);
    }
  });

  updateProgress(onProgress, "Scanning config files & source...", 42);

  const configResults = [];
  filesForDetection.forEach((path) => {
    const result = detectFromConfigFilename(path, addLog);
    if (Object.keys(result).length > 0) configResults.push(result);
  });

  let dockerServices = {};
  const composeFile = filesForDetection.find(
    (path) =>
      /^docker-compose(\.dev|\.prod|\.override)?\.ya?ml$/i.test(
        path.split("/").pop(),
      ) && path.split("/").length <= 4,
  );

  if (composeFile) {
    const composeText = await readTextFile(composeFile);
    if (composeText) {
      dockerServices = parseDockerCompose(composeText, addLog);
      addLog(
        "found",
        `${composeFile} -> docker services: ${
          Object.keys(dockerServices).join(", ") || "none"
        }`,
      );
    }
  }

  const signalFiles = selectSignalFiles(filesForDetection);
  addLog(
    "info",
    `Scanning ${signalFiles.length} high-signal text files (cap: ${ANALYSIS_LIMITS.MAX_SIGNAL_FILES})`,
  );

  const sourceSignals = createSourceSignals();
  const scannedTextByFile = new Map();

  const sourceResultsRaw = await mapWithConcurrency(
    signalFiles,
    ANALYSIS_LIMITS.FILE_READ_CONCURRENCY,
    async (filePath) => {
      const text = await readTextFile(filePath);
      if (!text) return null;
      const boundedText =
        text.length > ANALYSIS_LIMITS.MAX_TEXT_FILE_SIZE
          ? text.slice(0, ANALYSIS_LIMITS.MAX_TEXT_FILE_SIZE)
          : text;
      scannedTextByFile.set(filePath, boundedText);
      if (text.length > ANALYSIS_LIMITS.MAX_TEXT_FILE_SIZE) {
        addLog("warning", `Truncated large file for scan: ${filePath}`);
      }
      const result = detectFromSourceContent(boundedText, filePath, addLog);
      collectSourceSignalsFromContent(boundedText, filePath, sourceSignals);
      Object.keys(result).forEach((key) => {
        const nodeId = DETECTED_KEY_TO_NODE_ID[key];
        if (nodeId) addNodeEvidence(sourceSignals, nodeId, filePath);
      });
      return Object.keys(result).length > 0 ? result : null;
    },
  );

  const sourceResults = sourceResultsRaw.filter((item) => item && !item.error);

  const depUsageFiles = selectDependencyUsageFiles(filesForDetection);
  const depUsageAdditionalFiles = depUsageFiles.filter(
    (filePath) => !scannedTextByFile.has(filePath),
  );

  if (depUsageAdditionalFiles.length) {
    addLog(
      "info",
      `Scanning ${depUsageAdditionalFiles.length} additional files for dependency usage coverage`,
    );

    await mapWithConcurrency(
      depUsageAdditionalFiles,
      ANALYSIS_LIMITS.FILE_READ_CONCURRENCY,
      async (filePath) => {
        const text = await readTextFile(filePath);
        if (!text) return null;
        const boundedText =
          text.length > ANALYSIS_LIMITS.MAX_TEXT_FILE_SIZE
            ? text.slice(0, ANALYSIS_LIMITS.MAX_TEXT_FILE_SIZE)
            : text;
        scannedTextByFile.set(filePath, boundedText);
        return null;
      },
    );
  }

  const inventoryResult = detectFromFileInventory(
    uniqueFiles,
    projectMeta,
    addLog,
  );

  const backendFolderFiles = filesForDetection.filter(
    (path) =>
      /^(server|backend|api|services|apps\/api|src\/api|cmd|internal)\//i.test(
        path,
      ) && /\.(js|jsx|ts|tsx|mjs|cjs|py|go|rs|java|kt|kts|cs|php)$/i.test(path),
  );

  const hasDetectedBackend =
    perPkgResults.some((r) => !!r.backend) ||
    sourceResults.some((r) => !!r.backend) ||
    configResults.some((r) => !!r.backend) ||
    !!inventoryResult.backend;
  const inferredBackendFromFolders =
    !hasDetectedBackend && backendFolderFiles.length > 0
      ? inferBackendFromPaths(backendFolderFiles)
      : null;
  if (inferredBackendFromFolders) {
    addLog(
      "detect",
      `Inferred backend from folder structure: ${inferredBackendFromFolders.label}`,
    );
  }

  updateProgress(onProgress, "Detecting tech stack...", 58);

  const dockerResult = {};
  if (dockerServices.redis) {
    dockerResult.cache = {
      type: "redis",
      label: "Redis Cache",
      color: "#D82C20",
    };
    addLog("detect", "Promoted Redis from docker-compose");
  }
  if (dockerServices.mongodb) {
    dockerResult.database = {
      type: "mongodb",
      label: "MongoDB",
      color: "#4DB33D",
    };
    addLog("detect", "Promoted MongoDB from docker-compose");
  }
  if (dockerServices.postgresql) {
    dockerResult.database = {
      type: "postgresql",
      label: "PostgreSQL",
      color: "#336791",
    };
    addLog("detect", "Promoted PostgreSQL from docker-compose");
  }
  if (dockerServices.mysql) {
    dockerResult.database = {
      type: "mysql",
      label: "MySQL",
      color: "#F29111",
    };
    addLog("detect", "Promoted MySQL from docker-compose");
  }
  if (dockerServices.rabbitmq) {
    dockerResult.queue = { type: "queue", label: "RabbitMQ", color: "#FF6600" };
    addLog("detect", "Promoted RabbitMQ from docker-compose");
  }
  if (dockerServices.kafka) {
    dockerResult.queue = { type: "queue", label: "Kafka", color: "#231F20" };
    addLog("detect", "Promoted Kafka from docker-compose");
  }
  if (dockerServices.elasticsearch) {
    dockerResult.search = {
      type: "search",
      label: "Elasticsearch",
      color: "#2EC4B6",
    };
  }

  const hasDocker = filesForDetection.some(
    (path) =>
      /^dockerfile(\.|$)/i.test(path.split("/").pop()) ||
      /^docker-compose(\.|$)/i.test(path.split("/").pop()),
  );
  const hasKubernetes = filesForDetection.some((path) => {
    const p = String(path || "").toLowerCase();
    return (
      /(^|\/)(k8s|kubernetes|helm|charts?)\//.test(p) ||
      /(^|\/)(kustomization|chart)\.ya?ml$/.test(p)
    );
  });
  dockerResult.docker = hasDocker;
  dockerResult.kubernetes = hasKubernetes;
  if (hasKubernetes) {
    addLog("detect", "Kubernetes manifests detected from file inventory");
  }

  const frontendResults = perPkgResults.filter((r) => r._cat === "frontend");
  const backendResults = perPkgResults.filter((r) => r._cat !== "frontend");

  let detected = mergeDetected(
    [
      ...frontendResults,
      ...backendResults,
      ...sourceResults,
      ...configResults,
      inventoryResult,
      dockerResult,
    ],
    addLog,
  );

  if (!detected.backend && inferredBackendFromFolders) {
    detected.backend = inferredBackendFromFolders;
  }

  if (detected.frontend?.type === "next" && !detected.backend) {
    detected.backend = {
      type: "node_next_api",
      label: "Node.js API Routes",
      color: "#60A5FA",
    };
    addLog("detect", "Inferred Next.js API routes backend");
  }
  if (detected.frontend?.type === "nuxt" && !detected.backend) {
    detected.backend = {
      type: "node_nuxt_server",
      label: "Node.js Nitro Server",
      color: "#60A5FA",
    };
    addLog("detect", "Inferred Nuxt Nitro backend");
  }
  if (detected.frontend?.type === "sveltekit" && !detected.backend) {
    detected.backend = {
      type: "node_sveltekit_server",
      label: "Node.js SvelteKit Endpoints",
      color: "#60A5FA",
    };
    addLog("detect", "Inferred SvelteKit endpoint backend");
  }
  if (detected.frontend?.type === "remix" && !detected.backend) {
    detected.backend = {
      type: "node_remix_server",
      label: "Node.js Remix Server",
      color: "#60A5FA",
    };
    addLog("detect", "Inferred Remix server backend");
  }

  if (detected.orm && !detected.database) {
    const ormType = detected.orm.type;
    if (ormType === "sequelize") {
      if (allDeps["mysql2"] || allDeps["mysql"]) {
        detected.database = { type: "mysql", label: "MySQL", color: "#F29111" };
        addLog("detect", "Sequelize + mysql driver -> MySQL");
      } else if (allDeps["pg"]) {
        detected.database = {
          type: "postgresql",
          label: "PostgreSQL",
          color: "#336791",
        };
        addLog("detect", "Sequelize + pg driver -> PostgreSQL");
      } else {
        detected.database = {
          type: "postgresql",
          label: "PostgreSQL",
          color: "#336791",
          inferred: true,
        };
        addLog("detect", "Sequelize detected -> inferred PostgreSQL");
      }
    }
    if (ormType === "typeorm") {
      detected.database = {
        type: "postgresql",
        label: "PostgreSQL",
        color: "#336791",
        inferred: true,
      };
      addLog("detect", "TypeORM detected -> inferred PostgreSQL");
    }
    if (ormType === "prisma") {
      if (allDeps["mongodb"] || allDeps["mongoose"]) {
        detected.database = {
          type: "mongodb",
          label: "MongoDB",
          color: "#4DB33D",
        };
        addLog("detect", "Prisma + mongo driver -> MongoDB");
      } else if (allDeps["mysql2"] || allDeps["mysql"]) {
        detected.database = { type: "mysql", label: "MySQL", color: "#F29111" };
        addLog("detect", "Prisma + mysql driver -> MySQL");
      } else if (allDeps["sqlite3"] || allDeps["better-sqlite3"]) {
        detected.database = {
          type: "sqlite",
          label: "SQLite",
          color: "#0F80CC",
        };
        addLog("detect", "Prisma + sqlite driver -> SQLite");
      } else {
        detected.database = {
          type: "postgresql",
          label: "PostgreSQL",
          color: "#336791",
          inferred: true,
        };
        addLog("detect", "Prisma detected -> inferred PostgreSQL");
      }
    }
  }
  updateProgress(onProgress, "Building architecture graph...", 72);
  let { nodes, edges } = buildGraph(detected, addLog);

  const missingCore = getMissingCoreComponents(detected);
  const allowGeminiFallback = analysisOptions.enableGeminiFallback !== false;
  let fallbackMeta = {
    used: false,
    reason: missingCore.length
      ? `Missing core components: ${missingCore.join(", ")}`
      : "Deterministic detection sufficient",
    changes: [],
    usage: {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      costUSD: 0,
      elapsedMs: 0,
    },
  };

  if (missingCore.length > 0 && allowGeminiFallback) {
    updateProgress(onProgress, "Validating with AI fallback...", 84);
    const fallbackResult = await geminiFallback(
      {
        repoLabel: projectMeta.fullName,
        repoDescription: projectMeta.description,
        language: projectMeta.language,
        allFiles: filesForDetection,
        allDeps,
        missingCore,
        geminiApiKey: analysisOptions.geminiApiKey,
      },
      addLog,
    );

    if (
      fallbackResult?.detected &&
      Object.keys(fallbackResult.detected).length
    ) {
      const before = { ...detected };
      const merged = mergeDetected([detected, fallbackResult.detected], addLog);
      const changes = describeDetectionChanges(before, merged);
      detected = merged;
      const rebuilt = buildGraph(detected, addLog);
      nodes = rebuilt.nodes;
      edges = rebuilt.edges;
      fallbackMeta = {
        used: true,
        reason: `Missing core components before fallback: ${missingCore.join(", ")}`,
        changes,
        usage: fallbackResult.usage,
      };
      addLog(
        "info",
        `Gemini fallback applied. Changes: ${changes.join("; ") || "none"}`,
      );
    } else {
      addLog(
        "warning",
        "Gemini fallback did not provide usable detections. Keeping deterministic result.",
      );
    }
  } else if (missingCore.length > 0 && !allowGeminiFallback) {
    addLog(
      "info",
      `Gemini fallback disabled. Missing core components remain: ${missingCore.join(", ")}`,
    );
  } else {
    addLog(
      "info",
      "Deterministic analysis complete. Gemini fallback not needed.",
    );
  }

  const normalizedSourceSignals = toPlainSignals(sourceSignals);

  detected.technologies = buildDetectedTechnologies({
    allDeps,
    allDevDeps,
    filesForDetection,
    sourceResults,
    configResults,
    detected,
    packageDeclarations,
    sourceSignals: normalizedSourceSignals,
  });
  detected.stackTechnologies = buildStackTechnologyProjection(
    detected.technologies,
    detected,
  );

  updateProgress(onProgress, "Checking latest npm versions...", 90);

  const testFiles = uniqueFiles.filter(
    (path) =>
      /\.(test|spec)\.(js|ts|jsx|tsx|mjs|cjs|py|go|rs|java|kt|kts|cs|php)$/.test(
        path,
      ) || path.includes("__tests__"),
  );
  const srcFiles = uniqueFiles.filter(
    (path) =>
      /\.(js|jsx|ts|tsx|mjs|cjs|py|go|rs|java|kt|kts|cs|php)$/.test(path) &&
      !PATH_IGNORE_RE.test(path),
  );

  const modules = detectModules(uniqueFiles, addLog);
  const nodeDetails = buildNodeDetailsFromAnalysis({
    nodes,
    detected,
    allFiles: uniqueFiles,
    modules,
    allDeps,
    allDevDeps,
    sourceSignals: normalizedSourceSignals,
    stats: {
      language: projectMeta.language || "Unknown",
      moduleCount: modules.length,
    },
  });

  const rawDeps = [
    ...Object.entries(allDeps).map(([name, ver]) => ({
      name,
      cur:
        String(ver)
          .replace(/^[^0-9]*/, "")
          .split(/[ |]/)[0] || String(ver),
      type: classifyDep(name),
      isDevDep: false,
    })),
    ...Object.entries(allDevDeps).map(([name, ver]) => ({
      name,
      cur:
        String(ver)
          .replace(/^[^0-9]*/, "")
          .split(/[ |]/)[0] || String(ver),
      type: "dev",
      isDevDep: true,
    })),
  ];

  const configuredMaxDepChecks = Number.isFinite(
    Number(analysisOptions.maxDepVersionChecks),
  )
    ? Math.max(0, Number(analysisOptions.maxDepVersionChecks))
    : ANALYSIS_LIMITS.MAX_DEP_VERSION_CHECKS;
  const shouldSkipVersionLookup = analysisOptions.skipVersionLookup === true;

  const depsForVersionCheck = shouldSkipVersionLookup
    ? []
    : rawDeps.slice(0, configuredMaxDepChecks);

  if (shouldSkipVersionLookup) {
    addLog("info", "Dependency latest-version lookup skipped by option.");
  }

  if (rawDeps.length > depsForVersionCheck.length) {
    addLog(
      "warning",
      `Dependency version checks capped at ${depsForVersionCheck.length}/${rawDeps.length} packages`,
    );
  }

  addLog(
    "info",
    `Fetching latest versions for ${depsForVersionCheck.length} packages via jsdelivr`,
  );

  const uniqueDepTargets = Array.from(
    new Map(depsForVersionCheck.map((dep) => [dep.name, dep])).values(),
  );

  const latestResults = depsForVersionCheck.length
    ? await mapWithConcurrency(
        uniqueDepTargets,
        ANALYSIS_LIMITS.VERSION_FETCH_CONCURRENCY,
        async (dep) => ({
          name: dep.name,
          latest: await fetchLatestVersion(dep.name),
        }),
      )
    : [];

  const latestMap = {};
  latestResults.forEach((result) => {
    if (result && !result.error && result.latest) {
      latestMap[result.name] = result.latest;
    }
  });

  const dependencyNames = Array.from(new Set(rawDeps.map((dep) => dep.name)));
  const dependencyUsageIndex = buildDependencyUsageIndex(scannedTextByFile);
  const dependencyConfigReferenceIndex = buildDependencyConfigReferenceIndex(
    scannedTextByFile,
    dependencyNames,
  );
  const technologyMap = detected.technologies || {};

  const deps = rawDeps.map((dep) => {
    const latest = latestMap[dep.name] || dep.cur;
    const outdated = isOutdated(dep.cur, latest);
    const risk =
      outdated && dep.type === "security"
        ? "high"
        : outdated && dep.type === "runtime"
          ? "low"
          : outdated
            ? "medium"
            : "none";

    const usageFiles = normalizeStringArray([
      ...(Array.from(dependencyUsageIndex.get(dep.name) || []) || []),
      ...(dependencyConfigReferenceIndex[dep.name] || []),
    ]).slice(0, 8);

    const techEntry = technologyMap[normalizeTechnologyId(dep.name)] || null;
    const hasActiveTechnologySignal = techEntry?.status === "active";
    const languageDependency = isLanguageCategory(techEntry?.category);
    const excludedToolingDep =
      dep.isDevDep && isLikelyToolingDependency(dep.name);

    const unused =
      !hasActiveTechnologySignal &&
      usageFiles.length === 0 &&
      !languageDependency &&
      !excludedToolingDep;

    return {
      ...dep,
      lat: latest,
      old: outdated,
      risk,
      unused,
      usageFiles,
      usageCount: usageFiles.length,
    };
  });

  const outdatedCount = deps.filter((dep) => dep.old).length;
  const unusedDepsCount = deps.filter((dep) => dep.unused).length;
  const technologyEntries = Object.values(detected.technologies || {});
  const activeTechnologyEntries = technologyEntries.filter(
    (entry) => entry?.status === "active",
  );
  const declaredOnlyTechnologyEntries = technologyEntries.filter(
    (entry) => entry?.status === "declared-only",
  );
  const fullTechnologyHighlights = (
    activeTechnologyEntries.length ? activeTechnologyEntries : technologyEntries
  )
    .sort((a, b) => technologyPriorityScore(b) - technologyPriorityScore(a))
    .slice(0, 6)
    .map((entry) => entry.label);

  const stackTechnologyEntries = Object.values(
    detected.stackTechnologies || {},
  );
  const activeStackTechnologyEntries = stackTechnologyEntries.filter(
    (entry) => entry?.status === "active",
  );
  const declaredOnlyStackTechnologyEntries = stackTechnologyEntries.filter(
    (entry) => entry?.status === "declared-only",
  );
  const stackTechnologyHighlights = (
    activeStackTechnologyEntries.length
      ? activeStackTechnologyEntries
      : stackTechnologyEntries
  )
    .sort((a, b) => technologyPriorityScore(b) - technologyPriorityScore(a))
    .slice(0, 6)
    .map((entry) => entry.label);

  const technologyHighlights =
    stackTechnologyHighlights.length > 0
      ? stackTechnologyHighlights
      : fullTechnologyHighlights;

  return {
    nodes,
    edges,
    detected,
    nodeDetails,
    deps,
    stats: {
      repoName: projectMeta.name,
      repoFullName: projectMeta.fullName,
      pkgName: pkgMeta[0]?.name || projectMeta.name,
      language: projectMeta.language || "Unknown",
      stars: projectMeta.stars || 0,
      totalFiles: uniqueFiles.length,
      srcFiles: srcFiles.length,
      testFiles: testFiles.length,
      modules: modules.length,
      moduleList: modules.map(([name]) => name),
      totalDeps: Object.keys(allDeps).length,
      devDeps: Object.keys(allDevDeps).length,
      outdatedDeps: outdatedCount,
      unusedDeps: unusedDepsCount,
      technologyCount: stackTechnologyEntries.length,
      activeTechnologyCount: activeStackTechnologyEntries.length,
      declaredOnlyTechnologyCount: declaredOnlyStackTechnologyEntries.length,
      rawTechnologyCount: technologyEntries.length,
      rawActiveTechnologyCount: activeTechnologyEntries.length,
      rawDeclaredOnlyTechnologyCount: declaredOnlyTechnologyEntries.length,
      stackTechnologyCount: stackTechnologyEntries.length,
      stackActiveTechnologyCount: activeStackTechnologyEntries.length,
      stackDeclaredOnlyTechnologyCount:
        declaredOnlyStackTechnologyEntries.length,
      technologyHighlights,
      fullTechnologyHighlights,
      docker: hasDocker,
      kubernetes: hasKubernetes,
      orm: detected.orm?.label || null,
      llmUsed: fallbackMeta.used,
      fallbackReason: fallbackMeta.reason,
      fallbackChanges: fallbackMeta.changes,
      fallbackInputTokens: fallbackMeta.usage.inputTokens,
      fallbackOutputTokens: fallbackMeta.usage.outputTokens,
      fallbackTotalTokens: fallbackMeta.usage.totalTokens,
      fallbackCostUSD: fallbackMeta.usage.costUSD,
      fallbackElapsedMs: fallbackMeta.usage.elapsedMs,
    },
  };
}

function encodeGitHubPath(path) {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

// --- MAIN ANALYZERS -------------------------------------------------------
export async function analyzeGitHubRepo(
  owner,
  repo,
  onProgress,
  token,
  options = {},
) {
  const env = typeof process !== "undefined" ? process.env || {} : {};
  const resolvedGitHubToken =
    token ||
    env.GITHUB_TOKEN ||
    env.REACT_APP_GITHUB_TOKEN ||
    env.NEXT_PUBLIC_GITHUB_TOKEN ||
    "";

  const log = [];
  const addLog = (type, msg) => log.push({ type, msg });

  updateProgress(onProgress, "Fetching repository info...", 8);
  const repoInfo = await ghFetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    resolvedGitHubToken,
    { addLog },
  );
  const branch = repoInfo.default_branch;
  addLog(
    "info",
    `Repo: ${repoInfo.full_name} | branch: ${branch} | lang: ${
      repoInfo.language || "?"
    } | stars: ${repoInfo.stargazers_count}`,
  );

  updateProgress(onProgress, "Scanning file structure...", 18);
  const treeData = await ghFetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    resolvedGitHubToken,
    { addLog, retries: 3, timeoutMs: 28000 },
  );
  const allFiles = (treeData.tree || [])
    .filter((item) => item.type === "blob")
    .map((item) => item.path);

  addLog(
    "info",
    `File tree loaded: ${allFiles.length} files${treeData.truncated ? " (truncated by API)" : ""}`,
  );

  const readTextFile = async (path) =>
    ghFetchText(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodeGitHubPath(
        path,
      )}?ref=${branch}`,
      resolvedGitHubToken,
      { addLog, retries: 2, timeoutMs: 22000, allowNotFound: true },
    );

  const analysis = await analyzeIndexedProject({
    projectMeta: {
      name: repoInfo.name,
      fullName: repoInfo.full_name,
      description: repoInfo.description || "",
      language: repoInfo.language || "Unknown",
      stars: repoInfo.stargazers_count || 0,
    },
    allFiles,
    readTextFile,
    onProgress,
    addLog,
    analysisOptions: options,
  });

  addLog("info", "Analysis complete.");
  updateProgress(onProgress, "Done!", 100);

  return {
    ...analysis,
    debugLog: log,
  };
}

export async function analyzeZipArchive(file, onProgress, options = {}) {
  const log = [];
  const addLog = (type, msg) => log.push({ type, msg });

  updateProgress(onProgress, "Reading ZIP archive...", 8);

  const zipBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(zipBuffer);
  const zipEntries = normalizeZipFileEntries(zip);
  const allFiles = zipEntries.map((entry) => entry.path);
  const zipEntryMap = new Map(
    zipEntries.map((entry) => [entry.path, entry.entry]),
  );

  addLog("info", `ZIP loaded: ${allFiles.length} files`);

  const readTextFile = async (path) => {
    const entry = zipEntryMap.get(path);
    if (!entry) return null;
    try {
      const bytes = await entry.async("uint8array");
      if (!bytes || bytes.length === 0) return "";
      if (isLikelyBinaryBytes(bytes)) return null;
      const bounded =
        bytes.length > ANALYSIS_LIMITS.MAX_TEXT_FILE_SIZE
          ? bytes.slice(0, ANALYSIS_LIMITS.MAX_TEXT_FILE_SIZE)
          : bytes;
      return new TextDecoder("utf-8", { fatal: false }).decode(bounded);
    } catch {
      return null;
    }
  };

  const baseName = file.name.replace(/\.zip$/i, "") || "local-project";
  const analysis = await analyzeIndexedProject({
    projectMeta: {
      name: baseName,
      fullName: `local/${baseName}`,
      description: `Local ZIP archive: ${file.name}`,
      language: "Unknown",
      stars: 0,
    },
    allFiles,
    readTextFile,
    onProgress,
    addLog,
    analysisOptions: options,
  });

  addLog("info", "ZIP analysis complete.");
  updateProgress(onProgress, "Done!", 100);

  return {
    ...analysis,
    debugLog: log,
  };
}

export {
  parseGitHubUrl,
  ANALYSIS_LIMITS,
  CORE_COMPONENT_KEYS,
  PATH_IGNORE_RE,
  TEXT_ANALYSIS_EXT_RE,
};
