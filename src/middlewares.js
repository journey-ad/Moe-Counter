/**
 * @param {Request} req
 */
export async function withCORS(req) {
  const origin = req.headers.get('Origin');
  const methods = req.headers.get('Access-Control-Request-Method');
  const _headers = req.headers.get('Access-Control-Request-Headers');

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Expose-Headers': '*',
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'public, max-age=86400',
  };
  if (_headers) {
    headers['Access-Control-Allow-Headers'] = _headers;
  }

  if (origin && methods) {
    return new Response(null, {
      status: 204,
      headers,
    });
  }
}
