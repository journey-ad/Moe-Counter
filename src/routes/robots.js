import { genResponse } from '../response';

/**
 * @param {Request} req
 */
export async function get(req) {
  const robots = [
    'User-agent: *',
    'Allow: /robots.txt$',
    'Allow: /favicon.ico$',
    'Allow: /$',
    'Disallow: /',
  ];
  return await genResponse(req, robots.join('\n'), {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
