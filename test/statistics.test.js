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

test('详情缓存命中时不重复查询趋势、排名和来源统计', async (context) => {
  const db = fakeDb()
  const stats = createStatistics(db, logger)
  context.after(() => stats.close())
  await stats.init()
  await stats.summary()

  const seriesRead = context.mock.method(db, 'getSeries')
  const rankRead = context.mock.method(db, 'getCounterRank')
  const breakdownRead = context.mock.method(db, 'getBreakdown')
  const totalRead = context.mock.method(db, 'getNum')
  const first = await stats.series(':siatube')
  assert.deepEqual(await stats.series(':siatube'), first)

  assert.equal(seriesRead.mock.callCount(), 1)
  assert.equal(rankRead.mock.callCount(), 1)
  assert.deepEqual(breakdownRead.mock.calls.map(call => call.arguments[0]), ['country::siatube', 'language::siatube'])
  assert.equal(totalRead.mock.callCount(), 2)
})

test('详情缓存满五分钟过期，命中不延长有效期且并发刷新只查询一次', async (context) => {
  let now = Date.now()
  context.mock.method(Date, 'now', () => now)
  const db = fakeDb()
  const seriesRead = context.mock.method(db, 'getSeries')
  const rankRead = context.mock.method(db, 'getCounterRank')
  const stats = createStatistics(db, logger)
  context.after(() => stats.close())
  await stats.init()

  const first = await stats.series('a')
  now += 4 * 60000
  assert.deepEqual(await stats.series('a'), first)
  now += 60000 - 1
  assert.deepEqual(await stats.series('a'), first)
  assert.equal(seriesRead.mock.callCount(), 1)
  assert.equal(rankRead.mock.callCount(), 1)

  now++
  const refreshed = await Promise.all(Array.from({ length: 10 }, () => stats.series('a')))
  assert.ok(refreshed.every(data => data.updatedAt === now))
  assert.equal(seriesRead.mock.callCount(), 2)
  assert.equal(rankRead.mock.callCount(), 2)
})

test('详情缓存最多保存五十个 ID，访问命中后按 LRU 淘汰', async (context) => {
  const reads = new Map()
  const db = fakeDb({
    getSeries: async (name) => {
      reads.set(name, (reads.get(name) || 0) + 1)
      return []
    }
  })
  const stats = createStatistics(db, logger)
  context.after(() => stats.close())
  await stats.init()

  for (let index = 0; index < 50; index++) await stats.series(`id-${index}`)
  await stats.series('id-0')
  assert.equal(reads.get('id-0'), 1)

  await stats.series('id-50')
  await stats.series('id-0')
  assert.equal(reads.get('id-0'), 1)
  await stats.series('id-1')
  assert.equal(reads.get('id-1'), 2)
  assert.equal([...reads.values()].reduce((sum, count) => sum + count, 0), 52)
})

test('同一个详情 ID 的百个并发请求合并统计查询', async (context) => {
  const db = fakeDb({
    getSeries: async (name, start, end) => {
      await new Promise(resolve => setImmediate(resolve))
      return [{ bucket: end - 60000, num: 2 }]
    }
  })
  const stats = createStatistics(db, logger)
  context.after(() => stats.close())
  await stats.init()
  await stats.summary()

  const seriesRead = context.mock.method(db, 'getSeries')
  const rankRead = context.mock.method(db, 'getCounterRank')
  const breakdownRead = context.mock.method(db, 'getBreakdown')
  const results = await Promise.all(Array.from({ length: 100 }, () => stats.series('a')))

  assert.ok(results.every(data => data.name === 'a' && data.calls24h === 2 && data.points.length === 288))
  assert.equal(seriesRead.mock.callCount(), 1)
  assert.equal(rankRead.mock.callCount(), 1)
  assert.equal(breakdownRead.mock.callCount(), 2)
})

