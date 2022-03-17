import settings from '../../settings.json';
import html from './index.html';
import { genResponse } from '../response';
import { minify } from '../utils';

/**
 * @param {Request} req
 */
export async function get(req) {
  return await genResponse(
    req,
    minify(html).replace(/{{GAID}}/g, settings.index.analytics),
    {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    }
  );
}
