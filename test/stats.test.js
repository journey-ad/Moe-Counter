'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')

const statsPath = require.resolve('../db/stats')

// Retention is derived at require time, so reload the module after changing the environment
function load() {
  delete require.cache[statsPath]
  return require('../db/stats')
}

test('statsId 把维度、名称与分钟时间戳拼成主键', () => {
  const { statsId } = load()
  assert.equal(statsId({ dimension: 'counter', name: 'a', bucket: 1 }), '["counter","a",1]')
})

test('orderBy 把排序名换成要排序的字段', () => {
  const { orderBy } = load()
  assert.equal(orderBy('total'), 'total')
  assert.equal(orderBy('24h'), 'calls24h')
  assert.equal(orderBy('rpm'), 'calls5m')
})

test('orderBy 遇到未知排序名时按近5分钟调用数排序', () => {
  assert.equal(load().orderBy('unknown'), 'calls5m')
})

test('保留期默认为48小时、7天、90天', () => {
  const { retention, HOUR, DAY } = load()
  assert.equal(retention.detail, 48 * HOUR)
  assert.equal(retention.minute, 7 * DAY)
  assert.equal(retention.hour, 90 * DAY)
})

test('保留期按整数取值，配得过小时改用下限', () => {
  process.env.STATS_DETAIL_HOURS = '30'
  process.env.STATS_MINUTE_DAYS = '0.5'
  process.env.STATS_HOUR_DAYS = 'nonsense'
  try {
    const { retention, HOUR, DAY } = load()
    assert.equal(retention.detail, 30 * HOUR)
    assert.equal(retention.minute, 1 * DAY)
    assert.equal(retention.hour, 90 * DAY)
  } finally {
    delete process.env.STATS_DETAIL_HOURS
    delete process.env.STATS_MINUTE_DAYS
    delete process.env.STATS_HOUR_DAYS
    load()
  }
})
