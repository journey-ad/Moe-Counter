"use strict";

const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    num: { type: Number, required: true },
    password: { type: String, required: true }
  },
  { collection: 'tb_count', versionKey: false }
);

// the default mongodb url (local server)
const mongodbURL = process.env.DB_URL || "mongodb://127.0.0.1:27017";

mongoose.connect(mongodbURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const Count = mongoose.connection.model("Count", schema);

function getPassword(name) {
  return Count.findOne({ name }, "-_id -num -__v").exec();
}

function getNum(name) {
  return Count.findOne({ name }, "-_id -password -__v").exec();
}

function getAll() {
  return Count.find({}, "-_id -__v").exec();
}

function setNum(name, num) {
  return Count.findOneAndUpdate(
    { name },
    { name, num },
    { upsert: true }
  ).exec();
}

function setNumMulti(counters) {
  const bulkOps = counters.map((obj) => {
    const { name, num } = obj;
    return {
      updateOne: {
        filter: { name },
        update: { name, num },
        upsert: true,
      },
    };
  });

  return Count.bulkWrite(bulkOps, { ordered: false });
}

function setPassword(name, password) {
  return Count.findOneAndUpdate(
    { name },
    { name, password },
    { upsert: true }
  ).exec();
}

module.exports = {
  getNum,
  getPassword,
  getAll,
  setNum,
  setNumMulti,
  setPassword
};
