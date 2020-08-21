'use strict'

const mongoose = require('mongoose')
const schema = require('./schema')

// the default mongodb url (local server)
let mongodbURL = `mongodb://127.0.0.1:27017`
const envMongoURL = process.env.DB_URL
if (envMongoURL) mongodbURL = envMongoURL

mongoose.connect(mongodbURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
})

const Count = mongoose.connection.model('Count', schema)

function getNum(name) {
  return Count
          .findOne({ name }, '-_id -__v')
          .exec()
}

function getAll() {
  return Count
          .find({ }, '-_id -__v')
          .exec()
}

function setNum(name, num) {
  return Count
          .findOneAndUpdate({ name }, { name, num }, { upsert: true })
          .exec()
}

module.exports = {
  getNum,
  getAll,
  setNum
}