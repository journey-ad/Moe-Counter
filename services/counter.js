const db = require('../db');
const { logger } = require('../utils');
const config = require('../config');

class CounterService {
  constructor() {
    this.__cache_counter = {};
    this.enablePushDelay = config.db.interval > 0;
    this.needPush = false;
    
    if (this.enablePushDelay) {
      setInterval(() => {
        this.needPush = true;
      }, 1000 * config.db.interval);
    }
  }

  async pushDB() {
    if (Object.keys(this.__cache_counter).length === 0) return;
    if (this.enablePushDelay && !this.needPush) return;

    try {
      this.needPush = false;
      logger.info("pushDB", this.__cache_counter);

      const counters = Object.keys(this.__cache_counter).map((key) => ({
        name: key,
        num: this.__cache_counter[key],
      }));

      await db.setNumMulti(counters);
      this.__cache_counter = {};
    } catch (error) {
      logger.error("pushDB is error: ", error);
      throw error;
    }
  }

  async getCountByName(name, num = 0) {
    const defaultCount = { name, num: 0 };

    if (name === "demo") return { name, num: "0123456789" };
    if (num > 0) return { name, num };

    try {
      if (!(name in this.__cache_counter)) {
        const counter = (await db.getNum(name)) || defaultCount;
        this.__cache_counter[name] = counter.num + 1;
      } else {
        this.__cache_counter[name]++;
      }

      await this.pushDB();

      return { name, num: this.__cache_counter[name] };
    } catch (error) {
      logger.error("get count by name is error: ", error);
      return defaultCount;
    }
  }
}

module.exports = new CounterService();
