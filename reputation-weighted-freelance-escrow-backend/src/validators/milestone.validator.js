import Joi from 'joi';

export const createMilestoneSchema = Joi.object({
  title: Joi.string().min(3).max(150).required(),
  description: Joi.string().required(),
  acceptanceCriteria: Joi.array().items(Joi.string()).min(1).required(),
  amount: Joi.number().positive().required(),
  sequence: Joi.number().integer().min(1).default(1),
  dueDate: Joi.date().iso().optional(),
});

export const submitMilestoneSchema = Joi.object({
  submissionUrl: Joi.string().uri().optional().allow('', null),
  notes: Joi.string().optional().allow(''),
});

export const requestRevisionSchema = Joi.object({
  reason: Joi.string().min(10).required(),
});

export const createChangeRequestSchema = Joi.object({
  milestoneId: Joi.string().uuid().optional().allow(null),
  description: Joi.string().min(10).required(),
  proposedChanges: Joi.object().required(),
  paymentImpact: Joi.number().default(0),
  deadlineImpact: Joi.number().integer().default(0),
});

export const respondChangeRequestSchema = Joi.object({
  approve: Joi.boolean().required(),
});
