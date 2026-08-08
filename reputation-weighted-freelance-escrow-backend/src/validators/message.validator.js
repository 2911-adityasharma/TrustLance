import Joi from 'joi';
import { MESSAGE_TYPE } from '../utils/constants.js';

export const socketMessageSchema = Joi.object({
  projectId: Joi.string().uuid().required(),
  clientMessageId: Joi.string().required(),
  content: Joi.string().min(1).required(),
  milestoneId: Joi.string().uuid().optional().allow(null),
  messageType: Joi.string().valid(...Object.values(MESSAGE_TYPE)).default(MESSAGE_TYPE.TEXT),
  attachmentUrl: Joi.string().optional().allow(null),
  attachmentHash: Joi.string().optional().allow(null),
});
