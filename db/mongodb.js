'use strict'

const mongoose = require('mongoose')
const { HOUR, retention, statsId, orderBy } = require('./stats')

const options = (collection) => ({ collection, versionKey: false })
const countSchema = new mongoose.Schema({ name: { type: String, required: true, unique: true }, num: Number }, options('tb_count'))
countSchema.index({ num: -1, name: 1 })
const statSchema = new mongoose.Schema({ _id: String, dimension: String, name: String, bucket: Number, num: Number }, options('tb_stats'))
statSchema.index({ dimension: 1, bucket: 1, name: 1 })
statSchema.index({ dimension: 1, name: 1, bucket: 1 })
statSchema.index({ dimension: 1, bucket: 1, num: -1, name: 1 })
const Count = mongoose.model('Count', countSchema)
const Stat = mongoose.model('Stat', statSchema)
const Hour = mongoose.model('StatHour', new mongoose.Schema({ _id: Number, num: Number, covered: Number }, options('tb_stats_hour')))
const Meta = mongoose.model('StatMeta', new mongoose.Schema({ _id: String, value: Number }, options('tb_stats_meta')))
const connection = mongoose.connect(process.env.DB_URL || 'mongodb://127.0.0.1:27017', { serverSelectionTimeoutMS: 10000 })

async function bulk(model, operations) {
  for (let i = 0; i < operations.length; i += 500) await model.bulkWrite(operations.slice(i, i + 500), { ordered: false })
}

async function initStats() {
  await connection
  // convert legacy string num values to numbers
  await Count.collection.updateMany({ num: { $type: 'string' } }, [
    { $set: { num: { $convert: { input: '$num', to: 'double', onError: 0, onNull: 0 } } } }
  ])
  await Promise.all([Count.init(), Stat.init(), Hour.init(), Meta.init()])
  await Meta.updateOne({ _id: 'startedAt' }, { $setOnInsert: { value: Date.now() } }, { upsert: true })
  return Object.fromEntries((await Meta.find().lean()).map(row => [row._id, row.value]))
}

async function writeSnapshot({ counters, stats, updatedAt }) {
  await bulk(Count, counters.map(({ name, num }) => ({ updateOne: {
    filter: { name }, update: { $max: { num } }, upsert: true
  } })))
  await bulk(Stat, stats.map(row => ({ updateOne: {
    filter: { _id: statsId(row) },
    update: { $setOnInsert: { dimension: row.dimension, name: row.name, bucket: row.bucket }, $max: { num: row.num } },
    upsert: true
  } })))
  await Meta.updateOne({ _id: 'updatedAt' }, { $set: { value: updatedAt } }, { upsert: true })
}

async function getRank(dimension, sort, start, end, rpmStart) {
  const metric = orderBy(sort)
  const base = dimension === 'counter' ? Count : Stat
  const filter = dimension === 'counter' ? { name: { $ne: 'demo' } } : { dimension: 'source', bucket: -1, name: { $ne: '' } }
  const lookupActivity = { $lookup: {
    from: 'tb_stats', let: { name: '$name' }, as: 'activity', pipeline: [
      { $match: { dimension, bucket: { $gte: start, $lt: end }, $expr: { $eq: ['$name', '$$name'] } } },
      { $group: { _id: null, calls24h: { $sum: '$num' }, calls5m: { $sum: { $cond: [{ $gte: ['$bucket', rpmStart] }, '$num', 0] } } } }
    ]
  } }
  if (sort === 'total') {
    return base.aggregate([
      { $match: filter }, { $sort: { num: -1, name: 1 } }, { $limit: 100 }, lookupActivity,
      { $project: { _id: 0, name: 1, total: '$num', calls24h: { $ifNull: [{ $arrayElemAt: ['$activity.calls24h', 0] }, 0] }, calls5m: { $ifNull: [{ $arrayElemAt: ['$activity.calls5m', 0] }, 0] } } }
    ])
  }
  const rows = await Stat.aggregate([
    { $match: { dimension, bucket: { $gte: start, $lt: end }, name: { $ne: dimension === 'counter' ? 'demo' : '' } } },
    { $group: { _id: '$name', calls24h: { $sum: '$num' }, calls5m: { $sum: { $cond: [{ $gte: ['$bucket', rpmStart] }, '$num', 0] } } } },
    { $lookup: { from: dimension === 'counter' ? 'tb_count' : 'tb_stats', let: { name: '$_id' }, as: 'lifetime', pipeline: [
      { $match: { ...(dimension === 'source' ? { dimension: 'source', bucket: -1 } : {}), $expr: { $eq: ['$name', '$$name'] } } }, { $limit: 1 }
    ] } },
    { $project: { _id: 0, name: '$_id', calls24h: 1, calls5m: 1, total: { $ifNull: [{ $arrayElemAt: ['$lifetime.num', 0] }, 0] } } },
    { $sort: { [metric]: -1, total: -1, name: 1 } }, { $limit: 100 }
  ])
  const historical = await getRank(dimension, 'total', start, end, rpmStart)
  const candidates = [...new Map([...historical, ...rows].map(row => [row.name, row])).values()]
  return candidates.sort((a, b) => b[metric] - a[metric] || b.total - a.total || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)).slice(0, 100)
}

