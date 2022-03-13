import { encode } from 'base64-arraybuffer';
import { ResError } from './response';

/**
 * @param {string} str
 */
export function minify(str) {
  return str.replace(/ *\n */g, '').trim();
}

/**
 * @param {string} id
 * @returns
 */
export function validateID(id) {
  if (!/^[a-z][0-9a-z:!@#$%^&*_-]{0,255}$/i.test(id)) {
    throw new ResError(400, 'Invalid Counter ID');
  }
  return id;
}

/**
 * https://github.com/jshttp/etag/blob/master/index.js#L39
 * @param {ArrayBuffer} buffer
 */
export async function getETag(buffer) {
  // fast empty etag
  if (buffer.byteLength === 0) {
    return 'W/"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"';
  }
  try {
    // body hash
    const digest = await crypto.subtle.digest('SHA-1', buffer);
    const base64 = encode(digest);
    const hash = base64.substring(0, 27); // remove trailing `=`s
    // body length
    const length = buffer.byteLength.toString(16);
    return `W/"${length}-${hash}"`;
  } catch {
    return null;
  }
}
