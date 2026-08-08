import Joi from 'joi';
import { DISPUTE_CATEGORY, AI_DECISIONS } from '../utils/constants.js';

export const startDisputeSchema = Joi.object({
  projectId: Joi.string().uuid().required(),
  milestoneId: Joi.string().uuid().required(),
  category: Joi.string().valid(...Object.values(DISPUTE_CATEGORY)).required(),
  initialClaim: Joi.string().min(10).required(),
});

export const disputeMessageSchema = Joi.object({
  content: Joi.string().min(1).required(),
});

export const completeClaimSchema = Joi.object({
  finalSummary: Joi.string().optional(),
});

export const respondDisputeSchema = Joi.object({
  responseContent: Joi.string().min(10).required(),
});

export const submitEvidenceSchema = Joi.object({
  evidenceType: Joi.string().required(),
  source: Joi.string().required(),
  content: Joi.string().optional().allow(''),
});

export const aiRecommendationSchema = Joi.object({
  decision: Joi.string().valid(...Object.values(AI_DECISIONS)).required(),
  freelancerPercentage: Joi.number().min(0).max(100).required(),
  clientRefundPercentage: Joi.number().min(0).max(100).required(),
  confidence: Joi.number().min(0).max(100).required(),
  summary: Joi.string().required(),
  completedCriteria: Joi.array().items(Joi.string()).default([]),
  incompleteCriteria: Joi.array().items(Joi.string()).default([]),
  verifiedFacts: Joi.array().items(Joi.string()).default([]),
  assumptions: Joi.array().items(Joi.string()).default([]),
  missingInformation: Joi.array().items(Joi.string()).default([]),
  evidenceReferences: Joi.array().items(Joi.string()).default([]),
  requiresHumanReview: Joi.boolean().default(true),
}).custom((value, helpers) => {
  if (value.freelancerPercentage + value.clientRefundPercentage !== 100) {
    return helpers.message('freelancerPercentage + clientRefundPercentage must equal 100');
  }
  return value;
});
