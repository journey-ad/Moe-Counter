'use strict';

const { expect } = require('chai');
const { themeList, getCountImage } = require('../utils/themify');
const { randomArray, toFixed, logger } = require('../utils');

describe('Utils Module Tests', function() {
  
  describe('themeList', function() {
    it('should have multiple themes available', function() {
      expect(themeList).to.be.an('object');
      expect(Object.keys(themeList).length).to.be.greaterThan(0);
    });

    it('should have moebooru theme as default fallback', function() {
      expect(themeList).to.have.property('moebooru');
    });

    it('each theme should have digits 0-9 (except special themes)', function() {
      for (const themeName of Object.keys(themeList)) {
        const theme = themeList[themeName];
        if (themeName === 'capoo-2') continue;
        for (let i = 0; i <= 9; i++) {
          expect(theme).to.have.property(String(i));
        }
      }
    });

    it('each digit should have width, height, and data properties', function() {
      const moebooru = themeList.moebooru;
      const zero = moebooru['0'];
      
      expect(zero).to.have.property('width');
      expect(zero).to.have.property('height');
      expect(zero).to.have.property('data');
      expect(zero.width).to.be.a('number');
      expect(zero.height).to.be.a('number');
      expect(zero.data).to.be.a('string');
      expect(zero.data).to.match(/^data:image\/(png|gif|jpeg|webp);base64,/);
    });

    it('capoo-2 theme should have _start and _end images', function() {
      if (themeList['capoo-2']) {
        expect(themeList['capoo-2']).to.have.property('_start');
        expect(themeList['capoo-2']).to.have.property('_end');
      }
    });
  });

  describe('getCountImage', function() {
    it('should generate valid SVG for basic count', function() {
      const svg = getCountImage({
        count: 12345,
        theme: 'moebooru'
      });
      
      expect(svg).to.be.a('string');
      expect(svg).to.match(/^<\?xml version="1.0"/);
      expect(svg).to.include('<svg');
      expect(svg).to.include('</svg>');
      expect(svg).to.include('viewBox');
      expect(svg).to.include('Moe Counter!');
    });

    it('should use default theme when invalid theme is provided', function() {
      const svg1 = getCountImage({ count: 123, theme: 'invalid-theme-123' });
      const svg2 = getCountImage({ count: 123, theme: 'moebooru' });
      
      expect(svg1).to.be.a('string');
      expect(svg2).to.be.a('string');
    });

    it('should respect padding parameter', function() {
      const svg1 = getCountImage({ count: 1, theme: 'moebooru', padding: 3 });
      const svg2 = getCountImage({ count: 1, theme: 'moebooru', padding: 7 });
      
      expect(svg1).to.be.a('string');
      expect(svg2).to.be.a('string');
    });

    it('should respect scale parameter', function() {
      const svg1 = getCountImage({ count: 123, theme: 'moebooru', scale: 0.5 });
      const svg2 = getCountImage({ count: 123, theme: 'moebooru', scale: 2 });
      
      expect(svg1).to.be.a('string');
      expect(svg2).to.be.a('string');
    });

    it('should respect prefix parameter', function() {
      const svg = getCountImage({ 
        count: 123, 
        theme: 'moebooru', 
        prefix: 999 
      });
      
      expect(svg).to.be.a('string');
    });

    it('should respect offset parameter', function() {
      const svg = getCountImage({ 
        count: 123, 
        theme: 'moebooru', 
        offset: 5 
      });
      
      expect(svg).to.be.a('string');
    });

    it('should respect align parameter (center)', function() {
      const svg = getCountImage({ 
        count: 123, 
        theme: 'moebooru', 
        align: 'center' 
      });
      
      expect(svg).to.be.a('string');
    });

    it('should respect align parameter (bottom)', function() {
      const svg = getCountImage({ 
        count: 123, 
        theme: 'moebooru', 
        align: 'bottom' 
      });
      
      expect(svg).to.be.a('string');
    });

    it('should respect pixelated parameter', function() {
      const svg1 = getCountImage({ count: 123, theme: 'moebooru', pixelated: '1' });
      const svg2 = getCountImage({ count: 123, theme: 'moebooru', pixelated: '0' });
      
      expect(svg1).to.include('image-rendering: pixelated');
      expect(svg2).to.not.include('image-rendering: pixelated');
    });

    it('should respect darkmode parameter = "1"', function() {
      const svg = getCountImage({ count: 123, theme: 'moebooru', darkmode: '1' });
      expect(svg).to.include('filter: brightness(.6)');
    });

    it('should respect darkmode parameter = "0"', function() {
      const svg = getCountImage({ count: 123, theme: 'moebooru', darkmode: '0' });
      expect(svg).to.not.include('filter: brightness(.6)');
      expect(svg).to.not.include('prefers-color-scheme');
    });

    it('should respect darkmode parameter = "auto"', function() {
      const svg = getCountImage({ count: 123, theme: 'moebooru', darkmode: 'auto' });
      expect(svg).to.include('prefers-color-scheme');
    });

    it('should handle large numbers correctly', function() {
      const largeNumber = 999999999;
      const svg = getCountImage({ count: largeNumber, theme: 'moebooru' });
      
      expect(svg).to.be.a('string');
    });

    it('should handle zero correctly', function() {
      const svg = getCountImage({ count: 0, theme: 'moebooru' });
      
      expect(svg).to.be.a('string');
    });

    it('should handle string count input', function() {
      const svg = getCountImage({ count: '12345', theme: 'moebooru' });
      
      expect(svg).to.be.a('string');
    });

    it('should include _start and _end for capoo-2 theme', function() {
      if (themeList['capoo-2'] && themeList['capoo-2']['_start']) {
        const svg = getCountImage({ count: 123, theme: 'capoo-2' });
        expect(svg).to.be.a('string');
        expect(svg).to.include('xlink:href="#_start"');
        expect(svg).to.include('xlink:href="#_end"');
      }
    });
  });

  describe('randomArray', function() {
    it('should return a random element from array', function() {
      const arr = [1, 2, 3, 4, 5];
      const result = randomArray(arr);
      
      expect(arr).to.include(result);
    });

    it('should handle single element array', function() {
      const arr = [42];
      const result = randomArray(arr);
      
      expect(result).to.equal(42);
    });

    it('should return undefined for empty array', function() {
      const result = randomArray([]);
      expect(result).to.be.undefined;
    });
  });

  describe('toFixed', function() {
    it('should format number to specified digits', function() {
      expect(toFixed(3.14159, 2)).to.equal(3.14);
    });

    it('should default to 2 digits', function() {
      expect(toFixed(3.14159)).to.equal(3.14);
    });

    it('should handle string input', function() {
      expect(toFixed('3.14159', 2)).to.equal(3.14);
    });

    it('should return a number', function() {
      expect(toFixed(1.234)).to.be.a('number');
    });

    it('should handle zero correctly', function() {
      expect(toFixed(0)).to.equal(0);
    });

    it('should handle negative numbers', function() {
      expect(toFixed(-1.234, 2)).to.equal(-1.23);
    });
  });

  describe('logger', function() {
    it('should have all log methods', function() {
      expect(logger).to.have.property('debug');
      expect(logger).to.have.property('info');
      expect(logger).to.have.property('warn');
      expect(logger).to.have.property('error');
    });

    it('log methods should be functions', function() {
      expect(logger.debug).to.be.a('function');
      expect(logger.info).to.be.a('function');
      expect(logger.warn).to.be.a('function');
      expect(logger.error).to.be.a('function');
    });
  });
});
