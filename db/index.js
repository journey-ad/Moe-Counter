'use strict'

const { INTERFACE } = require('./interface')

/**
 * Data access interface. A driver module has to export every method listed below;
 * loading fails right away when one of them is missing.
 *
 * Return shapes
 *   Counter   { name, num }
 *   StatRow   { dimension, name, bucket, num }  bucket is a minute timestamp, -1 means the lifetime total
 *   RankRow   { name, total, calls24h, calls5m }
 *   Summary   { total, calls24h, calls5m }
 *   Traffic   { bucket, num, covered }          covered is 1 when the bucket holds a complete slice
 *   Series    { bucket, num }                    per-minute counts of one counter
 *   Snapshot  { counters: Counter[], stats: StatRow[], updatedAt }
 *
 * Method contract
 *   getNum(name)       reads one counter, returns { name, num: 0 } when it does not exist
 *   getAll()           reads every counter
 *   setNum(name, num)  writes one counter
 *   setNumMulti(list)  writes counters in bulk
 *   initStats()        creates tables and indexes, returns metadata shaped as { startedAt, updatedAt }
 *   getStats(rows)     reads stat rows in bulk by dimension, name and bucket
 *   writeSnapshot(s)   persists a batch, counters and stats are written with the greater value per key
 *   getRank(dimension, sort, start, end, rpmStart)    top 100, sort is rpm, total or 24h
 *   getSummary(dimension, name, start, end, rpmStart)
 *   getTraffic(granularity, start, end)               granularity is minute or hour
 *   getSeries(name, start, end)                       per-minute counts of one counter, ascending
 *   maintainStats(now)                                rolls minutes into hours and drops expired data
 *   close()                                           closes the connection
 */

const DRIVERS = {
  mongodb: './mongodb',
  sqlite: './sqlite'
}

function load(type) {
  const name = DRIVERS[type] ? type : 'sqlite'
  const driver = require(DRIVERS[name])
  const missing = INTERFACE.filter(method => typeof driver[method] !== 'function')
  if (missing.length) throw new Error(`Database driver "${name}" is missing: ${missing.join(', ')}`)
  return driver
}

module.exports = load(process.env.DB_TYPE)
