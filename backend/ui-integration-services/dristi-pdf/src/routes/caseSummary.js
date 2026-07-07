const express = require("express");
const router = express.Router();
const asyncMiddleware = require("../utils/asyncMiddleware");
const caseSummary = require("../caseSummaryHandlers/caseSummary");

router.post(
  "",
  asyncMiddleware(async function (req, res) {
    await caseSummary(req, res);
  }),
);

module.exports = router;
