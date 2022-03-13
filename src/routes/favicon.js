export async function get(req, event) {
  const cacheKey = new Request(new URL(req.url).toString(), req);
  const cache = caches.default;

  let usingCache = true;
  let resCache = await cache.match(cacheKey);
  if (!resCache) {
    usingCache = false;
    resCache = await fetch(
      'https://cdn.jsdelivr.net/gh/dsrkafuu/dsr-assets@3.0.0/favicon/favicon.ico'
    );
    event.waitUntil(cache.put(cacheKey, resCache.clone()));
  }

  const res = new Response(resCache.body, resCache);
  res.headers.set('X-Custom-Cache', usingCache ? 'HIT' : 'MISS');
  return new Response(res.body, res);
}
