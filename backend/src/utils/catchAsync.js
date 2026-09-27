/**
 * Wrap async route handlers so rejected promises are forwarded to
 * Express's error middleware instead of needing try/catch in every
 * controller.
 */
export function catchAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
