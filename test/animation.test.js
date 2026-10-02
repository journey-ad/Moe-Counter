'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')

const { hasAnimatedFrames } = require('../utils/animation')

// 1x1 GIF, global color table of 2 entries, one image descriptor per frame
function gif(frames) {
  const header = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]
  const logicalScreen = [1, 0, 1, 0, 0x80, 0, 0]
  const colorTable = [0, 0, 0, 255, 255, 255]
  const frame = [0x2C, 0, 0, 0, 0, 1, 0, 1, 0, 0x00, 0x02, 0x02, 0xAA, 0xBB, 0x00]
  const images = Array.from({ length: frames }, () => frame).flat()
  return Buffer.from([...header, ...logicalScreen, ...colorTable, ...images, 0x3B])
}

// Chunks carry no payload, which is enough for the frame counter
function png(frames) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10]
  const chunk = [...Buffer.alloc(4), ...Buffer.from('fcTL'), ...Buffer.alloc(4)]
  return Buffer.from([...signature, ...Array.from({ length: frames }, () => chunk).flat()])
}

function webp(frames) {
  const header = [...Buffer.from('RIFF'), ...Buffer.alloc(4), ...Buffer.from('WEBP')]
  const chunk = [...Buffer.from('ANMF'), ...Buffer.alloc(4)]
  return Buffer.from([...header, ...Array.from({ length: frames }, () => chunk).flat()])
}

test('多帧 GIF 判定为动图', () => {
  assert.equal(hasAnimatedFrames(gif(1)), false)
  assert.equal(hasAnimatedFrames(gif(2)), true)
  assert.equal(hasAnimatedFrames(gif(3)), true)
})

test('多帧 APNG 判定为动图', () => {
  assert.equal(hasAnimatedFrames(png(1)), false)
  assert.equal(hasAnimatedFrames(png(2)), true)
})

test('多帧 WebP 判定为动图', () => {
  assert.equal(hasAnimatedFrames(webp(1)), false)
  assert.equal(hasAnimatedFrames(webp(2)), true)
})

test('截断的 GIF 不抛错也不判为动图', () => {
  const full = gif(2)
  assert.equal(hasAnimatedFrames(full.subarray(0, 13)), false)
  assert.equal(hasAnimatedFrames(full.subarray(0, 30)), false)
})

test('非图片数据判定为静态', () => {
  assert.equal(hasAnimatedFrames(Buffer.alloc(0)), false)
  assert.equal(hasAnimatedFrames(Buffer.from('not an image at all')), false)
})
