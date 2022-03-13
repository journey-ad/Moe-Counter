import { genResponse } from '../response';

/**
 * @param {Request} req
 */
export async function get(req) {
  const robots = 'User-agent: *\nDisallow: /';
  return await genResponse(req, robots, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