async function getSummary(dimension, name, start, end, rpmStart) {
  const rows = await Stat.aggregate([
    { $match: { dimension, name, $or: [{ bucket: -1 }, { bucket: { $gte: start, $lt: end } }] } },
    { $group: { _id: null,
      total: { $sum: { $cond: [{ $eq: ['$bucket', -1] }, '$num', 0] } },
      calls24h: { $sum: { $cond: [{ $gte: ['$bucket', start] }, '$num', 0] } },
      calls5m: { $sum: { $cond: [{ $gte: ['$bucket', rpmStart] }, '$num', 0] } }
    } }
  ])
  const { total = 0, calls24h = 0, calls5m = 0 } = rows[0] || {}
  return { total, calls24h, calls5m }
}

async function getTraffic(granularity, start, end) {
  if (granularity === 'hour') return (await Hour.find({ _id: { $gte: start, $lt: end } }).sort({ _id: 1 }).lean()).map(row => ({ bucket: row._id, num: row.num, covered: row.covered }))
  return Stat.aggregate([
    { $match: { dimension: { $in: ['site', 'coverage'] }, bucket: { $gte: start, $lt: end } } },
    { $group: { _id: '$bucket', num: { $sum: { $cond: [{ $eq: ['$dimension', 'site'] }, '$num', 0] } }, covered: { $sum: { $cond: [{ $eq: ['$dimension', 'coverage'] }, 1, 0] } } } },
    { $project: { _id: 0, bucket: '$_id', num: 1, covered: 1 } }, { $sort: { bucket: 1 } }
  ])
}

async function maintainStats(now) {
  const end = Math.floor(now / HOUR) * HOUR
  const minuteStart = end - retention.minute
  const rows = await Stat.aggregate([
    { $match: { dimension: { $in: ['site', 'coverage'] }, bucket: { $gte: minuteStart, $lt: end } } },
    { $group: { _id: { $multiply: [{ $floor: { $divide: ['$bucket', HOUR] } }, HOUR] },
      num: { $sum: { $cond: [{ $eq: ['$dimension', 'site'] }, '$num', 0] } }, covered: { $sum: { $cond: [{ $eq: ['$dimension', 'coverage'] }, 1, 0] } }
    } }
  ])
  await bulk(Hour, rows.map(({ _id, num, covered }) => ({ updateOne: { filter: { _id }, update: { $set: { num, covered } }, upsert: true } })))
  await Stat.deleteMany({ bucket: { $gte: 0 }, $or: [
    { dimension: { $in: ['counter', 'source'] }, bucket: { $lt: now - retention.detail } },
    { dimension: { $in: ['site', 'coverage'] }, bucket: { $lt: minuteStart } }
  ] })
  await Hour.deleteMany({ _id: { $lt: now - retention.hour } })
}

module.exports = {
  getNum: (name) => Count.findOne({ name }, '-_id').lean().then(row => row || { name, num: 0 }),
  getAll: () => Count.find({}, '-_id').lean(),
  setNum: (name, num) => Count.updateOne({ name }, { $set: { num } }, { upsert: true }),
  setNumMulti: (counters) => bulk(Count, counters.map(({ name, num }) => ({ updateOne: { filter: { name }, update: { $set: { num } }, upsert: true } }))),
  getStats: (rows) => Stat.find({ _id: { $in: rows.map(statsId) } }).lean(),
  initStats, writeSnapshot, getRank, getSummary, getTraffic, maintainStats,
  close: () => mongoose.disconnect()
}
