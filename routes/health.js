const express = require('express');
const router = express.Router();
const { logger } = require('../utils');

// health check
router.get("/heart-beat", (req, res) => {
  res.set("cache-control", "max-age=0, no-cache, no-store, must-revalidate");
  res.send("alive");
  logger.debug("heart-beat");
});

module.exports = router;
