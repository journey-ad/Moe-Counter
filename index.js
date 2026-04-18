"use strict";

require('dotenv').config();
const express = require("express");
const compression = require("compression");
const { z } = require("zod");

const db = require("./db");
const { themeList, getCountImage } = require("./utils/themify");
const { cors, ZodValid } = require("./utils/middleware");
const { randomArray, logger } = require("./utils");

const app = express();

app.use(express.static("assets"));
app.use(compression());
app.use(cors());
app.set("view engine", "pug");

app.get('/', (req, res) => {
  const site = process.env.APP_SITE || `${req.protocol}://${req.get('host')}`
  const ga_id = process.env.GA_ID || null
  res.render('index', {
    site,
    ga_id,
    themeList,
  })
});

// get the image
app.get(["/@:name", "/get/@:name"],
  ZodValid({
    params: z.object({
      name: z.string().max(32),
    }),
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
  async (req, res) => {
    const { name } = req.params;
    let { theme = "moebooru", num = 0, ...rest } = req.query;

    // This helps with GitHub's image cache
    res.set({
      "content-type": "image/svg+xml",
      "cache-control": "max-age=0, no-cache, no-store, must-revalidate",
    });

    const data = await getCountByName(String(name), Number(num));

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

// JSON record
app.get("/record/@:name", async (req, res) => {
  const { name } = req.params;

  const data = await getCountByName(name);

  res.json(data);
});

app.get("/heart-beat", (req, res) => {
  res.set("cache-control", "max-age=0, no-cache, no-store, must-revalidate");
  res.send("alive");
  logger.debug("heart-beat");
});

app.get("/api/stats/:name",
  ZodValid({
    params: z.object({
      name: z.string().max(32),
    }),
    query: z.object({
      range: z.enum(["day", "week", "month"]).default("day"),
    })
  }),
  async (req, res) => {
    const { name } = req.params;
    const { range } = req.query;

    try {
      const dateRange = getDateRange(range);
      const rawStats = await db.getStats(name, dateRange.start, dateRange.end);
      const stats = fillMissingDates(rawStats, dateRange.start, dateRange.end);

      let total = 0;
      stats.forEach(day => {
        total += day.count;
      });

      const counter = await db.getNum(name);
      
      res.json({
        name,
        range,
        total,
        currentTotal: counter ? counter.num : 0,
        startDate: dateRange.start,
        endDate: dateRange.end,
        daily: stats
      });
    } catch (error) {
      logger.error("get stats error: ", error);
      res.status(500).json({
        error: "Failed to get stats",
        message: error.message
      });
    }
  }
);

const listener = app.listen(process.env.APP_PORT || 3000, () => {
  logger.info("Your app is listening on port " + listener.address().port);
});

let __cache_counter = {};
let __cache_stats = {};
let enablePushDelay = process.env.DB_INTERVAL > 0
let needPush = false;

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function getDateRange(rangeType) {
  const today = new Date();
  let startDate;
  
  switch (rangeType) {
    case 'week':
      const dayOfWeek = today.getDay();
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate = new Date(today);
      startDate.setDate(today.getDate() - diffToMonday);
      break;
    case 'month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'day':
    default:
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 6);
      break;
  }
  
  return {
    start: startDate.toISOString().split('T')[0],
    end: today.toISOString().split('T')[0]
  };
}

function fillMissingDates(data, startDate, endDate) {
  const result = [];
  const dataMap = {};
  
  data.forEach(item => {
    dataMap[item.date] = item.count;
  });
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    result.push({
      date: dateStr,
      count: dataMap[dateStr] || 0
    });
  }
  
  return result;
}

if (enablePushDelay) {
  setInterval(() => {
    needPush = true;
  }, 1000 * process.env.DB_INTERVAL);
}

async function pushDB() {
  const hasCounterData = Object.keys(__cache_counter).length > 0;
  const hasStatsData = Object.keys(__cache_stats).length > 0;
  
  if (!hasCounterData && !hasStatsData) return;
  if (enablePushDelay && !needPush) return;

  try {
    needPush = false;
    
    if (hasCounterData) {
      logger.info("pushDB counters", __cache_counter);
      const counters = Object.keys(__cache_counter).map((key) => {
        return {
          name: key,
          num: __cache_counter[key],
        };
      });
      await db.setNumMulti(counters);
      __cache_counter = {};
    }
    
    if (hasStatsData) {
      logger.info("pushDB stats", __cache_stats);
      const statsList = [];
      for (const nameDateKey in __cache_stats) {
        const [name, date] = nameDateKey.split('|');
        statsList.push({
          name,
          date,
          count: __cache_stats[nameDateKey]
        });
      }
      await db.incrementStatsMulti(statsList);
      __cache_stats = {};
    }
  } catch (error) {
    logger.error("pushDB is error: ", error);
  }
}

async function getCountByName(name, num) {
  const defaultCount = { name, num: 0 };

  if (name === "demo") return { name, num: "0123456789" };

  if (num > 0) { return { name, num } };

  try {
    if (!(name in __cache_counter)) {
      const counter = (await db.getNum(name)) || defaultCount;
      __cache_counter[name] = counter.num + 1;
    } else {
      __cache_counter[name]++;
    }

    const today = getTodayDate();
    const statsKey = `${name}|${today}`;
    if (!(statsKey in __cache_stats)) {
      __cache_stats[statsKey] = 1;
    } else {
      __cache_stats[statsKey]++;
    }

    pushDB();

    return { name, num: __cache_counter[name] };
  } catch (error) {
    logger.error("get count by name is error: ", error);
    return defaultCount;
  }
}
