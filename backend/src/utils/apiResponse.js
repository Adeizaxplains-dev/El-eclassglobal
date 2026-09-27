/**
 * Every controller should respond through these two helpers so the
 * response shape is identical across the whole API:
 *
 *   success: { success: true, data, message }
 *   error:   { success: false, message, errors }
 */
export function sendSuccess(res, { data = null, message = 'OK', statusCode = 200 } = {}) {
  return res.status(statusCode).json({ success: true, data, message });
}

export function sendError(res, { message = 'Something went wrong', statusCode = 500, errors = [] } = {}) {
  return res.status(statusCode).json({ success: false, message, errors });
}
