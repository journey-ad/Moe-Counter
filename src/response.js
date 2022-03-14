import { getETag } from './utils';

/**
 * @param {Request} req
 * @param {Response} res mutable response
 */
function applyCommonHeaders(req, res) {
  // cors headers
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Expose-Headers', '*');
  // fix missing cache control
  if (!res.headers.get('Cache-Control')) {
    res.headers.set('Cache-Control', 'no-cache');
  }
  // default content type or no content
  if (res.status === 204 || res.status === 304) {
    res.headers.delete('Content-Type');
    res.headers.delete('Content-Length');
    res.headers.delete('Transfer-Encoding');
  } else if (!res.headers.get('Content-Type')) {
    res.headers.set('Content-Type', 'text/plain; charset=utf-8');
  }
  // custom response time
  res.headers.set('X-Response-Time', `${Date.now() - req.time}ms`);
  return res;
}

/**
 * @param {Request} req
 * @param {BodyInit|null|undefined} body
 * @param {ResponseInit|undefined} init
 */
export async function genResponse(req, body, init) {
  let res;
  // 304
  const buffer = await new Response(body, init).arrayBuffer();
  const etag = await getETag(buffer);
  if (etag && req.headers.get('If-None-Match') === etag) {
    res = new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
      },
    });
  }
  // normal response
  else {
    res = new Response(body, init);
    res.headers.set('ETag', etag);
  }
  return applyCommonHeaders(req, res);
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
  let res;
  // 304
  const etag = resCache.headers.get('ETag');
  if (etag && req.headers.get('If-None-Match') === etag) {
    res = new Response(null, {
      status: 304,
      headers: {
        'Cache-Control': resCache.headers.get('Cache-Control'),
        'X-Proxy-Cache': 'HIT',
        ETag: etag,
      },
    });
  }
  // normal response
  else {
    res = new Response(resCache.body, resCache);
    res.headers.set('X-Proxy-Cache', usingCache ? 'HIT' : 'MISS');
  }
  return applyCommonHeaders(req, res);
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
export function genErrorResponse(req, e) {
  let res;
  if (e instanceof ResError) {
    res = new Response(e.message, { status: e.statusCode });
  } else {
    console.error(e.name + ':', e.message);
    res = new Response('Internal Server Error', { status: 500 });
  }
  return applyCommonHeaders(req, res);
}
