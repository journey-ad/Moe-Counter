/* global KV */
import settings from '../../settings.json';
import themes from '../../themes';
import { genResponse } from '../response';
import { validateID, minify } from '../utils';

/**
 * @param {number} count
 * @param {string} theme
 * @param {number|string} length
 * @param {boolean} pixelated
 */
function genImage(count, theme, length, pixelated) {
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
  <svg
    width="${x}"
    height="${height}"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    ${pixelated ? 'style="image-rendering: pixelated"' : ''}
  >
    <title>Moe Counter</title>
    <g>${parts}</g>
  </svg>
  `;
  return minify(svg);
}

/**
 * @param {Request} req
 * @param {FetchEvent} event
 */
export async function get(req, event) {
  // id
  const id = validateID(req.params.id);
  // theme
  let { theme, length, add } = req.query;
  if (!theme || !themes[theme]) {
    theme = settings.defaults.theme;
  }
  // length
  let _length = length || settings.defaults.length;
  if (length === 'auto') {
    _length = 'auto';
  } else if (!length || length <= 0 || length > 10) {
    _length = 7;
  }
  // render
  let pixelated = false;
  if (req.query.render === 'pixelated') {
    pixelated = true;
  }

  // get times from KV and set time asynchronously (no await)
  const count = Number.parseInt(await KV.get(id)) || 0;
  let image;
  if (add !== '0') {
    image = genImage(count + 1, theme, _length, pixelated);
    // do not quit worker before setting time
    event.waitUntil(KV.put(id, (count + 1).toString()));
  } else {
    image = genImage(count, theme, _length, pixelated);
  }

  return await genResponse(req, image, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
    },
  });
}
