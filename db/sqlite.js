'use strict'

const path = require('path')
const Database = require('better-sqlite3')

const db = new Database(path.resolve(__dirname, '../count.db'))

db.exec(`CREATE TABLE IF NOT EXISTS tb_count (
    id    INTEGER      PRIMARY KEY AUTOINCREMENT
                       NOT NULL
                       UNIQUE,
    name  VARCHAR (32) NOT NULL
                       UNIQUE,
    num   BIGINT       NOT NULL
                       DEFAULT (0) 
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

async function setNum(name, num) {
  const stmt = db.prepare(
    `INSERT INTO tb_count(name, num)
          VALUES(?, ?)
          ON CONFLICT(name) DO
          UPDATE SET num = excluded.num;`
  );
  stmt.run(name, num);
}

async function setNumMulti(counters) {
  const stmt = db.prepare(
    `INSERT INTO tb_count(name, num)
          VALUES(?, ?)
          ON CONFLICT(name) DO
          UPDATE SET num = excluded.num;`
  );

  db.transaction((counters) => {
    counters.forEach((counter) => {
      stmt.run(counter.name, counter.num);
    });
  })(counters);
}

module.exports = {
  getNum,
  getAll,
  setNum,
  setNumMulti
}
