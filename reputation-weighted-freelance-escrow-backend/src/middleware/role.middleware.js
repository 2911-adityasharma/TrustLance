import { ApiError } from '../utils/ApiError.js';

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthenticated user'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, `Access forbidden. Requires role: ${allowedRoles.join(', ')}`));
    }

    next();
  };
};
