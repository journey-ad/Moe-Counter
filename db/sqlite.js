'use strict'

const path = require('path')
const fs = require('fs')
const Database = require('better-sqlite3')
const { HOUR, retention, statsId, orderBy } = require('./stats')

const filename = process.env.DB_PATH || path.resolve(__dirname, '../data/count.db')
fs.mkdirSync(path.dirname(filename), { recursive: true })
const db = new Database(filename)
db.pragma('journal_mode = WAL')
db.exec(`
  CREATE TABLE IF NOT EXISTS tb_count (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(32) NOT NULL UNIQUE,
    num BIGINT NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_count_num ON tb_count(num DESC, name);
  CREATE TABLE IF NOT EXISTS tb_stats (
    id TEXT PRIMARY KEY,
    dimension TEXT NOT NULL,
    name TEXT NOT NULL,
    bucket INTEGER NOT NULL,
    num INTEGER NOT NULL,
    UNIQUE(dimension, bucket, name)
  );
  CREATE INDEX IF NOT EXISTS idx_stats_name ON tb_stats(dimension, name, bucket);
  CREATE INDEX IF NOT EXISTS idx_stats_total ON tb_stats(dimension, bucket, num DESC, name);
  CREATE TABLE IF NOT EXISTS tb_stats_hour (
    bucket INTEGER PRIMARY KEY,
    num INTEGER NOT NULL,
    covered INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS tb_stats_meta (name TEXT PRIMARY KEY, value INTEGER NOT NULL);
`)

const saveCount = db.prepare(`INSERT INTO tb_count(name, num) VALUES(@name, @num)
  ON CONFLICT(name) DO UPDATE SET num = excluded.num`)
const saveCounter = db.prepare(`INSERT INTO tb_count(name, num) VALUES(@name, @num)
  ON CONFLICT(name) DO UPDATE SET num = MAX(tb_count.num, excluded.num)`)
const saveStat = db.prepare(`INSERT INTO tb_stats(id, dimension, name, bucket, num)
  VALUES(@id, @dimension, @name, @bucket, @num)
  ON CONFLICT(id) DO UPDATE SET num = MAX(tb_stats.num, excluded.num)`)
const saveMeta = db.prepare(`INSERT INTO tb_stats_meta(name, value) VALUES(?, ?)
  ON CONFLICT(name) DO UPDATE SET value = excluded.value`)

const writeSnapshot = db.transaction(({ counters, stats, updatedAt }) => {
  for (const counter of counters) saveCounter.run(counter)
  for (const row of stats) saveStat.run({ ...row, id: statsId(row) })
  saveMeta.run('updatedAt', updatedAt)
})

async function initStats() {
  db.prepare('INSERT OR IGNORE INTO tb_stats_meta(name, value) VALUES(?, ?)').run('startedAt', Date.now())
  return Object.fromEntries(db.prepare('SELECT name, value FROM tb_stats_meta').all().map(row => [row.name, row.value]))
}

async function getStats(rows) {
  const result = []
  for (let i = 0; i < rows.length; i += 500) {
    const ids = rows.slice(i, i + 500).map(statsId)
    result.push(...db.prepare(`SELECT * FROM tb_stats WHERE id IN (${ids.map(() => '?').join(',')})`).all(...ids))
  }
  return result
}

async function getRank(dimension, sort, start, end, rpmStart) {
  const base = dimension === 'counter'
    ? `SELECT name, num AS total FROM tb_count WHERE name != 'demo'`
    : `SELECT name, num AS total FROM tb_stats WHERE dimension = 'source' AND bucket = -1 AND name != ''`
  return db.prepare(`WITH activity AS (
    SELECT name, SUM(num) AS calls24h,
      SUM(CASE WHEN bucket >= @rpmStart THEN num ELSE 0 END) AS calls5m
    FROM tb_stats WHERE dimension = @dimension AND bucket >= @start AND bucket < @end GROUP BY name
  ) SELECT base.name, base.total, COALESCE(activity.calls24h, 0) AS calls24h,
      COALESCE(activity.calls5m, 0) AS calls5m
    FROM (${base}) AS base LEFT JOIN activity ON base.name = activity.name
    ORDER BY ${orderBy(sort)} DESC, total DESC, base.name ASC LIMIT 100
  `).all({ dimension, start, end, rpmStart })
}

async function getSummary(dimension, name, start, end, rpmStart) {
  return db.prepare(`SELECT
    COALESCE(SUM(CASE WHEN bucket = -1 THEN num ELSE 0 END), 0) AS total,
    COALESCE(SUM(CASE WHEN bucket >= @start AND bucket < @end THEN num ELSE 0 END), 0) AS calls24h,
    COALESCE(SUM(CASE WHEN bucket >= @rpmStart AND bucket < @end THEN num ELSE 0 END), 0) AS calls5m
    FROM tb_stats WHERE dimension = @dimension AND name = @name AND (bucket = -1 OR bucket >= @start)
  `).get({ dimension, name, start, end, rpmStart })
}

async function getTraffic(granularity, start, end) {
  if (granularity === 'hour') {
    return db.prepare('SELECT bucket, num, covered FROM tb_stats_hour WHERE bucket >= ? AND bucket < ? ORDER BY bucket').all(start, end)
  }
  return db.prepare(`SELECT bucket,
    SUM(CASE WHEN dimension = 'site' THEN num ELSE 0 END) AS num,
    SUM(CASE WHEN dimension = 'coverage' THEN 1 ELSE 0 END) AS covered
    FROM tb_stats WHERE dimension IN ('site', 'coverage') AND bucket >= ? AND bucket < ?
    GROUP BY bucket ORDER BY bucket`).all(start, end)
}

async function maintainStats(now) {
  const end = Math.floor(now / HOUR) * HOUR
  const minuteStart = end - retention.minute
  db.transaction(() => {
    db.prepare(`INSERT INTO tb_stats_hour(bucket, num, covered)
      SELECT CAST(bucket / @hour AS INTEGER) * @hour,
        SUM(CASE WHEN dimension = 'site' THEN num ELSE 0 END),
        SUM(CASE WHEN dimension = 'coverage' THEN 1 ELSE 0 END)
      FROM tb_stats WHERE dimension IN ('site', 'coverage') AND bucket >= @start AND bucket < @end
      GROUP BY CAST(bucket / @hour AS INTEGER) * @hour
      ON CONFLICT(bucket) DO UPDATE SET num = excluded.num, covered = excluded.covered
    `).run({ hour: HOUR, start: minuteStart, end })
    db.prepare(`DELETE FROM tb_stats WHERE bucket >= 0 AND
      ((dimension IN ('counter', 'source') AND bucket < @detail) OR
       (dimension IN ('site', 'coverage') AND bucket < @minute))
    `).run({ detail: now - retention.detail, minute: minuteStart })
    db.prepare('DELETE FROM tb_stats_hour WHERE bucket < ?').run(now - retention.hour)
  })()
}

module.exports = {
  getNum: async (name) => db.prepare('SELECT name, num FROM tb_count WHERE name = ?').get(name) || { name, num: 0 },
  getAll: async () => db.prepare('SELECT * FROM tb_count').all(),
  setNum: async (name, num) => saveCount.run({ name, num }),
  setNumMulti: async (counters) => db.transaction(() => counters.forEach(row => saveCount.run(row)))(),
  initStats, getStats, getRank, getSummary, getTraffic, maintainStats,
  writeSnapshot: async (snapshot) => writeSnapshot(snapshot),
  close: async () => db.close()
}
