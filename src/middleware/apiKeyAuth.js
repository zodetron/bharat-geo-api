const { validateApiKey } = require("../services/apiKey.service");

// Extracts raw key from header: "X-API-Key: bsk_xxx.secret"
function extractKey(req) {
  const header = req.headers["x-api-key"];
  if (header) return header.trim();
  // Also accept: Authorization: ApiKey bsk_xxx.secret
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("ApiKey ")) return auth.slice(7).trim();
  return null;
}

async function apiKeyAuth(req, res, next) {
  const rawKey = extractKey(req);
  if (!rawKey) {
    return res.status(401).json({ success: false, error: "API key required. Pass via X-API-Key header." });
  }

  try {
    const apiKey = await validateApiKey(rawKey);
    if (!apiKey) {
      return res.status(401).json({ success: false, error: "Invalid or revoked API key." });
    }
    req.apiKey = apiKey;
    next();
  } catch {
    return res.status(401).json({ success: false, error: "Invalid or revoked API key." });
  }
}

module.exports = { apiKeyAuth };
