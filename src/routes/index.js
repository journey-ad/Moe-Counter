import { genResponse } from '../response';

/**
 * @param {Request} req
 */
export async function get(req) {
  return await genResponse(req, null, {
    status: 301,
    headers: {
      Location: 'https://github.com/dsrkafuu/moe-counter-cf#readme',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
