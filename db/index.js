'use strict'

const config = require('config-yml')

let db

switch (config.db.type) {
  case 'mongodb':
    db = require('./mongodb')
    break;
  case 'repl':
    db = require('./repl')
    break;
  case 'sqlite':
  default:
    db = require('./sqlite')
    break;
}

module.exports = db