const Database = require("@replit/database")

const db = new Database()

async function getNum(name) {
  const num = await db.get(name)
  return { name, num: num || 0 }
}

async function getAll() {
  const keys = await db.list()
  const rows = await Promise.all(keys.map(async key => ({ name: key, num: await db.get(key) || 0 })))
  return rows
}

async function setNum(name, num) {
  await db.set(name, num)
}

async function setNumMulti(counters) {
  const promises = counters.map(({ name, num }) => db.set(name, num))
  await Promise.all(promises)
}

module.exports = {
  getNum,
  getAll,
  setNum,
  setNumMulti
}
