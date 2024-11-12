'use strict'

let db

switch(process.env.DB_TYPE){
  case 'mongodb':
    db = require('./mongodb')
    break;
  case 'sqlite':
  default:
    db = require('./sqlite')
    break;
}

module.exports = db