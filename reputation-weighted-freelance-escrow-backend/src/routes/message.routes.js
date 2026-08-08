import { Router } from 'express';
import { listProjectMessages } from '../controllers/message.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { checkProjectAccess } from '../middleware/projectAccess.middleware.js';

const router = Router({ mergeParams: true });

// Sirf message endpoint par login aur project access verify hota hai, taaki yeh
// middleware root par mount hue notifications/disputes jaise routes ko block na kare.
router.get('/projects/:projectId/messages', authenticate, checkProjectAccess, listProjectMessages);

export default router;
