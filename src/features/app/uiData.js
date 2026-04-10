export const S = { UP: "up", LOAD: "load", DASH: "dash", DIAG: "diag" };

export const AI_MODELS = [
  {
    id: "gpt-4o",
    label: "GPT-4o",
    provider: "OpenAI",
    color: "#74AA9C",
    rpm: 450,
    acc: 94,
  },
  {
    id: "gpt-4o-mini",
    label: "GPT-4o Mini",
    provider: "OpenAI",
    color: "#52A98B",
    rpm: 120,
    acc: 87,
  },
  {
    id: "claude-sonnet",
    label: "Claude Sonnet 4",
    provider: "Anthropic",
    color: "#C49A6C",
    rpm: 380,
    acc: 96,
  },
  {
    id: "gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash Lite",
    provider: "Google",
    color: "#4285F4",
    rpm: 320,
    acc: 90,
  },
  {
    id: "llama-3",
    label: "Llama 3.3 70B",
    provider: "Meta/Groq",
    color: "#0064E0",
    rpm: 180,
    acc: 88,
  },
];

export const DB_OPT = [
  {
    id: "postgresql",
    label: "PostgreSQL",
    color: "#336791",
    icon: "postgresql",
    compat: {
      mongodb: "Schema restructure needed",
      mysql: "High effort, minor SQL diffs",
      sqlite: "Medium effort, feature subset",
      redis: "Paradigm mismatch",
    },
  },
  {
    id: "mongodb",
    label: "MongoDB",
    color: "#4DB33D",
    icon: "mongodb",
    compat: {
      postgresql: "Schema and query rewrite",
      mysql: "Schema restructure",
      sqlite: "Schema rewrite",
      redis: "Paradigm mismatch",
    },
  },
  {
    id: "mysql",
    label: "MySQL",
    color: "#F29111",
    icon: "mysql",
    compat: {
      postgresql: "High effort, minor SQL diffs",
      mongodb: "Schema restructure",
      sqlite: "Medium effort, clear path",
      redis: "Paradigm mismatch",
    },
  },
  {
    id: "sqlite",
    label: "SQLite",
    color: "#0F80CC",
    icon: "sqlite",
    compat: {
      postgresql: "Medium effort, clear path",
      mongodb: "Schema restructure",
      mysql: "Medium effort, clear path",
      redis: "Paradigm mismatch",
    },
  },
  {
    id: "redis",
    label: "Redis",
    color: "#D82C20",
    icon: "redis",
    compat: {
      postgresql: "Different paradigm",
      mongodb: "Different paradigm",
      mysql: "Different paradigm",
      sqlite: "Different paradigm",
    },
  },
];

export const MS_TYPES = [
  { id: "api", label: "REST API Service", icon: "api", color: "#68D391" },
  {
    id: "worker",
    label: "Background Worker",
    icon: "worker",
    color: "#F6AD55",
  },
  {
    id: "scheduler",
    label: "Cron Scheduler",
    icon: "scheduler",
    color: "#B794F4",
  },
  { id: "gateway", label: "API Gateway", icon: "gateway", color: "#63B3ED" },
  { id: "notif", label: "Notifications", icon: "notif", color: "#FC8181" },
];

export const LOAD_STEPS = [
  {
    label: "Fetching repository info",
    sub: "Reading metadata and default branch",
  },
  { label: "Scanning file structure", sub: "Building recursive file tree" },
  {
    label: "Reading package manifests",
    sub: "Searching all levels of monorepo",
  },
  {
    label: "Scanning config and source",
    sub: "ORM configs, imports, docker-compose",
  },
  { label: "Building architecture graph", sub: "Generating nodes and edges" },
  {
    label: "Gemini fallback if needed",
    sub: "Only when core stack cannot be detected",
  },
];

export const ARCH_GROUPS = [
  { id: "fe_grp", label: "Frontend", nodeIds: ["client"], color: "#61DAFB" },
  { id: "app_grp", label: "Application", nodeIds: ["api"], color: "#68D391" },
  { id: "auth_grp", label: "Auth", nodeIds: ["auth"], color: "#F6AD55" },
  {
    id: "data_grp",
    label: "Data",
    nodeIds: ["db", "cache", "queue"],
    color: "#336791",
  },
  {
    id: "ext_grp",
    label: "External APIs",
    nodeIds: ["ai", "email", "storage", "payment"],
    color: "#74AA9C",
  },
];

