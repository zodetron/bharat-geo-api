const searchService = require("../services/search.service");

async function search(req, res, next) {
  try {
    const result = await searchService.search(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function autocomplete(req, res, next) {
  try {
    const result = await searchService.autocomplete(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = { search, autocomplete };
