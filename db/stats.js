'use strict'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
function setting(name, fallback, minimum) {
  const value = Number(process.env[name] ?? fallback)
  return Number.isFinite(value) ? Math.max(minimum, Math.floor(value)) : fallback
}
const retention = {
  detail: setting('STATS_DETAIL_HOURS', 48, 24) * HOUR,
  minute: setting('STATS_MINUTE_DAYS', 7, 1) * DAY,
  hour: setting('STATS_HOUR_DAYS', 90, 7) * DAY
}

const statsId = ({ dimension, name, bucket }) => JSON.stringify([dimension, name, bucket])
const orderBy = (sort) => sort === 'total' ? 'total' : sort === '24h' ? 'calls24h' : 'calls5m'

module.exports = { MINUTE, HOUR, DAY, retention, statsId, orderBy }