export const MOCK_NODES = [
  {
    id: "client",
    x: 35,
    y: 185,
    w: 112,
    h: 46,
    label: "React Client",
    color: "#61DAFB",
    type: "frontend",
  },
  {
    id: "api",
    x: 222,
    y: 185,
    w: 112,
    h: 46,
    label: "Express API",
    color: "#68D391",
    type: "backend",
  },
  {
    id: "auth",
    x: 410,
    y: 85,
    w: 112,
    h: 46,
    label: "Auth Service",
    color: "#F6AD55",
    type: "service",
  },
  {
    id: "db",
    x: 410,
    y: 185,
    w: 112,
    h: 46,
    label: "PostgreSQL",
    color: "#336791",
    type: "database",
    editable: true,
    orm: "Prisma",
  },
  {
    id: "cache",
    x: 410,
    y: 290,
    w: 112,
    h: 46,
    label: "Redis Cache",
    color: "#D82C20",
    type: "cache",
  },
  {
    id: "ai",
    x: 410,
    y: 390,
    w: 112,
    h: 46,
    label: "OpenAI API",
    color: "#74AA9C",
    type: "ai",
    editable: true,
  },
];

export const MOCK_EDGES = [
  { from: "client", to: "api" },
  { from: "api", to: "auth" },
  { from: "api", to: "db" },
  { from: "api", to: "cache" },
  { from: "api", to: "ai" },
];

export const NODE_INFO = {
  client: {
    stats: [
      ["Components", "42"],
      ["Pages", "11"],
      ["Hooks", "18"],
      ["Bundle", "312 KB"],
    ],
    files: ["src/"],
    health: 88,
  },
  api: {
    stats: [
      ["Endpoints", "29"],
      ["Middleware", "7"],
      ["Avg Response", "143 ms"],
      ["Error Rate", "0.8%"],
    ],
    files: ["server.js", "routes/"],
    health: 85,
  },
  auth: {
    stats: [
      ["Strategy", "JWT"],
      ["Token TTL", "15m"],
      ["Refresh", "Enabled"],
      ["2FA", "Optional"],
    ],
    files: ["middleware/auth.js"],
    health: 78,
  },
  cache: {
    stats: [
      ["Hit Rate", "92%"],
      ["Memory", "128 MB"],
      ["TTL", "300 s"],
      ["Keys", "1200"],
    ],
    files: ["config/redis.js"],
    health: 91,
  },
};

export const MOCK_DEPS = [
  {
    name: "express",
    cur: "4.18.2",
    lat: "4.21.0",
    old: true,
    type: "runtime",
    risk: "low",
  },
  {
    name: "react",
    cur: "18.2.0",
    lat: "18.3.1",
    old: true,
    type: "runtime",
    risk: "low",
  },
  {
    name: "jsonwebtoken",
    cur: "9.0.0",
    lat: "9.0.2",
    old: true,
    type: "security",
    risk: "medium",
  },
  {
    name: "helmet",
    cur: "7.1.0",
    lat: "8.0.0",
    old: true,
    type: "security",
    risk: "high",
  },
  {
    name: "bcryptjs",
    cur: "2.4.3",
    lat: "2.4.3",
    old: false,
    type: "security",
    risk: "none",
  },
];

export const TESTS_MOCK = [
  {
    file: "tests/auth.test.js",
    module: "Auth Service",
    cov: 78,
    pass: ["Login success", "Token expiry"],
    miss: ["Password reset", "OAuth callback"],
  },
  {
    file: "tests/products.test.js",
    module: "Products API",
    cov: 45,
    pass: ["Get all", "Get by ID"],
    miss: ["Pagination", "Empty results"],
  },
  {
    file: "tests/cart.test.js",
    module: "Cart Service",
    cov: 31,
    pass: ["Add to cart"],
    miss: ["Quantity exceeds stock", "Cart expiry"],
  },
];

export const HEALTH_MOCK = [
  {
    file: "controllers/orders.js",
    cyc: 18,
    depth: 7,
    lines: 234,
    risk: "high",
    issues: [
      "createOrder has 8 nested conditions",
      "Mixed business logic and DB calls",
    ],
  },
  {
    file: "services/payment.js",
    cyc: 12,
    depth: 5,
    lines: 156,
    risk: "medium",
    issues: ["processPayment should be split"],
  },
  {
    file: "middleware/auth.js",
    cyc: 5,
    depth: 3,
    lines: 67,
    risk: "low",
    issues: [],
  },
];

