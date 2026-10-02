'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'moe-counter-sqlite-'))
process.env.DB_TYPE = 'sqlite'
process.env.DB_PATH = path.join(tempDir, 'count.db')

const db = require('../db')
const { statsId, MINUTE, HOUR } = require('../db/stats')

test('initStats 可重复执行并保留首次启动时间', async () => {
  const first = await db.initStats()
  const second = await db.initStats()
  assert.equal(typeof first.startedAt, 'number')
  assert.equal(second.startedAt, first.startedAt)
})

test('getNum 查不到时返回 num 为 0 的记录', async () => {
  assert.deepEqual(await db.getNum('missing'), { name: 'missing', num: 0 })
})

test('setNum 按传入值覆盖', async () => {
  await db.setNum('over', 10)
  await db.setNum('over', 3)
  assert.equal((await db.getNum('over')).num, 3)
})

test('writeSnapshot 写入时取已有值与新值中较大的一个', async () => {
  await db.writeSnapshot({ counters: [{ name: 'peak', num: 5 }], stats: [], updatedAt: Date.now() })
  await db.writeSnapshot({ counters: [{ name: 'peak', num: 3 }], stats: [], updatedAt: Date.now() })
  assert.equal((await db.getNum('peak')).num, 5)

  const row = { dimension: 'counter', name: 'peak', bucket: 0, num: 8 }
  await db.writeSnapshot({ counters: [], stats: [row], updatedAt: Date.now() })
  await db.writeSnapshot({ counters: [], stats: [{ ...row, num: 2 }], updatedAt: Date.now() })
  assert.deepEqual(await db.getStats([row]), [{ id: statsId(row), dimension: 'counter', name: 'peak', bucket: 0, num: 8 }])
})

test('getSummary 同时给出累计、近24小时与近5分钟三个值', async () => {
  const bucket = Math.floor(Date.now() / MINUTE) * MINUTE
  await db.writeSnapshot({
    counters: [],
    stats: [
      { dimension: 'counter', name: 'sum', bucket: -1, num: 100 },
      { dimension: 'counter', name: 'sum', bucket, num: 7 }
    ],
    updatedAt: Date.now()
  })

  const summary = await db.getSummary('counter', 'sum', bucket - 24 * HOUR, bucket + MINUTE, bucket - 5 * MINUTE)
  assert.deepEqual(summary, { total: 100, calls24h: 7, calls5m: 7 })
})

test('getRank 排除 demo 并按累计值排序', async () => {
  await db.setNumMulti([{ name: 'rank-a', num: 10 }, { name: 'rank-b', num: 30 }, { name: 'demo', num: 999 }])
  const now = Date.now()
  const rows = await db.getRank('counter', 'total', now - HOUR, now, now - 5 * MINUTE)

  assert.ok(!rows.some(row => row.name === 'demo'))
  assert.ok(rows.findIndex(row => row.name === 'rank-b') < rows.findIndex(row => row.name === 'rank-a'))
  assert.deepEqual(Object.keys(rows[0]).sort(), ['calls24h', 'calls5m', 'name', 'total'])
})

test('maintainStats 把整站分钟数据汇总成小时数据并清理过期明细', async () => {
  const now = Math.floor(Date.now() / HOUR) * HOUR
  await db.writeSnapshot({
    counters: [],
    stats: [
      { dimension: 'site', name: '', bucket: now - 2 * HOUR, num: 3 },
      { dimension: 'coverage', name: '', bucket: now - 2 * HOUR, num: 1 },
      { dimension: 'counter', name: 'keep', bucket: now - HOUR, num: 4 },
      { dimension: 'counter', name: 'drop', bucket: now - 72 * HOUR, num: 9 }
    ],
    updatedAt: now
  })

  await db.maintainStats(now)

  const hours = await db.getTraffic('hour', now - 3 * HOUR, now)
  assert.deepEqual(hours, [{ bucket: now - 2 * HOUR, num: 3, covered: 1 }])

  const left = await db.getStats([
    { dimension: 'counter', name: 'keep', bucket: now - HOUR },
    { dimension: 'counter', name: 'drop', bucket: now - 72 * HOUR }
  ])
  assert.deepEqual(left.map(row => row.name), ['keep'])
})

test('getSeries 只返回指定计数器的分钟数据并按时间升序', async () => {
  const now = Math.floor(Date.now() / MINUTE) * MINUTE
  await db.writeSnapshot({
    counters: [],
    stats: [
      { dimension: 'counter', name: 'series-a', bucket: now - 2 * MINUTE, num: 2 },
      { dimension: 'counter', name: 'series-a', bucket: now - MINUTE, num: 5 },
      { dimension: 'counter', name: 'series-b', bucket: now - MINUTE, num: 9 },
      // The lifetime row sits at bucket -1 and must stay out of the series
      { dimension: 'counter', name: 'series-a', bucket: -1, num: 100 },
      { dimension: 'site', name: '', bucket: now - MINUTE, num: 7 }
    ],
    updatedAt: now
  })

  const rows = await db.getSeries('series-a', now - 3 * MINUTE, now)
  assert.deepEqual(rows, [
    { bucket: now - 2 * MINUTE, num: 2 },
    { bucket: now - MINUTE, num: 5 }
  ])
})

test.after(async () => {
  await db.close()
  fs.rmSync(tempDir, { recursive: true, force: true })
})
