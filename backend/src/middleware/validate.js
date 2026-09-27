import { AppError } from '../utils/AppError.js';

/**
 * Wraps a zod schema into Express middleware. Reused across every
 * route that needs body validation instead of hand-rolled checks
 * scattered through controllers.
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => issue.message);
      return next(AppError.badRequest('Validation failed', errors));
    }
    req.body = result.data;
    next();
  };
}
