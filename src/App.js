import React, { useState, useRef } from 'react';

const S = { UP: 'up', LOAD: 'load', DASH: 'dash', DIAG: 'diag' };

const AI_MODELS = [
  {
    id: 'gpt-4o',
    label: 'GPT-4o',
    provider: 'OpenAI',
    color: '#74AA9C',
    rpm: 450,
    acc: 94,
  },
  {
    id: 'gpt-4o-mini',
    label: 'GPT-4o Mini',
    provider: 'OpenAI',
    color: '#52A98B',
    rpm: 120,
    acc: 87,
  },
  {
    id: 'claude-sonnet',
    label: 'Claude Sonnet 4',
    provider: 'Anthropic',
    color: '#C49A6C',
    rpm: 380,
    acc: 96,
  },
  {
    id: 'gemini-flash',
    label: 'Gemini 2.0 Flash',
    provider: 'Google',
    color: '#4285F4',
    rpm: 280,
    acc: 91,
  },
  {
    id: 'llama-3',
    label: 'Llama 3.3 70B',
    provider: 'Meta/Groq',
    color: '#0064E0',
    rpm: 180,
    acc: 88,
  },
];
const DB_OPT = [
  {
    id: 'postgresql',
    label: 'PostgreSQL',
    color: '#336791',
    icon: '🐘',
    compat: {
      mongodb: '⚠ Schema restructure needed',
      mysql: '✓ High — minor syntax diffs',
      sqlite: '✓ Medium — feature subset',
      redis: '✗ Paradigm mismatch',
    },
  },
  {
    id: 'mongodb',
    label: 'MongoDB',
    color: '#4DB33D',
    icon: '🍃',
    compat: {
      postgresql: '⚠ Schema & query rewrite',
      mysql: '⚠ Schema restructure',
      sqlite: '⚠ Schema rewrite',
      redis: '✗ Paradigm mismatch',
    },
  },
  {
    id: 'mysql',
    label: 'MySQL',
    color: '#F29111',
    icon: '🐬',
    compat: {
      postgresql: '✓ High — minor syntax diffs',
      mongodb: '⚠ Schema restructure',
      sqlite: '✓ Medium — clear path',
      redis: '✗ Paradigm mismatch',
    },
  },
  {
    id: 'sqlite',
    label: 'SQLite',
    color: '#0F80CC',
    icon: '📦',
    compat: {
      postgresql: '✓ Medium — clear path',
      mongodb: '⚠ Schema restructure',
      mysql: '✓ Medium — clear path',
      redis: '✗ Paradigm mismatch',
    },
  },
  {
    id: 'redis',
    label: 'Redis',
    color: '#D82C20',
    icon: '⚡',
    compat: {
      postgresql: '✗ Different paradigm',
      mongodb: '✗ Different paradigm',
      mysql: '✗ Different paradigm',
      sqlite: '✗ Different paradigm',
    },
  },
];
const MS_TYPES = [
  { id: 'api', label: 'REST API Service', icon: '🔌', color: '#68D391' },
  { id: 'worker', label: 'Background Worker', icon: '⚙', color: '#F6AD55' },
  { id: 'scheduler', label: 'Cron Scheduler', icon: '⏱', color: '#B794F4' },
  { id: 'gateway', label: 'API Gateway', icon: '🛡', color: '#63B3ED' },
  { id: 'notif', label: 'Notifications', icon: '🔔', color: '#FC8181' },
];
const LOAD_STEPS = [
  {
    label: 'Fetching repository info',
    sub: 'Reading metadata and default branch',
  },
  { label: 'Scanning file structure', sub: 'Building recursive file tree' },
  {
    label: 'Reading all package.json',
    sub: 'Searching all levels of monorepo',
  },
  {
    label: 'Scanning config & source',
    sub: 'ORM configs, imports, docker-compose',
  },
  { label: 'Building architecture graph', sub: 'Generating nodes and edges' },
  {
    label: 'Validating with AI (if needed)',
    sub: 'LLM fallback for low-confidence results',
  },
];
const ARCH_GROUPS = [
  { id: 'fe_grp', label: 'Frontend', nodeIds: ['client'], color: '#61DAFB' },
  { id: 'app_grp', label: 'Application', nodeIds: ['api'], color: '#68D391' },
  { id: 'auth_grp', label: 'Auth', nodeIds: ['auth'], color: '#F6AD55' },
  {
    id: 'data_grp',
    label: 'Data',
    nodeIds: ['db', 'cache', 'queue'],
    color: '#336791',
  },
  {
    id: 'ext_grp',
    label: 'External APIs',
    nodeIds: ['ai', 'email', 'storage', 'payment'],
    color: '#74AA9C',
  },
];
function renderGroups(nodes) {
  return ARCH_GROUPS.map((grp) => {
    const gn = nodes.filter((n) => grp.nodeIds.includes(n.id));
    if (!gn.length) return null;
    const PX = 16,
      PY = 14,
      LH = 15;
    const minX = Math.min(...gn.map((n) => n.x)) - PX,
      minY = Math.min(...gn.map((n) => n.y)) - PY - LH;
    const maxX = Math.max(...gn.map((n) => n.x + (n.w || 0))) + PX,
      maxY = Math.max(...gn.map((n) => n.y + (n.h || 0))) + PY;
    return (
      <g key={grp.id}>
        <rect
          x={minX}
          y={minY}
          width={maxX - minX}
          height={maxY - minY}
          rx="10"
          fill={grp.color}
          fillOpacity="0.05"
          stroke={grp.color}
          strokeOpacity="0.2"
          strokeWidth="1"
          strokeDasharray="5,4"
        />
        <text
          x={minX + 9}
          y={minY + 11}
          fill={grp.color}
          fillOpacity="0.6"
          fontSize="7.5"
          fontWeight="700"
          fontFamily="JetBrains Mono"
          letterSpacing="0.8"
        >
          {grp.label.toUpperCase()}
        </text>
      </g>
    );
  }).filter(Boolean);
}

// ─── MOCK DATA ─────────────────────────────────────────────────────────────
const MOCK_NODES = [
  {
    id: 'client',
    x: 35,
    y: 185,
    w: 112,
    h: 46,
    label: 'React Client',
    color: '#61DAFB',
    type: 'frontend',
  },
  {
    id: 'api',
    x: 222,
    y: 185,
    w: 112,
    h: 46,
    label: 'Express API',
    color: '#68D391',
    type: 'backend',
  },
  {
    id: 'auth',
    x: 410,
    y: 85,
    w: 112,
    h: 46,
    label: 'Auth Service',
    color: '#F6AD55',
    type: 'service',
  },
  {
    id: 'db',
    x: 410,
    y: 185,
    w: 112,
    h: 46,
    label: 'PostgreSQL',
    color: '#336791',
    type: 'database',
    editable: true,
  },
  {
    id: 'cache',
    x: 410,
    y: 290,
    w: 112,
    h: 46,
    label: 'Redis Cache',
    color: '#D82C20',
    type: 'cache',
  },
  {
    id: 'ai',
    x: 410,
    y: 390,
    w: 112,
    h: 46,
    label: 'OpenAI API',
    color: '#74AA9C',
    type: 'ai',
    editable: true,
  },
];
const MOCK_EDGES = [
  { from: 'client', to: 'api' },
  { from: 'api', to: 'auth' },
  { from: 'api', to: 'db' },
  { from: 'api', to: 'cache' },
  { from: 'api', to: 'ai' },
];
const NODE_INFO = {
  client: {
    stats: [
      ['Components', '—'],
      ['Pages', '—'],
      ['Hooks', '—'],
      ['Bundle', '—'],
    ],
    files: ['src/'],
    health: 88,
  },
  api: {
    stats: [
      ['Endpoints', '—'],
      ['Middleware', '—'],
      ['Avg Response', '—'],
      ['Error Rate', '—'],
    ],
    files: ['server.js', 'routes/'],
    health: 85,
  },
  auth: {
    stats: [
      ['Strategy', 'JWT'],
      ['Token TTL', '—'],
      ['Refresh', '—'],
      ['2FA', '—'],
    ],
    files: ['middleware/auth.js'],
    health: 78,
  },
  cache: {
    stats: [
      ['Hit Rate', '—'],
      ['Memory', '—'],
      ['TTL', '—'],
      ['Keys', '—'],
    ],
    files: ['config/redis.js'],
    health: 91,
  },
};
const MOCK_DEPS = [
  {
    name: 'express',
    cur: '4.18.2',
    lat: '4.21.0',
    old: true,
    type: 'runtime',
    risk: 'low',
  },
  {
    name: 'react',
    cur: '18.2.0',
    lat: '18.3.1',
    old: true,
    type: 'runtime',
    risk: 'low',
  },
  {
    name: 'jsonwebtoken',
    cur: '9.0.0',
    lat: '9.0.2',
    old: true,
    type: 'security',
    risk: 'medium',
  },
  {
    name: 'helmet',
    cur: '7.1.0',
    lat: '8.0.0',
    old: true,
    type: 'security',
    risk: 'high',
  },
  {
    name: 'bcryptjs',
    cur: '2.4.3',
    lat: '2.4.3',
    old: false,
    type: 'security',
    risk: 'none',
  },
];
const TESTS_MOCK = [
  {
    file: 'tests/auth.test.js',
    module: 'Auth Service',
    cov: 78,
    pass: ['Login success', 'Token expiry'],
    miss: ['Password reset', 'OAuth callback'],
  },
  {
    file: 'tests/products.test.js',
    module: 'Products API',
    cov: 45,
    pass: ['Get all', 'Get by ID'],
    miss: ['Pagination', 'Empty results'],
  },
  {
    file: 'tests/cart.test.js',
    module: 'Cart Service',
    cov: 31,
    pass: ['Add to cart'],
    miss: ['Qty exceeds stock', 'Cart expiry'],
  },
];
const HEALTH_MOCK = [
  {
    file: 'controllers/orders.js',
    cyc: 18,
    depth: 7,
    lines: 234,
    risk: 'high',
    issues: [
      'createOrder() — 8 nested conditions',
      'Mixed business logic + DB calls',
    ],
  },
  {
    file: 'services/payment.js',
    cyc: 12,
    depth: 5,
    lines: 156,
    risk: 'medium',
    issues: ['processPayment() — consider splitting'],
  },
  {
    file: 'middleware/auth.js',
    cyc: 5,
    depth: 3,
    lines: 67,
    risk: 'low',
    issues: [],
  },
];
const UF_NODES = [
  {
    id: 'start',
    cx: 280,
    cy: 25,
    label: 'Start',
    color: '#63B3ED',
    shape: 'circle',
    r: 13,
  },
  {
    id: 'login',
    x: 230,
    y: 62,
    w: 100,
    h: 34,
    label: 'Login Page',
    color: '#A0AEC0',
    shape: 'rect',
  },
  {
    id: 'achk',
    x: 230,
    y: 136,
    w: 100,
    h: 34,
    label: 'Auth Check',
    color: '#F6AD55',
    shape: 'diamond',
  },
  {
    id: 'err',
    x: 85,
    y: 210,
    w: 98,
    h: 34,
    label: 'Error: Invalid',
    color: '#FC8181',
    shape: 'rect',
  },
  {
    id: 'dash',
    x: 230,
    y: 210,
    w: 100,
    h: 34,
    label: 'Dashboard',
    color: '#68D391',
    shape: 'rect',
  },
  {
    id: 'browse',
    x: 95,
    y: 286,
    w: 92,
    h: 34,
    label: 'Browse Products',
    color: '#A0AEC0',
    shape: 'rect',
  },
  {
    id: 'cart',
    x: 228,
    y: 286,
    w: 92,
    h: 34,
    label: 'Add to Cart',
    color: '#A0AEC0',
    shape: 'rect',
  },
  {
    id: 'chk',
    x: 360,
    y: 286,
    w: 92,
    h: 34,
    label: 'Checkout',
    color: '#A0AEC0',
    shape: 'rect',
  },
  {
    id: 'pchk',
    x: 360,
    y: 360,
    w: 92,
    h: 34,
    label: 'Payment Check',
    color: '#F6AD55',
    shape: 'diamond',
  },
  {
    id: 'pok',
    x: 390,
    y: 430,
    w: 92,
    h: 34,
    label: 'Order OK',
    color: '#68D391',
    shape: 'rect',
  },
];
const UF_EDGES = [
  { f: 'start', t: 'login' },
  { f: 'login', t: 'achk' },
  { f: 'achk', t: 'err', lbl: 'fail' },
  { f: 'achk', t: 'dash', lbl: 'ok' },
  { f: 'err', t: 'login', lbl: 'retry' },
  { f: 'dash', t: 'browse' },
  { f: 'dash', t: 'cart' },
  { f: 'cart', t: 'chk' },
  { f: 'chk', t: 'pchk' },
  { f: 'pchk', t: 'pok', lbl: 'ok' },
];
const UF_CODE = {
  login: { file: 'src/pages/Login.jsx', line: 1 },
  achk: { file: 'middleware/auth.js', line: 23 },
  err: { file: 'controllers/auth.js', line: 45 },
  dash: { file: 'src/pages/Dashboard.jsx', line: 1 },
  browse: { file: 'src/pages/Products.jsx', line: 1 },
  cart: { file: 'services/cart.js', line: 12 },
  chk: { file: 'src/pages/Checkout.jsx', line: 1 },
  pchk: { file: 'services/payment.js', line: 34 },
  pok: { file: 'controllers/orders.js', line: 112 },
};

// ═══════════════════════════════════════════════════════════════════════════
//  ANALYSIS ENGINE v4 — Multi-package + Config scan + Source scan + LLM fallback
// ═══════════════════════════════════════════════════════════════════════════

function parseGitHubUrl(raw) {
  const cleaned = raw
    .trim()
    .replace(/\.git$/, '')
    .replace(/\/$/, '');
  const m = cleaned.match(/github\.com[/:]+([^/]+)\/([^/\s]+)/);
  return m ? { owner: m[1], repo: m[2] } : null;
}

async function ghFetch(url, token) {
  const headers = { Accept: 'application/vnd.github.v3+json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const r = await fetch(url, { headers });
  if (r.status === 403)
    throw new Error(
      'GitHub rate limit (60 req/hr unauthenticated). Add a GitHub token or wait ~1h.'
    );
  if (r.status === 404) throw new Error('Repository not found or private.');
  if (!r.ok) throw new Error(`GitHub API error ${r.status}`);
  return r.json();
}

async function ghFetchText(url, token) {
  const headers = { Accept: 'application/vnd.github.v3.raw' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const r = await fetch(url, { headers });
  if (!r.ok) return null;
  return r.text();
}

async function fetchLatestVersion(name) {
  try {
    const r = await fetch(
      `https://cdn.jsdelivr.net/npm/${encodeURIComponent(name)}/package.json`
    );
    if (!r.ok) return null;
    return (await r.json()).version || null;
  } catch {
    return null;
  }
}

function isOutdated(cur, lat) {
  if (!cur || !lat) return false;
  const n = (v) =>
    v
      .replace(/^[^0-9]*/, '')
      .split('-')[0]
      .split('.')
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
      name
    )
  )
    return 'dev';
  if (
    /eslint|prettier|typescript|babel|webpack|vite|rollup|esbuild|nodemon|ts-node|tsx|concurrently|rimraf/.test(
      name
    )
  )
    return 'dev';
  if (
    /passport|bcrypt|jsonwebtoken|helmet|cors|csrf|sanitize|validator|jose|argon2/.test(
      name
    )
  )
    return 'security';
  return 'runtime';
}

