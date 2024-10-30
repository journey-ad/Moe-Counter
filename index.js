"use strict";

require('dotenv').config();
const express = require("express");
const compression = require("compression");
const { z } = require("zod");

const db = require("./db");
const { themeList, getCountImage } = require("./utils/themify");
const { cors, ZodValid } = require("./utils/middleware");
const { randomArray } = require("./utils");

const app = express();

app.use(express.static("assets"));
app.use(compression());
app.use(cors());
app.set("view engine", "pug");

app.get('/', (req, res) => {
  const site = process.env.APP_SITE || `${req.protocol}://${req.get('host')}`
  res.render('index', {
    site,
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
      num: z.coerce.number().min(0).max(1000000000000000).default(0), // a carry-safe integer, less than `2^53-1`, and aesthetically pleasing in decimal.
      padding: z.coerce.number().min(0).max(16).default(7),
      offset: z.coerce.number().min(-500).max(500).default(0),
      align: z.enum(["top", "center", "bottom"]).default("top"),
      scale: z.coerce.number().min(0.1).max(2).default(1),
      pixelated: z.enum(["0", "1"]).default("1"),
      darkmode: z.enum(["0", "1", "auto"]).default("auto")
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

    const data = await getCountByName(name, num);

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

    console.log(
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
  console.log("heart-beat");
});

const listener = app.listen(process.env.APP_PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

let __cache_counter = {};
let enablePushDelay = process.env.DB_INTERVAL > 0
let needPush = false;

if (enablePushDelay) {
  setInterval(() => {
    needPush = true;
  }, 1000 * process.env.DB_INTERVAL);
}

async function pushDB() {
  if (Object.keys(__cache_counter).length === 0) return;
  if (enablePushDelay && !needPush) return;

  try {
    needPush = false;
    console.log("pushDB", __cache_counter);

    const counters = Object.keys(__cache_counter).map((key) => {
      return {
        name: key,
        num: __cache_counter[key],
      };
    });

    await db.setNumMulti(counters);
    __cache_counter = {};
  } catch (error) {
    console.log("pushDB is error: ", error);
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

    pushDB();

    return { name, num: __cache_counter[name] };
  } catch (error) {
    console.log("get count by name is error: ", error);
    return defaultCount;
  }
}
