/* global KV */
import { genResponse } from '../response';
import { validateID } from '../utils';

/**
 * @param {Request} req
 */
export async function get(req) {
  const id = validateID(req.params.id);
  const count = Number.parseInt(await KV.get(id)) || 0;
  return await genResponse(req, JSON.stringify({ count }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

/**
 * @param {Request} req
 */
export async function del(req) {
  const id = validateID(req.params.id);
  await KV.delete(id);
  return await genResponse(req, null, {
    status: 204,
  });
}
