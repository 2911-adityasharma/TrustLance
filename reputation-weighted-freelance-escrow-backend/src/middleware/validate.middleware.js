import { ApiError } from '../utils/ApiError.js';

export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return next(new ApiError(400, 'Validation failed', errorMessages));
    }

    req[property] = value;
    next();
  };
};
