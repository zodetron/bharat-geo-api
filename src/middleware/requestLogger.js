const { writeLog } = require("../services/log.service");

// Extracts the real client IP, respecting common proxy headers
function getIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || null;
}

function requestLogger(req, res, next) {
  const startedAt = Date.now();

  res.on("finish", () => {
    // Fire-and-forget — never awaited, never blocks the response
    writeLog({
      endpoint:     req.path,
      method:       req.method,
      statusCode:   res.statusCode,
      responseTime: Date.now() - startedAt,
      ipAddress:    getIp(req),
      userAgent:    req.headers["user-agent"] || null,
      userId:       req.user?.userId || req.apiKey?.userId || null,
      apiKeyId:     req.apiKey?.id  || null,
    });
  });

  next();
}

module.exports = { requestLogger };
