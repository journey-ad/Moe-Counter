'use strict'

const path = require('path')
const Database = require('better-sqlite3')

const db = new Database(path.resolve(__dirname, '../data/count.db'))

db.exec(`CREATE TABLE IF NOT EXISTS tb_count (
    id    INTEGER      PRIMARY KEY AUTOINCREMENT
                       NOT NULL
                       UNIQUE,
    name  VARCHAR (32) NOT NULL
                       UNIQUE,
    num   BIGINT       NOT NULL
                       DEFAULT (0) 
);`)

db.exec(`CREATE TABLE IF NOT EXISTS tb_stats (
    id        INTEGER      PRIMARY KEY AUTOINCREMENT
                           NOT NULL
                           UNIQUE,
    name      VARCHAR (32) NOT NULL,
    date      DATE         NOT NULL,
    count     BIGINT       NOT NULL
                           DEFAULT (0),
    UNIQUE(name, date)
);`)

function getNum(name) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('SELECT `name`, `num` from tb_count WHERE `name` = ?')
    const row = stmt.get(name)
    resolve(row || { name, num: 0 })
  })
}

function getAll(name) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('SELECT * from tb_count')
    const rows = stmt.all()
    resolve(rows)
  })
}

function setNum(name, num) {
  return new Promise((resolve, reject) => {
    db.exec(`INSERT INTO tb_count(\`name\`, \`num\`)
            VALUES($name, $num)
            ON CONFLICT(name) DO
            UPDATE SET \`num\` = $num;`
      ,
      { $name: name, $num: num }
    )

    resolve()
  })
}

function setNumMulti(counters) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`INSERT INTO tb_count(\`name\`, \`num\`)
    VALUES($name, $num)
    ON CONFLICT(name) DO
    UPDATE SET \`num\` = $num;`)

    const setMany = db.transaction((counters) => {
      for (const counter of counters) stmt.run(counter)
    })

    setMany(counters)
    resolve()
  })
}

function incrementStats(name, date) {
  return new Promise((resolve, reject) => {
    db.exec(`INSERT INTO tb_stats(\`name\`, \`date\`, \`count\`)
            VALUES($name, $date, 1)
            ON CONFLICT(name, date) DO
            UPDATE SET \`count\` = \`count\` + 1;`
      ,
      { $name: name, $date: date }
    )
    resolve()
  })
}

function getStats(name, startDate, endDate) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      SELECT \`date\`, \`count\` 
      FROM tb_stats 
      WHERE \`name\` = ? AND \`date\` >= ? AND \`date\` <= ? 
      ORDER BY \`date\` ASC
    `)
    const rows = stmt.all(name, startDate, endDate)
    resolve(rows)
  })
}

function incrementStatsMulti(statsList) {
  return new Promise((resolve, reject) => {
    if (statsList.length === 0) {
      resolve()
      return
    }

    const stmt = db.prepare(`INSERT INTO tb_stats(\`name\`, \`date\`, \`count\`)
    VALUES($name, $date, $count)
    ON CONFLICT(name, date) DO
    UPDATE SET \`count\` = \`count\` + $count;`)

    const incrementMany = db.transaction((statsList) => {
      for (const stat of statsList) stmt.run(stat)
    })

    incrementMany(statsList)
    resolve()
  })
}

module.exports = {
  getNum,
  getAll,
  setNum,
  setNumMulti,
  incrementStats,
  getStats,
  incrementStatsMulti
}
