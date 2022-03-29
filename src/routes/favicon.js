import { genProxyResponse } from '../response';

/**
 * @param {Request} req
 * @param {FetchEvent} event
 */
export async function get(req, event) {
  return await genProxyResponse(
    req,
    event,
    'https://cdn.jsdelivr.net/gh/dsrkafuu/dsr-assets@9.0.0/favicon/favicon.ico'
  );
}
