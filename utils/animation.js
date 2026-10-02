'use strict'

function skipSubBlocks(buffer, offset) {
  while (offset < buffer.length) {
    const size = buffer[offset++]
    if (!size) return offset
    offset += size
  }
  return buffer.length + 1
}

function hasAnimatedGifFrames(buffer) {
  if (buffer.length < 13) return false
  let offset = 13 + ((buffer[10] & 0x80) ? 3 * (1 << ((buffer[10] & 7) + 1)) : 0)
  let frames = 0

  while (offset < buffer.length) {
    const marker = buffer[offset++]
    if (marker === 0x21) {
      offset = skipSubBlocks(buffer, offset + 1)
    } else if (marker === 0x2c) {
      if (offset + 9 > buffer.length) return false
      const packed = buffer[offset + 8]
      offset += 9 + ((packed & 0x80) ? 3 * (1 << ((packed & 7) + 1)) : 0)
      offset = skipSubBlocks(buffer, offset + 1)
      if (offset > buffer.length) return false
      if (++frames > 1) return true
    } else {
      return false
    }
  }
  return false
}

function hasAnimatedPngFrames(buffer) {
  let frames = 0
  for (let offset = 8; offset + 12 <= buffer.length;) {
    const size = buffer.readUInt32BE(offset)
    if (offset + size + 12 > buffer.length) return false
    if (buffer.toString('ascii', offset + 4, offset + 8) === 'fcTL' && ++frames > 1) return true
    offset += size + 12
  }
  return false
}

function hasAnimatedWebpFrames(buffer) {
  let frames = 0
  for (let offset = 12; offset + 8 <= buffer.length;) {
    const size = buffer.readUInt32LE(offset + 4)
    if (offset + size + 8 > buffer.length) return false
    if (buffer.toString('ascii', offset, offset + 4) === 'ANMF' && ++frames > 1) return true
    offset += size + 8 + (size & 1)
  }
  return false
}

function hasAnimatedFrames(buffer) {
  if (/^GIF8[79]a$/.test(buffer.toString('ascii', 0, 6))) return hasAnimatedGifFrames(buffer)
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return hasAnimatedPngFrames(buffer)
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return hasAnimatedWebpFrames(buffer)
  return false
}

module.exports = { hasAnimatedFrames }
