const crypto = require("crypto");
const prisma = require("../lib/prisma");
const { cacheGet, cacheSet, cacheDel } = require("../lib/redis");

const KEY_CACHE_TTL = 60; // 1 minute — balance between performance and revocation latency

// ── Key generation ────────────────────────────────────────────────────────────

function generateKeyPair() {
  const prefix = "bsk_" + crypto.randomBytes(6).toString("hex"); // 16 chars total
  const secret = crypto.randomBytes(32).toString("hex");          // 64 chars
  const fullKey = `${prefix}.${secret}`;
  return { prefix, secret, fullKey };
}

// SHA-256 hash — fast enough for per-request validation, secure for random secrets
function hashSecret(secret) {
  return crypto.createHash("sha256").update(secret).digest("hex");
}

function verifySecret(secret, hash) {
  const computed = hashSecret(secret);
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

async function createApiKey(userId, body = {}) {
  const { expiresAt } = body;

  // Clients always get FREE — plan is assigned by admin after creation
  const plan = "FREE";

  const existing = await prisma.apiKey.count({
    where: { userId, isActive: true },
  });
  if (existing >= 3) {
    throw Object.assign(new Error("Maximum of 3 active keys reached"), { status: 409 });
  }

  const { prefix, secret, fullKey } = generateKeyPair();
  const secretHash = hashSecret(secret);

  const apiKey = await prisma.apiKey.create({
    data: {
      keyPrefix: prefix,
      secretHash,
      plan,
      userId,
      isActive: true,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
    select: {
      id: true,
      keyPrefix: true,
      plan: true,
      isActive: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  return {
    ...apiKey,
    apiKey: fullKey,
    warning: "Save this API key now. The secret will not be shown again.",
  };
}

async function listAllApiKeys() {
  const keys = await prisma.apiKey.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      keyPrefix: true,
      plan: true,
      isActive: true,
      createdAt: true,
      expiresAt: true,
      user: { select: { id: true, email: true, fullName: true } },
    },
  });
  return { keys };
}

async function updateApiKey(keyId, { plan, isActive }) {
  const id = parseInt(keyId);
  if (isNaN(id)) throw Object.assign(new Error("Invalid key id"), { status: 400 });

  const validPlans = ["FREE", "PREMIUM", "PRO", "UNLIMITED"];
  const data = {};
  if (plan !== undefined) {
    if (!validPlans.includes(plan)) {
      throw Object.assign(new Error(`Invalid plan. Must be one of: ${validPlans.join(", ")}`), { status: 400 });
    }
    data.plan = plan;
  }
  if (isActive !== undefined) data.isActive = Boolean(isActive);

  const key = await prisma.apiKey.findUnique({ where: { id } });
  if (!key) throw Object.assign(new Error("API key not found"), { status: 404 });

  const updated = await prisma.apiKey.update({
    where: { id },
    data,
    select: { id: true, keyPrefix: true, plan: true, isActive: true, updatedAt: true },
  });

  // Bust Redis cache so changes take effect immediately
  await cacheDel(`apikey:${key.keyPrefix}`);

  return { key: updated };
}

async function listApiKeys(userId) {
  const keys = await prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      keyPrefix: true,
      plan: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      expiresAt: true,
    },
  });
  return { keys };
}

async function revokeApiKey(userId, keyId) {
  const id = parseInt(keyId);
  if (isNaN(id)) throw Object.assign(new Error("Invalid key id"), { status: 400 });

  const key = await prisma.apiKey.findFirst({ where: { id, userId } });
  if (!key) throw Object.assign(new Error("API key not found"), { status: 404 });
  if (!key.isActive) throw Object.assign(new Error("API key is already revoked"), { status: 409 });

  await prisma.apiKey.update({ where: { id }, data: { isActive: false } });

  // Bust cache so the key stops working immediately
  await cacheDel(`apikey:${key.keyPrefix}`);

  return { message: "API key revoked successfully" };
}

// ── Validation (used by middleware) ───────────────────────────────────────────

async function validateApiKey(rawKey) {
  if (!rawKey || !rawKey.includes(".")) return null;

  const dotIndex = rawKey.indexOf(".");
  const prefix = rawKey.slice(0, dotIndex);
  const secret = rawKey.slice(dotIndex + 1);

  // Check Redis cache first
  const cacheKey = `apikey:${prefix}`;
  const cached = await cacheGet(cacheKey);
  if (cached) {
    if (!verifySecret(secret, cached.secretHash)) return null;
    return cached;
  }

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyPrefix: prefix },
    select: {
      id: true,
      keyPrefix: true,
      secretHash: true,
      plan: true,
      isActive: true,
      expiresAt: true,
      userId: true,
    },
  });

  if (!apiKey) return null;
  if (!apiKey.isActive) return null;
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;
  if (!verifySecret(secret, apiKey.secretHash)) return null;

  // Cache the validated key (include secretHash so we can re-verify from cache)
  await cacheSet(cacheKey, apiKey, KEY_CACHE_TTL);

  return apiKey;
}

module.exports = { createApiKey, listApiKeys, listAllApiKeys, updateApiKey, revokeApiKey, validateApiKey };
