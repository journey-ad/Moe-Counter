import html from '../index.html';
import { genResponse } from '../response';
import { minify } from '../utils';

/**
 * @param {Request} req
 */
export async function get(req) {
  return await genResponse(req, minify(html), {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
