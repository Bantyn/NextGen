import { ApiError } from '../utils/apiError.js';

/**
 * Zod Request Validation Middleware Factory
 * Validates req.body, req.query, or req.params against provided Zod schemas
 *
 * @param {object} schemas
 * @param {import('zod').ZodSchema} [schemas.body]
 * @param {import('zod').ZodSchema} [schemas.query]
 * @param {import('zod').ZodSchema} [schemas.params]
 */
export const validate = ({ body, query, params } = {}) => {
  return (req, res, next) => {
    try {
      if (body) {
        const parsedBody = body.safeParse(req.body);
        if (!parsedBody.success) {
          const formattedErrors = parsedBody.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          }));
          throw ApiError.unprocessable('Validation failed on request body', 'VALIDATION_ERROR', formattedErrors);
        }
        req.body = parsedBody.data;
      }

      if (query) {
        const parsedQuery = query.safeParse(req.query);
        if (!parsedQuery.success) {
          const formattedErrors = parsedQuery.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          }));
          throw ApiError.unprocessable('Validation failed on query parameters', 'VALIDATION_ERROR', formattedErrors);
        }
        req.query = parsedQuery.data;
      }

      if (params) {
        const parsedParams = params.safeParse(req.params);
        if (!parsedParams.success) {
          const formattedErrors = parsedParams.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          }));
          throw ApiError.unprocessable('Validation failed on route parameters', 'VALIDATION_ERROR', formattedErrors);
        }
        req.params = parsedParams.data;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default validate;
