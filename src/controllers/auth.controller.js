const authService = require("../services/auth.service");

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const result = await authService.getMe(req.user.userId);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };
