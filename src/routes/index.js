import html from '../index.html';
import { minify } from '../utils';

export async function get() {
  return new Response(minify(html), {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=86400',
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
