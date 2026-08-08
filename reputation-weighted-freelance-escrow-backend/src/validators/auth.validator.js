import Joi from 'joi';
import { ROLES } from '../utils/constants.js';

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  role: Joi.string().valid(...Object.values(ROLES)).default(ROLES.CLIENT),
  walletAddress: Joi.string().optional().allow('', null),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});
