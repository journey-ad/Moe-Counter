import settings from '../settings.json';
import { encode } from 'base64-arraybuffer';
import { ResError } from './response';

/**
 * @param {string} str
 */
export function minify(str) {
  return str
    .replace(/[\r\n]/g, ' ')
    .replace(/> +</g, '><')
    .trim();
}

/**
 * @param {string} id
 */
export function validateID(id) {
  if (!/^[a-z0-9:.@_-]{1,256}$/i.test(id)) {
    throw new ResError(400, 'Invalid Counter ID');
  }
  if (!settings.ids[id]) {
    throw new ResError(400, 'Unregistered Counter ID');
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
