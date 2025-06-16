const express = require('express');
const { z } = require("zod");
const router = express.Router();

const config = require('../config');
const counterService = require('../services/counter');
const { themeList, getCountImage } = require('../utils/themify');
const { ZodValid } = require('../utils/middleware');
const { randomArray, logger } = require('../utils');

// get counter image
router.get(["/@:name", "/get/@:name"],
  ZodValid({
    params: z.object({
      name: z.string().max(config.limits.nameMaxLength),
    }),
    query: z.object({
      theme: z.string().default("moebooru"),
      padding: z.coerce.number().int().min(0).max(16).default(7),
      offset: z.coerce.number().min(config.limits.offsetRange.min).max(config.limits.offsetRange.max).default(0),
      align: z.enum(["top", "center", "bottom"]).default("top"),
      scale: z.coerce.number().min(config.limits.scaleRange.min).max(config.limits.scaleRange.max).default(1),
      pixelated: z.enum(["0", "1"]).default("1"),
      darkmode: z.enum(["0", "1", "auto"]).default("auto"),
      num: z.coerce.number().int().min(0).max(config.limits.numMax).default(0),
      prefix: z.coerce.number().int().min(-1).max(config.limits.prefixMax).default(-1)
    })
  }),
  async (req, res) => {
    const site = config.app.site || `${req.protocol}://${req.get('host')}`;
    const { name } = req.params;
    let { theme = "moebooru", num = 0, ...rest } = req.query;

    res.set({
      "content-type": "image/svg+xml",
      "cache-control": `max-age=${config.cache.maxAge.default}, no-cache, no-store, must-revalidate`,
    });

    const data = await counterService.getCountByName(String(name), Number(num));

    if (name === "demo") {
      res.set("cache-control", `max-age=${config.cache.maxAge.demo}`);
    }

    if (theme === "random") {
      theme = randomArray(Object.keys(themeList));
    }

    const renderSvg = getCountImage({
      name,
      count: data.num,
      theme,
      site,
      /**
       * Using image URLs is preferred for better bandwidth efficiency.
       * However, for github-camo (proxy for raw.githubusercontent.com), we need base64 data URI to bypass CSP restrictions.
       */
      base64: ['github-camo'].includes(req.get('User-Agent')),
      ...rest
    });

    res.send(renderSvg);

    logger.debug(
      data,
      { theme, ...req.query },
      `ip: ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`,
      `ref: ${req.get("Referrer") || null}`,
      `ua: ${req.get("User-Agent") || null}`
    );
  }
);

// get counter record
router.get("/record/@:name", async (req, res) => {
  const { name } = req.params;
  const data = await counterService.getCountByName(name);
  res.json(data);
});

module.exports = router;
