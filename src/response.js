/**
 * custom api error
 */
export class ResError extends Error {
  /**
   * @param {number} status
   * @param {string} message
   */
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
  }
}

/**
 * @param {any} e
 */
export function genErrorResponse(e) {
  const headers = {
    'Content-Type': 'text/plain',
    'Cache-Control': 'no-cache',
  };
  if (e instanceof ResError) {
    return new Response(e.message, { status: e.statusCode, headers });
  } else {
    console.error(e.name + ':', e.message);
    return new Response('Internal Server Error', { status: 500, headers });
  }
}

/**
 * @param {string} html
 */
export function genHTMLResponse(html) {
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'max-age=0, private, must-revalidate',
    },
  });
}
