"use strict";

const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    num: { type: Number, required: true }
  },
  { collection: 'tb_count', versionKey: false }
);

// the default mongodb url (local server)
const mongodbURL = process.env.DB_URL || "mongodb://127.0.0.1:27017";

mongoose.connect(mongodbURL);

const Count = mongoose.connection.model("Count", schema);

function getNum(name) {
  return Count.findOne({ name }, "-_id -__v").exec();
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

module.exports = {
  getNum,
  getAll,
  setNum,
  setNumMulti,
};
