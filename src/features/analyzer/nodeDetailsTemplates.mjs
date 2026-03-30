const NODE_DETAIL_TEMPLATES = {
  client: {
    title: "Frontend Layer",
    fields: [
      "Framework",
      "Language",
      "TypeScript",
      "Build Tool",
      "Key Modules",
    ],
    modulePatterns: [/^(src|app)(\/|$)/i, /components|pages|features|layouts/i],
    filePatterns: [
      /^src\//i,
      /^app\//i,
      /next\.config\.(js|mjs|ts)$/i,
      /vite\.config\.(js|ts|mjs)$/i,
      /webpack\.config\.(js|ts)$/i,
    ],
  },
  api: {
    title: "Backend Layer",
    fields: [
      "Service",
      "Language",
      "Entry Scope",
      "External APIs",
      "Monitoring",
    ],
    modulePatterns: [
      /api|server|backend|routes|controllers|services|features\/analyzer/i,
    ],
    filePatterns: [
      /(^|\/)(server|backend|api|routes|controllers|services)\//i,
      /engine\.(mjs|js|ts)$/i,
      /scripts\//i,
    ],
  },
  auth: {
    title: "Authentication",
    fields: ["Strategy", "Token TTL", "Refresh Tokens", "2FA"],
    modulePatterns: [/auth|middleware|security|guards/i],
    filePatterns: [/auth|jwt|passport|next-auth|clerk|auth0|middleware/i],
  },
  db: {
    title: "Database",
    fields: ["Engine", "ORM", "Driver", "Migration Assets"],
    modulePatterns: [
      /db|database|models|repositories|entities|migrations|prisma/i,
    ],
    filePatterns: [
      /db|database|prisma|sequelize|typeorm|drizzle|knex|models|migrations?/i,
    ],
  },
  cache: {
    title: "Caching",
    fields: ["Engine", "Client", "Usage"],
    modulePatterns: [/cache|redis|store/i],
    filePatterns: [/cache|redis/i],
  },
  queue: {
    title: "Queue",
    fields: ["Queue", "Broker", "Workers"],
    modulePatterns: [/queue|jobs|workers|tasks|events/i],
    filePatterns: [/queue|worker|job|bull|kafka|rabbit|nats/i],
  },
  ai: {
    title: "AI Layer",
    fields: ["Provider", "Integration", "Model Hints", "Usage Files"],
    modulePatterns: [/ai|llm|inference|analyzer/i],
    filePatterns: [/ai|llm|openai|anthropic|gemini|inference|analyzer/i],
  },
  email: {
    title: "Email",
    fields: ["Provider", "Delivery Channel", "Integration Files"],
    modulePatterns: [/email|mail|notifications?/i],
    filePatterns: [/email|mail|resend|sendgrid|postmark|smtp/i],
  },
  storage: {
    title: "Storage",
    fields: ["Provider", "Access Pattern", "Integration Files"],
    modulePatterns: [/storage|uploads?|media|assets/i],
    filePatterns: [/storage|s3|cloudinary|blob|uploads?/i],
  },
  payment: {
    title: "Payments",
    fields: ["Provider", "Mode", "Integration Files"],
    modulePatterns: [/payment|billing|checkout|orders/i],
    filePatterns: [/payment|billing|checkout|stripe|paypal|paddle|braintree/i],
  },
  search: {
    title: "Search",
    fields: ["Engine", "Client", "Integration Files"],
    modulePatterns: [/search|index|query/i],
    filePatterns: [/search|index|meili|elastic|algolia|opensearch/i],
  },
  messaging: {
    title: "Messaging",
    fields: ["Provider", "Transport", "Integration Files"],
    modulePatterns: [/message|notifications?|events|queue/i],
    filePatterns: [/twilio|slack|discord|pusher|kafka|rabbit|nats|socket/i],
  },
  analytics: {
    title: "Analytics",
    fields: ["Platform", "Tracking", "Integration Files"],
    modulePatterns: [/analytics|tracking|metrics/i],
    filePatterns: [
      /analytics|metrics|posthog|mixpanel|amplitude|ga4|plausible/i,
    ],
  },
  monitoring: {
    title: "Monitoring",
    fields: ["Platform", "Signals", "Integration Files"],
    modulePatterns: [/monitor|observability|telemetry|tracing/i],
    filePatterns: [/sentry|datadog|newrelic|otel|prometheus|grafana|monitor/i],
  },
  externalApi: {
    title: "External APIs",
    fields: ["Integrations", "Contract Hints", "Integration Files"],
    modulePatterns: [/api|integrations|clients/i],
    filePatterns: [/openapi|swagger|integrations?|clients?|api/i],
  },
  default: {
    title: "Node Details",
    fields: ["Type", "Signals"],
    modulePatterns: [],
    filePatterns: [],
  },
};

