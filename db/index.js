'use strict'

const config = require('config-yml')

let db

switch(config.db.type){
  case 'mongo':
    db = require('./mongo')
    break;
  case 'sqlite':
  default:
    db = require('./sqlite')
    break;
}

module.exports = db