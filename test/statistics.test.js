'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')

const { createStatistics, hostname, country, language } = require('../utils/statistics')

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
    getCounterRank: async () => ({ position: null, total: 0 }),
    getSummary: async () => ({ total: 0, calls24h: 0, calls5m: 0 }),
    getTraffic: async () => [],
    getSeries: async () => [],
    getBreakdown: async () => [],
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

test('同一个计数器名的并发请求只读一次库并依次递增', async (t) => {
  let reads = 0
  const db = fakeDb({ getNum: async (name) => { reads++; return { name, num: 10 } } })
  const stats = createStatistics(db, logger)
  t.after(() => stats.close())

  const counters = await Promise.all([1, 2, 3, 4, 5].map(() => stats.getCounter('a')))

  assert.equal(reads, 1)
  assert.deepEqual(counters.map(row => row.num), [11, 12, 13, 14, 15])
})

test('指定计数时与 demo 这个计数器名都不读写库', async (t) => {
  const db = fakeDb({ getNum: async () => { throw new Error('should not read') } })
  const stats = createStatistics(db, logger)
  t.after(() => stats.close())

  assert.deepEqual(await stats.getCounter('a', 42), { name: 'a', num: 42 })
  assert.equal((await stats.getCounter('demo')).name, 'demo')
  assert.equal(db.written.length, 0)
})

test('record 按计数器、整站与来源三个维度累计', async (t) => {
  const db = fakeDb()
  const site = 'https://moe.test'
  const now = 1_700_000_000_000
  const stats = createStatistics(db, logger)
  t.after(() => stats.close())

  stats.record('a', 'https://GitHub.com/x', site, now)
  stats.record('a', 'https://moe.test/rank', site, now)
  await stats.flush()

  const snapshot = db.written.at(-1)
  assert.deepEqual(rowsOf(snapshot, 'counter').map(row => [row.name, row.num]), [['a', 2]])
  assert.deepEqual(rowsOf(snapshot, 'site').map(row => row.num), [2, 2])
  assert.deepEqual([...new Set(rowsOf(snapshot, 'source').map(row => row.name))], ['github.com'])
})

test('本站来源不计入来源维度，缺失来源记为未知', async (t) => {
  const db = fakeDb()
  const site = 'https://moe.test'
  const stats = createStatistics(db, logger)
  t.after(() => stats.close())

  stats.record('a', site, site, 1_700_000_000_000)
  await stats.flush()
  assert.deepEqual(rowsOf(db.written.at(-1), 'source'), [])

  stats.record('a', '', site, 1_700_000_000_000)
  await stats.flush()
  assert.deepEqual([...new Set(rowsOf(db.written.at(-1), 'source').map(row => row.name))], [''])
})

test('国家代码取两位小写字母，XX 与异常值不写入', () => {
  assert.equal(country('US'), 'us')
  assert.equal(country(' cn '), 'cn')
  assert.equal(country('TW'), 'cn')
  assert.equal(country(' tw '), 'cn')
  assert.equal(country('XX'), '')
  assert.equal(country('T1'), '')
  assert.equal(country('USA'), '')
  assert.equal(country(''), '')
  assert.equal(country(undefined), '')
})

test('语言取第一项的主语言子标签', () => {
  assert.equal(language('zh-CN,zh;q=0.9,en;q=0.8'), 'zh')
  assert.equal(language('en-US,en;q=0.9'), 'en')
  assert.equal(language('ja'), 'ja')
  assert.equal(language('zh-Hans-CN'), 'zh')
  assert.equal(language('*'), '')
  assert.equal(language(''), '')
  assert.equal(language(undefined), '')
})