test('并发详情查询失败不缓存错误，下次请求可以重试', async (context) => {
  let failing = true
  const db = fakeDb({
    getCounterRank: async () => {
      await new Promise(resolve => setImmediate(resolve))
      if (failing) throw new Error('rank unavailable')
      return { position: 1, total: 100 }
    }
  })
  const rankRead = context.mock.method(db, 'getCounterRank')
  const stats = createStatistics(db, logger)
  context.after(() => stats.close())
  await stats.init()

  const failures = await Promise.allSettled(Array.from({ length: 10 }, () => stats.series('a')))
  assert.ok(failures.every(result => result.status === 'rejected' && result.reason.message === 'rank unavailable'))
  assert.equal(rankRead.mock.callCount(), 1)

  failing = false
  const recovered = await stats.series('a')
  assert.deepEqual(recovered.rank24h, { position: 1, total: 100 })
  assert.deepEqual(await stats.series('a'), recovered)
  assert.equal(rankRead.mock.callCount(), 2)
})

test('不同详情 ID 的趋势、排名和来源缓存互不影响', async (context) => {
  const db = fakeDb({
    getSeries: async (name, start, end) => [{ bucket: end - 60000, num: name === 'a' ? 2 : 3 }],
    getCounterRank: async (name) => ({ position: name === 'a' ? 1 : 2, total: 2 }),
    getBreakdown: async (dimension) => dimension.includes(':') ? [{ name: dimension, total: 1 }] : []
  })
  const seriesRead = context.mock.method(db, 'getSeries')
  const stats = createStatistics(db, logger)
  context.after(() => stats.close())
  await stats.init()

  const first = await stats.series('a')
  const second = await stats.series('b')
  assert.equal(first.name, 'a')
  assert.equal(first.calls24h, 2)
  assert.deepEqual(first.rank24h, { position: 1, total: 2 })
  assert.deepEqual(first.countries, [{ name: 'country:a', total: 1 }])
  assert.deepEqual(first.languages, [{ name: 'language:a', total: 1 }])
  assert.equal(second.name, 'b')
  assert.equal(second.calls24h, 3)
  assert.deepEqual(second.rank24h, { position: 2, total: 2 })
  assert.deepEqual(second.countries, [{ name: 'country:b', total: 1 }])
  assert.deepEqual(second.languages, [{ name: 'language:b', total: 1 }])
  assert.deepEqual(await stats.series('a'), first)
  assert.equal(seriesRead.mock.callCount(), 2)
})

test('详情统计命中缓存时累计计数仍读取内存和落库后的最新值', async (context) => {
  const persisted = new Map([['a', 7]])
  const db = fakeDb({
    getNum: async (name) => ({ name, num: persisted.get(name) || 0 }),
    writeSnapshot: async (snapshot) => {
      for (const counter of snapshot.counters) persisted.set(counter.name, counter.num)
    }
  })
  const seriesRead = context.mock.method(db, 'getSeries')
  const rankRead = context.mock.method(db, 'getCounterRank')
  const stats = createStatistics(db, logger)
  context.after(() => stats.close())
  await stats.init()

  assert.equal((await stats.series('a')).total, 7)
  persisted.set('a', 8)
  assert.equal((await stats.series('a')).total, 8)
  assert.equal((await stats.getCounter('a')).num, 9)
  assert.equal((await stats.series('a')).total, 9)
  await stats.flush()
  assert.equal(persisted.get('a'), 9)
  persisted.set('a', 10)
  assert.equal((await stats.series('a')).total, 10)
  assert.equal(seriesRead.mock.callCount(), 1)
  assert.equal(rankRead.mock.callCount(), 1)
})

test('关闭统计模块时等待正在进行的详情查询再关闭数据库', async (context) => {
  let releaseRead
  let markStarted
  const waiting = new Promise(resolve => { releaseRead = resolve })
  const started = new Promise(resolve => { markStarted = resolve })
  const db = fakeDb({
    getSeries: async () => { markStarted(); await waiting; return [] }
  })
  const closeDb = context.mock.method(db, 'close')
  const stats = createStatistics(db, logger)
  context.after(async () => { releaseRead(); await stats.close() })
  await stats.init()
  await stats.summary()

  const loading = stats.series('a')
  await started
  const closing = stats.close()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(closeDb.mock.callCount(), 0)

  releaseRead()
  const [data] = await Promise.all([loading, closing])
  assert.equal(data.name, 'a')
  assert.equal(closeDb.mock.callCount(), 1)
})
