/**
 * Global error handler — must be registered LAST in app.js.
 * Catches anything passed to next(err) or thrown in async routes
 * (when wrapped with asyncHandler).
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  // Log full error in dev, minimal in prod
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`, err);
  } else {
    console.error(`[${new Date().toISOString()}] ${err.message}`);
  }

  // Knex / PostgreSQL constraint violations
  if (err.code === '23505') {
    const field = err.detail?.match(/Key \((.+?)\)/)?.[1] || 'field';
    return res.status(409).json({ error: `Duplicate value: ${field} already exists.` });
  }
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced record does not exist.' });
  }
  if (err.code === '23502') {
    return res.status(400).json({ error: 'A required field is missing.' });
  }

  // Custom app errors thrown with a status property
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  // Default 500
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred.'
      : err.message,
  });
};

/**
 * asyncHandler(fn)
 * Wraps async route handlers so thrown errors reach errorHandler
 * without try/catch boilerplate in every controller.
 *
 * Usage: router.get('/', asyncHandler(ctrl.list))
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/**
 * AppError
 * Throw this anywhere to return a clean HTTP error response.
 * Example: throw new AppError('Asset not found', 404)
 */
class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

module.exports = { errorHandler, asyncHandler, AppError };
