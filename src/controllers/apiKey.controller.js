const apiKeyService = require("../services/apiKey.service");

async function create(req, res, next) {
  try {
    const result = await apiKeyService.createApiKey(req.user.userId, req.body);
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const result = await apiKeyService.listApiKeys(req.user.userId);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function revoke(req, res, next) {
  try {
    const result = await apiKeyService.revokeApiKey(req.user.userId, req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function listAll(req, res, next) {
  try {
    const result = await apiKeyService.listAllApiKeys();
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const result = await apiKeyService.updateApiKey(req.params.id, req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, revoke, listAll, update };