// ─── DOCKER-COMPOSE PARSER ─────────────────────────────────────────────────
function parseDockerCompose(content, addLog) {
  const found = {},
    lower = content.toLowerCase();
  const imgs = [...lower.matchAll(/image:\s*["']?([^\s"'\n]+)/g)];
  imgs.forEach((m) => {
    const img = m[1].split(':')[0];
    if (/redis/.test(img)) {
      found.redis = true;
      addLog('detect', 'docker-compose: Redis');
    }
    if (/mongo/.test(img)) {
      found.mongodb = true;
      addLog('detect', 'docker-compose: MongoDB');
    }
    if (/postgres/.test(img)) {
      found.postgresql = true;
      addLog('detect', 'docker-compose: PostgreSQL');
    }
    if (/mysql|mariadb/.test(img)) {
      found.mysql = true;
      addLog('detect', 'docker-compose: MySQL/MariaDB');
    }
    if (/rabbitmq/.test(img)) {
      found.rabbitmq = true;
      addLog('detect', 'docker-compose: RabbitMQ');
    }
    if (/kafka|zookeeper/.test(img)) {
      found.kafka = true;
      addLog('detect', 'docker-compose: Kafka');
    }
    if (/elasticsearch/.test(img)) {
      found.elasticsearch = true;
      addLog('detect', 'docker-compose: Elasticsearch');
    }
    if (/nginx/.test(img)) {
      found.nginx = true;
      addLog('detect', 'docker-compose: Nginx');
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

// ─── SOURCE FILE IMPORT SCANNER ────────────────────────────────────────────
// Scans actual source file content for import/require statements
// Used when a backend exists (folder present) but has no package.json
function detectFromSourceContent(content, filePath, addLog) {
  const found = {};
  const lower = content.toLowerCase();

  // Normalize: handle both import/require patterns
  const hasImport = (...patterns) =>
    patterns.some((p) => {
      const re = new RegExp(
        `(require|from)\\s*['"\`]${p.replace(/\//g, '/')}`,
        'i'
      );
      return re.test(content);
    });

  // Backend frameworks
  if (hasImport('express')) {
    found.backend = { type: 'express', label: 'Express API', color: '#68D391' };
    addLog('detect', `[${filePath}] import express`);
  }
  if (hasImport('@nestjs/core', '@nestjs/common')) {
    found.backend = { type: 'nest', label: 'NestJS API', color: '#E0234E' };
    addLog('detect', `[${filePath}] nestjs`);
  }
  if (hasImport('fastify')) {
    found.backend = { type: 'fastify', label: 'Fastify API', color: '#808080' };
    addLog('detect', `[${filePath}] fastify`);
  }
  if (hasImport('koa')) {
    found.backend = { type: 'koa', label: 'Koa API', color: '#33333D' };
    addLog('detect', `[${filePath}] koa`);
  }
  if (hasImport('hono')) {
    found.backend = { type: 'hono', label: 'Hono API', color: '#E36002' };
    addLog('detect', `[${filePath}] hono`);
  }

  // Database drivers/ORMs
  if (hasImport('sequelize', 'sequelize-typescript')) {
    found.orm = { type: 'sequelize', label: 'Sequelize' };
    addLog('detect', `[${filePath}] sequelize`);
  }
  if (hasImport('typeorm', '@typeorm')) {
    found.orm = { type: 'typeorm', label: 'TypeORM' };
    addLog('detect', `[${filePath}] typeorm`);
  }
  if (hasImport('prisma/@prisma', '@prisma/client')) {
    found.orm = { type: 'prisma', label: 'Prisma' };
    addLog('detect', `[${filePath}] prisma`);
  }
  if (hasImport('drizzle-orm')) {
    found.orm = { type: 'drizzle', label: 'Drizzle' };
    addLog('detect', `[${filePath}] drizzle-orm`);
  }
  if (hasImport('mongoose')) {
    found.database = { type: 'mongodb', label: 'MongoDB', color: '#4DB33D' };
    addLog('detect', `[${filePath}] mongoose → MongoDB`);
  }
  if (hasImport('mysql2', 'mysql')) {
    found.database = { type: 'mysql', label: 'MySQL', color: '#F29111' };
    addLog('detect', `[${filePath}] mysql2 → MySQL`);
  }
  if (hasImport('better-sqlite3', 'sqlite3')) {
    found.database = { type: 'sqlite', label: 'SQLite', color: '#0F80CC' };
    addLog('detect', `[${filePath}] sqlite`);
  }
  if (hasImport('ioredis', 'redis')) {
    found.cache = { type: 'redis', label: 'Redis Cache', color: '#D82C20' };
    addLog('detect', `[${filePath}] redis`);
  }
  if (hasImport('firebase', 'firebase-admin', '@firebase/app')) {
    found.firebase = true;
    addLog('detect', `[${filePath}] firebase`);
  }
  if (hasImport('@supabase/supabase-js')) {
    found.database = { type: 'supabase', label: 'Supabase', color: '#3ECF8E' };
    addLog('detect', `[${filePath}] supabase`);
  }

  // Auth
  if (hasImport('passport')) {
    found.auth = { type: 'passport', label: 'Passport.js', color: '#35DF79' };
    addLog('detect', `[${filePath}] passport`);
  }
  if (hasImport('jsonwebtoken', 'jose')) {
    found.auth = { type: 'jwt', label: 'JWT Auth', color: '#F6AD55' };
    addLog('detect', `[${filePath}] jsonwebtoken`);
  }
  if (hasImport('next-auth', '@auth/core')) {
    found.auth = { type: 'nextauth', label: 'NextAuth.js', color: '#6C47FF' };
    addLog('detect', `[${filePath}] next-auth`);
  }
  if (hasImport('@clerk/')) {
    found.auth = { type: 'clerk', label: 'Clerk Auth', color: '#6C47FF' };
    addLog('detect', `[${filePath}] clerk`);
  }
  if (hasImport('express-openid-connect', '@auth0/')) {
    found.auth = { type: 'auth0', label: 'Auth0', color: '#EB5424' };
    addLog('detect', `[${filePath}] auth0`);
  }

  // AI
  if (hasImport('openai')) {
    found.ai = { type: 'openai', label: 'OpenAI API', color: '#74AA9C' };
    addLog('detect', `[${filePath}] openai`);
  }
  if (hasImport('@anthropic-ai/sdk')) {
    found.ai = { type: 'anthropic', label: 'Anthropic API', color: '#C49A6C' };
    addLog('detect', `[${filePath}] anthropic`);
  }
  if (hasImport('@google/generative-ai')) {
    found.ai = { type: 'google', label: 'Gemini API', color: '#4285F4' };
    addLog('detect', `[${filePath}] gemini`);
  }

  // Look for DB connection strings in content
  if (/mysql:\/\/|MYSQL_/.test(content)) {
    if (!found.database)
      found.database = { type: 'mysql', label: 'MySQL', color: '#F29111' };
  }
  if (/mongodb:\/\/|MONGO_URI/.test(content)) {
    if (!found.database)
      found.database = { type: 'mongodb', label: 'MongoDB', color: '#4DB33D' };
  }
  if (/redis:\/\/|REDIS_/.test(content)) {
    if (!found.cache)
      found.cache = { type: 'redis', label: 'Redis Cache', color: '#D82C20' };
  }
  if (/postgresql:\/\/|postgres:\/\//.test(content)) {
    if (!found.database)
      found.database = {
        type: 'postgresql',
        label: 'PostgreSQL',
        color: '#336791',
      };
  }

  return found;
}

// ─── CONFIG FILE SCANNER ───────────────────────────────────────────────────
// Checks for ORM config files, prisma schema, etc — no package.json needed
function detectFromConfigFilename(filePath, addLog) {
  const f = filePath.toLowerCase();
  const found = {};
  if (/\.sequelizerc$|sequelize\.config\.(js|ts|json)$/.test(f)) {
    found.orm = { type: 'sequelize', label: 'Sequelize' };
    addLog('detect', `Config file: ${filePath} → Sequelize`);
  }
  if (/ormconfig\.(json|js|ts|yml|yaml)$/.test(f)) {
    found.orm = { type: 'typeorm', label: 'TypeORM' };
    addLog('detect', `Config file: ${filePath} → TypeORM`);
  }
  if (/prisma\/schema\.prisma$/.test(f)) {
    found.orm = { type: 'prisma', label: 'Prisma' };
    addLog('detect', `Config file: ${filePath} → Prisma schema`);
  }
  if (/drizzle\.config\.(ts|js)$/.test(f)) {
    found.orm = { type: 'drizzle', label: 'Drizzle' };
    addLog('detect', `Config file: ${filePath} → Drizzle`);
  }
  if (/knexfile\.(ts|js)$/.test(f)) {
    found.orm = { type: 'knex', label: 'Knex.js' };
    addLog('detect', `Config file: ${filePath} → Knex`);
  }
  if (/firebase\.(json|rc)$|\.firebaserc$/.test(f)) {
    found.firebase = true;
    addLog('detect', `Config file: ${filePath} → Firebase`);
  }
  if (/mongoose\.config|mongo\.config/.test(f)) {
    found.database = { type: 'mongodb', label: 'MongoDB', color: '#4DB33D' };
    addLog('detect', `Config file: ${filePath} → MongoDB`);
  }
  return found;
}

// ─── DETECT FROM SINGLE DEPS OBJECT ───────────────────────────────────────
function detectFromDeps(deps, devDeps, context, addLog) {
  const all = { ...deps, ...devDeps };
  const has = (...libs) => libs.find((l) => all[l]);
  const det = {};

  // Frontend
  if (has('next')) {
    det.frontend = {
      type: 'next',
      lib: 'next',
      ver: all['next'],
      label: 'Next.js',
      color: '#E2E8F0',
    };
    addLog('detect', `[${context}] next@${all['next'] || '?'}`);
  } else if (has('@remix-run/react')) {
    det.frontend = { type: 'remix', label: 'Remix', color: '#E8F4FF' };
    addLog('detect', `[${context}] remix`);
  } else if (has('nuxt', '@nuxt/core')) {
    det.frontend = { type: 'nuxt', label: 'Nuxt.js', color: '#00DC82' };
    addLog('detect', `[${context}] nuxt`);
  } else if (has('react', 'react-dom')) {
    det.frontend = {
      type: 'react',
      lib: 'react',
      ver: all['react'],
      label: 'React Client',
      color: '#61DAFB',
    };
    addLog('detect', `[${context}] react@${all['react'] || '?'}`);
  } else if (has('vue', '@vue/core')) {
    det.frontend = { type: 'vue', label: 'Vue Client', color: '#42B883' };
    addLog('detect', `[${context}] vue`);
  } else if (has('@angular/core')) {
    det.frontend = { type: 'angular', label: 'Angular App', color: '#DD0031' };
    addLog('detect', `[${context}] angular`);
  } else if (has('svelte')) {
    det.frontend = { type: 'svelte', label: 'Svelte App', color: '#FF3E00' };
    addLog('detect', `[${context}] svelte`);
  } else if (has('astro')) {
    det.frontend = { type: 'astro', label: 'Astro Site', color: '#FF5D01' };
    addLog('detect', `[${context}] astro`);
  }

  // Backend — only if not fullstack
  if (!['next', 'remix', 'nuxt'].includes(det.frontend?.type)) {
    if (has('@nestjs/core')) {
      det.backend = {
        type: 'nest',
        lib: '@nestjs/core',
        label: 'NestJS API',
        color: '#E0234E',
      };
      addLog('detect', `[${context}] nestjs`);
    } else if (has('express')) {
      det.backend = {
        type: 'express',
        lib: 'express',
        ver: all['express'],
        label: 'Express API',
        color: '#68D391',
      };
      addLog('detect', `[${context}] express@${all['express'] || '?'}`);
    } else if (has('fastify')) {
      det.backend = { type: 'fastify', label: 'Fastify API', color: '#808080' };
      addLog('detect', `[${context}] fastify`);
    } else if (has('koa')) {
      det.backend = { type: 'koa', label: 'Koa API', color: '#33333D' };
      addLog('detect', `[${context}] koa`);
    } else if (has('hono')) {
      det.backend = { type: 'hono', label: 'Hono API', color: '#E36002' };
      addLog('detect', `[${context}] hono`);
    } else if (has('elysia')) {
      det.backend = { type: 'elysia', label: 'Elysia API', color: '#B966E7' };
      addLog('detect', `[${context}] elysia`);
    } else if (has('@trpc/server')) {
      det.backend = { type: 'trpc', label: 'tRPC Server', color: '#398CCB' };
      addLog('detect', `[${context}] trpc`);
    }
  }

  // Database
  if (has('@supabase/supabase-js')) {
    det.database = { type: 'supabase', label: 'Supabase', color: '#3ECF8E' };
    addLog('detect', `[${context}] supabase`);
  } else if (has('@neondatabase/serverless')) {
    det.database = { type: 'neon', label: 'Neon DB', color: '#00E5BF' };
    addLog('detect', `[${context}] neon`);
  } else if (has('mongoose', 'mongodb')) {
    const l = has('mongoose', 'mongodb');
    det.database = { type: 'mongodb', label: 'MongoDB', color: '#4DB33D' };
    addLog('detect', `[${context}] ${l} → MongoDB`);
  } else if (has('mysql2', 'mysql')) {
    det.database = { type: 'mysql', label: 'MySQL', color: '#F29111' };
    addLog('detect', `[${context}] mysql`);
  } else if (has('better-sqlite3', 'sqlite3')) {
    det.database = { type: 'sqlite', label: 'SQLite', color: '#0F80CC' };
    addLog('detect', `[${context}] sqlite`);
  } else if (has('@libsql/client')) {
    det.database = { type: 'turso', label: 'Turso', color: '#4FF8D2' };
    addLog('detect', `[${context}] turso`);
  } else if (has('@planetscale/database')) {
    det.database = {
      type: 'planetscale',
      label: 'PlanetScale',
      color: '#F8F8F8',
    };
    addLog('detect', `[${context}] planetscale`);
  }

  const ormLib = has('@prisma/client', 'prisma')
    ? 'prisma'
    : has('drizzle-orm')
    ? 'drizzle'
    : has('sequelize', 'sequelize-typescript')
    ? 'sequelize'
    : has('typeorm', '@typeorm/core')
    ? 'typeorm'
    : has('objection', 'knex')
    ? 'knex'
    : null;
  if (ormLib) {
    det.orm = {
      type: ormLib,
      label: ormLib.charAt(0).toUpperCase() + ormLib.slice(1),
    };
    addLog('detect', `[${context}] ${ormLib} ORM`);
  }
  if (!det.database && ormLib && ormLib !== 'knex') {
    det.database = {
      type: 'postgresql',
      label: 'PostgreSQL',
      color: '#336791',
      inferred: true,
    };
    addLog('detect', `[${context}] Inferred PostgreSQL from ${ormLib}`);
  }
  if (!det.database && has('p' + 'g', 'postgres', '@vercel/postgres')) {
    const l = has('p' + 'g', 'postgres', '@vercel/postgres');
    det.database = {
      type: 'postgresql',
      label: 'PostgreSQL',
      color: '#336791',
    };
    addLog('detect', `[${context}] ${l} → PostgreSQL`);
  }

  // Infer DB type from ORM + specific driver combos
  if (
    det.orm?.type === 'sequelize' &&
    has('mysql2', 'mysql') &&
    !det.database?.type
  ) {
    det.database = { type: 'mysql', label: 'MySQL', color: '#F29111' };
    addLog('detect', `[${context}] Sequelize + mysql2 → MySQL`);
  }
  if (det.orm?.type === 'sequelize' && has('p' + 'g') && !det.database?.type) {
    det.database = {
      type: 'postgresql',
      label: 'PostgreSQL',
      color: '#336791',
    };
    addLog('detect', `[${context}] Sequelize + postgres-driver → PostgreSQL`);
  }

  // Cache/Queue
  if (has('ioredis', 'redis', '@upstash/redis', '@redis/client')) {
    const l = has('ioredis', 'redis', '@upstash/redis', '@redis/client');
    det.cache = { type: 'redis', label: 'Redis Cache', color: '#D82C20' };
    addLog('detect', `[${context}] ${l} → Redis`);
  }
  if (has('bull', 'bullmq', 'amqplib', 'amqp-connection-manager', 'kafkajs')) {
    const l = has('bull', 'bullmq', 'amqplib', 'kafkajs');
    const ql =
      l === 'kafkajs'
        ? 'Kafka'
        : l?.includes('amqp')
        ? 'RabbitMQ'
        : 'Bull Queue';
    det.queue = { type: 'queue', label: ql, color: '#F59E0B' };
    addLog('detect', `[${context}] ${l} → ${ql}`);
  }

  // AI
  if (has('openai')) {
    det.ai = { type: 'openai', label: 'OpenAI API', color: '#74AA9C' };
    addLog('detect', `[${context}] openai`);
  } else if (has('@anthropic-ai/sdk')) {
    det.ai = { type: 'anthropic', label: 'Anthropic API', color: '#C49A6C' };
    addLog('detect', `[${context}] anthropic`);
  } else if (has('@google/generative-ai')) {
    det.ai = { type: 'google', label: 'Gemini API', color: '#4285F4' };
    addLog('detect', `[${context}] gemini`);
  } else if (has('ai')) {
    det.ai = { type: 'vercel_ai', label: 'Vercel AI SDK', color: '#8B8B8B' };
    addLog('detect', `[${context}] vercel ai`);
  } else if (has('langchain', '@langchain/core')) {
    det.ai = { type: 'langchain', label: 'LangChain', color: '#1C3C3C' };
    addLog('detect', `[${context}] langchain`);
  } else if (has('groq-sdk', 'groq')) {
    det.ai = { type: 'groq', label: 'Groq API', color: '#F55036' };
    addLog('detect', `[${context}] groq`);
  } else if (has('@huggingface/inference')) {
    det.ai = { type: 'hf', label: 'HuggingFace', color: '#FFD21E' };
    addLog('detect', `[${context}] huggingface`);
  }

  // Auth
  if (has('next-auth', '@auth/core', '@auth/nextjs')) {
    det.auth = { type: 'nextauth', label: 'NextAuth.js', color: '#6C47FF' };
    addLog('detect', `[${context}] next-auth`);
  } else if (
    has(
      '@clerk/nextjs',
      '@clerk/clerk-sdk-node',
      '@clerk/backend',
      '@clerk/express'
    )
  ) {
    det.auth = { type: 'clerk', label: 'Clerk Auth', color: '#6C47FF' };
    addLog('detect', `[${context}] clerk`);
  } else if (
    has(
      '@auth0/nextjs-auth0',
      '@auth0/auth0-react',
      'express-openid-connect',
      '@auth0/express'
    )
  ) {
    det.auth = { type: 'auth0', label: 'Auth0', color: '#EB5424' };
    addLog('detect', `[${context}] auth0`);
  } else if (has('passport')) {
    det.auth = { type: 'passport', label: 'Passport.js', color: '#35DF79' };
    addLog('detect', `[${context}] passport`);
  } else if (has('lucia')) {
    det.auth = { type: 'lucia', label: 'Lucia Auth', color: '#5F9EA0' };
    addLog('detect', `[${context}] lucia`);
  } else if (has('better-auth')) {
    det.auth = { type: 'better-auth', label: 'Better Auth', color: '#7C3AED' };
    addLog('detect', `[${context}] better-auth`);
  } else if (has('jsonwebtoken', 'jose')) {
    det.auth = { type: 'jwt', label: 'JWT Auth', color: '#F6AD55' };
    addLog('detect', `[${context}] jsonwebtoken → JWT`);
  }

  // Firebase (covers DB+Auth+Storage)
  if (has('firebase', 'firebase-admin', '@firebase/app')) {
    const l = has('firebase', 'firebase-admin', '@firebase/app');
    det.firebase = true;
    addLog('detect', `[${context}] ${l} → Firebase`);
    if (!det.database) {
      det.database = {
        type: 'firestore',
        label: 'Firestore',
        color: '#FF6D00',
        inferred: true,
      };
      addLog('detect', `[${context}] Inferred Firestore from Firebase`);
    }
    if (!det.auth) {
      det.auth = {
        type: 'firebase_auth',
        label: 'Firebase Auth',
        color: '#FF6D00',
      };
      addLog('detect', `[${context}] Inferred Firebase Auth`);
    }
  }

  // Extra services
  if (has('@aws-sdk/client-s3', '@aws-sdk/s3-client')) {
    det.storage = { label: 'AWS S3', color: '#FF9900' };
    addLog('detect', `[${context}] aws s3`);
  } else if (has('cloudinary')) {
    det.storage = { label: 'Cloudinary', color: '#3448C5' };
    addLog('detect', `[${context}] cloudinary`);
  } else if (has('uploadthing')) {
    det.storage = { label: 'UploadThing', color: '#EF4444' };
    addLog('detect', `[${context}] uploadthing`);
  }
  if (has('stripe', '@stripe/stripe-js')) {
    det.payment = { label: 'Stripe', color: '#635BFF' };
    addLog('detect', `[${context}] stripe`);
  }
  if (has('resend', '@sendgrid/mail', 'nodemailer', 'postmark')) {
    const l = has('resend', '@sendgrid/mail', 'nodemailer', 'postmark');
    det.email = {
      label:
        l === 'resend'
          ? 'Resend'
          : l === 'nodemailer'
          ? 'Nodemailer'
          : l?.includes('sendgrid')
          ? 'SendGrid'
          : 'Email',
      color: '#63B3ED',
    };
    addLog('detect', `[${context}] ${l} → Email`);
  }

  det.typescript = !!all['typescript'];
  det.tailwind = !!(
    all['tailwindcss'] ||
    all['@tailwindcss/vite'] ||
    all['@tailwindcss/postcss']
  );
  return det;
}

// ─── SMART MERGE ──────────────────────────────────────────────────────────
function mergeDetected(results, addLog) {
  const merged = {};
  results.forEach((r) => {
    Object.entries(r).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (!merged[k]) {
        merged[k] = v;
        return;
      }
      // Booleans: OR
      if (typeof v === 'boolean') {
        merged[k] = merged[k] || v;
        return;
      }
      // Backend: explicit beats api-routes inference
      if (
        k === 'backend' &&
        merged[k]?.type?.endsWith('_api') &&
        !v?.type?.endsWith('_api')
      ) {
        addLog('detect', `Upgraded backend: API Routes → ${v.label}`);
        merged[k] = v;
        return;
      }
      // Database: non-inferred beats inferred
      if (k === 'database' && merged[k]?.inferred && !v?.inferred) {
        addLog('detect', `Upgraded DB: inferred → ${v.label}`);
        merged[k] = v;
        return;
      }
      // ORM: keep first
    });
  });
  return merged;
}

// ─── BUILD GRAPH ──────────────────────────────────────────────────────────
function buildGraph(detected, addLog) {
  const nodes = [],
    edges = [],
    COL = { left: 35, mid: 222, right: 410 };
  let rightY = 75;
  if (detected.frontend) {
    const isFS = ['next', 'remix', 'nuxt'].includes(detected.frontend.type);
    nodes.push({
      id: 'client',
      x: COL.left,
      y: 185,
      w: 112,
      h: 46,
      label: detected.frontend.label,
      color: detected.frontend.color,
      type: isFS ? 'fullstack' : 'frontend',
    });
    addLog('graph', `Node: "${detected.frontend.label}" → LEFT`);
  }
  if (detected.backend) {
    nodes.push({
      id: 'api',
      x: COL.mid,
      y: 185,
      w: 112,
      h: 46,
      label: detected.backend.label,
      color: detected.backend.color,
      type: 'backend',
    });
    addLog('graph', `Node: "${detected.backend.label}" → MIDDLE`);
  }
  const svcs = [
    detected.auth && {
      id: 'auth',
      label: detected.auth.label,
      color: detected.auth.color,
      type: 'service',
    },
    detected.database && {
      id: 'db',
      label: detected.database.label,
      color: detected.database.color,
      type: 'database',
      editable: true,
      orm: detected.orm?.label,
    },
    detected.cache && {
      id: 'cache',
      label: detected.cache.label,
      color: detected.cache.color,
      type: 'cache',
    },
    detected.queue && {
      id: 'queue',
      label: detected.queue.label,
      color: detected.queue.color,
      type: 'queue',
    },
    detected.ai && {
      id: 'ai',
      label: detected.ai.label,
      color: detected.ai.color,
      type: 'ai',
      editable: true,
    },
    detected.email && {
      id: 'email',
      label: detected.email.label,
      color: detected.email.color,
      type: 'service',
    },
    detected.storage && {
      id: 'storage',
      label: detected.storage.label,
      color: detected.storage.color,
      type: 'storage',
    },
    detected.payment && {
      id: 'payment',
      label: detected.payment.label,
      color: detected.payment.color,
      type: 'payment',
    },
  ].filter(Boolean);
  svcs.forEach((s) => {
    nodes.push({ ...s, x: COL.right, y: rightY, w: 112, h: 46 });
    addLog('graph', `Node: "${s.label}" → RIGHT y=${rightY}`);
    rightY += 105;
  });
  const hn = (id) => nodes.find((n) => n.id === id);
  if (hn('client') && hn('api')) {
    edges.push({ from: 'client', to: 'api' });
    addLog('edge', 'client → api');
  }
  ['auth', 'db', 'cache', 'queue', 'ai', 'email', 'storage', 'payment'].forEach(
    (id) => {
      if (hn('api') && hn(id)) {
        edges.push({ from: 'api', to: id });
        addLog('edge', `api → ${id}`);
      } else if (hn('client') && hn(id) && !hn('api')) {
        edges.push({ from: 'client', to: id });
        addLog('edge', `client → ${id}`);
      }
    }
  );
  addLog('info', `Graph: ${nodes.length} nodes, ${edges.length} edges`);
  return { nodes, edges };
}

// ─── MODULE DETECTION ─────────────────────────────────────────────────────
function detectModules(allFiles, addLog) {
  const IGNORE = new Set([
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    '.nuxt',
    'out',
    '.vercel',
    '.turbo',
    'coverage',
    '.cache',
    'public',
    'static',
    'assets',
    'images',
    'fonts',
    '.github',
    '.vscode',
    'vendor',
  ]);
  const MONO = new Set([
    'src',
    'app',
    'packages',
    'libs',
    'modules',
    'apps',
    'services',
    'projects',
  ]);
  const KNOWN = new Set([
    'components',
    'pages',
    'hooks',
    'utils',
    'lib',
    'api',
    'routes',
    'controllers',
    'models',
    'services',
    'middleware',
    'config',
    'store',
    'context',
    'layouts',
    'views',
    'features',
    'helpers',
    'types',
    'schemas',
    'validators',
    'guards',
    'filters',
    'resolvers',
    'adapters',
    'dto',
    'entities',
    'repositories',
    'jobs',
    'tasks',
    'queues',
    'events',
    'migrations',
    'seeders',
    'tests',
    '__tests__',
    'spec',
    'e2e',
    'mocks',
    'core',
    'shared',
    'common',
  ]);
  const src = allFiles.filter(
    (p) =>
      /\.(js|jsx|ts|tsx|mjs|cjs)$/.test(p) &&
      !/(node_modules|\/dist\/|\/build\/|\.min\.|\/coverage\/|\/\.next\/)/.test(
        p
      )
  );
  const map = {};
  const add = (k) => {
    map[k] = (map[k] || 0) + 1;
  };
  src.forEach((path) => {
    const parts = path.split('/');
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
        add(parts.slice(0, i + 1).join('/'));
    }
  });
  const sorted = Object.entries(map)
    .filter(([, c]) => c >= 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24);
  addLog(
    'info',
    `Modules (${sorted.length}): ${sorted
      .slice(0, 8)
      .map(([n, c]) => `${n}(${c})`)
      .join(', ')}`
  );
  return sorted;
}

// ─── LLM FALLBACK (Anthropic claude-haiku-4-5) ────────────────────────────
// Called only when confidence is low (< 2 nodes detected)
// Uses the Anthropic API available in Claude artifacts
async function llmFallback(repoInfo, allFiles, allDeps, addLog) {
  addLog(
    'info',
    '⚡ LLM fallback triggered — static analysis returned < 2 nodes'
  );

  // Summarize file tree for the LLM (top 60 paths, exclude node_modules etc)
  const relevantFiles = allFiles
    .filter((f) => !/(node_modules|dist\/|\.next\/|build\/)/.test(f))
    .slice(0, 60);

  const depsList = Object.keys(allDeps).slice(0, 50).join(', ') || '(none)';
  const filesSummary = relevantFiles.join('\n');

  const prompt = `You are analyzing a GitHub repository to detect its tech stack for an architecture diagram.

Repository: ${repoInfo.full_name}
Description: ${repoInfo.description || '(none)'}
Primary language: ${repoInfo.language || 'unknown'}

File tree (first 60 relevant files):
${filesSummary}

Dependencies found in package.json files:
${depsList}

Based on this information, identify the tech stack. Respond ONLY with a valid JSON object (no markdown, no explanation):
{
  "frontend": null or {"label": "React Client", "type": "react", "color": "#61DAFB"},
  "backend": null or {"label": "Express API", "type": "express", "color": "#68D391"},
  "database": null or {"label": "MySQL", "type": "mysql", "color": "#F29111"},
  "cache": null or {"label": "Redis Cache", "type": "redis", "color": "#D82C20"},
  "auth": null or {"label": "JWT Auth", "type": "jwt", "color": "#F6AD55"},
  "ai": null,
  "queue": null,
  "reasoning": "brief explanation of what clues you used"
}

Use ONLY technologies clearly evident from the file tree or description. Do not guess.`;

  const t0 = Date.now();
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      addLog(
        'warning',
        `LLM API error ${response.status} — falling back to partial results`
      );
      return null;
    }

    const data = await response.json();
    const elapsed = Date.now() - t0;
    const inputTokens = data.usage?.input_tokens || 0;
    const outputTokens = data.usage?.output_tokens || 0;
    const totalTokens = inputTokens + outputTokens;
    // claude-haiku pricing: $0.80/1M input, $4.00/1M output (as of 2025)
    const costUSD = (inputTokens * 0.8 + outputTokens * 4.0) / 1_000_000;

    addLog(
      'info',
      `LLM response: ${elapsed}ms · ${inputTokens} input + ${outputTokens} output = ${totalTokens} tokens · cost: $${costUSD.toFixed(
        5
      )}`
    );

    const text = data.content?.[0]?.text || '';
    // Strip any markdown fences
    const jsonStr = text.replace(/```json?|```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    addLog('detect', `LLM reasoning: ${parsed.reasoning || '(none)'}`);

    // Build a detected object from LLM result
    const llmDetected = {};
    const colorMap = {
      react: '#61DAFB',
      next: '#E2E8F0',
      vue: '#42B883',
      angular: '#DD0031',
      svelte: '#FF3E00',
      astro: '#FF5D01',
      express: '#68D391',
      nest: '#E0234E',
      fastify: '#808080',
      koa: '#33333D',
      hono: '#E36002',
      postgresql: '#336791',
      mongodb: '#4DB33D',
      mysql: '#F29111',
      sqlite: '#0F80CC',
      redis: '#D82C20',
      firebase: '#FF6D00',
      jwt: '#F6AD55',
      nextauth: '#6C47FF',
      clerk: '#6C47FF',
      auth0: '#EB5424',
      openai: '#74AA9C',
      anthropic: '#C49A6C',
    };

    ['frontend', 'backend', 'database', 'cache', 'auth', 'ai', 'queue'].forEach(
      (key) => {
        if (parsed[key] && typeof parsed[key] === 'object') {
          const v = parsed[key];
          if (!v.color && v.type && colorMap[v.type])
            v.color = colorMap[v.type];
          llmDetected[key] = v;
          addLog('detect', `LLM detected ${key}: ${v.label}`);
        }
      }
    );

    return llmDetected;
  } catch (e) {
    addLog('warning', `LLM fallback failed: ${e.message}`);
    return null;
  }
}

// ─── MAIN ANALYZER ────────────────────────────────────────────────────────
export async function analyzeGitHubRepo(owner, repo, onProgress, token) {
  const log = [];
  const addLog = (type, msg) => log.push({ type, msg });

  // Step 1: Repo info
  onProgress('Fetching repository info...', 8);
  const repoInfo = await ghFetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    token
  );
  const branch = repoInfo.default_branch;
  addLog(
    'info',
    `Repo: ${repoInfo.full_name} · branch: ${branch} · lang: ${
      repoInfo.language || '?'
    } · ⭐${repoInfo.stargazers_count}`
  );
  addLog('info', `Description: ${repoInfo.description || '(none)'}`);

  // Step 2: File tree
  onProgress('Scanning file structure...', 18);
  const treeData = await ghFetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    token
  );
  const allFiles = (treeData.tree || [])
    .filter((f) => f.type === 'blob')
    .map((f) => f.path);
  addLog(
    'info',
    `File tree: ${allFiles.length} files${
      treeData.truncated ? ' ⚠ truncated' : ''
    }`
  );

  // Step 3: Find ALL package.json (up to depth 5, skip node_modules)
  onProgress('Reading all package.json files...', 28);
  const pkgPaths = allFiles
    .filter(
      (p) =>
        p.endsWith('package.json') &&
        !p.endsWith('package-lock.json') &&
        !/(node_modules|\.cache|\.next|dist\/)/.test(p) &&
        p.split('/').length <= 5
    )
    .slice(0, 12);
  addLog(
    'info',
    `package.json files found (${pkgPaths.length}): ${
      pkgPaths.join(', ') || 'none'
    }`
  );

  const allDeps = {},
    allDevDeps = {},
    pkgMeta = [];
  const perPkgResults = [];
  const catPkg = (path) => {
    if (path === 'package.json') return 'root';
    const t = path.split('/')[0].toLowerCase();
    if (/(client|frontend|web|ui|app|next)/.test(t)) return 'frontend';
    if (/(server|backend|api|service|express)/.test(t)) return 'backend';
    return 'other';
  };

  for (const pkgPath of pkgPaths) {
    try {
      const data = await ghFetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${pkgPath}?ref=${branch}`,
        token
      );
      const pkg = JSON.parse(atob(data.content.replace(/\s/g, '')));
      const deps = pkg.dependencies || {},
        devDeps = pkg.devDependencies || {};
      if (Object.keys(deps).length === 0 && Object.keys(devDeps).length === 0) {
        addLog(
          'found',
          `${pkgPath} → "${pkg.name || '?'}" — empty workspace root, skipping`
        );
        continue;
      }
      Object.assign(allDeps, deps);
      Object.assign(allDevDeps, devDeps);
      pkgMeta.push({ name: pkg.name, version: pkg.version, path: pkgPath });
      const cat = catPkg(pkgPath);
      addLog(
        'found',
        `${pkgPath} [${cat}] → "${pkg.name || '?'}" — ${
          Object.keys(deps).length
        } deps, ${Object.keys(devDeps).length} devDeps`
      );
      const partial = detectFromDeps(deps, devDeps, pkgPath, addLog);
      partial._cat = cat;
      perPkgResults.push(partial);
    } catch (e) {
      addLog('warning', `Could not parse ${pkgPath}: ${e.message}`);
    }
  }

  // Step 4: Config files + docker-compose + source scanning
  onProgress('Scanning config files & source...', 42);

  // 4a. Config filename hints (ORM configs, firebase.json, etc.)
  const configResults = [];
  allFiles.forEach((f) => {
    const r = detectFromConfigFilename(f, addLog);
    if (Object.keys(r).length > 0) configResults.push(r);
  });

  // 4b. Docker-compose
  let dockerServices = {};
  const composeFile = allFiles.find(
    (f) =>
      /^docker-compose(\.dev|\.prod|\.override)?\.ya?ml$/.test(
        f.split('/').pop()
      ) && f.split('/').length <= 3
  );
  if (composeFile) {
    try {
      const rawResp = await ghFetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${composeFile}?ref=${branch}`,
        token
      );
      const rawContent = decodeURIComponent(escape(atob(rawResp.content)));
      dockerServices = parseDockerCompose(rawContent, addLog);
      addLog(
        'found',
        `${composeFile} → docker services: ${
          Object.keys(dockerServices).join(', ') || 'none'
        }`
      );
    } catch (e) {
      addLog('warning', `docker-compose parse failed: ${e.message}`);
    }
  }

  // 4c. Source file scanning — scan key backend files when no backend pkg.json found
  const hasBackendPkg = perPkgResults.some(
    (r) => r._cat === 'backend' && r.backend
  );
  const backendFolderNames = [
    'server',
    'backend',
    'api',
    'express-server',
    'node-server',
    'services',
    'src',
  ];
  const backendFiles = allFiles.filter((f) => {
    const parts = f.split('/');
    return (
      parts.length >= 2 &&
      backendFolderNames.includes(parts[0].toLowerCase()) &&
      /\.(ts|js|mjs)$/.test(f) &&
      !/(node_modules|dist\/|test)/.test(f)
    );
  });

  if (!hasBackendPkg && backendFiles.length > 0) {
    addLog(
      'info',
      `No backend package.json — scanning ${Math.min(
        backendFiles.length,
        5
      )} source files for imports`
    );
    const toScan = backendFiles.slice(0, 5);
    const sourceResults = [];
    for (const filePath of toScan) {
      try {
        const content = await ghFetchText(
          `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
          token
        );
        if (content) {
          const r = detectFromSourceContent(content, filePath, addLog);
          if (Object.keys(r).length > 0) sourceResults.push(r);
        }
      } catch (e) {
        addLog('warning', `Could not fetch ${filePath}: ${e.message}`);
      }
    }
    if (sourceResults.length > 0) perPkgResults.push(...sourceResults);
    // Also infer backend exists from folder structure
    if (!perPkgResults.some((r) => r.backend)) {
      addLog(
        'detect',
        `Backend folder "${
          backendFiles[0]?.split('/')[0]
        }" found with JS/TS files → infer Node.js server`
      );
      perPkgResults.push({
        backend: { type: 'node', label: 'Node.js Server', color: '#68D391' },
        _cat: 'backend',
      });
    }
  }

  // 4d. Scan .env.example or .env.sample for technology hints
  const envFile = allFiles.find(
    (f) =>
      /\.(env\.example|env\.sample|env\.local\.example)$/.test(f) ||
      f === '.env.example'
  );
  if (envFile) {
    try {
      const content = await ghFetchText(
        `https://api.github.com/repos/${owner}/${repo}/contents/${envFile}?ref=${branch}`,
        token
      );
      if (content) {
        addLog('info', `Scanning ${envFile} for connection string hints`);
        const r = detectFromSourceContent(content, envFile, addLog);
        if (Object.keys(r).length > 0) configResults.push(r);
      }
    } catch (e) {}
  }

  // Step 5: Merge everything
  onProgress('Detecting tech stack...', 58);

  const dockerResult = {};
  if (dockerServices.redis && !perPkgResults.some((r) => r.cache)) {
    dockerResult.cache = {
      type: 'redis',
      label: 'Redis Cache',
      color: '#D82C20',
    };
    addLog('detect', 'Promoted Redis from docker-compose');
  }
  if (
    dockerServices.mongodb &&
    !perPkgResults.some((r) => r.database?.type === 'mongodb')
  ) {
    dockerResult.database = {
      type: 'mongodb',
      label: 'MongoDB',
      color: '#4DB33D',
    };
    addLog('detect', 'Promoted MongoDB from docker-compose');
  }
  if (dockerServices.postgresql && !perPkgResults.some((r) => r.database)) {
    dockerResult.database = {
      type: 'postgresql',
      label: 'PostgreSQL',
      color: '#336791',
    };
    addLog('detect', 'Promoted PostgreSQL from docker-compose');
  }
  if (dockerServices.mysql && !perPkgResults.some((r) => r.database)) {
    dockerResult.database = { type: 'mysql', label: 'MySQL', color: '#F29111' };
    addLog('detect', 'Promoted MySQL from docker-compose');
  }
  if (dockerServices.rabbitmq) {
    dockerResult.queue = { type: 'queue', label: 'RabbitMQ', color: '#FF6600' };
    addLog('detect', 'Promoted RabbitMQ from docker-compose');
  }
  if (dockerServices.kafka) {
    dockerResult.queue = { type: 'queue', label: 'Kafka', color: '#231F20' };
    addLog('detect', 'Promoted Kafka from docker-compose');
  }

  const hasDocker = allFiles.some(
    (f) =>
      f === 'Dockerfile' ||
      f.startsWith('Dockerfile.') ||
      f === 'docker-compose.yml' ||
      f === 'docker-compose.yaml'
  );
  const hasTS =
    allFiles.some((f) => f === 'tsconfig.json') ||
    !!allDeps['typescript'] ||
    !!allDevDeps['typescript'];
  dockerResult.docker = hasDocker;
  dockerResult.typescript = hasTS;

  const frontendResults = perPkgResults.filter((r) => r._cat === 'frontend');
  const backendResults = perPkgResults.filter(
    (r) => r._cat === 'backend' || r._cat === 'other'
  );

  let detected = mergeDetected(
    [...frontendResults, ...backendResults, ...configResults, dockerResult],
    addLog
  );

  // Handle fullstack + separate backend
  if (detected.frontend?.type === 'next') {
    const explicitBackend = backendResults.find(
      (r) => r.backend && !r.backend.type?.endsWith('_api')
    )?.backend;
    if (explicitBackend) {
      detected.backend = explicitBackend;
      addLog('detect', 'Monorepo: Next.js frontend + separate backend');
    } else {
      detected.backend = {
        type: 'next_api',
        label: 'API Routes',
        color: '#60A5FA',
      };
    }
  }

  // ORM-to-DB inference: if we have ORM but DB was not determined, check all deps
  if (detected.orm && !detected.database) {
    const ormType = detected.orm.type;
    if (ormType === 'sequelize') {
      if (allDeps['mysql2'] || allDeps['mysql']) {
        detected.database = { type: 'mysql', label: 'MySQL', color: '#F29111' };
        addLog('detect', 'Sequelize + mysql2 in combined deps → MySQL');
      } else if (allDeps['p' + 'g']) {
        detected.database = {
          type: 'postgresql',
          label: 'PostgreSQL',
          color: '#336791',
        };
        addLog(
          'detect',
          'Sequelize + postgres driver in combined deps → PostgreSQL'
        );
      } else {
        detected.database = {
          type: 'postgresql',
          label: 'PostgreSQL',
          color: '#336791',
          inferred: true,
        };
        addLog('detect', 'Sequelize detected → inferred PostgreSQL');
      }
    }
    if (ormType === 'typeorm' && !detected.database) {
      detected.database = {
        type: 'postgresql',
        label: 'PostgreSQL',
        color: '#336791',
        inferred: true,
      };
      addLog('detect', 'TypeORM → inferred PostgreSQL');
    }
  }

  // Fallback: if still no backend but we know backend folder exists
  if (
    !detected.backend &&
    !detected.frontend &&
    hasBackendPkg === false &&
    backendFiles.length > 0
  ) {
    detected.backend = {
      type: 'node',
      label: 'Node.js Server',
      color: '#68D391',
    };
    addLog(
      'detect',
      'Fallback: Node.js backend inferred from folder structure'
    );
  }

  detected.typescript = hasTS;

  // Step 6: Build graph
  onProgress('Building architecture graph...', 72);
  const { nodes, edges } = buildGraph(detected, addLog);

  // Step 7: LLM fallback — only if < 2 nodes AND no obvious reason
  const needsLLM = nodes.length < 2;
  if (needsLLM) {
    onProgress('Validating with AI fallback...', 85);
    addLog(
      'info',
      '⚠ Static analysis found <2 nodes — calling LLM for assistance'
    );
    const llmDetected = await llmFallback(repoInfo, allFiles, allDeps, addLog);
    if (llmDetected && Object.keys(llmDetected).length > 0) {
      const merged = mergeDetected([detected, llmDetected], addLog);
      Object.assign(detected, merged);
      const { nodes: n2, edges: e2 } = buildGraph(detected, addLog);
      if (n2.length > nodes.length) {
        nodes.splice(0, nodes.length, ...n2);
        edges.splice(0, edges.length, ...e2);
        addLog('info', `LLM improved graph: ${nodes.length} nodes`);
      }
    }
  } else {
    addLog(
      'info',
      '✓ Static analysis sufficient — LLM not needed (0 tokens, $0.00000)'
    );
  }

  // Step 8: Stats + npm versions
  onProgress('Checking latest npm versions...', 90);
  const testFiles = allFiles.filter(
    (p) =>
      /\.(test|spec)\.(js|ts|jsx|tsx|mjs)$/.test(p) || p.includes('__tests__')
  );
  const srcFiles2 = allFiles.filter(
    (p) =>
      /\.(js|jsx|ts|tsx|mjs)$/.test(p) &&
      !/(node_modules|dist\/|build\/|\.next\/)/.test(p)
  );
  const modules = detectModules(allFiles, addLog);

  const rawDeps = [
    ...Object.entries(allDeps).map(([name, ver]) => ({
      name,
      cur: ver.replace(/^[^0-9]*/, '').split(/[ |]/)[0] || ver,
      type: classifyDep(name),
      isDevDep: false,
    })),
    ...Object.entries(allDevDeps).map(([name, ver]) => ({
      name,
      cur: ver.replace(/^[^0-9]*/, '').split(/[ |]/)[0] || ver,
      type: 'dev',
      isDevDep: true,
    })),
  ];

  addLog(
    'info',
    `Fetching latest versions for ${rawDeps.length} packages via jsdelivr...`
  );
  const latestResults = await Promise.allSettled(
    rawDeps.map((d) =>
      fetchLatestVersion(d.name).then((v) => ({ name: d.name, latest: v }))
    )
  );
  const latestMap = {};
  let fetched = 0;
  latestResults.forEach((r) => {
    if (r.status === 'fulfilled' && r.value?.latest) {
      latestMap[r.value.name] = r.value.latest;
      fetched++;
    }
  });
  addLog('info', `npm versions fetched: ${fetched}/${rawDeps.length}`);

  const deps = rawDeps.map((d) => {
    const lat = latestMap[d.name] || d.cur;
    const old = isOutdated(d.cur, lat);
    const risk =
      old && d.type === 'security'
        ? 'high'
        : old && d.type === 'runtime'
        ? 'low'
        : old
        ? 'medium'
        : 'none';
    return { ...d, lat, old, risk };
  });
  const outdatedCount = deps.filter((d) => d.old).length;
  addLog('info', `Outdated: ${outdatedCount}/${deps.length} packages`);
  addLog('info', 'Analysis complete.');
  onProgress('Done!', 100);

  return {
    nodes,
    edges,
    debugLog: log,
    detected,
    deps,
    stats: {
      repoName: repoInfo.name,
      repoFullName: repoInfo.full_name,
      pkgName: pkgMeta[0]?.name || repoInfo.name,
      language: repoInfo.language || 'JavaScript',
      stars: repoInfo.stargazers_count,
      totalFiles: allFiles.length,
      srcFiles: srcFiles2.length,
      testFiles: testFiles.length,
      modules: modules.length,
      moduleList: modules.map(([n]) => n),
      totalDeps: Object.keys(allDeps).length,
      devDeps: Object.keys(allDevDeps).length,
      outdatedDeps: outdatedCount,
      typescript: !!detected.typescript,
      docker: hasDocker,
      orm: detected.orm?.label || null,
      llmUsed: needsLLM,
    },
  };
}

