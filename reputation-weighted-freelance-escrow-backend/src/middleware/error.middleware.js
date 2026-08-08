import { logger } from '../config/logger.js';
import { ApiError } from '../utils/ApiError.js';

export const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message = 'Internal Server Error', errors = [] } = err;

  if (!(err instanceof ApiError)) {
    logger.error('Unhandled Server Error: %o', err);
    statusCode = err.statusCode || 500;
    message = err.message || 'Internal Server Error';
  } else {
    logger.warn(`Operational Error [${statusCode}]: ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: Array.isArray(errors) && errors.length > 0 ? errors : [message],
  });
};
