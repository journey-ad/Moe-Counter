'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')

const { createStatistics, hostname } = require('../utils/statistics')

const logger = { info() {}, debug() {}, error() {} }

function fakeDb(overrides = {}) {
  const written = []
  const existing = new Map()

  return Object.assign({
    written,
    existing,
    getNum: async (name) => ({ name, num: existing.get(name) || 0 }),
    getAll: async () => [],
    setNum: async () => {},
    setNumMulti: async () => {},
    initStats: async () => ({ startedAt: 1 }),
    getStats: async () => [],
    writeSnapshot: async (snapshot) => { written.push(snapshot) },
    getRank: async () => [],
    getSummary: async () => ({ total: 0, calls24h: 0, calls5m: 0 }),
    getTraffic: async () => [],
    maintainStats: async () => {},
    close: async () => {}
  }, overrides)
}

const rowsOf = (snapshot, dimension) => snapshot.stats.filter(row => row.dimension === dimension)

test('hostname 只接受 http 与 https 并输出小写主机名', () => {
  assert.equal(hostname('https://GitHub.com/a/b?c=1#d'), 'github.com')
  assert.equal(hostname('http://sub.example.com:8080/'), 'sub.example.com')
  assert.equal(hostname('https://example.com./'), 'example.com')
  assert.equal(hostname('ftp://example.com/'), '')
  assert.equal(hostname('not a url'), '')
  assert.equal(hostname(''), '')
  assert.equal(hostname(undefined), '')
})

test('同一个计数器名的并发请求只读一次库并依次递增', async () => {
  let reads = 0
  const db = fakeDb({ getNum: async (name) => { reads++; return { name, num: 10 } } })
  const stats = createStatistics(db, logger)

  const counters = await Promise.all([1, 2, 3, 4, 5].map(() => stats.getCounter('a')))

  assert.equal(reads, 1)
  assert.deepEqual(counters.map(row => row.num), [11, 12, 13, 14, 15])
  await stats.close()
})

test('指定计数时与 demo 这个计数器名都不读写库', async () => {
  const db = fakeDb({ getNum: async () => { throw new Error('should not read') } })
  const stats = createStatistics(db, logger)

  assert.deepEqual(await stats.getCounter('a', 42), { name: 'a', num: 42 })
  assert.equal((await stats.getCounter('demo')).name, 'demo')
  assert.equal(db.written.length, 0)
  await stats.close()
})

test('record 按计数器、整站与来源三个维度累计', async () => {
  const db = fakeDb()
  const site = 'https://moe.test'
  const now = 1_700_000_000_000
  const stats = createStatistics(db, logger)

  stats.record('a', 'https://GitHub.com/x', site, now)
  stats.record('a', 'https://moe.test/rank', site, now)
  await stats.flush()

  const snapshot = db.written.at(-1)
  assert.deepEqual(rowsOf(snapshot, 'counter').map(row => [row.name, row.num]), [['a', 2]])
  assert.deepEqual(rowsOf(snapshot, 'site').map(row => row.num), [2, 2])
  assert.deepEqual([...new Set(rowsOf(snapshot, 'source').map(row => row.name))], ['github.com'])
  await stats.close()
})

test('本站来源不计入来源维度，缺失来源记为未知', async () => {
  const db = fakeDb()
  const site = 'https://moe.test'
  const stats = createStatistics(db, logger)

  stats.record('a', site, site, 1_700_000_000_000)
  await stats.flush()
  assert.deepEqual(rowsOf(db.written.at(-1), 'source'), [])

  stats.record('a', '', site, 1_700_000_000_000)
  await stats.flush()
  assert.deepEqual([...new Set(rowsOf(db.written.at(-1), 'source').map(row => row.name))], [''])
  await stats.close()
})

test('写入失败后重试仍带着原本的计数', async () => {
  const written = []
  let failing = true
  const db = fakeDb({
    writeSnapshot: async (snapshot) => {
      if (failing) { failing = false; throw new Error('write failed') }
      written.push(snapshot)
    }
  })
  const stats = createStatistics(db, logger)

  await stats.getCounter('a')
  await stats.getCounter('a')
  await assert.rejects(() => stats.flush(), /write failed/)
  await stats.flush()

  assert.deepEqual(written[0].counters, [{ name: 'a', num: 2 }])
  await stats.close()
})

test('统计窗口不足时每分钟调用数标记为未就绪', async () => {
  const db = fakeDb({ getRank: async () => [{ name: 'a', total: 5, calls24h: 5, calls5m: 5 }] })
  const stats = createStatistics(db, logger)
  await stats.init()

  const data = await stats.rank('rpm')
  assert.equal(data.rpmReady, false)
  assert.equal(data.partial24h, true)
  assert.equal(data.counters[0].rpm, null)
  assert.equal(data.counters[0].total, 5)

  const traffic = await stats.traffic('minute', '24h')
  assert.equal(traffic.points.length, 1440)
  assert.equal(traffic.points[0].count, null)
  await stats.close()
})