export const UF_NODES = [
  {
    id: "start",
    cx: 280,
    cy: 25,
    label: "Start",
    color: "#63B3ED",
    shape: "circle",
    r: 13,
  },
  {
    id: "login",
    x: 230,
    y: 62,
    w: 100,
    h: 34,
    label: "Login Page",
    color: "#A0AEC0",
    shape: "rect",
  },
  {
    id: "achk",
    x: 230,
    y: 136,
    w: 100,
    h: 34,
    label: "Auth Check",
    color: "#F6AD55",
    shape: "diamond",
  },
  {
    id: "err",
    x: 85,
    y: 210,
    w: 98,
    h: 34,
    label: "Error: Invalid",
    color: "#FC8181",
    shape: "rect",
  },
  {
    id: "dash",
    x: 230,
    y: 210,
    w: 100,
    h: 34,
    label: "Dashboard",
    color: "#68D391",
    shape: "rect",
  },
  {
    id: "browse",
    x: 95,
    y: 286,
    w: 92,
    h: 34,
    label: "Browse Products",
    color: "#A0AEC0",
    shape: "rect",
  },
  {
    id: "cart",
    x: 228,
    y: 286,
    w: 92,
    h: 34,
    label: "Add to Cart",
    color: "#A0AEC0",
    shape: "rect",
  },
  {
    id: "chk",
    x: 360,
    y: 286,
    w: 92,
    h: 34,
    label: "Checkout",
    color: "#A0AEC0",
    shape: "rect",
  },
  {
    id: "pchk",
    x: 360,
    y: 360,
    w: 92,
    h: 34,
    label: "Payment Check",
    color: "#F6AD55",
    shape: "diamond",
  },
  {
    id: "pok",
    x: 390,
    y: 430,
    w: 92,
    h: 34,
    label: "Order OK",
    color: "#68D391",
    shape: "rect",
  },
];

export const UF_EDGES = [
  { f: "start", t: "login" },
  { f: "login", t: "achk" },
  { f: "achk", t: "err", lbl: "fail" },
  { f: "achk", t: "dash", lbl: "ok" },
  { f: "err", t: "login", lbl: "retry" },
  { f: "dash", t: "browse" },
  { f: "dash", t: "cart" },
  { f: "cart", t: "chk" },
  { f: "chk", t: "pchk" },
  { f: "pchk", t: "pok", lbl: "ok" },
];

export const UF_CODE = {
  login: { file: "src/pages/Login.jsx", line: 1 },
  achk: { file: "middleware/auth.js", line: 23 },
  err: { file: "controllers/auth.js", line: 45 },
  dash: { file: "src/pages/Dashboard.jsx", line: 1 },
  browse: { file: "src/pages/Products.jsx", line: 1 },
  cart: { file: "services/cart.js", line: 12 },
  chk: { file: "src/pages/Checkout.jsx", line: 1 },
  pchk: { file: "services/payment.js", line: 34 },
  pok: { file: "controllers/orders.js", line: 112 },
};

export const LOG_COLORS = {
  info: "#64748B",
  found: "#60A5FA",
  detect: "#34D399",
  graph: "#B794F4",
  edge: "#F6AD55",
  warning: "#FBBF24",
  error: "#F87171",
};

