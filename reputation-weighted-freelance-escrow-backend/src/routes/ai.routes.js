import { Router } from 'express';
import { disputeAssistantStart, disputeAssistantMessage, generateDoc } from '../controllers/ai.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { startDisputeSchema, disputeMessageSchema } from '../validators/dispute.validator.js';
import { generateDocumentSchema } from '../validators/document.validator.js';

const router = Router();

// Is router ke sabhi AI endpoints use karne se pehle user ka token verify hoga.
router.use(authenticate);

// Document ki details validate karke AI se project document generate karwata hai.
router.post('/generate-doc', validate(generateDocumentSchema), generateDoc);

// Dispute ki initial details validate karke AI assistant session start karta hai.
router.post('/dispute-assistant/start', validate(startDisputeSchema), disputeAssistantStart);

// Frontend ka message validate karke selected dispute ke AI assistant ko bhejta hai.
router.post('/dispute-assistant/:disputeId/message', validate(disputeMessageSchema), disputeAssistantMessage);

export default router;
