import { ResError } from './response';

export function minify(str) {
  if (typeof str !== 'string') {
    return str;
  }
  return str.replace(/ *\n */g, '').trim();
}

export function validateID(id) {
  if (!/^[a-z][0-9a-z!@#$%^&*_-]{0,255}$/i.test(id)) {
    throw new ResError(400, 'Invalid Counter ID');
  }
  return id;
}
