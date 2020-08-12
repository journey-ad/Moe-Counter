'use strict'

const mongoose = require('mongoose')
const schema = require('./schema')

mongoose.connect(process.env.DB_URL, {
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