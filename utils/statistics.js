'use strict'

const { MINUTE, HOUR, DAY, statsId } = require('../db/stats')

function hostname(value) {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.hostname.toLowerCase().replace(/\.$/, '') : ''
  } catch { return '' }
}

function createStatistics(db, logger) {
  const counters = new Map()
  let dirty = new Map()
  let pending = new Map()
  let retry = null
  let writing = null
  let nextCoverage = Math.ceil(Date.now() / MINUTE) * MINUTE
  let updatedAt = 0
  let maintenanceAt = -1
  let cache = null
  let reading = null
  let timer
  let startedAt
  const configuredInterval = Number(process.env.DB_INTERVAL ?? 10)
  const interval = Number.isFinite(configuredInterval) && configuredInterval >= 0 ? configuredInterval : 10

  function add(dimension, name, bucket, num = 1) {
    const row = { dimension, name, bucket, num }
    const id = statsId(row)
    const existing = pending.get(id)
    if (existing) existing.num += num
    else pending.set(id, row)
  }

  async function getCounter(name, num = 0) {
    if (name === 'demo') return { name, num: '0123456789' }
    if (num > 0) return { name, num }
    let state = counters.get(name)
    if (!state) {
      state = { num: 0, readers: 0 }
      state.ready = Promise.resolve().then(() => db.getNum(name)).then(row => { state.num = row.num })
      counters.set(name, state)
    }
    state.readers++
    try {
      await state.ready
      state.num++
      dirty.set(name, state.num)
      return { name, num: state.num }
    } catch (error) {
      if (counters.get(name) === state) counters.delete(name)
      throw error
    } finally { state.readers-- }
  }

  function record(name, referrer, site, now = Date.now()) {
    if (name === 'demo') return
    const bucket = Math.floor(now / MINUTE) * MINUTE
    add('counter', name, bucket)
    add('site', '', bucket)
    add('site', '', -1)
    const source = hostname(referrer)
    if (!source || source !== hostname(site)) {
      add('source', source, bucket)
      add('source', source, -1)
    }
    if (interval === 0) flush().catch(error => logger.error('Statistics write failed:', error))
  }

  async function persist() {
    await db.writeSnapshot(retry)
    updatedAt = retry.updatedAt
    for (const { name, num } of retry.counters) {
      const state = counters.get(name)
      if (state?.num === num && state.readers === 0) counters.delete(name)
    }
    retry = null
  }

  async function write() {
    if (retry) await persist()
    const now = Date.now()
    const end = Math.floor(now / MINUTE) * MINUTE
    for (; nextCoverage < end; nextCoverage += MINUTE) add('coverage', '', nextCoverage)
    const batch = pending
    const batchCounters = dirty
    pending = new Map()
    dirty = new Map()
    try {
      const previous = new Map((await db.getStats([...batch.values()])).map(row => [statsId(row), row.num]))
      retry = {
        counters: [...batchCounters].map(([name, num]) => ({ name, num })),
        stats: [...batch].map(([id, row]) => ({ ...row, num: row.num + (previous.get(id) || 0) })),
        updatedAt: now
      }
    } catch (error) {
      for (const row of batch.values()) add(row.dimension, row.name, row.bucket, row.num)
      for (const [name, num] of batchCounters) dirty.set(name, Math.max(num, dirty.get(name) || 0))
      throw error
    }
    await persist()
    const hour = Math.floor(now / HOUR)
    if (hour !== maintenanceAt) {
      await db.maintainStats(now)
      maintenanceAt = hour
    }
  }

  function flush() {
    if (!writing) {
      let succeeded = false
      writing = write().then(() => { succeeded = true }).finally(() => {
        writing = null
        if (succeeded && interval === 0 && (pending.size || dirty.size)) {
          setImmediate(() => flush().catch(error => logger.error('Statistics write failed:', error)))
        }
      })
    }
    return writing
  }

  async function init() {
    const meta = await db.initStats()
    startedAt = meta.startedAt
    updatedAt = meta.updatedAt || startedAt
    nextCoverage = Math.ceil(Date.now() / MINUTE) * MINUTE
    await flush()
    timer = setInterval(() => flush().catch(error => logger.error('Statistics write failed:', error)), Math.max(1, interval) * 1000)
  }

  async function snapshot() {
    if (cache && Date.now() - cache.updatedAt < MINUTE) return cache
    if (reading) return reading
    reading = (async () => {
      await flush()
      const end = Math.floor(updatedAt / MINUTE) * MINUTE
      const start = end - DAY
      const rpmStart = end - 5 * MINUTE
      const [traffic, site, unknown, ...rankRows] = await Promise.all([
        db.getTraffic('minute', start, end), db.getSummary('site', '', start, end, rpmStart),
        db.getSummary('source', '', start, end, rpmStart),
        ...['rpm', 'total', '24h'].flatMap(sort => ['counter', 'source'].map(dimension => db.getRank(dimension, sort, start, end, rpmStart)))
      ])
      const covered = new Set(traffic.filter(row => row.covered === 1).map(row => row.bucket))
      const rpmReady = Array.from({ length: 5 }, (_, i) => rpmStart + i * MINUTE).every(bucket => covered.has(bucket))
      const metrics = ({ calls5m, ...row }) => ({ ...row, rpm: rpmReady ? calls5m / 5 : null })
      const rankings = {}
      for (const [i, sort] of ['rpm', 'total', '24h'].entries()) rankings[sort] = { counters: rankRows[i * 2].map(metrics), sources: rankRows[i * 2 + 1].map(metrics) }
      const minute = new Map(traffic.map(row => [row.bucket, row]))
      const hours = new Map((await db.getTraffic('hour', Math.floor(end / HOUR) * HOUR - 7 * DAY, Math.floor(end / HOUR) * HOUR)).map(row => [row.bucket, row]))
      cache = { startedAt, updatedAt, end, start, rpmStart, partial24h: covered.size < 1440, rpmReady, site: metrics(site), unknown: metrics(unknown), rankings, minute, hours }
      return cache
    })().finally(() => { reading = null })
    return reading
  }

  async function rank(sort) {
    const data = await snapshot()
    return { startedAt: data.startedAt, updatedAt: data.updatedAt, window: { start: data.start, end: data.end, rpmStart: data.rpmStart },
      partial24h: data.partial24h, rpmReady: data.rpmReady, site: data.site, unknown: data.unknown, ...data.rankings[sort] }
  }

  async function summary() {
    const data = await snapshot()
    return { updatedAt: data.updatedAt, rpmReady: data.rpmReady, site: data.site }
  }

  async function traffic(granularity, range) {
    const data = await snapshot()
    const step = granularity === 'hour' ? HOUR : MINUTE
    const end = Math.floor(data.end / step) * step
    const start = end - (range === '7d' ? 7 * DAY : DAY)
    const rows = granularity === 'hour' ? data.hours : data.minute
    const points = []
    for (let bucket = start; bucket < end; bucket += step) {
      const row = rows.get(bucket)
      points.push({ time: bucket, count: row?.covered === step / MINUTE ? row.num : null })
    }
    return { startedAt: data.startedAt, updatedAt: data.updatedAt, granularity, start, end, points }
  }

  async function close() {
    clearInterval(timer)
    if (reading) await reading.catch(() => {})
    if (writing) await writing.catch(() => {})
    await flush()
    await db.close()
  }

  return { init, getCounter, record, flush, rank, summary, traffic, close }
}

module.exports = { createStatistics, hostname }
