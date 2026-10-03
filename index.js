"use strict";

require('dotenv').config();
const express = require("express");
const compression = require("compression");
const { z } = require("zod");

const db = require("./db");
const { themeList, themeGroups, getThemeGroups, getCountImage } = require("./utils/themify");
const { cors, ZodValid } = require("./utils/middleware");
const { randomArray, logger } = require("./utils");
const { createStatistics } = require('./utils/statistics');

const app = express();
const statistics = createStatistics(db, logger);
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
const nameParams = z.object({ name: z.string().min(1).max(32) });

function collectStatistics(req, res, next) {
  res.once('finish', () => {
    if (res.statusCode >= 200 && res.statusCode < 300 && res.locals.counted) {
      statistics.record(req.params.name, req.get('Referer'), process.env.APP_SITE || `${req.protocol}://${req.get('host')}`, Date.now(), {
        country: req.get('CF-IPCountry'),
        language: req.get('Accept-Language')
      });
    }
  });
  next();
}

app.use(express.static("assets"));
app.use(compression());
app.use(cors());
app.set("view engine", "pug");

app.get(['/', '/rank'], (req, res) => {
  const page = req.path === '/rank' ? 'rank' : 'home'
  const site = process.env.APP_SITE || `${req.protocol}://${req.get('host')}`
  const ga_id = process.env.GA_ID || null
  const themes = Object.keys(themeList).map((name) => ({ name, groups: getThemeGroups(name) }))

  res.render(page, {
    site,
    ga_id,
    themeCount: themes.length,
    page,
    // Theme names and groups go to the front end; images are rendered on demand by /@:name
    globalData: JSON.stringify({ site, page, groups: themeGroups, themes }).replace(/</g, '\\u003c'),
  })
});

// Counter detail page; renders client side from /api/stats/series/:name
app.get('/view/@:name', ZodValid({ params: nameParams }), (req, res) => {
  const name = req.params.name
  const site = process.env.APP_SITE || `${req.protocol}://${req.get('host')}`

  res.render('view', {
    site,
    ga_id: process.env.GA_ID || null,
    themeCount: Object.keys(themeList).length,
    page: 'view',
    name,
    globalData: JSON.stringify({
      site,
      page: 'view',
      name,
      groups: themeGroups,
      themes: Object.keys(themeList).map((theme) => ({ name: theme, groups: getThemeGroups(theme) }))
    }).replace(/</g, '\\u003c'),
  })
});

app.get('/api/stats/series/:name', ZodValid({ params: nameParams }), asyncRoute(async (req, res) => {
  res.set('cache-control', 'no-store');
  res.json(await statistics.series(req.params.name));
}));

// get the image
app.get(["/@:name", "/get/@:name"],
  ZodValid({
    params: nameParams,
    query: z.object({
      theme: z.string().default("moebooru"),
      padding: z.coerce.number().int().min(0).max(16).default(7),
      offset: z.coerce.number().min(-500).max(500).default(0),
      align: z.enum(["top", "center", "bottom"]).default("top"),
      scale: z.coerce.number().min(0.1).max(2).default(1),
      pixelated: z.enum(["0", "1"]).default("1"),
      darkmode: z.enum(["0", "1", "auto"]).default("auto"),

      // Unusual Options
      num: z.coerce.number().int().min(0).max(1e15).default(0), // a carry-safe integer, less than `2^53-1`, and aesthetically pleasing in decimal.
      prefix: z.coerce.number().int().min(-1).max(999999).default(-1)
    })
  }),
  collectStatistics,
  asyncRoute(async (req, res) => {
    const { name } = req.params;
    let { theme = "moebooru", num = 0, ...rest } = req.query;

    // This helps with GitHub's image cache
    res.set({
      "content-type": "image/svg+xml",
      "cache-control": "max-age=0, no-cache, no-store, must-revalidate",
    });

    const data = await statistics.getCounter(String(name), Number(num));

    if (name === "demo") {
      res.set("cache-control", "max-age=31536000");
    }

    if (theme === "random") {
      theme = randomArray(Object.keys(themeList));
    }

    // Send the generated SVG as the result
    const renderSvg = getCountImage({
      count: data.num,
      theme,
      ...rest
    });

    res.locals.counted = name !== 'demo' && num === 0;
    res.send(renderSvg);

    logger.debug(
      data,
      { theme, ...req.query },
      `ip: ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`,
      `ref: ${req.get("Referrer") || null}`,
      `ua: ${req.get("User-Agent") || null}`
    );
  })
);

// JSON record
app.get("/record/@:name", ZodValid({ params: nameParams }), collectStatistics, asyncRoute(async (req, res) => {
  const { name } = req.params;

  const data = await statistics.getCounter(name);

  res.locals.counted = name !== 'demo';
  res.json(data);
}));

app.get('/api/rank', ZodValid({ query: z.object({ sort: z.enum(['rpm', 'total', '24h']).default('rpm') }) }), asyncRoute(async (req, res) => {
  res.set('cache-control', 'no-store');
  res.json(await statistics.rank(req.query.sort));
}));

app.get('/api/stats/summary', asyncRoute(async (req, res) => {
  res.set('cache-control', 'no-store');
  res.json(await statistics.summary());
}));

app.get('/api/stats/traffic', ZodValid({ query: z.object({
  granularity: z.enum(['minute', 'hour']).default('minute'),
  range: z.enum(['24h', '7d']).default('24h')
}).refine(query => query.granularity === 'hour' || query.range === '24h', { message: 'Minute data supports the 24h range.' }) }), asyncRoute(async (req, res) => {
  res.set('cache-control', 'no-store');
  res.json(await statistics.traffic(req.query.granularity, req.query.range));
}));

app.get("/heart-beat", (req, res) => {
  res.set("cache-control", "max-age=0, no-cache, no-store, must-revalidate");
  res.send("alive");
  logger.debug("heart-beat");
});

app.use((error, req, res, next) => {
  logger.error('Request failed:', error);
  if (res.headersSent) return next(error);
  res.status(503).json({ message: 'The service is temporarily unavailable. Please try again.' });
});

statistics.init().then(() => {
  const listener = app.listen(process.env.APP_PORT || 3000, () => {
    logger.info('Your app is listening on port ' + listener.address().port);
  });
  listener.once('error', async error => {
    logger.error('Server startup failed:', error);
    process.exitCode = 1;
    await statistics.close();
  });
  let closing = false;
  const shutdown = async () => {
    if (closing) return;
    closing = true;
    try {
      await new Promise(resolve => listener.close(resolve));
      await statistics.close();
    } catch (error) {
      logger.error('Shutdown failed:', error);
      process.exitCode = 1;
      await db.close();
    }
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}).catch(async error => {
  logger.error('Database initialization failed:', error);
  process.exitCode = 1;
  await db.close();
});
