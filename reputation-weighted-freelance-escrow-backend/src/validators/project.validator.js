import Joi from 'joi';

export const createProjectSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(10).required(),
  totalBudget: Joi.number().positive().required(),
  currency: Joi.string().default('USD'),
  freelancerEmail: Joi.string().email().optional(),
});

export const updateProjectSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().min(10).optional(),
  totalBudget: Joi.number().positive().optional(),
  currency: Joi.string().optional(),
});

export const inviteFreelancerSchema = Joi.object({
  freelancerEmail: Joi.string().email().required(),
});
