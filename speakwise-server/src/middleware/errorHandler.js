/**
 * Centralised error handler middleware
 */
export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  // Don't expose internal error details in production
  const message = err.isApiError
    ? err.message
    : status >= 500
      ? 'An internal server error occurred. Please try again.'
      : err.message || 'Request failed';

  console.error(`[ERROR] ${status} ${code}: ${err.message}`);

  res.status(status).json({
    error: message,
    code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * Request validation middleware
 */
export function validateContentType(expectedType) {
  return (req, res, next) => {
    if (!req.is(expectedType)) {
      return res.status(415).json({
        error: `Expected ${expectedType} content type`,
        code: 'INVALID_CONTENT_TYPE',
      });
    }
    next();
  };
}
