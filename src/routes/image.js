/* global KV */
import themes from '../../themes';
import { validateID, minify } from '../utils';

function genImage(count, theme, length) {
  let nums;
  if (length === 'auto') {
    nums = count.toString().split('');
  } else {
    nums = count.toString().padStart(length, '0').split('');
  }

  const { width, height, images } = themes[theme];
  let x = 0; // x axis
  const parts = nums.reduce((pre, cur) => {
    const uri = images[cur];
    const image = `<image x="${x}" y="0" width="${width}" height="${height}" href="${uri}"/>`;
    x += width;
    return pre + image;
  }, '');

  const svg = `
  <?xml version="1.0" encoding="UTF-8"?>
  <svg width="${x}" height="${height}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <title>Moe Counter</title>
    <g>${parts}</g>
  </svg>
  `;
  return minify(svg);
}

export async function get(req, event) {
  const id = validateID(req.params.id);
  let { theme, length } = req.query;
  if (!themes[theme]) {
    theme = 'gelbooru';
  }
  let _length = length;
  if (length === 'auto') {
    _length = 'auto';
  } else if (!length || length <= 0 || length > 10) {
    _length = 7;
  }

  // get times from KV
  const data = ((await KV.get(id)) || '|').split('|');
  const count = (Number.parseInt(data[0]) || 0) + 1;
  const image = genImage(count, theme, _length);
  // set time asynchronously (no await)
  event.waitUntil(KV.put(id, `${count}|${Date.now()}`));

  return new Response(image, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}
