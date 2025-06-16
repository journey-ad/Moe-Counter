const express = require('express');
const router = express.Router();

const config = require('../config');
const { themeList } = require('../utils/themify');

// index page
router.get('/', (req, res) => {
  const site = config.app.site || `${req.protocol}://${req.get('host')}`;
  res.render('index', {
    site,
    ga_id: config.app.gaId,
    themeList,
  });
});

module.exports = router;
