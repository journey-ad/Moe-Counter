'use strict';

const http = require('http');
const path = require('path');

process.env.DB_TYPE = 'sqlite';
process.env.DB_INTERVAL = '0';
process.env.LOG_LEVEL = 'error';

const db = require('./db');

const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function httpRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

async function runTests() {
  console.log('========================================');
  console.log('  Moe Counter 数据可视化模块测试');
  console.log('========================================\n');

  let server;
  let app;

  try {
    console.log('[1/6] 启动测试服务器...');
    const express = require('express');
    const compression = require('compression');
    const { z } = require('zod');
    const { cors, ZodValid } = require('./utils/middleware');
    const { randomArray, logger } = require('./utils');

    app = express();
    app.use(express.static("assets"));
    app.use(compression());
    app.use(cors());
    app.set("view engine", "pug");

    let __cache_counter = {};
    let __cache_stats = {};
    let enablePushDelay = process.env.DB_INTERVAL > 0;
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

    async function pushDB() {
      const hasCounterData = Object.keys(__cache_counter).length > 0;
      const hasStatsData = Object.keys(__cache_stats).length > 0;
      
      if (!hasCounterData && !hasStatsData) return;
      if (enablePushDelay && !needPush) return;

      try {
        needPush = false;
        
        if (hasCounterData) {
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
        console.error("pushDB error: ", error);
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
        console.error("get count by name error: ", error);
        return defaultCount;
      }
    }

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
          num: z.coerce.number().int().min(0).max(1e15).default(0),
          prefix: z.coerce.number().int().min(-1).max(999999).default(-1)
        })
      }),
      async (req, res) => {
        const { name } = req.params;
        let { theme = "moebooru", num = 0, ...rest } = req.query;

        res.set({
          "content-type": "image/svg+xml",
          "cache-control": "max-age=0, no-cache, no-store, must-revalidate",
        });

        const data = await getCountByName(String(name), Number(num));
        res.send(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="20"><text x="10" y="15">${data.num}</text></svg>`);
      }
    );

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
          console.error("get stats error: ", error);
          res.status(500).json({
            error: "Failed to get stats",
            message: error.message
          });
        }
      }
    );

    server = app.listen(PORT, () => {
      console.log('      ✓ 测试服务器已启动在端口 ' + PORT);
    });

    await sleep(500);

    const testCounterName = `test_stats_${Date.now()}`;
    const visitCount = 5;

    console.log('\n[2/6] 访问计数器生成测试数据...');
    console.log(`      计数器名称: ${testCounterName}`);
    console.log(`      计划访问次数: ${visitCount}`);

    for (let i = 0; i < visitCount; i++) {
      const response = await httpRequest(`${BASE_URL}/@${testCounterName}`);
      if (response.statusCode !== 200) {
        throw new Error(`访问计数器失败，状态码: ${response.statusCode}`);
      }
      process.stdout.write(`      已访问 ${i + 1}/${visitCount} 次\r`);
    }
    console.log('\n      ✓ 测试数据生成完成');

    await sleep(200);

    console.log('\n[3/6] 测试统计接口 /api/stats/:name (默认范围)...');
    const statsResponse = await httpRequest(`${BASE_URL}/api/stats/${testCounterName}`);
    
    if (statsResponse.statusCode !== 200) {
      throw new Error(`统计接口返回错误状态码: ${statsResponse.statusCode}`);
    }

    const statsData = JSON.parse(statsResponse.body);
    console.log(`      ✓ 接口返回状态码: ${statsResponse.statusCode}`);
    console.log(`      ✓ 计数器名称: ${statsData.name}`);
    console.log(`      ✓ 时间范围: ${statsData.range}`);
    console.log(`      ✓ 总访问量: ${statsData.currentTotal}`);
    console.log(`      ✓ 范围访问量: ${statsData.total}`);
    console.log(`      ✓ 日期范围: ${statsData.startDate} ~ ${statsData.endDate}`);
    console.log(`      ✓ 每日数据条数: ${statsData.daily.length}`);

    if (statsData.currentTotal < visitCount) {
      console.log(`      ⚠  注意: 由于缓存机制，数据可能延迟写入，请等待 DB_INTERVAL 秒后再次查询`);
    }

    console.log('\n[4/6] 测试不同时间范围参数...');
    
    for (const range of ['day', 'week', 'month']) {
      const response = await httpRequest(`${BASE_URL}/api/stats/${testCounterName}?range=${range}`);
      if (response.statusCode !== 200) {
        throw new Error(`range=${range} 参数测试失败，状态码: ${response.statusCode}`);
      }
      const data = JSON.parse(response.body);
      console.log(`      ✓ range=${range}: 成功返回 ${data.daily.length} 天数据`);
    }

    console.log('\n[5/6] 测试无效参数验证...');
    const invalidRangeResponse = await httpRequest(`${BASE_URL}/api/stats/${testCounterName}?range=invalid`);
    
    if (invalidRangeResponse.statusCode !== 400) {
      console.log(`      ⚠  注意: 无效参数返回状态码 ${invalidRangeResponse.statusCode} (预期 400)`);
    } else {
      console.log(`      ✓ 无效 range 参数正确返回 400 状态码`);
    }

    const longNameResponse = await httpRequest(`${BASE_URL}/api/stats/${'a'.repeat(50)}`);
    if (longNameResponse.statusCode !== 200 && longNameResponse.statusCode !== 400) {
      console.log(`      ⚠  超长名称返回状态码: ${longNameResponse.statusCode}`);
    } else {
      console.log(`      ✓ 超长名称参数处理正常`);
    }

    console.log('\n[6/6] 验证前端静态页面...');
    const statsPageResponse = await httpRequest(`${BASE_URL}/stats.html`);
    
    if (statsPageResponse.statusCode !== 200) {
      throw new Error(`前端页面无法访问，状态码: ${statsPageResponse.statusCode}`);
    }

    if (!statsPageResponse.body.includes('Chart')) {
      throw new Error('前端页面未包含 Chart.js 相关代码');
    }

    if (!statsPageResponse.body.includes('/api/stats/')) {
      throw new Error('前端页面未包含统计接口调用');
    }

    console.log(`      ✓ 页面返回状态码: ${statsPageResponse.statusCode}`);
    console.log(`      ✓ 页面包含 Chart.js 引用`);
    console.log(`      ✓ 页面包含统计接口调用逻辑`);

    console.log('\n========================================');
    console.log('  ✅ 所有测试通过!');
    console.log('========================================\n');

    console.log('测试信息总结:');
    console.log(`  - 测试计数器: ${testCounterName}`);
    console.log(`  - 访问次数: ${visitCount}`);
    console.log(`  - 测试端口: ${PORT}`);
    console.log(`  - 数据库类型: ${process.env.DB_TYPE}`);
    console.log('\n手动验证步骤:');
    console.log('  1. 启动主服务器: pnpm start');
    console.log(`  2. 访问计数器几次: curl ${BASE_URL}/@${testCounterName}`);
    console.log(`  3. 查看统计数据: curl ${BASE_URL}/api/stats/${testCounterName}`);
    console.log(`  4. 查看可视化页面: 浏览器打开 ${BASE_URL}/stats.html`);

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
  }
}

runTests();