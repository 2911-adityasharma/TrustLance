import Joi from 'joi';

export const generateDocumentSchema = Joi.object({
  prompt: Joi.string().min(10).required(),
  existingContent: Joi.object().optional(),
});

export const createDocumentSchema = Joi.object({
  content: Joi.object().required(),
});

export const approveDocumentSchema = Joi.object({
  comment: Joi.string().optional().allow(''),
  walletSignature: Joi.string().optional().allow(''),
});

export const rejectDocumentSchema = Joi.object({
  reason: Joi.string().min(3).required(),
});