export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Syne:wght@400;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#0D1117}::-webkit-scrollbar-thumb{background:#1E2D40;border-radius:3px}
.bp{background:linear-gradient(135deg,#1E4D8C,#2563EB);border:none;color:#fff;padding:10px 22px;border-radius:7px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;letter-spacing:.4px;transition:all .2s}
.bp:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(37,99,235,.35)}
.bg{background:transparent;border:1px solid #1E2D40;color:#94A3B8;padding:7px 14px;border-radius:6px;cursor:pointer;font-family:inherit;font-size:11px;transition:all .2s}
.bg:hover{border-color:#2D3F55;color:#E2E8F0;background:#0F1925}
.tab{background:transparent;border:none;color:#64748B;padding:9px 13px;cursor:pointer;font-family:inherit;font-size:11px;font-weight:500;border-bottom:2px solid transparent;transition:all .2s;white-space:nowrap;display:flex;align-items:center;gap:6px}
.tab.on{color:#60A5FA;border-bottom-color:#60A5FA}.tab:hover{color:#CBD5E0}
.fade{animation:fi .3s ease}@keyframes fi{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
.pulse{animation:pu 1.8s infinite}@keyframes pu{0%,100%{opacity:1}50%{opacity:.35}}
.spin{animation:sp 1s linear infinite;display:inline-block}@keyframes sp{to{transform:rotate(360deg)}}
.pbar{background:linear-gradient(90deg,#1D4ED8,#60A5FA);border-radius:2px;transition:width .5s ease}
.gsel{filter:drop-shadow(0 0 8px rgba(96,165,250,.65))}
.nh:hover{cursor:pointer;filter:brightness(1.12)}
.card{background:#0B111C;border:1px solid #1A2740;border-radius:9px;padding:14px}
.badge{display:inline-flex;align-items:center;padding:2px 7px;border-radius:12px;font-size:10px;font-weight:600}
.dbo{padding:9px 12px;border-radius:7px;border:1px solid #1A2740;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:9px}
.dbo:hover{border-color:#2D3F55;background:#0F1925}.dbo.sel{border-color:#2563EB;background:rgba(37,99,235,.1)}
.codediff{background:#07090F;border:1px solid #1A2740;border-radius:6px;padding:12px;font-size:10px;line-height:1.85;overflow-x:auto}
.mso{padding:9px 12px;border-radius:7px;border:1px solid #1A2740;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:9px}
.mso:hover{border-color:#2D3F55;background:#0F1925}.mso.sel{border-color:#2563EB;background:rgba(37,99,235,.1)}
`;

export function gc(node) {
  return { x: node.x + (node.w || 0) / 2, y: node.y + (node.h || 0) / 2 };
}

export function ufBottom(node) {
  return node.shape === "circle"
    ? { x: node.cx, y: node.cy + node.r }
    : { x: node.x + (node.w || 0) / 2, y: node.y + (node.h || 0) };
}

export function ufTop(node) {
  return node.shape === "circle"
    ? { x: node.cx, y: node.cy - node.r }
    : { x: node.x + (node.w || 0) / 2, y: node.y };
}

export function renderGroups(nodes) {
  return ARCH_GROUPS.map((group) => {
    const groupedNodes = nodes.filter((node) =>
      group.nodeIds.includes(node.id),
    );
    if (!groupedNodes.length) return null;

    const padX = 16;
    const padY = 14;
    const labelHeight = 15;
    const minX = Math.min(...groupedNodes.map((node) => node.x)) - padX;
    const minY =
      Math.min(...groupedNodes.map((node) => node.y)) - padY - labelHeight;
    const maxX =
      Math.max(...groupedNodes.map((node) => node.x + (node.w || 0))) + padX;
    const maxY =
      Math.max(...groupedNodes.map((node) => node.y + (node.h || 0))) + padY;

    return {
      id: group.id,
      label: group.label,
      color: group.color,
      minX,
      minY,
      maxX,
      maxY,
    };
  }).filter(Boolean);
}

export function wrapNodeLabel(label, maxChars = 14, maxLines = 2) {
  const raw = String(label || "").trim();
  if (!raw) return ["Unnamed"];

  const words = raw.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    if (!line) {
      line = word;
      return;
    }
    const candidate = `${line} ${word}`;
    if (candidate.length <= maxChars) {
      line = candidate;
      return;
    }
    lines.push(line);
    line = word;
  });

  if (line) lines.push(line);
  if (!lines.length) lines.push(raw.slice(0, maxChars));

  if (lines.length > maxLines) {
    const clipped = lines.slice(0, maxLines);
    const last = clipped[maxLines - 1];
    clipped[maxLines - 1] =
      last.length > maxChars - 3
        ? `${last.slice(0, maxChars - 3)}...`
        : `${last}...`;
    return clipped;
  }

  return lines;
}

export function getNodeDisplayMeta(node) {
  const labelLines = wrapNodeLabel(node?.label, 14, 2);
  const typeLine = String(node?.type || "service").replace(/-/g, " ");
  const subtitleLine =
    String(node?.subtitle || "").trim() ||
    (node?.id === "db" && node?.orm ? `via ${node.orm}` : "");

  return { labelLines, typeLine, subtitleLine };
}

export function normalizeLogMessage(msg) {
  return String(msg || "")
    .replace(/â†’/g, "->")
    .replace(/→/g, "->")
    .replace(/â€”/g, "-")
    .replace(/â€¦/g, "...")
    .replace(/�/g, "?");
}