function uniqueStable(values) {
  const result = [];
  const seen = new Set();
  (values || []).forEach((value) => {
    const text = String(value || "").trim();
    if (!text || seen.has(text)) return;
    seen.add(text);
    result.push(text);
  });
  return result;
}

function listLabel(values, fallback = "Not detected", limit = 3) {
  const items = uniqueStable(values);
  if (!items.length) return fallback;
  return items.slice(0, limit).join(", ");
}

function yesNo(value) {
  return value ? "Yes" : "No";
}

function pickFiles(allFiles, patterns, limit = 8) {
  return (allFiles || [])
    .filter((filePath) => patterns.some((pattern) => pattern.test(filePath)))
    .slice(0, limit);
}

function pickModules(modules, patterns, limit = 6) {
  return (modules || [])
    .map((entry) => (Array.isArray(entry) ? entry[0] : entry))
    .filter((moduleName) =>
      patterns.some((pattern) => pattern.test(String(moduleName || ""))),
    )
    .slice(0, limit);
}

function pickDeps(allDeps, allDevDeps, regex, limit = 4) {
  const names = uniqueStable([
    ...Object.keys(allDeps || {}),
    ...Object.keys(allDevDeps || {}),
  ]);
  return names.filter((name) => regex.test(name)).slice(0, limit);
}

