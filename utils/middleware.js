function parseError(error) {
  const err = JSON.parse(error)[0];

  return {
    code: 400,
    message: `The field \`${err.path[0]}\` is invalid. ${err.message}`,
  }
}
function validateInput(parseFn, input) {
  const result = parseFn(input);
  if (!result.success) {
    return parseError(result.error);
  }
  return null;
}

module.exports = {
  ZodValid: ({ headers, params, query, body }) => {
    const handler = (req, res, next) => {
      const validations = [
        { input: req.headers, parseFn: headers?.safeParse },
        { input: req.params, parseFn: params?.safeParse },
        { input: req.query, parseFn: query?.safeParse },
        { input: req.body, parseFn: body?.safeParse },
      ];

      for (const { input, parseFn } of validations) {
        if (parseFn) {
          const error = validateInput(parseFn, input);
          if (error) {
            return res.status(400).send(error);
          }
        }
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
