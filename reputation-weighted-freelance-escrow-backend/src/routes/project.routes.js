import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  inviteFreelancer,
  acceptInvitation,
  getProjectMessages,
} from '../controllers/project.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { checkProjectAccess } from '../middleware/projectAccess.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createProjectSchema, updateProjectSchema, inviteFreelancerSchema } from '../validators/project.validator.js';

const router = Router();

// Is router ke har project endpoint se pehle user ka login token verify hota hai.
router.use(authenticate);

// Frontend ka project data validate karke naya project create karta hai.
router.post('/', validate(createProjectSchema), createProject);

// Logged-in user se related projects ki list frontend ko return karta hai.
router.get('/', getProjects);

// Project access verify karke selected project ki complete details return karta hai.
router.get('/:projectId', checkProjectAccess, getProjectById);

// Project access aur updated fields validate karke selected project update karta hai.
router.patch('/:projectId', checkProjectAccess, validate(updateProjectSchema), updateProject);

// Project access aur freelancer email validate karke invitation bhejta hai.
router.post('/:projectId/invite', checkProjectAccess, validate(inviteFreelancerSchema), inviteFreelancer);

// Invited freelancer ke liye selected project invitation accept karta hai.
router.post('/:projectId/accept-invitation', acceptInvitation);

// Project access verify karke selected project ke messages return karta hai.
router.get('/:projectId/messages', checkProjectAccess, getProjectMessages);

export default router;
