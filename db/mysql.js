'use strict'

const mysql = require('mysql2')

const mysqlURL = process.env.DB_URL || 'mysql://user:password@localhost:3306/database'

let hosts = mysqlURL.split("://")[1].split("/")[0];
let mysql_database = mysqlURL.split("://")[1].split("/")[1].split("?")[0];
let mysql_user = hosts.split("@")[0].split(":")[0];
let mysql_password = hosts.split("@")[0].split(":")[1];
let mysql_host = hosts.split("@")[1].split(":")[0];
let mysql_port = hosts.split("@")[1].split(":")[1];

const db = mysql.createPool({
    host: mysql_host,
    user: mysql_user,
    password: mysql_password,
    database: mysql_database,
    port: mysql_port
})

db.query(`CREATE TABLE IF NOT EXISTS tb_count (
    id    INTEGER      PRIMARY KEY AUTO_INCREMENT
                       NOT NULL
                       UNIQUE,
    name  VARCHAR (32) NOT NULL
                       UNIQUE,
    num   BIGINT       NOT NULL
                       DEFAULT (0) 
);`)

function getNum(name) {
  return new Promise((resolve, reject) => {
    db.query('SELECT `name`, `num` from tb_count WHERE `name` = ?', name, (err, rows) => {
      if (err) reject(err)

      resolve(rows[0] || { name, num: 0 })
    })
  })
}

function getAll(name) {
  return new Promise((resolve, reject) => {
    db.query('SELECT * from tb_count', (err, rows) => {
      if (err) reject(err)

      resolve(rows)
    })
  })
}

function setNum(name, num) {
  return new Promise((resolve, reject) => {
    db.query(`INSERT INTO tb_count(\`name\`, \`num\`)
              VALUES(?, ?)
              ON DUPLICATE KEY UPDATE \`num\` = ?;`
      , [name, num, num]
      , (err, result) => {
        if (err) reject(err)

        resolve(result)
      })
 })
}

module.exports = {
  getNum,
  getAll,
  setNum
}
