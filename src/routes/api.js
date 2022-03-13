/* global KV */
import { validateID } from '../utils';

export async function get(req) {
  const id = validateID(req.params.id);

  // get times from KV
  const data = ((await KV.get(id)) || '|').split('|');
  const count = Number.parseInt(data[0]) || 0;
  const update = Number.parseInt(data[1]) || null;

  return new Response(JSON.stringify({ count, update }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}

export async function del(req) {
  const id = validateID(req.params.id);

  await KV.delete(id);

  return new Response(null, {
    status: 204,
    headers: {
      'Cache-Control': 'no-cache',
    },
  });
}