function gc(n) {
  return { x: n.x + (n.w || 0) / 2, y: n.y + (n.h || 0) / 2 };
}
function ufBottom(n) {
  return n.shape === 'circle'
    ? { x: n.cx, y: n.cy + n.r }
    : { x: n.x + (n.w || 0) / 2, y: n.y + (n.h || 0) };
}
function ufTop(n) {
  return n.shape === 'circle'
    ? { x: n.cx, y: n.cy - n.r }
    : { x: n.x + (n.w || 0) / 2, y: n.y };
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Syne:wght@400;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#0D1117}::-webkit-scrollbar-thumb{background:#1E2D40;border-radius:3px}
.bp{background:linear-gradient(135deg,#1E4D8C,#2563EB);border:none;color:#fff;padding:10px 22px;border-radius:7px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;letter-spacing:.4px;transition:all .2s}
.bp:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(37,99,235,.35)}
.bg{background:transparent;border:1px solid #1E2D40;color:#94A3B8;padding:7px 14px;border-radius:6px;cursor:pointer;font-family:inherit;font-size:11px;transition:all .2s}
.bg:hover{border-color:#2D3F55;color:#E2E8F0;background:#0F1925}
.tab{background:transparent;border:none;color:#64748B;padding:9px 13px;cursor:pointer;font-family:inherit;font-size:11px;font-weight:500;border-bottom:2px solid transparent;transition:all .2s;white-space:nowrap}
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

const LOG_COLORS = {
  info: '#64748B',
  found: '#60A5FA',
  detect: '#34D399',
  graph: '#B794F4',
  edge: '#F6AD55',
  warning: '#FBBF24',
  error: '#F87171',
};

export default function App() {
  const [screen, setScreen] = useState(S.UP);
  const [tab, setTab] = useState('architecture');
  const [selNode, setSelNode] = useState(null);
  const [nodes, setNodes] = useState(MOCK_NODES);
  const [edges, setEdges] = useState(MOCK_EDGES);
  const [curDb, setCurDb] = useState('postgresql');
  const [curAI, setCurAI] = useState('gpt-4o');
  const [converting, setConverting] = useState(false);
  const [convDone, setConvDone] = useState(false);
  const [swapAI, setSwapAI] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [showMS, setShowMS] = useState(false);
  const [msType, setMsType] = useState(null);
  const [msName, setMsName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [depFilter, setDepFilter] = useState('all');
  const [selDep, setSelDep] = useState(null);
  const [selUF, setSelUF] = useState(null);
  const [selTest, setSelTest] = useState(null);
  const [selHealth, setSelHealth] = useState(null);
  const [apiKeyEdit, setApiKeyEdit] = useState(false);
  const [apiKeyVal, setApiKeyVal] = useState('sk-proj-••••••••••••••••••••••');
  const [githubUrl, setGithubUrl] = useState('');
  const [ghToken, setGhToken] = useState('');
  const [loadMsg, setLoadMsg] = useState('');
  const [loadPct, setLoadPct] = useState(0);
  const [realData, setRealData] = useState(null);
  const [analyzeErr, setAnalyzeErr] = useState('');
  const fileRef = useRef();

  const curDbObj = DB_OPT.find((d) => d.id === curDb);
  const curAIObj = AI_MODELS.find((m) => m.id === curAI);
  const displayDeps = realData ? realData.deps : MOCK_DEPS;
  const displayStats = realData
    ? realData.stats
    : {
        repoName: 'demo-project',
        totalFiles: 47,
        srcFiles: 32,
        testFiles: 4,
        modules: 8,
        moduleList: [
          'src',
          'routes',
          'controllers',
          'models',
          'middleware',
          'services',
          'tests',
          'config',
        ],
        totalDeps: 18,
        devDeps: 9,
        outdatedDeps: 3,
      };

  const handleAnalyze = async () => {
    const parsed = parseGitHubUrl(githubUrl);
    if (!parsed) {
      setAnalyzeErr('Invalid URL. Example: https://github.com/owner/repo');
      return;
    }
    setAnalyzeErr('');
    setLoadMsg('Starting...');
    setLoadPct(0);
    setScreen(S.LOAD);
    try {
      const data = await analyzeGitHubRepo(
        parsed.owner,
        parsed.repo,
        (msg, pct) => {
          setLoadMsg(msg);
          setLoadPct(pct);
        },
        ghToken.trim() || undefined
      );
      setRealData(data);
      setNodes(data.nodes.length > 0 ? data.nodes : MOCK_NODES);
      setEdges(data.edges.length > 0 ? data.edges : MOCK_EDGES);
      setScreen(S.DASH);
      setTab('architecture');
    } catch (e) {
      setAnalyzeErr(e.message);
      setScreen(S.UP);
    }
  };

  const doDbSwap = (id) => {
    if (id === curDb || converting) return;
    setConverting(true);
    setConvDone(false);
    setTimeout(() => {
      const d = DB_OPT.find((x) => x.id === id);
      setCurDb(id);
      setNodes((p) =>
        p.map((n) =>
          n.id === 'db' ? { ...n, label: d.label, color: d.color } : n
        )
      );
      setConverting(false);
      setConvDone(true);
    }, 2300);
  };
  const doAISwap = (id) => {
    if (id === curAI || swapAI) return;
    setSwapAI(true);
    setAiDone(false);
    setTimeout(() => {
      const m = AI_MODELS.find((x) => x.id === id);
      setCurAI(id);
      setNodes((p) =>
        p.map((n) =>
          n.id === 'ai' ? { ...n, label: m.label, color: m.color } : n
        )
      );
      setSwapAI(false);
      setAiDone(true);
    }, 1800);
  };
  const addMS = () => {
    if (!msType || !msName.trim()) return;
    const t = MS_TYPES.find((x) => x.id === msType);
    const id = 'ms_' + Date.now();
    const mc = nodes.filter((n) => n.type === 'microservice').length;
    setNodes((p) => [
      ...p,
      {
        id,
        x: 35 + mc * 140,
        y: Math.max(...p.map((n) => n.y + n.h)) + 30,
        w: 120,
        h: 46,
        label: msName.trim(),
        color: t.color,
        type: 'microservice',
        msType,
      },
    ]);
    setEdges((p) => [...p, { from: 'api', to: id }]);
    setShowMS(false);
    setMsName('');
    setMsType(null);
  };
  const doRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2200);
  };
  const reset = () => {
    setScreen(S.UP);
    setConvDone(false);
    setAiDone(false);
    setSelNode(null);
    setNodes(MOCK_NODES);
    setEdges(MOCK_EDGES);
    setCurDb('postgresql');
    setCurAI('gpt-4o');
    setShowMS(false);
    setSelUF(null);
    setSelTest(null);
    setSelHealth(null);
    setSelDep(null);
    setRealData(null);
    setGithubUrl('');
    setAnalyzeErr('');
    setGhToken('');
    setLoadPct(0);
  };

  const filtDeps = displayDeps.filter((d) =>
    depFilter === 'all'
      ? true
      : depFilter === 'outdated'
      ? d.old
      : d.type === depFilter
  );

  // ── NAV: shows "← Dashboard" from diagram editor, "← New Analysis" from dashboard/load
  const Nav = () => (
    <nav
      style={{
        borderBottom: '1px solid #111D2E',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 52,
        background: '#07090F',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 24,
            height: 24,
            background: 'linear-gradient(135deg,#1D4ED8,#60A5FA)',
            borderRadius: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
          }}
        >
          ⬡
        </div>
        <span
          style={{
            fontFamily: "'Syne',sans-serif",
            fontWeight: 800,
            fontSize: 14,
            letterSpacing: '-.5px',
          }}
        >
          CodeLens<span style={{ color: '#60A5FA' }}>AI</span>
        </span>
        <span
          style={{
            fontSize: 9,
            background: 'rgba(96,165,250,.12)',
            color: '#60A5FA',
            border: '1px solid rgba(96,165,250,.2)',
            borderRadius: 4,
            padding: '1px 5px',
            marginLeft: 3,
          }}
        >
          BETA
        </span>
      </div>
      <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
        {/* From DIAG → back to Dashboard, not New Analysis */}
        {screen === S.DIAG && (
          <button className="bg" onClick={() => setScreen(S.DASH)}>
            ← Dashboard
          </button>
        )}
        {/* From DASH or LOAD → back to upload */}
        {(screen === S.DASH || screen === S.LOAD) && (
          <button className="bg" onClick={reset}>
            ← New Analysis
          </button>
        )}
        {screen === S.DASH && (
          <button
            className="bg"
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
            onClick={doRefresh}
          >
            <span className={refreshing ? 'spin' : ''}>
              {refreshing ? '↻' : '🔄'}
            </span>
            {refreshing ? 'Syncing...' : 'Sync Git'}
          </button>
        )}
        {/* Removed: ✏ Diagram Editor button — users click nodes or Edit Visually in the arch tab */}
      </div>
    </nav>
  );

  const MSModal = () =>
    !showMS ? null : (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setShowMS(false);
        }}
      >
        <div
          className="fade card"
          style={{ width: 400, border: '1px solid #2563EB' }}
        >
          <div
            style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 3,
            }}
          >
            Add Microservice
          </div>
          <div style={{ fontSize: 10, color: '#64748B', marginBottom: 14 }}>
            Will be containerized with Docker automatically
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 6,
              marginBottom: 12,
            }}
          >
            {MS_TYPES.map((t) => (
              <div
                key={t.id}
                className={`mso ${msType === t.id ? 'sel' : ''}`}
                onClick={() => setMsType(t.id)}
              >
                <span style={{ fontSize: 14 }}>{t.icon}</span>
                <span
                  style={{
                    fontSize: 10,
                    color: msType === t.id ? t.color : '#94A3B8',
                    fontWeight: 600,
                  }}
                >
                  {t.label}
                </span>
              </div>
            ))}
          </div>
          <input
            value={msName}
            onChange={(e) => setMsName(e.target.value)}
            placeholder="e.g. notification-service"
            style={{
              width: '100%',
              background: '#07090F',
              border: '1px solid #1A2740',
              borderRadius: 6,
              padding: '8px 11px',
              color: '#E2E8F0',
              fontFamily: 'inherit',
              fontSize: 11,
              outline: 'none',
              marginBottom: 12,
            }}
          />
          {msType && msName && (
            <div className="fade codediff" style={{ marginBottom: 12 }}>
              <span style={{ color: '#64748B' }}>
                {'// Dockerfile — auto-generated'}
              </span>
              <br />
              <span style={{ color: '#60A5FA' }}>FROM</span>{' '}
              <span style={{ color: '#34D399' }}>node:20-alpine</span>
              <br />
              <span style={{ color: '#60A5FA' }}>WORKDIR</span>{' '}
              <span style={{ color: '#E2E8F0' }}>
                {'/app/' + msName.toLowerCase().replace(/\s/g, '-')}
              </span>
              <br />
              <span style={{ color: '#60A5FA' }}>EXPOSE</span>{' '}
              <span style={{ color: '#FBBF24' }}>3001</span>
              <br />
              <span style={{ color: '#60A5FA' }}>CMD</span>{' '}
              <span style={{ color: '#E2E8F0' }}>{'["node","index.js"]'}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 7 }}>
            <button
              className="bp"
              style={{ flex: 1, padding: '8px', fontSize: 11 }}
              onClick={addMS}
            >
              Add to Architecture
            </button>
            <button
              className="bg"
              style={{ padding: '8px 12px', fontSize: 11 }}
              onClick={() => setShowMS(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );

  // ─── UPLOAD ───
  if (screen === S.UP)
    return (
      <div
        style={{
          fontFamily: "'JetBrains Mono',monospace",
          background: '#07090F',
          minHeight: '100vh',
          color: '#E2E8F0',
        }}
      >
        <style>{CSS}</style>
        <Nav />
        <div
          className="fade"
          style={{ maxWidth: 620, margin: '0 auto', padding: '64px 24px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: '3px',
                color: '#60A5FA',
                textTransform: 'uppercase',
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              DevTools · Innovation Labs 2026
            </div>
            <h1
              style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: 38,
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-2px',
                marginBottom: 12,
              }}
            >
              Understand any codebase
              <br />
              <span style={{ color: '#60A5FA' }}>in 60 seconds.</span>
            </h1>
            <p style={{ color: '#64748B', fontSize: 13, lineHeight: 1.7 }}>
              Paste a public GitHub URL to get an automatic architecture
              diagram, dependency analysis and tech stack detection — no setup
              required.
            </p>
          </div>
          <div
            style={{
              background: '#0B111C',
              border: '1px solid #1A2740',
              borderRadius: 10,
              padding: '20px',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: '#60A5FA',
                fontWeight: 600,
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              🔗 GitHub Repository
            </div>
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: analyzeErr ? 10 : 0,
              }}
            >
              <input
                value={githubUrl}
                onChange={(e) => {
                  setGithubUrl(e.target.value);
                  setAnalyzeErr('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                placeholder="https://github.com/owner/repository"
                style={{
                  flex: 1,
                  background: '#07090F',
                  border: `1px solid ${analyzeErr ? '#F87171' : '#1A2740'}`,
                  borderRadius: 7,
                  padding: '10px 13px',
                  color: '#E2E8F0',
                  fontFamily: 'inherit',
                  fontSize: 12,
                  outline: 'none',
                }}
              />
              <button
                className="bp"
                style={{ padding: '10px 18px', fontSize: 12 }}
                onClick={handleAnalyze}
              >
                Analyze →
              </button>
            </div>
            {analyzeErr && (
              <div style={{ fontSize: 11, color: '#F87171', marginTop: 6 }}>
                ⚠ {analyzeErr}
              </div>
            )}
            <div style={{ fontSize: 10, color: '#334155', marginTop: 10 }}>
              Any public GitHub repo with package.json · JS/TS · No auth
              required
            </div>
          </div>

          {/* Optional GitHub token for higher rate limit */}
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 10,
                color: '#64748B',
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ color: '#FBBF24' }}>⚡</span>
              Optional: GitHub token for 5,000 req/hr (vs 60 without)
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#60A5FA', fontSize: 9, marginLeft: 'auto' }}
              >
                Generate token →
              </a>
            </div>
            <input
              value={ghToken}
              onChange={(e) => setGhToken(e.target.value)}
              placeholder="ghp_xxxx... (Personal Access Token — stored only in browser)"
              type="password"
              style={{
                width: '100%',
                background: '#07090F',
                border: '1px solid #1A2740',
                borderRadius: 7,
                padding: '9px 13px',
                color: '#E2E8F0',
                fontFamily: 'inherit',
                fontSize: 11,
                outline: 'none',
              }}
            />
          </div>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: '2px dashed #1A2740',
              borderRadius: 10,
              padding: '22px 24px',
              textAlign: 'center',
              cursor: 'not-allowed',
              background: '#0B111C',
              opacity: 0.5,
              marginBottom: 24,
              position: 'relative',
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".zip"
              style={{ display: 'none' }}
            />
            <div style={{ fontSize: 24, marginBottom: 6 }}>📁</div>
            <div style={{ fontWeight: 600, marginBottom: 3, fontSize: 13 }}>
              Drop project ZIP here
            </div>
            <div style={{ fontSize: 10, color: '#334155' }}>
              ZIP parsing coming in v2
            </div>
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 10,
                fontSize: 9,
                color: '#60A5FA',
                background: 'rgba(96,165,250,.1)',
                border: '1px solid rgba(96,165,250,.2)',
                borderRadius: 4,
                padding: '1px 6px',
              }}
            >
              SOON
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
            {[
              ['⚡', '~15–30 sec', 'avg analysis'],
              ['🔒', 'Zero storage', 'code never sent'],
              ['🌐', 'JS · TS · Node', 'supported'],
            ].map(([ic, t, s]) => (
              <div key={t} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, marginBottom: 2 }}>{ic}</div>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{t}</div>
                <div style={{ fontSize: 10, color: '#334155' }}>{s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

  // ─── LOADING ───
  if (screen === S.LOAD) {
    const activeStep = Math.min(5, Math.floor(loadPct / 17));
    return (
      <div
        style={{
          fontFamily: "'JetBrains Mono',monospace",
          background: '#07090F',
          minHeight: '100vh',
          color: '#E2E8F0',
        }}
      >
        <style>{CSS}</style>
        <Nav />
        <div
          className="fade"
          style={{ maxWidth: 480, margin: '0 auto', padding: '64px 24px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div
              style={{
                fontSize: 10,
                color: '#60A5FA',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: 9,
              }}
            >
              Analyzing
            </div>
            <div
              style={{
                fontFamily: "'Syne',sans-serif",
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 5,
                wordBreak: 'break-all',
              }}
            >
              {githubUrl.replace('https://github.com/', '')}
            </div>
            <div style={{ color: '#334155', fontSize: 11 }}>{loadMsg}</div>
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div
              style={{
                height: 3,
                background: '#111D2E',
                marginBottom: 18,
                borderRadius: 2,
              }}
            >
              <div
                className="pbar"
                style={{ height: '100%', width: `${loadPct}%` }}
              />
            </div>
            {LOAD_STEPS.map((s, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  marginBottom: i < LOAD_STEPS.length - 1 ? 14 : 0,
                  opacity: i < activeStep ? 1 : i === activeStep ? 0.8 : 0.18,
                  transition: 'opacity .4s',
                }}
              >
                <div
                  style={{
                    width: 17,
                    height: 17,
                    borderRadius: '50%',
                    border: `2px solid ${
                      i < activeStep
                        ? '#34D399'
                        : i === activeStep
                        ? '#60A5FA'
                        : '#1E2D40'
                    }`,
                    background: i < activeStep ? '#34D399' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 1,
                    fontSize: 8,
                  }}
                >
                  {i < activeStep ? (
                    '✓'
                  ) : i === activeStep ? (
                    <span
                      className="spin"
                      style={{
                        width: 6,
                        height: 6,
                        border: '2px solid #60A5FA',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                      }}
                    />
                  ) : (
                    ''
                  )}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: i < activeStep ? '#34D399' : '#E2E8F0',
                    }}
                  >
                    {s.label}
                  </div>
                  <div style={{ fontSize: 10, color: '#334155', marginTop: 2 }}>
                    {s.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              textAlign: 'center',
              fontSize: 10,
              color: '#1E2D40',
              marginTop: 14,
            }}
          >
            {loadPct}% complete
          </div>
        </div>
      </div>
    );
  }

  // ─── DASHBOARD ───
  if (screen === S.DASH) {
    const isReal = !!realData;
    const totalCov = Math.round(
      TESTS_MOCK.reduce((a, t) => a + t.cov, 0) / TESTS_MOCK.length
    );
    const TABS_LIST = [
      ['architecture', '🗺 Architecture'],
      ['narrative', '📖 Narrative'],
      ['entry-points', '⚡ Entry Points'],
      ['tech-stack', '🛠 Tech Stack'],
      ['dependencies', '📦 Dependencies'],
      ['tests', '🧪 Tests'],
      ['user-flow', '🔀 User Flow'],
      ['code-health', '💊 Code Health'],
      ['debug', '🔍 Analysis Log'],
    ];

    // SVG viewBox height for diagram
    const svgH = Math.max(420, Math.max(...nodes.map((n) => n.y + n.h)) + 70);

    return (
      <div
        style={{
          fontFamily: "'JetBrains Mono',monospace",
          background: '#07090F',
          minHeight: '100vh',
          color: '#E2E8F0',
        }}
      >
        <style>{CSS}</style>
        <Nav />
        <MSModal />
        <div
          className="fade"
          style={{ maxWidth: 1100, margin: '0 auto', padding: '22px' }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 16,
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 19,
                    fontWeight: 800,
                  }}
                >
                  {displayStats.repoName || 'demo-project'}
                </span>
                {isReal && (
                  <span
                    className="badge"
                    style={{
                      background: 'rgba(52,211,153,.1)',
                      color: '#34D399',
                      border: '1px solid rgba(52,211,153,.2)',
                    }}
                  >
                    {displayStats.language}
                    {displayStats.typescript ? ' · TS' : ''}
                  </span>
                )}
                {isReal && displayStats.stars > 0 && (
                  <span
                    className="badge"
                    style={{
                      background: 'rgba(251,191,36,.1)',
                      color: '#FBBF24',
                      border: '1px solid rgba(251,191,36,.2)',
                    }}
                  >
                    ⭐ {displayStats.stars}
                  </span>
                )}
                {isReal && displayStats.llmUsed && (
                  <span
                    className="badge"
                    style={{
                      background: 'rgba(246,173,85,.1)',
                      color: '#FBBF24',
                      border: '1px solid rgba(246,173,85,.2)',
                    }}
                  >
                    ⚡ AI assisted
                  </span>
                )}
                {!isReal && (
                  <span
                    className="badge"
                    style={{
                      background: 'rgba(96,165,250,.1)',
                      color: '#60A5FA',
                      border: '1px solid rgba(96,165,250,.2)',
                    }}
                  >
                    Demo Mode
                  </span>
                )}
              </div>
              <div style={{ color: '#334155', fontSize: 11 }}>
                {isReal
                  ? `${displayStats.totalFiles} files · ${
                      displayStats.srcFiles
                    } src · ${
                      displayStats.totalDeps + displayStats.devDeps
                    } deps · ${
                      refreshing ? '🔄 syncing...' : 'analyzed just now'
                    }`
                  : 'Paste a GitHub URL to analyze'}
              </div>
            </div>
            <button className="bg" style={{ fontSize: 10 }}>
              ⬇ Export PDF
            </button>
          </div>

          {/* Metrics */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4,1fr)',
              gap: 9,
              marginBottom: 16,
            }}
          >
            {[
              {
                l: 'Modules',
                v: String(isReal ? displayStats.modules : '8'),
                s: isReal
                  ? displayStats.moduleList.slice(0, 2).join(', ')
                  : 'well-separated',
                c: '#34D399',
              },
              {
                l: 'Dependencies',
                v: String(
                  isReal ? displayStats.totalDeps + displayStats.devDeps : '134'
                ),
                s: isReal
                  ? `${displayStats.outdatedDeps} outdated`
                  : '9 outdated',
                c: '#FBBF24',
              },
              {
                l: 'Test Files',
                v: String(isReal ? displayStats.testFiles : totalCov + '%'),
                s: isReal
                  ? displayStats.testFiles > 0
                    ? 'detected'
                    : 'none found'
                  : 'below 80%',
                c: isReal
                  ? displayStats.testFiles > 0
                    ? '#34D399'
                    : '#F87171'
                  : '#F87171',
              },
              {
                l: 'Stack',
                v: String(
                  isReal
                    ? Object.keys(realData.detected).filter(
                        (k) => !['docker', 'typescript', 'orm'].includes(k)
                      ).length
                    : '—'
                ),
                s: isReal
                  ? displayStats.docker
                    ? '🐳 Docker'
                    : 'no Docker'
                  : 'analyze a repo',
                c: '#60A5FA',
              },
            ].map((m) => (
              <div key={m.l} className="card">
                <div
                  style={{
                    fontSize: 9,
                    color: '#334155',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: 6,
                  }}
                >
                  {m.l}
                </div>
                <div
                  style={{
                    fontSize: 19,
                    fontWeight: 700,
                    color: m.c,
                    fontFamily: "'Syne',sans-serif",
                  }}
                >
                  {m.v}
                </div>
                <div style={{ fontSize: 10, color: '#64748B', marginTop: 3 }}>
                  {m.s}
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div
            style={{
              borderBottom: '1px solid #111D2E',
              marginBottom: 16,
              display: 'flex',
              gap: 1,
              overflowX: 'auto',
            }}
          >
            {TABS_LIST.map(([id, label]) => (
              <button
                key={id}
                className={`tab ${tab === id ? 'on' : ''}`}
                onClick={() => setTab(id)}
              >
                {label}
                {id === 'debug' && isReal && (
                  <span
                    style={{ marginLeft: 4, fontSize: 9, color: '#34D399' }}
                  >
                    {realData.debugLog.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── ARCHITECTURE TAB ── */}
          {tab === 'architecture' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 270px',
                gap: 12,
              }}
            >
              <div className="card" style={{ minHeight: 360 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}
                  >
                    System Architecture{' '}
                    {isReal && (
                      <span style={{ color: '#34D399', fontSize: 9 }}>
                        ● REAL DATA
                      </span>
                    )}
                  </span>
                  {/* Removed: "✏ Edit Visually" button — clicking any node opens editor */}
                  <button
                    className="bg"
                    style={{ fontSize: 10 }}
                    onClick={() => setShowMS(true)}
                  >
                    + Microservice
                  </button>
                </div>
                {nodes.length === 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 260,
                      color: '#334155',
                      fontSize: 12,
                    }}
                  >
                    No nodes detected — check Analysis Log
                  </div>
                ) : (
                  <svg
                    width="100%"
                    viewBox={`0 0 600 ${svgH}`}
                    style={{ overflow: 'visible' }}
                  >
                    <defs>
                      <marker
                        id="arr"
                        markerWidth="7"
                        markerHeight="7"
                        refX="7"
                        refY="3"
                        orient="auto"
                      >
                        <path d="M0,0 L0,6 L7,3 z" fill="#2D3F55" />
                      </marker>
                    </defs>
                    {/* Groups FIRST (below edges+nodes) */}
                    {renderGroups(nodes)}
                    {/* Edges */}
                    {edges.map((e, i) => {
                      const fn = nodes.find((n) => n.id === e.from),
                        tn = nodes.find((n) => n.id === e.to);
                      if (!fn || !tn) return null;
                      const f = gc(fn),
                        t = gc(tn);
                      return (
                        <line
                          key={i}
                          x1={f.x}
                          y1={f.y}
                          x2={t.x}
                          y2={t.y}
                          stroke="#2D3F55"
                          strokeWidth="1.5"
                          markerEnd="url(#arr)"
                        />
                      );
                    })}
                    {/* Nodes */}
                    {nodes.map((n) => (
                      <g
                        key={n.id}
                        className="nh"
                        onClick={() => setScreen(S.DIAG)}
                      >
                        {n.type === 'microservice' && (
                          <rect
                            x={n.x - 2}
                            y={n.y - 2}
                            width={n.w + 4}
                            height={n.h + 4}
                            rx="9"
                            fill="none"
                            stroke={n.color}
                            strokeWidth="1"
                            strokeDasharray="4,2"
                            opacity=".5"
                          />
                        )}
                        <rect
                          x={n.x}
                          y={n.y}
                          width={n.w}
                          height={n.h}
                          rx="7"
                          fill="#0B111C"
                          stroke={n.color}
                          strokeWidth="1.5"
                        />
                        {n.editable && (
                          <rect
                            x={n.x}
                            y={n.y}
                            width={n.w}
                            height={n.h}
                            rx="7"
                            fill={n.color}
                            fillOpacity=".05"
                          />
                        )}
                        <text
                          x={n.x + n.w / 2}
                          y={n.y + n.h / 2 - 4}
                          textAnchor="middle"
                          fill={n.color}
                          fontSize="10"
                          fontWeight="600"
                          fontFamily="JetBrains Mono"
                        >
                          {n.label}
                        </text>
                        <text
                          x={n.x + n.w / 2}
                          y={n.y + n.h / 2 + 9}
                          textAnchor="middle"
                          fill="#334155"
                          fontSize="8.5"
                          fontFamily="JetBrains Mono"
                        >
                          {n.type}
                        </text>
                        {n.editable && (
                          <text
                            x={n.x + n.w - 7}
                            y={n.y + 11}
                            fill="#60A5FA"
                            fontSize="8"
                          >
                            ✏
                          </text>
                        )}
                        {n.type === 'microservice' && (
                          <text
                            x={n.x + 8}
                            y={n.y + 11}
                            fill="#34D399"
                            fontSize="8"
                          >
                            🐳
                          </text>
                        )}
                        {n.orm && (
                          <text
                            x={n.x + n.w / 2}
                            y={n.y + n.h + 12}
                            textAnchor="middle"
                            fill="#64748B"
                            fontSize="8"
                            fontFamily="JetBrains Mono"
                          >
                            via {n.orm}
                          </text>
                        )}
                      </g>
                    ))}
                  </svg>
                )}
                <div
                  style={{
                    fontSize: 9,
                    color: '#1E2D40',
                    textAlign: 'center',
                    marginTop: 4,
                  }}
                >
                  ✏ = editable · 🐳 = Docker · click any node to open Diagram
                  Editor
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <div className="card">
                  <div
                    style={{
                      fontSize: 9,
                      color: '#334155',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginBottom: 9,
                    }}
                  >
                    Legend
                  </div>
                  {[
                    ['Frontend', '#61DAFB'],
                    ['Full-stack', '#E2E8F0'],
                    ['Backend', '#34D399'],
                    ['Service', '#FBBF24'],
                    ['Database', '#336791'],
                    ['Cache', '#D82C20'],
                    ['AI', '#74AA9C'],
                    ['Microservice', '#60A5FA'],
                  ].map(([nm, c]) => (
                    <div
                      key={nm}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 2,
                          background: c,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>
                        {nm}
                      </span>
                    </div>
                  ))}
                </div>
                {isReal && displayStats.moduleList.length > 0 && (
                  <div className="card">
                    <div
                      style={{
                        fontSize: 9,
                        color: '#334155',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: 9,
                      }}
                    >
                      Modules ({displayStats.modules})
                    </div>
                    <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                      {displayStats.moduleList.map((m) => (
                        <div
                          key={m}
                          style={{
                            fontSize: 10,
                            color: '#94A3B8',
                            marginBottom: 5,
                            paddingLeft: 8,
                            borderLeft: '2px solid #1A2740',
                          }}
                        >
                          {m}/
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="card">
                  <div
                    style={{
                      fontSize: 9,
                      color: '#334155',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginBottom: 9,
                    }}
                  >
                    Quick Actions
                  </div>
                  <button
                    className="bg"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      fontSize: 10,
                      padding: '7px 10px',
                      marginBottom: 6,
                    }}
                    onClick={() => setShowMS(true)}
                  >
                    + Add Microservice →
                  </button>
                  <button
                    className="bg"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      fontSize: 10,
                      padding: '7px 10px',
                      marginBottom: 6,
                    }}
                    onClick={() => setScreen(S.DIAG)}
                  >
                    ✏ Open Diagram Editor →
                  </button>
                  <button
                    className="bg"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      fontSize: 10,
                      padding: '7px 10px',
                    }}
                    onClick={() => setTab('dependencies')}
                  >
                    📦 View Dependencies →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── DEPENDENCIES TAB (REAL + OUTDATED + NO TRUNCATION) ── */}
          {tab === 'dependencies' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 270px',
                gap: 12,
              }}
            >
              <div className="card">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{ fontSize: 11, color: '#60A5FA', fontWeight: 600 }}
                  >
                    📦 {filtDeps.length} packages{' '}
                    {isReal && (
                      <span style={{ color: '#34D399', fontSize: 9 }}>
                        ● REAL
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {['all', 'outdated', 'security', 'dev', 'runtime'].map(
                      (f) => (
                        <button
                          key={f}
                          className="bg"
                          style={{
                            fontSize: 9,
                            padding: '3px 8px',
                            borderColor: depFilter === f ? '#2563EB' : '',
                            color: depFilter === f ? '#60A5FA' : '',
                          }}
                          onClick={() => setDepFilter(f)}
                        >
                          {f}
                          {f === 'outdated'
                            ? ` (${displayDeps.filter((d) => d.old).length})`
                            : ''}
                        </button>
                      )
                    )}
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Package', 'Current', 'Latest', 'Type', 'Risk'].map(
                          (h) => (
                            <th
                              key={h}
                              style={{
                                fontSize: 9,
                                color: '#334155',
                                padding: '5px 8px 8px 0',
                                borderBottom: '1px solid #111D2E',
                                textAlign: 'left',
                                fontWeight: 600,
                              }}
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {/* No truncation — show all packages */}
                      {filtDeps.map((d) => (
                        <tr
                          key={d.name}
                          style={{ cursor: 'pointer' }}
                          onClick={() =>
                            setSelDep(selDep === d.name ? null : d.name)
                          }
                        >
                          <td
                            style={{
                              fontSize: 11,
                              color: d.old ? '#FBBF24' : '#94A3B8',
                              padding: '6px 8px 6px 0',
                              borderBottom: '1px solid #0B111C',
                              fontWeight: d.old ? 600 : 400,
                            }}
                          >
                            {d.name}
                          </td>
                          <td
                            style={{
                              fontSize: 10,
                              color: d.old ? '#F87171' : '#64748B',
                              padding: '6px 8px 6px 0',
                              borderBottom: '1px solid #0B111C',
                            }}
                          >
                            {d.cur}
                          </td>
                          <td
                            style={{
                              fontSize: 10,
                              color: d.old ? '#34D399' : '#64748B',
                              padding: '6px 8px 6px 0',
                              borderBottom: '1px solid #0B111C',
                              fontWeight: d.old ? 600 : 400,
                            }}
                          >
                            {d.lat}
                            {d.old && ' ↑'}
                          </td>
                          <td
                            style={{
                              padding: '6px 8px 6px 0',
                              borderBottom: '1px solid #0B111C',
                            }}
                          >
                            <span
                              className="badge"
                              style={{
                                background: 'rgba(96,165,250,.08)',
                                color: '#60A5FA',
                                border: '1px solid rgba(96,165,250,.15)',
                              }}
                            >
                              {d.type}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: '6px 0',
                              borderBottom: '1px solid #0B111C',
                            }}
                          >
                            {d.risk !== 'none' && (
                              <span
                                className="badge"
                                style={{
                                  background:
                                    d.risk === 'high'
                                      ? 'rgba(248,113,113,.1)'
                                      : 'rgba(251,191,36,.1)',
                                  color:
                                    d.risk === 'high' ? '#F87171' : '#FBBF24',
                                  border: `1px solid ${
                                    d.risk === 'high'
                                      ? 'rgba(248,113,113,.25)'
                                      : 'rgba(251,191,36,.25)'
                                  }`,
                                }}
                              >
                                {d.risk}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card" style={{ height: 'fit-content' }}>
                <div
                  style={{
                    fontSize: 11,
                    color: '#60A5FA',
                    fontWeight: 600,
                    marginBottom: 10,
                  }}
                >
                  📊 Summary
                </div>
                {[
                  {
                    l: 'Runtime',
                    v: displayDeps.filter((d) => d.type === 'runtime').length,
                    c: '#E2E8F0',
                  },
                  {
                    l: 'Dev',
                    v: displayDeps.filter((d) => d.type === 'dev').length,
                    c: '#64748B',
                  },
                  {
                    l: 'Security libs',
                    v: displayDeps.filter((d) => d.type === 'security').length,
                    c: '#34D399',
                  },
                  {
                    l: 'Outdated',
                    v: displayDeps.filter((d) => d.old).length,
                    c: '#FBBF24',
                  },
                  {
                    l: 'Security risk',
                    v: displayDeps.filter(
                      (d) => d.risk === 'high' || d.risk === 'medium'
                    ).length,
                    c: '#F87171',
                  },
                ].map((x) => (
                  <div
                    key={x.l}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 9,
                    }}
                  >
                    <span style={{ fontSize: 11, color: '#64748B' }}>
                      {x.l}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: x.c }}>
                      {x.v}
                    </span>
                  </div>
                ))}
                {selDep &&
                  (() => {
                    const d = displayDeps.find((x) => x.name === selDep);
                    return d ? (
                      <div
                        style={{
                          borderTop: '1px solid #111D2E',
                          paddingTop: 10,
                          marginTop: 4,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            color: '#60A5FA',
                            fontWeight: 600,
                            marginBottom: 6,
                          }}
                        >
                          {d.name}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: '#64748B',
                            lineHeight: 2,
                          }}
                        >
                          <div>
                            Installed:{' '}
                            <span
                              style={{ color: d.old ? '#F87171' : '#E2E8F0' }}
                            >
                              {d.cur}
                            </span>
                          </div>
                          <div>
                            Latest:{' '}
                            <span style={{ color: '#34D399' }}>{d.lat}</span>
                          </div>
                          <div>
                            Type:{' '}
                            <span style={{ color: '#E2E8F0' }}>{d.type}</span>
                          </div>
                        </div>
                        {d.old && (
                          <div
                            style={{
                              marginTop: 8,
                              padding: '7px 9px',
                              background: 'rgba(251,191,36,.07)',
                              borderRadius: 5,
                              fontSize: 10,
                              color: '#FBBF24',
                              fontFamily: 'monospace',
                            }}
                          >
                            npm i {d.name}@{d.lat}
                          </div>
                        )}
                      </div>
                    ) : null;
                  })()}
              </div>
            </div>
          )}

          {/* ── TECH STACK ── */}
          {tab === 'tech-stack' && (
            <div>
              {isReal ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3,1fr)',
                    gap: 10,
                  }}
                >
                  {Object.entries(realData.detected)
                    .filter(([k]) => !['docker', 'typescript'].includes(k))
                    .map(([cat, val]) => {
                      if (!val || typeof val !== 'object') return null;
                      const label = val.label || val.type || cat,
                        color = val.color || '#60A5FA',
                        ver = val.ver;
                      return (
                        <div key={cat} className="card">
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: 8,
                            }}
                          >
                            <div>
                              <div
                                style={{ fontSize: 13, fontWeight: 700, color }}
                              >
                                {label}
                              </div>
                              <div
                                style={{
                                  fontSize: 10,
                                  color: '#64748B',
                                  marginTop: 2,
                                  textTransform: 'capitalize',
                                }}
                              >
                                {cat.replace('_', ' ')}
                              </div>
                            </div>
                            <span
                              className="badge"
                              style={{
                                background: 'rgba(52,211,153,.1)',
                                color: '#34D399',
                                border: '1px solid rgba(52,211,153,.2)',
                              }}
                            >
                              detected
                            </span>
                          </div>
                          {ver && (
                            <div style={{ fontSize: 10, color: '#334155' }}>
                              v{ver.replace(/[^0-9.]/g, '')}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  {realData.detected.docker && (
                    <div className="card">
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#60A5FA',
                        }}
                      >
                        🐳 Docker
                      </div>
                      <div
                        style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}
                      >
                        Container config found
                      </div>
                    </div>
                  )}
                  {realData.detected.typescript && (
                    <div className="card">
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#3178C6',
                        }}
                      >
                        TypeScript
                      </div>
                      <div
                        style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}
                      >
                        tsconfig.json found
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#334155',
                    fontSize: 12,
                  }}
                >
                  Analyze a repo to see real tech stack detection.
                </div>
              )}
            </div>
          )}

          {/* ── NARRATIVE ── */}
          {tab === 'narrative' && (
            <div>
              <div
                style={{
                  marginBottom: 12,
                  padding: '10px 14px',
                  background: 'rgba(96,165,250,.07)',
                  border: '1px solid rgba(96,165,250,.2)',
                  borderRadius: 7,
                  fontSize: 11,
                  color: '#60A5FA',
                }}
              >
                ℹ Narrative generation requires LLM — coming in v2.
              </div>
              <div className="card">
                <div
                  style={{
                    fontSize: 11,
                    color: '#60A5FA',
                    fontWeight: 600,
                    marginBottom: 10,
                  }}
                >
                  📖 Project Summary
                </div>
                <p style={{ color: '#94A3B8', fontSize: 12, lineHeight: 1.85 }}>
                  This is a{' '}
                  <strong style={{ color: '#E2E8F0' }}>
                    full-stack application
                  </strong>{' '}
                  with a well-structured codebase.
                </p>
                {isReal && realData.detected.orm && (
                  <p
                    style={{
                      color: '#94A3B8',
                      fontSize: 12,
                      lineHeight: 1.85,
                      marginTop: 10,
                    }}
                  >
                    ORM:{' '}
                    <strong style={{ color: '#E2E8F0' }}>
                      {realData.detected.orm.label}
                    </strong>{' '}
                    detected for database access.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── ENTRY POINTS ── */}
          {tab === 'entry-points' && (
            <div>
              <div
                style={{
                  marginBottom: 12,
                  padding: '10px 14px',
                  background: 'rgba(96,165,250,.07)',
                  border: '1px solid rgba(96,165,250,.2)',
                  borderRadius: 7,
                  fontSize: 11,
                  color: '#60A5FA',
                }}
              >
                ℹ Entry point tracing coming in v2.
              </div>
              <div className="card">
                {[
                  {
                    file: 'server.js:1',
                    desc: 'Server bootstrap',
                    type: 'MAIN',
                  },
                  {
                    file: 'routes/api.js:12',
                    desc: 'REST API router',
                    type: 'API',
                  },
                  { file: 'src/App.jsx:1', desc: 'React root', type: 'UI' },
                ].map((ep) => (
                  <div
                    key={ep.file}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid #111D2E',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          color: '#E2E8F0',
                          fontWeight: 500,
                        }}
                      >
                        {ep.file}
                      </div>
                      <div
                        style={{ fontSize: 10, color: '#334155', marginTop: 2 }}
                      >
                        {ep.desc}
                      </div>
                    </div>
                    <span
                      className="badge"
                      style={{
                        background: 'rgba(96,165,250,.1)',
                        color: '#60A5FA',
                        border: '1px solid rgba(96,165,250,.15)',
                      }}
                    >
                      {ep.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TESTS ── */}
          {tab === 'tests' && (
            <div>
              {isReal && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: '10px 14px',
                    background: 'rgba(52,211,153,.07)',
                    border: '1px solid rgba(52,211,153,.2)',
                    borderRadius: 7,
                    fontSize: 11,
                    color: '#34D399',
                  }}
                >
                  ✓ Real: {displayStats.testFiles} test file(s) detected.
                  Coverage analysis coming in v2.
                </div>
              )}
              {!isReal && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: '10px 14px',
                    background: 'rgba(96,165,250,.07)',
                    border: '1px solid rgba(96,165,250,.2)',
                    borderRadius: 7,
                    fontSize: 11,
                    color: '#60A5FA',
                  }}
                >
                  ℹ Demo content.
                </div>
              )}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}
              >
                <div>
                  {TESTS_MOCK.map((t) => (
                    <div
                      key={t.file}
                      className="card"
                      style={{
                        marginBottom: 10,
                        cursor: 'pointer',
                        borderColor: selTest === t.file ? '#2563EB' : '#1A2740',
                      }}
                      onClick={() =>
                        setSelTest(selTest === t.file ? null : t.file)
                      }
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 11,
                              color: '#E2E8F0',
                              fontWeight: 600,
                            }}
                          >
                            {t.module}
                          </div>
                          <div
                            style={{
                              fontSize: 9,
                              color: '#334155',
                              marginTop: 2,
                            }}
                          >
                            {t.file}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color:
                              t.cov > 70
                                ? '#34D399'
                                : t.cov > 45
                                ? '#FBBF24'
                                : '#F87171',
                          }}
                        >
                          {t.cov}%
                        </div>
                      </div>
                      <div
                        style={{
                          background: '#111D2E',
                          borderRadius: 2,
                          height: 3,
                        }}
                      >
                        <div
                          style={{
                            width: `${t.cov}%`,
                            height: '100%',
                            background:
                              t.cov > 70
                                ? '#34D399'
                                : t.cov > 45
                                ? '#FBBF24'
                                : '#F87171',
                            borderRadius: 2,
                          }}
                        />
                      </div>
                      {selTest === t.file && (
                        <div className="fade" style={{ marginTop: 11 }}>
                          {t.pass.map((s) => (
                            <div
                              key={s}
                              style={{
                                fontSize: 10,
                                color: '#34D399',
                                marginBottom: 3,
                              }}
                            >
                              ✓ {s}
                            </div>
                          ))}
                          {t.miss.map((s) => (
                            <div
                              key={s}
                              style={{
                                fontSize: 10,
                                color: '#F87171',
                                marginBottom: 3,
                              }}
                            >
                              ✗ {s}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="card" style={{ height: 'fit-content' }}>
                  {TESTS_MOCK.map((t) => (
                    <div key={t.file} style={{ marginBottom: 12 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>
                          {t.module}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color:
                              t.cov > 70
                                ? '#34D399'
                                : t.cov > 45
                                ? '#FBBF24'
                                : '#F87171',
                          }}
                        >
                          {t.cov}%
                        </span>
                      </div>
                      <div
                        style={{
                          background: '#111D2E',
                          borderRadius: 2,
                          height: 5,
                        }}
                      >
                        <div
                          style={{
                            width: `${t.cov}%`,
                            height: '100%',
                            background:
                              t.cov > 70
                                ? '#34D399'
                                : t.cov > 45
                                ? '#FBBF24'
                                : '#F87171',
                            borderRadius: 2,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── USER FLOW ── */}
          {tab === 'user-flow' && (
            <div>
              <div
                style={{
                  marginBottom: 12,
                  padding: '10px 14px',
                  background: 'rgba(96,165,250,.07)',
                  border: '1px solid rgba(96,165,250,.2)',
                  borderRadius: 7,
                  fontSize: 11,
                  color: '#60A5FA',
                }}
              >
                ℹ User flow generation requires AST parsing — coming in v2.
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 250px',
                  gap: 12,
                }}
              >
                <div className="card">
                  <svg
                    width="100%"
                    viewBox="0 0 560 480"
                    style={{ overflow: 'visible' }}
                  >
                    <defs>
                      <marker
                        id="uarr"
                        markerWidth="6"
                        markerHeight="6"
                        refX="6"
                        refY="3"
                        orient="auto"
                      >
                        <path d="M0,0 L0,6 L6,3 z" fill="#2D3F55" />
                      </marker>
                    </defs>
                    {UF_EDGES.map((e, i) => {
                      const fn = UF_NODES.find((n) => n.id === e.f),
                        tn = UF_NODES.find((n) => n.id === e.t);
                      if (!fn || !tn) return null;
                      const f = ufBottom(fn),
                        t = ufTop(tn);
                      return (
                        <g key={i}>
                          <line
                            x1={f.x}
                            y1={f.y}
                            x2={t.x}
                            y2={t.y}
                            stroke="#2D3F55"
                            strokeWidth="1.5"
                            markerEnd="url(#uarr)"
                          />
                          {e.lbl && (
                            <text
                              x={(f.x + t.x) / 2 + 5}
                              y={(f.y + t.y) / 2}
                              fill="#FBBF24"
                              fontSize="8.5"
                              fontFamily="JetBrains Mono"
                            >
                              {e.lbl}
                            </text>
                          )}
                        </g>
                      );
                    })}
                    {UF_NODES.map((n) => {
                      const isSel = selUF === n.id;
                      return (
                        <g
                          key={n.id}
                          className="nh"
                          onClick={() => setSelUF(selUF === n.id ? null : n.id)}
                        >
                          {n.shape === 'circle' && (
                            <circle
                              cx={n.cx}
                              cy={n.cy}
                              r={n.r}
                              fill={isSel ? '#111D2E' : '#0B111C'}
                              stroke={isSel ? '#60A5FA' : n.color}
                              strokeWidth={isSel ? 2.5 : 1.5}
                            />
                          )}
                          {n.shape === 'rect' && (
                            <rect
                              x={n.x}
                              y={n.y}
                              width={n.w}
                              height={n.h}
                              rx="6"
                              fill={isSel ? '#111D2E' : '#0B111C'}
                              stroke={isSel ? '#60A5FA' : n.color}
                              strokeWidth={isSel ? 2 : 1.5}
                            />
                          )}
                          {n.shape === 'diamond' &&
                            (() => {
                              const cx2 = n.x + n.w / 2,
                                cy2 = n.y + n.h / 2,
                                hw = n.w / 2,
                                hh = n.h / 2;
                              return (
                                <polygon
                                  points={`${cx2},${cy2 - hh} ${
                                    cx2 + hw
                                  },${cy2} ${cx2},${cy2 + hh} ${
                                    cx2 - hw
                                  },${cy2}`}
                                  fill={isSel ? '#111D2E' : '#0B111C'}
                                  stroke={isSel ? '#60A5FA' : n.color}
                                  strokeWidth={isSel ? 2 : 1.5}
                                />
                              );
                            })()}
                          <text
                            x={
                              n.shape === 'circle' ? n.cx : n.x + (n.w || 0) / 2
                            }
                            y={
                              n.shape === 'circle'
                                ? n.cy + 3
                                : n.y + (n.h || 0) / 2 + 3
                            }
                            textAnchor="middle"
                            fill={isSel ? '#E2E8F0' : n.color}
                            fontSize="8.5"
                            fontFamily="JetBrains Mono"
                          >
                            {n.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
                <div className="card" style={{ height: 'fit-content' }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#60A5FA',
                      fontWeight: 600,
                      marginBottom: 10,
                    }}
                  >
                    🔗 Code Location
                  </div>
                  {!selUF && (
                    <div
                      style={{
                        fontSize: 11,
                        color: '#334155',
                        textAlign: 'center',
                        padding: '28px 10px',
                      }}
                    >
                      Click a node
                    </div>
                  )}
                  {selUF &&
                    (() => {
                      const n = UF_NODES.find((x) => x.id === selUF);
                      const code = UF_CODE[selUF];
                      return n ? (
                        <div className="fade">
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: n.color,
                              marginBottom: 6,
                            }}
                          >
                            {n.label}
                          </div>
                          {code ? (
                            <>
                              <div
                                style={{
                                  background: '#07090F',
                                  border: '1px solid #111D2E',
                                  borderRadius: 6,
                                  padding: '9px 11px',
                                  marginBottom: 9,
                                }}
                              >
                                <div style={{ fontSize: 11, color: '#60A5FA' }}>
                                  {code.file}
                                </div>
                                <div style={{ fontSize: 10, color: '#334155' }}>
                                  line {code.line}
                                </div>
                              </div>
                              <button
                                className="bg"
                                style={{
                                  width: '100%',
                                  fontSize: 10,
                                  padding: '7px',
                                }}
                              >
                                Jump to code →
                              </button>
                            </>
                          ) : (
                            <div style={{ fontSize: 10, color: '#334155' }}>
                              Entry point
                            </div>
                          )}
                        </div>
                      ) : null;
                    })()}
                </div>
              </div>
            </div>
          )}

          {/* ── CODE HEALTH ── */}
          {tab === 'code-health' && (
            <div>
              <div
                style={{
                  marginBottom: 12,
                  padding: '10px 14px',
                  background: 'rgba(96,165,250,.07)',
                  border: '1px solid rgba(96,165,250,.2)',
                  borderRadius: 7,
                  fontSize: 11,
                  color: '#60A5FA',
                }}
              >
                ℹ Code health metrics require AST analysis — coming in v2.
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 270px',
                  gap: 12,
                }}
              >
                <div className="card">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['File', 'Cyclomatic', 'Depth', 'Risk'].map((h) => (
                          <th
                            key={h}
                            style={{
                              fontSize: 9,
                              color: '#334155',
                              padding: '5px 0',
                              borderBottom: '1px solid #111D2E',
                              textAlign: 'left',
                              fontWeight: 600,
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {HEALTH_MOCK.map((h) => (
                        <React.Fragment key={h.file}>
                          <tr
                            style={{ cursor: 'pointer' }}
                            onClick={() =>
                              setSelHealth(selHealth === h.file ? null : h.file)
                            }
                          >
                            <td
                              style={{
                                fontSize: 10,
                                color:
                                  h.risk === 'high'
                                    ? '#F87171'
                                    : h.risk === 'medium'
                                    ? '#FBBF24'
                                    : '#94A3B8',
                                padding: '8px 0',
                                borderBottom: '1px solid #0B111C',
                                fontWeight: h.risk !== 'low' ? 600 : 400,
                              }}
                            >
                              {h.file}
                            </td>
                            <td
                              style={{
                                fontSize: 11,
                                color:
                                  h.cyc > 15
                                    ? '#F87171'
                                    : h.cyc > 10
                                    ? '#FBBF24'
                                    : '#34D399',
                                padding: '8px 0',
                                borderBottom: '1px solid #0B111C',
                                fontWeight: 700,
                              }}
                            >
                              {h.cyc}
                            </td>
                            <td
                              style={{
                                fontSize: 11,
                                color:
                                  h.depth > 6
                                    ? '#F87171'
                                    : h.depth > 4
                                    ? '#FBBF24'
                                    : '#34D399',
                                padding: '8px 0',
                                borderBottom: '1px solid #0B111C',
                              }}
                            >
                              {h.depth}
                            </td>
                            <td
                              style={{
                                padding: '8px 0',
                                borderBottom: '1px solid #0B111C',
                              }}
                            >
                              <span
                                className="badge"
                                style={{
                                  background:
                                    h.risk === 'high'
                                      ? 'rgba(248,113,113,.1)'
                                      : h.risk === 'medium'
                                      ? 'rgba(251,191,36,.1)'
                                      : 'rgba(52,211,153,.1)',
                                  color:
                                    h.risk === 'high'
                                      ? '#F87171'
                                      : h.risk === 'medium'
                                      ? '#FBBF24'
                                      : '#34D399',
                                  border: `1px solid ${
                                    h.risk === 'high'
                                      ? 'rgba(248,113,113,.25)'
                                      : h.risk === 'medium'
                                      ? 'rgba(251,191,36,.25)'
                                      : 'rgba(52,211,153,.25)'
                                  }`,
                                }}
                              >
                                {h.risk}
                              </span>
                            </td>
                          </tr>
                          {selHealth === h.file && h.issues.length > 0 && (
                            <tr>
                              <td
                                colSpan="4"
                                style={{
                                  paddingBottom: 10,
                                  borderBottom: '1px solid #111D2E',
                                }}
                              >
                                {h.issues.map((issue) => (
                                  <div
                                    key={issue}
                                    style={{
                                      fontSize: 10,
                                      color: '#FBBF24',
                                      marginBottom: 4,
                                      paddingLeft: 12,
                                      borderLeft: '2px solid #FBBF2444',
                                      marginTop: 4,
                                    }}
                                  >
                                    ⚠ {issue}
                                  </div>
                                ))}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="card" style={{ height: 'fit-content' }}>
                  {[
                    { l: 'Avg complexity', v: '9.2', c: '#FBBF24' },
                    { l: 'Max depth', v: '7', c: '#F87171' },
                    { l: 'Long functions', v: '3', c: '#FBBF24' },
                  ].map((m) => (
                    <div
                      key={m.l}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 10,
                        paddingBottom: 10,
                        borderBottom: '1px solid #0B111C',
                      }}
                    >
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>
                        {m.l}
                      </span>
                      <span
                        style={{ fontSize: 14, fontWeight: 700, color: m.c }}
                      >
                        {m.v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ANALYSIS LOG ── */}
          {tab === 'debug' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 240px',
                gap: 12,
              }}
            >
              <div className="card">
                <div
                  style={{
                    fontSize: 11,
                    color: '#60A5FA',
                    fontWeight: 600,
                    marginBottom: 12,
                  }}
                >
                  🔍 Analysis Log{' '}
                  {isReal ? (
                    <span style={{ color: '#34D399', fontSize: 9 }}>
                      ● {realData.debugLog.length} entries
                    </span>
                  ) : (
                    <span style={{ color: '#F87171', fontSize: 9 }}>
                      ● no analysis
                    </span>
                  )}
                </div>
                {!isReal && (
                  <div
                    style={{
                      color: '#334155',
                      fontSize: 12,
                      textAlign: 'center',
                      padding: '40px 0',
                    }}
                  >
                    Paste a GitHub URL and analyze to see the reasoning log.
                  </div>
                )}
                {isReal && (
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 10,
                      lineHeight: 1.9,
                      maxHeight: 500,
                      overflowY: 'auto',
                    }}
                  >
                    {realData.debugLog.map((entry, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          gap: 10,
                          marginBottom: 2,
                          paddingBottom: 2,
                          borderBottom: '1px solid #0B111C',
                        }}
                      >
                        <span
                          style={{
                            color: '#334155',
                            flexShrink: 0,
                            width: 22,
                            textAlign: 'right',
                          }}
                        >
                          {i + 1}
                        </span>
                        <span
                          style={{ color: '#2D3F55', flexShrink: 0, width: 52 }}
                        >
                          [{entry.type}]
                        </span>
                        <span
                          style={{
                            color: LOG_COLORS[entry.type] || '#94A3B8',
                            wordBreak: 'break-word',
                          }}
                        >
                          {entry.msg}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="card" style={{ height: 'fit-content' }}>
                <div
                  style={{
                    fontSize: 11,
                    color: '#60A5FA',
                    fontWeight: 600,
                    marginBottom: 10,
                  }}
                >
                  Log types
                </div>
                {[
                  ['info', 'General', '#64748B'],
                  ['found', 'Parsed file', '#60A5FA'],
                  ['detect', 'Tech found', '#34D399'],
                  ['graph', 'Node added', '#B794F4'],
                  ['edge', 'Edge added', '#F6AD55'],
                  ['warning', 'Issue', '#FBBF24'],
                  ['error', 'Error', '#F87171'],
                ].map(([t, d, c]) => (
                  <div
                    key={t}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 9,
                        color: c,
                        background: c + '22',
                        padding: '1px 5px',
                        borderRadius: 3,
                        flexShrink: 0,
                      }}
                    >
                      {t}
                    </span>
                    <span style={{ fontSize: 10, color: '#64748B' }}>{d}</span>
                  </div>
                ))}
                {isReal && (
                  <div
                    style={{
                      borderTop: '1px solid #111D2E',
                      marginTop: 10,
                      paddingTop: 10,
                      fontSize: 10,
                      color: '#64748B',
                      lineHeight: 1.7,
                    }}
                  >
                    If diagram looks wrong, copy this log and describe what's
                    incorrect — we'll fix the detection rules.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── DIAGRAM EDITOR ───
  const selNodeData = nodes.find((n) => n.id === selNode);
  const selNodeInfo = NODE_INFO[selNode];
  const diagSvgH = Math.max(460, Math.max(...nodes.map((n) => n.y + n.h)) + 80);

  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono',monospace",
        background: '#07090F',
        height: '100vh',
        color: '#E2E8F0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{CSS}</style>
      <Nav />
      {/* Nav shows "← Dashboard" when in DIAG */}
      <MSModal />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 310px',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* Canvas */}
        <div
          style={{
            background: '#07090F',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 11,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>
              🗺 Diagram Editor — click nodes to inspect & refactor{' '}
              {realData && (
                <span style={{ color: '#34D399', fontSize: 9 }}>
                  ● REAL DATA
                </span>
              )}
            </span>
            <button
              className="bg"
              style={{ fontSize: 10 }}
              onClick={() => setShowMS(true)}
            >
              + Microservice
            </button>
          </div>
          <div
            style={{
              flex: 1,
              background: '#0B111C',
              border: '1px solid #111D2E',
              borderRadius: 10,
              padding: 14,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <svg
              style={{ position: 'absolute', inset: 0, opacity: 0.15 }}
              width="100%"
              height="100%"
            >
              <defs>
                <pattern
                  id="dots2"
                  width="18"
                  height="18"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="1" cy="1" r=".8" fill="#2D3F55" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots2)" />
            </svg>
            <svg
              width="100%"
              viewBox={`0 0 620 ${diagSvgH}`}
              style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}
            >
              <defs>
                <marker
                  id="arr2"
                  markerWidth="7"
                  markerHeight="7"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L7,3 z" fill="#3D4F66" />
                </marker>
              </defs>
              {/* Groups FIRST */}
              {renderGroups(nodes)}
              {/* Edges */}
              {edges.map((e, i) => {
                const fn = nodes.find((n) => n.id === e.from),
                  tn = nodes.find((n) => n.id === e.to);
                if (!fn || !tn) return null;
                const f = gc(fn),
                  t = gc(tn);
                const isDb = e.to === 'db',
                  isAi = e.to === 'ai';
                return (
                  <line
                    key={i}
                    x1={f.x}
                    y1={f.y}
                    x2={t.x}
                    y2={t.y}
                    stroke={
                      (isDb && converting) || (isAi && swapAI)
                        ? '#FBBF24'
                        : (isDb && convDone) || (isAi && aiDone)
                        ? '#34D399'
                        : '#3D4F66'
                    }
                    strokeWidth={
                      (isDb && (converting || convDone)) ||
                      (isAi && (swapAI || aiDone))
                        ? '2'
                        : '1.5'
                    }
                    strokeDasharray={
                      (isDb && converting) || (isAi && swapAI) ? '6,3' : 'none'
                    }
                    markerEnd="url(#arr2)"
                  />
                );
              })}
              {/* Nodes */}
              {nodes.map((n) => {
                const isSel = selNode === n.id;
                return (
                  <g
                    key={n.id}
                    className={`nh ${isSel ? 'gsel' : ''}`}
                    style={{ transition: 'all .2s' }}
                    onClick={() => setSelNode(n.id)}
                  >
                    {n.type === 'microservice' && (
                      <rect
                        x={n.x - 3}
                        y={n.y - 3}
                        width={n.w + 6}
                        height={n.h + 6}
                        rx="9"
                        fill="none"
                        stroke={n.color}
                        strokeWidth="1"
                        strokeDasharray="5,3"
                        opacity=".4"
                      />
                    )}
                    <rect
                      x={n.x}
                      y={n.y}
                      width={n.w}
                      height={n.h}
                      rx="7"
                      fill={isSel ? '#0F1925' : '#0B111C'}
                      stroke={isSel ? '#60A5FA' : n.color}
                      strokeWidth={isSel ? 2.5 : 1.5}
                    />
                    {converting && n.id === 'db' && (
                      <rect
                        x={n.x}
                        y={n.y}
                        width={n.w}
                        height={n.h}
                        rx="7"
                        fill="#FBBF24"
                        fillOpacity=".12"
                        className="pulse"
                      />
                    )}
                    {convDone && n.id === 'db' && (
                      <rect
                        x={n.x}
                        y={n.y}
                        width={n.w}
                        height={n.h}
                        rx="7"
                        fill="#34D399"
                        fillOpacity=".07"
                      />
                    )}
                    {swapAI && n.id === 'ai' && (
                      <rect
                        x={n.x}
                        y={n.y}
                        width={n.w}
                        height={n.h}
                        rx="7"
                        fill="#FBBF24"
                        fillOpacity=".12"
                        className="pulse"
                      />
                    )}
                    {aiDone && n.id === 'ai' && (
                      <rect
                        x={n.x}
                        y={n.y}
                        width={n.w}
                        height={n.h}
                        rx="7"
                        fill="#34D399"
                        fillOpacity=".07"
                      />
                    )}
                    <text
                      x={n.x + n.w / 2}
                      y={n.y + n.h / 2 - 4}
                      textAnchor="middle"
                      fill={n.color}
                      fontSize="10"
                      fontWeight="600"
                      fontFamily="JetBrains Mono"
                    >
                      {n.label}
                    </text>
                    <text
                      x={n.x + n.w / 2}
                      y={n.y + n.h / 2 + 9}
                      textAnchor="middle"
                      fill="#334155"
                      fontSize="8.5"
                      fontFamily="JetBrains Mono"
                    >
                      {n.type}
                    </text>
                    {n.editable && (
                      <text
                        x={n.x + n.w - 7}
                        y={n.y + 11}
                        fill="#60A5FA"
                        fontSize="8"
                      >
                        ✏
                      </text>
                    )}
                    {n.type === 'microservice' && (
                      <text
                        x={n.x + 8}
                        y={n.y + 11}
                        fill="#34D399"
                        fontSize="8"
                      >
                        🐳
                      </text>
                    )}
                    {isSel && (
                      <circle
                        cx={n.x + n.w / 2}
                        cy={n.y - 7}
                        r="3.5"
                        fill="#60A5FA"
                        className="pulse"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right panel */}
        <div
          style={{
            background: '#090C14',
            borderLeft: '1px solid #111D2E',
            overflowY: 'auto',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {!selNode && (
            <div
              style={{
                textAlign: 'center',
                padding: '50px 14px',
                color: '#1E2D40',
              }}
            >
              <div style={{ fontSize: 26, marginBottom: 8 }}>👆</div>
              <div style={{ fontSize: 11 }}>
                Click a node to inspect and refactor
              </div>
            </div>
          )}

          {selNode && selNodeInfo && (
            <div className="fade">
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  marginBottom: 2,
                  color: selNodeData?.color,
                }}
              >
                {selNodeData?.label}
              </div>
              <div style={{ fontSize: 10, color: '#64748B', marginBottom: 10 }}>
                {selNodeData?.type} layer
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 10, color: '#334155' }}>Health</span>
                <div
                  style={{
                    flex: 1,
                    background: '#111D2E',
                    borderRadius: 2,
                    height: 4,
                  }}
                >
                  <div
                    style={{
                      width: `${selNodeInfo.health}%`,
                      height: '100%',
                      background:
                        selNodeInfo.health > 80 ? '#34D399' : '#FBBF24',
                      borderRadius: 2,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: selNodeInfo.health > 80 ? '#34D399' : '#FBBF24',
                  }}
                >
                  {selNodeInfo.health}
                </span>
              </div>
              <div className="card" style={{ marginBottom: 9 }}>
                <div
                  style={{
                    fontSize: 9,
                    color: '#334155',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: 8,
                  }}
                >
                  Stats
                </div>
                {selNodeInfo.stats.map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontSize: 10, color: '#64748B' }}>{k}</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#E2E8F0',
                      }}
                    >
                      {v}
                    </span>
                  </div>
                ))}
              </div>
              <div className="card">
                <div
                  style={{
                    fontSize: 9,
                    color: '#334155',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: 8,
                  }}
                >
                  Files
                </div>
                {selNodeInfo.files.map((f) => (
                  <div
                    key={f}
                    style={{ fontSize: 10, color: '#60A5FA', marginBottom: 5 }}
                  >
                    {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selNode === 'db' && (
            <div className="fade">
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  marginBottom: 2,
                  color: curDbObj?.color,
                }}
              >
                Database Layer
              </div>
              <div style={{ fontSize: 10, color: '#64748B', marginBottom: 12 }}>
                Swap engine with code preview
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: '#334155',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: 8,
                }}
              >
                Swap Engine
              </div>
              {DB_OPT.map((db) => (
                <div
                  key={db.id}
                  className={`dbo ${curDb === db.id ? 'sel' : ''}`}
                  onClick={() => doDbSwap(db.id)}
                  style={{ marginBottom: 6 }}
                >
                  <span style={{ fontSize: 14 }}>{db.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: curDb === db.id ? db.color : '#94A3B8',
                      }}
                    >
                      {db.label}
                    </div>
                    {curDb !== db.id && (
                      <div
                        style={{ fontSize: 9, color: '#334155', marginTop: 1 }}
                      >
                        {DB_OPT.find((x) => x.id === curDb)?.compat[db.id]}
                      </div>
                    )}
                  </div>
                  {curDb === db.id && (
                    <span style={{ fontSize: 9, color: '#34D399' }}>✓</span>
                  )}
                </div>
              ))}
              {converting && (
                <div
                  className="fade"
                  style={{
                    marginTop: 11,
                    padding: 10,
                    background: 'rgba(251,191,36,.07)',
                    border: '1px solid rgba(251,191,36,.2)',
                    borderRadius: 7,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <span
                      className="spin"
                      style={{
                        width: 12,
                        height: 12,
                        border: '2px solid #FBBF24',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        color: '#FBBF24',
                        fontWeight: 600,
                      }}
                    >
                      Analyzing...
                    </span>
                  </div>
                  {[
                    'Detecting ORM',
                    'Mapping schema diffs',
                    'Rewriting config',
                  ].map((s) => (
                    <div
                      key={s}
                      style={{
                        fontSize: 9,
                        color: '#64748B',
                        marginBottom: 2,
                        paddingLeft: 20,
                      }}
                    >
                      → {s}
                    </div>
                  ))}
                </div>
              )}
              {convDone && !converting && (
                <div className="fade" style={{ marginTop: 11 }}>
                  <div
                    style={{
                      padding: 9,
                      background: 'rgba(52,211,153,.07)',
                      border: '1px solid rgba(52,211,153,.2)',
                      borderRadius: 7,
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: '#34D399',
                        fontWeight: 600,
                        marginBottom: 2,
                      }}
                    >
                      ✓ Preview ready — 3 files
                    </div>
                    <div style={{ fontSize: 9, color: '#64748B' }}>
                      0 breaking · 2 warnings
                    </div>
                  </div>
                  <div className="codediff" style={{ marginBottom: 9 }}>
                    <span style={{ color: '#F87171' }}>
                      {"- require('db-driver')"}
                    </span>
                    <br />
                    <span style={{ color: '#34D399' }}>
                      {"+ require('" +
                        curDbObj?.label.toLowerCase().replace(/\s/g, '') +
                        "')"}
                    </span>
                    <br />
                    <br />
                    <span style={{ color: '#F87171' }}>
                      {'- host: OLD_HOST'}
                    </span>
                    <br />
                    <span style={{ color: '#34D399' }}>
                      {'+ uri: ' + curDb.toUpperCase() + '_URI'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button
                      className="bp"
                      style={{ flex: 1, padding: '7px', fontSize: 10 }}
                    >
                      Apply Changes
                    </button>
                    <button
                      className="bg"
                      style={{ padding: '7px 10px', fontSize: 10 }}
                      onClick={() => {
                        setCurDb('postgresql');
                        setConvDone(false);
                        setNodes((p) =>
                          p.map((n) =>
                            n.id === 'db'
                              ? { ...n, label: 'PostgreSQL', color: '#336791' }
                              : n
                          )
                        );
                      }}
                    >
                      ↩ Revert
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {selNode === 'ai' && (
            <div className="fade">
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  marginBottom: 2,
                  color: curAIObj?.color,
                }}
              >
                AI Service Layer
              </div>
              <div style={{ fontSize: 10, color: '#64748B', marginBottom: 12 }}>
                Swap model and manage configuration
              </div>
              <div className="card" style={{ marginBottom: 11 }}>
                {[
                  ['Model', curAIObj?.label],
                  ['Provider', curAIObj?.provider],
                  ['Avg Response', curAIObj?.rpm + 'ms'],
                  ['Accuracy', curAIObj?.acc + '%'],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontSize: 10, color: '#64748B' }}>{k}</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#E2E8F0',
                      }}
                    >
                      {v}
                    </span>
                  </div>
                ))}
                <div
                  style={{
                    borderTop: '1px solid #111D2E',
                    paddingTop: 8,
                    marginTop: 4,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 5,
                    }}
                  >
                    <span style={{ fontSize: 10, color: '#64748B' }}>
                      API Key
                    </span>
                    <button
                      className="bg"
                      style={{ fontSize: 9, padding: '2px 7px' }}
                      onClick={() => setApiKeyEdit(!apiKeyEdit)}
                    >
                      {apiKeyEdit ? 'save' : 'edit'}
                    </button>
                  </div>
                  {apiKeyEdit ? (
                    <input
                      value={apiKeyVal}
                      onChange={(e) => setApiKeyVal(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#07090F',
                        border: '1px solid #2563EB',
                        borderRadius: 5,
                        padding: '5px 8px',
                        color: '#E2E8F0',
                        fontFamily: 'inherit',
                        fontSize: 10,
                        outline: 'none',
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: 10, color: '#334155' }}>
                      {apiKeyVal}
                    </div>
                  )}
                </div>
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: '#334155',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: 8,
                }}
              >
                Swap Model
              </div>
              {AI_MODELS.map((m) => (
                <div
                  key={m.id}
                  className={`dbo ${curAI === m.id ? 'sel' : ''}`}
                  onClick={() => doAISwap(m.id)}
                  style={{ marginBottom: 6 }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: m.color,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: curAI === m.id ? m.color : '#94A3B8',
                      }}
                    >
                      {m.label}
                    </div>
                    <div style={{ fontSize: 9, color: '#334155' }}>
                      {m.provider} · {m.acc}% acc
                    </div>
                  </div>
                  {curAI === m.id && (
                    <span style={{ fontSize: 9, color: '#34D399' }}>✓</span>
                  )}
                </div>
              ))}
              {swapAI && (
                <div
                  className="fade"
                  style={{
                    marginTop: 10,
                    padding: 9,
                    background: 'rgba(251,191,36,.07)',
                    border: '1px solid rgba(251,191,36,.2)',
                    borderRadius: 7,
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <span
                      className="spin"
                      style={{
                        width: 12,
                        height: 12,
                        border: '2px solid #FBBF24',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        color: '#FBBF24',
                        fontWeight: 600,
                      }}
                    >
                      Updating calls...
                    </span>
                  </div>
                </div>
              )}
              {aiDone && !swapAI && (
                <div className="fade" style={{ marginTop: 10 }}>
                  <div
                    style={{
                      padding: 9,
                      background: 'rgba(52,211,153,.07)',
                      border: '1px solid rgba(52,211,153,.2)',
                      borderRadius: 7,
                      marginBottom: 9,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: '#34D399',
                        fontWeight: 600,
                      }}
                    >
                      ✓ Model swapped
                    </div>
                  </div>
                  <div className="codediff" style={{ marginBottom: 9 }}>
                    <span style={{ color: '#F87171' }}>
                      {"- model: 'gpt-4o'"}
                    </span>
                    <br />
                    <span style={{ color: '#34D399' }}>
                      {"+ model: '" + curAI + "'"}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button
                      className="bp"
                      style={{ flex: 1, padding: '7px', fontSize: 10 }}
                    >
                      Apply Changes
                    </button>
                    <button
                      className="bg"
                      style={{ padding: '7px 10px', fontSize: 10 }}
                      onClick={() => {
                        setCurAI('gpt-4o');
                        setAiDone(false);
                        setNodes((p) =>
                          p.map((n) =>
                            n.id === 'ai'
                              ? { ...n, label: 'OpenAI API', color: '#74AA9C' }
                              : n
                          )
                        );
                      }}
                    >
                      ↩ Revert
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {selNode && selNodeData?.type === 'microservice' && (
            <div className="fade">
              <div
                style={{
                  fontFamily: "'Syne',sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  marginBottom: 2,
                  color: selNodeData.color,
                }}
              >
                🐳 {selNodeData.label}
              </div>
              <div style={{ fontSize: 10, color: '#64748B', marginBottom: 12 }}>
                Docker containerized microservice
              </div>
              <div className="card">
                <div className="codediff">
                  <span style={{ color: '#60A5FA' }}>FROM</span>{' '}
                  <span style={{ color: '#34D399' }}>node:20-alpine</span>
                  <br />
                  <span style={{ color: '#60A5FA' }}>WORKDIR</span>{' '}
                  <span style={{ color: '#E2E8F0' }}>
                    {'/app/' +
                      selNodeData.label.toLowerCase().replace(/\s/g, '-')}
                  </span>
                  <br />
                  <span style={{ color: '#60A5FA' }}>EXPOSE</span>{' '}
                  <span style={{ color: '#FBBF24' }}>3001</span>
                  <br />
                  <span style={{ color: '#60A5FA' }}>CMD</span>{' '}
                  <span style={{ color: '#E2E8F0' }}>
                    {'["node","index.js"]'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {selNode &&
            !selNodeInfo &&
            selNode !== 'db' &&
            selNode !== 'ai' &&
            selNodeData?.type !== 'microservice' && (
              <div className="fade">
                <div
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 2,
                    color: selNodeData?.color,
                  }}
                >
                  {selNodeData?.label}
                </div>
                <div
                  style={{ fontSize: 10, color: '#64748B', marginBottom: 12 }}
                >
                  {selNodeData?.type} · detected from package.json
                </div>
                {realData &&
                  (() => {
                    const cat =
                      selNodeData?.type === 'frontend'
                        ? 'frontend'
                        : selNodeData?.type === 'backend'
                        ? 'backend'
                        : selNodeData?.id;
                    const info = realData.detected[cat];
                    return info && typeof info === 'object' ? (
                      <div className="card">
                        <div
                          style={{
                            fontSize: 9,
                            color: '#334155',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            marginBottom: 8,
                          }}
                        >
                          Detected via
                        </div>
                        {Object.entries(info)
                          .slice(0, 6)
                          .map(([k, v]) => (
                            <div
                              key={k}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: 6,
                              }}
                            >
                              <span style={{ fontSize: 10, color: '#64748B' }}>
                                {k}
                              </span>
                              <span style={{ fontSize: 10, color: '#E2E8F0' }}>
                                {typeof v === 'object'
                                  ? v.label || v.lib || k
                                  : String(v)}
                              </span>
                            </div>
                          ))}
                      </div>
                    ) : null;
                  })()}
                {!realData && (
                  <div style={{ fontSize: 11, color: '#334155' }}>
                    Detailed stats available in next version.
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
