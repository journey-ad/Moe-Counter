import { getETag } from './utils';

/**
 * @param {Request} req
 * @param {BodyInit|null|undefined} body
 * @param {ResponseInit|undefined} init
 */
export async function genResponse(req, body, init) {
  // 304
  const buffer = await new Response(body, init).arrayBuffer();
  const etag = await getETag(buffer);
  if (!etag) {
    return res;
  }
  if (req.headers.get('If-None-Match') === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': init.headers['Cache-Control'] || 'no-cache',
        ETag: etag,
      },
    });
  }
  // 200
  const res = new Response(body, init);
  res.headers.set('Access-Control-Allow-Origin', '*');
  if (!init.headers['Cache-Control']) {
    res.headers.set('Cache-Control', 'no-cache');
  }
  res.headers.set('ETag', etag);
  return res;
}

/**
 * @param {Request} req
 * @param {FetchEvent} event
 * @param {string} proxy
 */
export async function genProxyResponse(req, event, proxy) {
  // check cache
  const cacheKey = new Request(new URL(req.url).toString(), req);
  const cache = caches.default;
  let usingCache = true;
  let resCache = await cache.match(cacheKey);
  if (!resCache) {
    usingCache = false;
    resCache = await fetch(proxy);
    event.waitUntil(cache.put(cacheKey, resCache.clone()));
  }
  // 304
  const etag = resCache.headers.get('ETag');
  if (etag && req.headers.get('If-None-Match') === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': resCache.headers.get('Cache-Control'),
        ETag: etag,
        'X-Proxy-Cache': 'HIT',
      },
    });
  }
  // normal response
  const res = new Response(resCache.body, resCache);
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('X-Proxy-Cache', usingCache ? 'HIT' : 'MISS');
  return res;
}

/**
 * custom api error
 */
export class ResError extends Error {
  /**
   * @param {number} status
   * @param {string} message
   */
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
  }
}

/**
 * @param {Request} req
 * @param {any} e
 */
export function genErrorResponse(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'text/plain',
    'Cache-Control': 'no-cache',
  };
  if (e instanceof ResError) {
    return new Response(e.message, { status: e.statusCode, headers });
  } else {
    console.error(e.name + ':', e.message);
    return new Response('Internal Server Error', { status: 500, headers });
  }
}
