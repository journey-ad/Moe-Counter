import index from '../views/index.html';

export async function get() {
  return new Response(index, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'max-age=0, private, must-revalidate',
    },
  });
}
