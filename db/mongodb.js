"use strict";

const mongoose = require("mongoose");

const countSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    num: { type: Number, required: true }
  },
  { collection: 'tb_count', versionKey: false }
);

const statsSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    date: { type: Date, required: true },
    count: { type: Number, required: true, default: 0 }
  },
  { collection: 'tb_stats', versionKey: false }
);

statsSchema.index({ name: 1, date: 1 }, { unique: true });

// the default mongodb url (local server)
const mongodbURL = process.env.DB_URL || "mongodb://127.0.0.1:27017";
mongoose.connect(mongodbURL);

const Count = mongoose.connection.model("Count", countSchema);
const Stats = mongoose.connection.model("Stats", statsSchema);

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

function incrementStats(name, date) {
  return Stats.findOneAndUpdate(
    { name, date: new Date(date) },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  ).exec();
}

function getStats(name, startDate, endDate) {
  return Stats.find(
    { name, date: { $gte: new Date(startDate), $lte: new Date(endDate) } },
    "-_id -__v"
  )
    .sort({ date: 1 })
    .exec()
    .then((docs) => {
      return docs.map((doc) => ({
        date: doc.date.toISOString().split('T')[0],
        count: doc.count
      }));
    });
}

function incrementStatsMulti(statsList) {
  if (statsList.length === 0) {
    return Promise.resolve();
  }

  const bulkOps = statsList.map((obj) => {
    const { name, date, count } = obj;
    return {
      updateOne: {
        filter: { name, date: new Date(date) },
        update: { $inc: { count } },
        upsert: true,
      },
    };
  });

  return Stats.bulkWrite(bulkOps, { ordered: false });
}

module.exports = {
  getNum,
  getAll,
  setNum,
  setNumMulti,
  incrementStats,
  getStats,
  incrementStatsMulti
};
