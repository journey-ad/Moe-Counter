const sqlite3 = require('sqlite3')

const db = new sqlite3.Database('count.db')

db.run(`CREATE TABLE IF NOT EXISTS tb_count (
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
    db.get('SELECT `name`, `num` from tb_count WHERE `name` = ?', name, (err, row) => {
      if (err) reject(err)

      resolve(row || { name, num: 0 })
    })
  })
}

function getAll(name) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * from tb_count', (err, row) => {
      if (err) reject(err)

      resolve(row)
    })
  })
}

function setNum(name, num) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO tb_count(\`name\`, \`num\`)
            VALUES($name, $num)
            ON CONFLICT(name) DO
            UPDATE SET \`num\` = $num;`
      , {
        $name: name,
        $num: num
      }
      , (err, row) => {
        if (err) reject(err)

        resolve(row)
      })
  })
}

module.exports = {
  getNum,
  getAll,
  setNum
}