export async function get() {
  return new Response(null, {
    status: 301,
    headers: {
      Location: 'https://github.com/dsrkafuu/moe-counter#readme',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
