"use strict";

const Redis = require("ioredis");

// the default redis url (local server)
const redisURL = process.env.DB_URL || "redis://127.0.0.1:6379";
const redisPrefix = process.env.REDIS_PREFIX || "moe_count_"

const redis = new Redis(redisURL);

async function getNum(name) {
  const result = await redis.get(redisPrefix+name)
  if(result === null || isNaN(result) ){
    return {name:name,num:0}
  }
  return {name:name,num:parseInt(result)}
}


async function getAll() {
  const keys = await redis.keys(redisPrefix+'*');
  const values = await redis.mget(keys);
  return keys.map((key, i) => ({ name: key, num: values[i] || 0 }))
}

async function setNum(name, num) {
  return redis.set(redisPrefix+name, num);
}

async function setNumMulti(counters) {
  const pipeline = redis.pipeline()
  counters.forEach(({ name, num }) => {
    pipeline.set(redisPrefix+name, num)
  })
  await pipeline.exec()
}

module.exports = {
  getNum,
  getAll,
  setNum,
  setNumMulti,
};
