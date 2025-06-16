"use strict";

const express = require("express");
const compression = require("compression");

const config = require("./config");
const { cors } = require("./utils/middleware");
const { logger } = require("./utils");

// import routes
const homeRouter = require('./routes/home');
const counterRouter = require('./routes/counter');
const healthRouter = require('./routes/health');

const app = express();

// static assets
app.use(express.static("assets", {
  setHeaders: (res, path) => {
    // cache theme images for long time
    if (path.includes("theme")) {
      res.setHeader("Cache-Control", `max-age=${config.cache.maxAge.theme}`);
    }
  }
}));
app.use(compression());
app.use(cors());
app.set("view engine", "pug");

// routes handler
app.use('/', homeRouter);
app.use('/', counterRouter);
app.use('/', healthRouter);

// error handler
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// start server
const listener = app.listen(config.app.port, () => {
  logger.info("Your app is listening on port " + listener.address().port);
});
