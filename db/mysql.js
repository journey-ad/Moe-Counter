"use strict";

const mysql = require('mysql2/promise');

// the default mysql url (local server)
const mysqlURL = process.env.DB_URL || "mysql://localhost:3306/counter";

let connection;



async function initDb() {
  connection = await mysql.createConnection(mysqlURL);
  await connection.execute("CREATE TABLE IF NOT EXISTS tb_count (name VARCHAR(32) NOT NULL, num INT NOT NULL, PRIMARY KEY (name)) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
}

async function getNum(name) {
  const [rows] = await connection.execute("SELECT num FROM tb_count WHERE name = ?", [name]);
  return rows[0];
}

async function getAll() {
  const [rows] = await connection.execute("SELECT * FROM tb_count");
  return rows;
}

async function setNum(name, num) {
  await connection.execute("INSERT INTO tb_count (name, num) VALUES (?, ?) ON DUPLICATE KEY UPDATE num = ?", [name, num, num]);
}

async function setNumMulti(counters) {
  const values = [];
  const placeholders = [];

  for (let counter of counters) {
    values.push(counter.name, counter.num);
    placeholders.push("(?, ?)");
  }

  const sql = `
    INSERT INTO tb_count (name, num) 
    VALUES ${placeholders.join(", ")} 
    ON DUPLICATE KEY UPDATE num = VALUES(num)
  `;

  await connection.execute(sql, values);
}


initDb();

module.exports = {
  getNum,
  getAll,
  setNum,
  setNumMulti,
};
