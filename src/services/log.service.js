const prisma = require("../lib/prisma");

// In-memory queue — flushed every second or when it hits FLUSH_SIZE
const FLUSH_INTERVAL_MS = 1000;
const FLUSH_SIZE = 100;

let queue = [];
let flushTimer = null;

function enqueue(entry) {
  queue.push(entry);
  if (queue.length >= FLUSH_SIZE) flush();
  else if (!flushTimer) {
    flushTimer = setTimeout(flush, FLUSH_INTERVAL_MS);
  }
}

async function flush() {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  if (!queue.length) return;

  const batch = queue.splice(0, queue.length);
  try {
    await prisma.apiLog.createMany({ data: batch, skipDuplicates: false });
  } catch {
    // Non-fatal — logging must never break the API
  }
}

// Flush remaining entries cleanly on process exit
process.on("SIGINT",  () => flush().finally(() => {}));
process.on("SIGTERM", () => flush().finally(() => {}));

function writeLog({ endpoint, method, statusCode, responseTime, ipAddress, userAgent, userId, apiKeyId }) {
  enqueue({
    endpoint,
    method,
    statusCode,
    responseTime,
    ipAddress:   ipAddress  || null,
    userAgent:   userAgent  || null,
    userId:      userId     || null,
    apiKeyId:    apiKeyId   || null,
    createdAt:   new Date(),
  });
}

module.exports = { writeLog, flush };
