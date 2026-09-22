/**
 * Wraps an async Express handler so rejected promises are forwarded to
 * next(err) instead of crashing the process (Express 4 doesn't do this
 * automatically for async/await handlers).
 */
export default function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
