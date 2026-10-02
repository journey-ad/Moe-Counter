function parseError(error) {
  const err = error.issues[0];

  return {
    code: 400,
    message: `The field \`${err.path.join('.') || 'request'}\` is invalid. ${err.message}`,
  }
}
module.exports = {
  ZodValid: ({ headers, params, query, body }) => {
    const handler = (req, res, next) => {
      for (const [key, schema] of Object.entries({ headers, params, query, body })) {
        if (!schema) continue;
        const result = schema.safeParse(req[key]);
        if (!result.success) return res.status(400).send(parseError(result.error));
        req[key] = result.data;
      }

      next();
    }

    return handler
  },
  cors: ({ allowOrigins = '*', allowMethods = 'GET, POST, PUT, DELETE' } = {}) => {
    const isOriginAllowed = (origin) => {
      if (Array.isArray(allowOrigins)) {
        return allowOrigins.includes(origin);
      }
      if (typeof allowOrigins === 'string') {
        return allowOrigins === '*' || allowOrigins === origin;
      }
      return false;
    };

    const handler = (req, res, next) => {
      const origin = req.headers.origin;

      if (origin && isOriginAllowed(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
        res.header("Access-Control-Allow-Credentials", "true");
      } else {
        return next();
      }

      if (req.method === "OPTIONS") {
        const requestMethod = req.headers['access-control-request-method'];
        if (requestMethod) {
          res.header("Access-Control-Allow-Methods", requestMethod);
        } else {
          res.header("Access-Control-Allow-Methods", allowMethods);
        }

        const requestHeaders = req.headers['access-control-request-headers'];
        if (requestHeaders) {
          res.header("Access-Control-Allow-Headers", requestHeaders);
        }

        return res.sendStatus(204);
      }

      next();
    };

    return handler;
  }
}
