'use strict'

const mongoose = require('mongoose')
const schema = require('./schema')

// the default mongodb url (local server)
const mongodbURL = process.env.DB_URL || 'mongodb://127.0.0.1:27017'

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

function setNumMulti(counters) {
  const bulkOps = counters.map(obj => {
    const { name, num } = obj
    return {
      updateOne: {
        filter: { name },
        update: { name, num },
        upsert: true
      }
    }
  })

  return Count.bulkWrite(bulkOps, { ordered : false })
}

module.exports = {
  getNum,
  getAll,
  setNum,
  setNumMulti
}
