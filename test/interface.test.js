'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const Module = require('node:module')

const INTERFACE = [
  'getNum', 'getAll', 'setNum', 'setNumMulti', 'initStats', 'getStats',
  'writeSnapshot', 'getRank', 'getSummary', 'getTraffic', 'maintainStats', 'close'
]

const indexPath = require.resolve('../db')
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'moe-counter-interface-'))
process.env.DB_PATH = path.join(tempDir, 'count.db')

const stub = () => Object.fromEntries(INTERFACE.map(name => [name, () => {}]))

// db/index.js resolves the driver at require time, so stub the dependency and reload it
function load(type, stubs = {}) {
  const original = Module.prototype.require
  Module.prototype.require = function (id) {
    if (Object.hasOwn(stubs, id)) return stubs[id]
    return original.apply(this, arguments)
  }

  const previous = process.env.DB_TYPE
  process.env.DB_TYPE = type
  delete require.cache[indexPath]
  try {
    return require('../db')
  } finally {
    Module.prototype.require = original
    if (previous === undefined) delete process.env.DB_TYPE
    else process.env.DB_TYPE = previous
  }
}

test('sqlite 驱动提供了接口要求的全部方法', async () => {
  const driver = load('sqlite')
  assert.equal(driver, require('../db/sqlite'))
  for (const name of INTERFACE) assert.equal(typeof driver[name], 'function', `${name} 缺失`)
  await driver.close()
})

test('mongodb 驱动提供了接口要求的全部方法', () => {
  const schema = () => ({ index() {} })
  const mongodb = load('mongodb', {
    mongoose: { connect: () => Promise.resolve(), Schema: function () { return schema() }, model: () => ({}) }
  })

  assert.equal(mongodb, require('../db/mongodb'))
  for (const name of INTERFACE) assert.equal(typeof mongodb[name], 'function', `${name} 缺失`)
})

test('未识别的 DB_TYPE 仍使用 sqlite 驱动', () => {
  const sqlite = stub()
  assert.equal(load('postgres', { './sqlite': sqlite }), sqlite)
  assert.equal(load(undefined, { './sqlite': sqlite }), sqlite)
})

test('驱动缺少接口方法时在加载时报错', () => {
  assert.throws(
    () => load('sqlite', { './sqlite': { getNum: async () => ({}) } }),
    /Database driver "sqlite" is missing: getAll, setNum/
  )
})

test.after(() => fs.rmSync(tempDir, { recursive: true, force: true }))
