function parseError(error) {
  const err = JSON.parse(error)[0];

  return {
    code: 400,
    message: `The field \`${err.path[0]}\` is invalid. ${err.message}`,
  }
}

module.exports = {
  ZodValid: ({ headers, params, query, body }) => {
    const handler = (req, res, next) => {
      if (headers) {
        const result = headers.safeParse(req.headers);
        if (!result.success) {
          res.status(400).send(parseError(result.error));
          return;
        }
      }

      if (params) {
        const result = params.safeParse(req.params);
        if (!result.success) {
          res.status(400).send(parseError(result.error));
          return;
        }
      }

      if (query) {
        const result = query.safeParse(req.query);
        if (!result.success) {
          res.status(400).send(parseError(result.error));
          return;
        }
      }

      if (body) {
        const result = body.safeParse(req.body);
        if (!result.success) {
          res.status(400).send(parseError(result.error));
          return;
        }
      }

      next();
    }

    return handler
  }
}