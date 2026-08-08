import { Router } from 'express';
import {
  completeClaim,
  respondDispute,
  uploadEvidence,
  analyzeDispute,
  getDispute,
  getDisputeMessages,
  getRecommendation,
  requestHumanReview,
} from '../controllers/dispute.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { uploadMiddleware } from '../middleware/upload.middleware.js';
import {
  completeClaimSchema,
  respondDisputeSchema,
  submitEvidenceSchema,
} from '../validators/dispute.validator.js';

const router = Router();

// Is router ke har dispute endpoint se pehle login token verify hoga.
router.use(authenticate);

// Claim ki final details validate karke dispute claim complete karta hai.
router.post('/disputes/:disputeId/complete-claim', validate(completeClaimSchema), completeClaim);

// Opposite party ka dispute response validate karke save karta hai.
router.post('/disputes/:disputeId/respond', validate(respondDisputeSchema), respondDispute);

// Pehle uploaded file parse hoti hai, phir evidence details validate hokar save hoti hain.
router.post('/disputes/:disputeId/evidence', uploadMiddleware.single('file'), validate(submitEvidenceSchema), uploadEvidence);

// Existing dispute data ko analyze karke recommendation process chalata hai.
router.post('/disputes/:disputeId/analyze', analyzeDispute);

// Dispute ID ke basis par us dispute ki details frontend ko deta hai.
router.get('/disputes/:disputeId', getDispute);

// Selected dispute ke saare conversation messages return karta hai.
router.get('/disputes/:disputeId/messages', getDisputeMessages);

// Selected dispute ke liye generated recommendation return karta hai.
router.get('/disputes/:disputeId/recommendation', getRecommendation);

// AI result ke baad dispute ko human review ke liye request karta hai.
router.post('/disputes/:disputeId/human-review', requestHumanReview);

export default router;
