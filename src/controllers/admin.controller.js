const adminService = require("../services/admin.service");

const ok = (res, data) => res.json({ success: true, ...data });

async function getStats(req, res, next) {
  try { ok(res, await adminService.getStats()); } catch (e) { next(e); }
}

async function getAnalytics(req, res, next) {
  try {
    const [daily, endpoints, plans] = await Promise.all([
      adminService.getDailyRequests(parseInt(req.query.days) || 30),
      adminService.getTopEndpoints(10),
      adminService.getPlanDistribution(),
    ]);
    ok(res, { daily, endpoints, plans });
  } catch (e) { next(e); }
}

async function listUsers(req, res, next) {
  try { ok(res, await adminService.listUsers(req.query)); } catch (e) { next(e); }
}

async function updateUserStatus(req, res, next) {
  try {
    ok(res, await adminService.updateUserStatus(req.params.id, req.body.status));
  } catch (e) { next(e); }
}

module.exports = { getStats, getAnalytics, listUsers, updateUserStatus };