function createDynamicStats(nodeId, context) {
  const {
    detected,
    allDeps,
    allDevDeps,
    sourceSignals,
    stats,
    evidenceByNode,
    migrationFiles,
    aiProviders,
    aiModes,
    aiModels,
  } = context;

  const backendService = detected?.backend?.label || "Not detected";
  const backendLanguage = stats?.language || "Unknown";
  const authStrategy = detected?.auth?.label || "Not detected";
  const dbEngine = detected?.database?.label || "Not detected";
  const ormLabel = detected?.orm?.label || "None";
  const cacheLabel = detected?.cache?.label || "Not detected";
  const queueLabel = detected?.queue?.label || "Not detected";
  const aiProviderLabel =
    detected?.ai?.label || listLabel(aiProviders, "Not detected", 2);
  const evidenceFiles = evidenceByNode[nodeId] || [];

  if (nodeId === "client") {
    const buildTool = listLabel(
      pickDeps(
        allDeps,
        allDevDeps,
        /(vite|webpack|react-scripts|next|nuxt|remix|sveltekit)/i,
        2,
      ),
      "Not detected",
      2,
    );

    return {
      Framework: detected?.frontend?.label || "Not detected",
      Language: backendLanguage,
      TypeScript: yesNo(!!detected?.typescript),
      "Build Tool": buildTool,
      "Key Modules": String(stats?.moduleCount || 0),
    };
  }

  if (nodeId === "api") {
    const hasExternalApi =
      !!detected?.externalApi || (evidenceByNode.externalApi || []).length > 0;
    return {
      Service: backendService,
      Language: backendLanguage,
      "Entry Scope": evidenceFiles.length
        ? `${evidenceFiles.length} files`
        : "Not detected",
      "External APIs": yesNo(hasExternalApi),
      Monitoring: detected?.monitoring?.label || "Not detected",
    };
  }

  if (nodeId === "auth") {
    return {
      Strategy: authStrategy,
      "Token TTL": listLabel(sourceSignals.authTokenTtls, "Not found", 2),
      "Refresh Tokens": yesNo(!!sourceSignals.authRefresh),
      "2FA": yesNo(!!sourceSignals.auth2fa),
    };
  }

  if (nodeId === "db") {
    const dbDriver = listLabel(
      pickDeps(
        allDeps,
        allDevDeps,
        /(pg|postgres|mysql|mongodb|sqlite|libsql)/i,
      ),
      "Not found",
      2,
    );
    return {
      Engine: dbEngine,
      ORM: ormLabel,
      Driver: dbDriver,
      "Migration Assets": migrationFiles.length
        ? `${migrationFiles.length} files`
        : "Not found",
    };
  }

  if (nodeId === "cache") {
    return {
      Engine: cacheLabel,
      Client: listLabel(
        pickDeps(allDeps, allDevDeps, /(redis|ioredis|memcached|upstash)/i),
      ),
      Usage: evidenceFiles.length
        ? `${evidenceFiles.length} files`
        : "Not found",
    };
  }

  if (nodeId === "queue") {
    const broker = listLabel(
      pickDeps(
        allDeps,
        allDevDeps,
        /(bull|bullmq|amqp|rabbit|kafka|nats|sqs|pubsub)/i,
      ),
    );
    return {
      Queue: queueLabel,
      Broker: broker,
      Workers: evidenceFiles.length
        ? `${evidenceFiles.length} files`
        : "Not found",
    };
  }

  if (nodeId === "ai") {
    return {
      Provider: aiProviderLabel,
      Integration: listLabel(aiModes, "Not detected", 2),
      "Model Hints": listLabel(aiModels, "Not found", 3),
      "Usage Files": evidenceFiles.length
        ? `${evidenceFiles.length} files`
        : "Not found",
    };
  }

  if (nodeId === "email") {
    return {
      Provider: detected?.email?.label || "Not detected",
      "Delivery Channel": listLabel(
        pickDeps(
          allDeps,
          allDevDeps,
          /(resend|sendgrid|postmark|mailgun|nodemailer|ses)/i,
        ),
      ),
      "Integration Files": evidenceFiles.length
        ? `${evidenceFiles.length} files`
        : "Not found",
    };
  }

  if (nodeId === "storage") {
    return {
      Provider: detected?.storage?.label || "Not detected",
      "Access Pattern": listLabel(
        pickDeps(
          allDeps,
          allDevDeps,
          /(@aws-sdk\/client-s3|cloudinary|google-cloud\/storage|azure\/storage-blob|uploadthing|supabase)/i,
        ),
      ),
      "Integration Files": evidenceFiles.length
        ? `${evidenceFiles.length} files`
        : "Not found",
    };
  }

  if (nodeId === "payment") {
    return {
      Provider: detected?.payment?.label || "Not detected",
      Mode: listLabel(
        pickDeps(
          allDeps,
          allDevDeps,
          /(stripe|paypal|paddle|braintree|razorpay|adyen)/i,
        ),
      ),
      "Integration Files": evidenceFiles.length
        ? `${evidenceFiles.length} files`
        : "Not found",
    };
  }

  if (nodeId === "search") {
    return {
      Engine: detected?.search?.label || "Not detected",
      Client: listLabel(
        pickDeps(
          allDeps,
          allDevDeps,
          /(meilisearch|algolia|elastic|opensearch)/i,
        ),
      ),
      "Integration Files": evidenceFiles.length
        ? `${evidenceFiles.length} files`
        : "Not found",
    };
  }

  if (nodeId === "messaging") {
    return {
      Provider: detected?.messaging?.label || "Not detected",
      Transport: listLabel(
        pickDeps(
          allDeps,
          allDevDeps,
          /(twilio|slack|discord|pusher|socket\.io|kafka|nats|rabbit)/i,
        ),
      ),
      "Integration Files": evidenceFiles.length
        ? `${evidenceFiles.length} files`
        : "Not found",
    };
  }

  if (nodeId === "analytics") {
    return {
      Platform: detected?.analytics?.label || "Not detected",
      Tracking: listLabel(
        pickDeps(
          allDeps,
          allDevDeps,
          /(posthog|mixpanel|amplitude|plausible|analytics)/i,
        ),
      ),
      "Integration Files": evidenceFiles.length
        ? `${evidenceFiles.length} files`
        : "Not found",
    };
  }

  if (nodeId === "monitoring") {
    return {
      Platform: detected?.monitoring?.label || "Not detected",
      Signals: listLabel(
        pickDeps(
          allDeps,
          allDevDeps,
          /(sentry|datadog|newrelic|opentelemetry|prometheus|grafana)/i,
        ),
      ),
      "Integration Files": evidenceFiles.length
        ? `${evidenceFiles.length} files`
        : "Not found",
    };
  }

  if (nodeId === "externalApi") {
    return {
      Integrations: detected?.externalApi?.label || "Not detected",
      "Contract Hints": listLabel(
        pickDeps(
          allDeps,
          allDevDeps,
          /(openapi|swagger|graphql-request|apollo|octokit|googleapis|notion)/i,
        ),
      ),
      "Integration Files": evidenceFiles.length
        ? `${evidenceFiles.length} files`
        : "Not found",
    };
  }

  return {
    Type: nodeId,
    Signals: evidenceFiles.length
      ? `${evidenceFiles.length} files`
      : "Not found",
  };
}