test('国家与语言分别累计整站和单个计数器，请求头缺失时不建桶', async (t) => {
  const db = fakeDb()
  const site = 'https://moe.test'
  const stats = createStatistics(db, logger)
  t.after(() => stats.close())

  stats.record('a', site, site, 1_700_000_000_000, { country: 'US', language: 'zh-CN,zh;q=0.9' })
  stats.record('a', site, site, 1_700_000_100_000, { country: 'us', language: 'en-US' })
  stats.record('a', site, site, 1_700_000_200_000, { country: 'XX', language: '' })
  stats.record('a', site, site, 1_700_000_300_000, { country: 'TW', language: '' })
  stats.record('b', site, site, 1_700_000_400_000, { country: 'JP', language: 'ja' })
  await stats.flush()

  const snapshot = db.written.at(-1)
  assert.deepEqual(rowsOf(snapshot, 'country').map(row => [row.name, row.num, row.bucket]), [['us', 2, -1], ['cn', 1, -1], ['jp', 1, -1]])
  assert.deepEqual(rowsOf(snapshot, 'language').map(row => [row.name, row.num, row.bucket]).sort(), [['en', 1, -1], ['ja', 1, -1], ['zh', 1, -1]])
  assert.deepEqual(rowsOf(snapshot, 'country:a').map(row => [row.name, row.num, row.bucket]), [['us', 2, -1], ['cn', 1, -1]])
  assert.deepEqual(rowsOf(snapshot, 'language:a').map(row => [row.name, row.num, row.bucket]).sort(), [['en', 1, -1], ['zh', 1, -1]])
  assert.deepEqual(rowsOf(snapshot, 'country:b').map(row => [row.name, row.num, row.bucket]), [['jp', 1, -1]])
  assert.deepEqual(rowsOf(snapshot, 'language:b').map(row => [row.name, row.num, row.bucket]), [['ja', 1, -1]])
})

test('写入失败后重试仍带着原本的计数', async (t) => {
  const written = []
  let failing = true
  const db = fakeDb({
    writeSnapshot: async (snapshot) => {
      if (failing) { failing = false; throw new Error('write failed') }
      written.push(snapshot)
    }
  })
  const stats = createStatistics(db, logger)
  t.after(() => stats.close())

  await stats.getCounter('a')
  await stats.getCounter('a')
  await assert.rejects(() => stats.flush(), /write failed/)
  await stats.flush()

  assert.deepEqual(written[0].counters, [{ name: 'a', num: 2 }])
})

test('统计窗口不足时每分钟调用数标记为未就绪', async (t) => {
  const db = fakeDb({ getRank: async () => [{ name: 'a', total: 5, calls24h: 5, calls5m: 5 }] })
  const stats = createStatistics(db, logger)
  t.after(() => stats.close())
  await stats.init()

  const data = await stats.rank('rpm')
  assert.equal(data.rpmReady, false)
  assert.equal(data.partial24h, true)
  assert.equal(data.counters[0].rpm, null)
  assert.equal(data.counters[0].total, 5)

  const traffic = await stats.traffic('minute', '24h')
  assert.equal(traffic.points.length, 1440)
  assert.equal(traffic.points[0].count, null)
})

test('单计数器序列按 5 分钟汇总且不返回终身累计行', async (t) => {
  const breakdowns = {
    'country:a': [{ name: 'us', total: 7 }],
    'language:a': [{ name: 'en', total: 7 }]
  }
  const db = fakeDb({
    getNum: async (name) => ({ name, num: 42 }),
    getCounterRank: async (name) => {
      assert.equal(name, 'a')
      return { position: 105, total: 120 }
    },
    getBreakdown: async (dimension) => breakdowns[dimension] || [],
    getSeries: async (name, start, end) => {
      const lastMinute = Math.floor(end / 60000) * 60000
      return [
        { bucket: lastMinute - 9 * 60000, num: 1 },
        { bucket: lastMinute - 8 * 60000, num: 2 },
        { bucket: lastMinute - 60000, num: 4 }
      ]
    }
  })
  const stats = createStatistics(db, logger)
  t.after(() => stats.close())
  await stats.init()

  const data = await stats.series('a')
  assert.equal(data.name, 'a')
  assert.equal(data.total, 42)
  assert.deepEqual(data.countries, breakdowns['country:a'])
  assert.deepEqual(data.languages, breakdowns['language:a'])
  assert.equal(data.points.length, 288)
  assert.equal(data.calls24h, 7)
  assert.deepEqual(data.rank24h, { position: 105, total: 120 })

  const busy = data.points.filter(point => point.count > 0)
  assert.deepEqual(busy.map(point => point.count), [3, 4])
  // The two minutes ten minutes ago fall in the same bucket
  assert.equal(busy[0].time % 300000, 0)
  assert.equal(busy[1].time - busy[0].time, 300000)
})

test('单计数器序列读累计时不增加计数', async (t) => {
  const db = fakeDb({ getNum: async (name) => ({ name, num: 7 }) })
  const stats = createStatistics(db, logger)
  t.after(() => stats.close())
  await stats.init()

  const data = await stats.series('a')
  assert.equal(data.total, 7)
  assert.deepEqual(data.rank24h, { position: null, total: 0 })
  assert.equal((await stats.series('a')).total, 7)
  assert.deepEqual(db.written.flatMap(batch => batch.counters), [])

  assert.equal((await stats.getCounter('a')).num, 8)
  assert.equal((await stats.series('a')).total, 8)
})
