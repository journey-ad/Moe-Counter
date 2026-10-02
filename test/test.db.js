'use strict';

const { expect } = require('chai');
const db = require('../db');

const TEST_PREFIX = 'test_counter_';

describe('Database Module Tests', function() {
  
  describe('SQLite Database', function() {
    
    it('should have getNum function', function() {
      expect(db).to.have.property('getNum');
      expect(db.getNum).to.be.a('function');
    });

    it('should have getAll function', function() {
      expect(db).to.have.property('getAll');
      expect(db.getAll).to.be.a('function');
    });

    it('should have setNum function', function() {
      expect(db).to.have.property('setNum');
      expect(db.setNum).to.be.a('function');
    });

    it('should have setNumMulti function', function() {
      expect(db).to.have.property('setNumMulti');
      expect(db.setNumMulti).to.be.a('function');
    });
  });

  describe('getNum', function() {
    const testName = `${TEST_PREFIX}get_${Date.now()}`;

    it('should return default count for non-existing counter', async function() {
      const result = await db.getNum(testName);
      expect(result).to.be.an('object');
      expect(result).to.have.property('name', testName);
      expect(result).to.have.property('num', 0);
    });
  });

  describe('setNum', function() {
    const testName = `${TEST_PREFIX}set_${Date.now()}`;

    it('should set and get counter correctly', async function() {
      await db.setNum(testName, 42);
      const result = await db.getNum(testName);
      
      expect(result).to.have.property('name', testName);
      expect(result).to.have.property('num', 42);
    });

    it('should update existing counter', async function() {
      const testName2 = `${TEST_PREFIX}update_${Date.now()}`;
      
      await db.setNum(testName2, 10);
      const result1 = await db.getNum(testName2);
      expect(result1.num).to.equal(10);
      
      await db.setNum(testName2, 100);
      const result2 = await db.getNum(testName2);
      expect(result2.num).to.equal(100);
    });

    it('should handle zero', async function() {
      const testName3 = `${TEST_PREFIX}zero_${Date.now()}`;
      
      await db.setNum(testName3, 0);
      const result = await db.getNum(testName3);
      expect(result.num).to.equal(0);
    });

    it('should handle large numbers', async function() {
      const testName4 = `${TEST_PREFIX}large_${Date.now()}`;
      const largeNum = 999999999999;
      
      await db.setNum(testName4, largeNum);
      const result = await db.getNum(testName4);
      expect(result.num).to.equal(largeNum);
    });
  });

  describe('setNumMulti', function() {
    const timestamp = Date.now();

    it('should set multiple counters at once', async function() {
      const counters = [
        { name: `${TEST_PREFIX}multi_1_${timestamp}`, num: 100 },
        { name: `${TEST_PREFIX}multi_2_${timestamp}`, num: 200 },
        { name: `${TEST_PREFIX}multi_3_${timestamp}`, num: 300 }
      ];

      await db.setNumMulti(counters);

      for (const counter of counters) {
        const result = await db.getNum(counter.name);
        expect(result.num).to.equal(counter.num);
      }
    });

    it('should handle empty array', async function() {
      await db.setNumMulti([]);
    });

    it('should handle single counter in array', async function() {
      const name = `${TEST_PREFIX}single_${timestamp}`;
      await db.setNumMulti([{ name, num: 500 }]);
      
      const result = await db.getNum(name);
      expect(result.num).to.equal(500);
    });
  });

  describe('getAll', function() {
    const timestamp = Date.now();

    it('should return all counters', async function() {
      const testName1 = `${TEST_PREFIX}all_1_${timestamp}`;
      const testName2 = `${TEST_PREFIX}all_2_${timestamp}`;
      
      await db.setNum(testName1, 111);
      await db.setNum(testName2, 222);
      
      const all = await db.getAll();
      
      expect(all).to.be.an('array');
      
      const counter1 = all.find(c => c.name === testName1);
      const counter2 = all.find(c => c.name === testName2);
      
      expect(counter1).to.exist;
      expect(counter1.num).to.equal(111);
      expect(counter2).to.exist;
      expect(counter2.num).to.equal(222);
    });
  });

  describe('Counter Operations Integration', function() {
    const timestamp = Date.now();

    it('should increment counter correctly', async function() {
      const name = `${TEST_PREFIX}increment_${timestamp}`;
      
      let result = await db.getNum(name);
      expect(result.num).to.equal(0);
      
      await db.setNum(name, 1);
      result = await db.getNum(name);
      expect(result.num).to.equal(1);
      
      await db.setNum(name, 2);
      result = await db.getNum(name);
      expect(result.num).to.equal(2);
    });

    it('should maintain separate counters', async function() {
      const name1 = `${TEST_PREFIX}sep1_${timestamp}`;
      const name2 = `${TEST_PREFIX}sep2_${timestamp}`;
      
      await db.setNum(name1, 10);
      await db.setNum(name2, 20);
      
      const result1 = await db.getNum(name1);
      const result2 = await db.getNum(name2);
      
      expect(result1.num).to.equal(10);
      expect(result2.num).to.equal(20);
    });

    it('should handle special characters in counter name', async function() {
      const specialNames = [
        `${TEST_PREFIX}special-dash_${timestamp}`,
        `${TEST_PREFIX}special.dot_${timestamp}`,
        `${TEST_PREFIX}special_underscore_${timestamp}`
      ];

      for (let i = 0; i < specialNames.length; i++) {
        await db.setNum(specialNames[i], i + 1);
        const result = await db.getNum(specialNames[i]);
        expect(result.num).to.equal(i + 1);
      }
    });
  });
});
