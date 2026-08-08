import { Router } from 'express';
import {
  createMilestone,
  getMilestones,
  submitMilestone,
  approveMilestone,
  requestRevision,
  createChangeRequest,
  respondChangeRequest,
} from '../controllers/milestone.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { checkProjectAccess } from '../middleware/projectAccess.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createMilestoneSchema,
  submitMilestoneSchema,
  requestRevisionSchema,
  createChangeRequestSchema,
  respondChangeRequestSchema,
} from '../validators/milestone.validator.js';

const router = Router({ mergeParams: true });

// Is router ke har milestone aur change-request endpoint se pehle token verify hota hai.
router.use(authenticate);

// Project access aur request data validate karke naya milestone create karta hai.
router.post('/projects/:projectId/milestones', checkProjectAccess, validate(createMilestoneSchema), createMilestone);

// Project access verify karke us project ke saare milestones return karta hai.
router.get('/projects/:projectId/milestones', checkProjectAccess, getMilestones);

// Project access aur input validate karke nayi change request create karta hai.
router.post('/projects/:projectId/change-requests', checkProjectAccess, validate(createChangeRequestSchema), createChangeRequest);

// Submission details validate karke selected milestone ko submit karta hai.
router.post('/milestones/:id/submit', validate(submitMilestoneSchema), submitMilestone);

// Selected submitted milestone ko approve karta hai; body validation required nahi hai.
router.post('/milestones/:id/approve', approveMilestone);

// Revision reason validate karke milestone par changes request karta hai.
router.post('/milestones/:id/request-revision', validate(requestRevisionSchema), requestRevision);

// Change-request response validate karke uska approval/rejection status update karta hai.
router.patch('/change-requests/:id/respond', validate(respondChangeRequestSchema), respondChangeRequest);

export default router;
