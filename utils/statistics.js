'use strict'

const { MINUTE, HOUR, DAY, statsId } = require('../db/stats')

// Fixed number shown by the demo counter, never stored
const DEMO_COUNT = '0123456789'

const FIVE_MINUTES = 5 * MINUTE

function hostname(value) {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.hostname.toLowerCase().replace(/\.$/, '') : ''
  } catch { return '' }
}

// XX means Cloudflare could not tell
function country(value) {
  const code = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (!/^[a-z]{2}$/.test(code) || code === 'xx') return ''
  // Taiwan is stored under CN
  return code === 'tw' ? 'cn' : code
}

// Primary subtag of the first tag
function language(value) {
  const first = String(value || '').split(',', 1)[0].trim()
  const code = first.split(';', 1)[0].split('-', 1)[0].toLowerCase()
  return /^[a-z]{2,3}$/.test(code) ? code : ''
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
    if (name === 'demo') return { name, num: DEMO_COUNT }
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

  function record(name, referrer, site, now = Date.now(), traits = {}) {
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
    const countryCode = country(traits.country)
    if (countryCode) {
      add('country', countryCode, -1)
      add(`country:${name}`, countryCode, -1)
    }
    const languageCode = language(traits.language)
    if (languageCode) {
      add('language', languageCode, -1)
      add(`language:${name}`, languageCode, -1)
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
      const hourEnd = Math.floor(end / HOUR) * HOUR
      const [traffic, hourlyTraffic, site, unknown, countries, languages, rankRows] = await Promise.all([
        db.getTraffic('minute', start, end),
        db.getTraffic('hour', hourEnd - 7 * DAY, hourEnd),
        db.getSummary('site', '', start, end, rpmStart),
        db.getSummary('source', '', start, end, rpmStart),
        db.getBreakdown('country'), db.getBreakdown('language'),
        Promise.all(['rpm', 'total', '24h'].map(async sort => {
          const [counters, sources] = await Promise.all([
            db.getRank('counter', sort, start, end, rpmStart),
            db.getRank('source', sort, start, end, rpmStart)
          ])
          return [sort, { counters, sources }]
        }))
      ])
      const covered = new Set(traffic.filter(row => row.covered === 1).map(row => row.bucket))
      const rpmReady = Array.from({ length: 5 }, (_, i) => rpmStart + i * MINUTE).every(bucket => covered.has(bucket))
      const metrics = ({ calls5m, ...row }) => ({ ...row, rpm: rpmReady ? calls5m / 5 : null })
      const rankings = Object.fromEntries(rankRows.map(([sort, { counters, sources }]) => [
        sort, { counters: counters.map(metrics), sources: sources.map(metrics) }
      ]))
      const minute = new Map(traffic.map(row => [row.bucket, row]))
      const hours = new Map(hourlyTraffic.map(row => [row.bucket, row]))
      cache = { startedAt, updatedAt, end, start, rpmStart, partial24h: covered.size < 1440, rpmReady, site: metrics(site), unknown: metrics(unknown), countries, languages, rankings, minute, hours }
      return cache
    })().finally(() => { reading = null })
    return reading
  }

  async function rank(sort) {
    const data = await snapshot()
    return { startedAt: data.startedAt, updatedAt: data.updatedAt, window: { start: data.start, end: data.end, rpmStart: data.rpmStart },
      partial24h: data.partial24h, rpmReady: data.rpmReady, site: data.site, unknown: data.unknown,
      countries: data.countries, languages: data.languages, ...data.rankings[sort] }
  }

  async function series(name) {
    const data = await snapshot()
    // Snap both ends to five minute boundaries so the window is a whole number of buckets
    const end = Math.floor(data.end / FIVE_MINUTES) * FIVE_MINUTES
    const start = end - DAY
    const [minutes, total, countries, languages, rank24h] = await Promise.all([
      db.getSeries(name, start, end), getTotal(name),
      db.getBreakdown(`country:${name}`), db.getBreakdown(`language:${name}`),
      db.getCounterRank(name, data.start, data.end)
    ])

    // Minutes are summed into five minute buckets
    const points = []
    for (let bucket = start; bucket < end; bucket += FIVE_MINUTES) points.push({ time: bucket, count: 0 })
    for (const row of minutes) {
      const index = Math.floor((row.bucket - start) / FIVE_MINUTES)
      if (points[index]) points[index].count += row.num
    }

    return { name, total, calls24h: points.reduce((sum, point) => sum + point.count, 0), rank24h, updatedAt: data.updatedAt, start, end, partial: data.partial24h, countries, languages, points }
  }

  // Reads the current count from the loaded state instead of incrementing it
  async function getTotal(name) {
    if (name === 'demo') return DEMO_COUNT
    const state = counters.get(name)
    if (state) {
      try { await state.ready; return state.num } catch { return 0 }
    }
    return (await db.getNum(name)).num
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

  return { init, getCounter, record, flush, rank, series, summary, traffic, close }
}

module.exports = { createStatistics, hostname, country, language }
