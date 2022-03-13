/* global KV */
import { validateID } from '../utils';

export async function get(req) {
  const id = validateID(req.params.id);

  // get times from KV
  const count = Number.parseInt(await KV.get(id)) || 0;

  return new Response(JSON.stringify({ count }), {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

export async function del(req) {
  const id = validateID(req.params.id);
  await KV.delete(id);

  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    },
  });
}