export function buildNodeDetailsFromAnalysis({
  nodes,
  detected,
  allFiles,
  modules,
  allDeps,
  allDevDeps,
  sourceSignals,
  stats,
}) {
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safeDetected = detected || {};
  const safeSignals = sourceSignals || {};
  const safeEvidenceByNode = safeSignals.evidenceByNode || {};
  const moduleNames = Array.isArray(modules) ? modules : [];

  const aiProviders = uniqueStable([
    ...(safeSignals.aiProviders || []),
    safeDetected.ai?.label,
  ]);
  const aiModes = uniqueStable(safeSignals.aiModes || []);
  const aiModels = uniqueStable(safeSignals.aiModels || []);

  const migrationFiles = pickFiles(
    allFiles || [],
    [
      /prisma\/schema\.prisma$/i,
      /migrations?\//i,
      /drizzle/i,
      /typeorm/i,
      /sequelize/i,
      /knexfile\.(js|ts)$/i,
    ],
    8,
  );

  const detailsByNode = {};

  safeNodes.forEach((node) => {
    const nodeId = node.id;
    const template =
      NODE_DETAIL_TEMPLATES[nodeId] || NODE_DETAIL_TEMPLATES.default;

    const dynamicMap = createDynamicStats(nodeId, {
      detected: safeDetected,
      allDeps,
      allDevDeps,
      sourceSignals: safeSignals,
      stats,
      evidenceByNode: safeEvidenceByNode,
      migrationFiles,
      aiProviders,
      aiModes,
      aiModels,
    });

    const statsRows = (template.fields || []).map((field) => [
      field,
      String(dynamicMap[field] || "Not detected"),
    ]);

    const inferredModules = pickModules(
      moduleNames,
      template.modulePatterns || [],
      6,
    );
    const inferredFiles = pickFiles(
      allFiles || [],
      template.filePatterns || [],
      8,
    );

    const files = uniqueStable([
      ...(safeEvidenceByNode[nodeId] || []),
      ...inferredFiles,
    ]).slice(0, 8);

    detailsByNode[nodeId] = {
      title: template.title,
      stats: statsRows,
      modules: uniqueStable(inferredModules),
      files,
    };
  });

  return detailsByNode;
}

export { NODE_DETAIL_TEMPLATES };
