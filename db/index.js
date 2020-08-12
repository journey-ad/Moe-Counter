'use strict'

const config = require('config-yml')

let db

switch(config.db.type){
  case 'mongodb':
    db = require('./mongodb')
    break;
  case 'sqlite':
  default:
    db = require('./sqlite')
    break;
}

module.exports = db