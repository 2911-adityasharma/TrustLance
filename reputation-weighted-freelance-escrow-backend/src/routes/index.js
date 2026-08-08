import { Router } from 'express';
import authRoutes from './auth.routes.js';
import projectRoutes from './project.routes.js';
import documentRoutes from './document.routes.js';
import milestoneRoutes from './milestone.routes.js';
import messageRoutes from './message.routes.js';
import disputeRoutes from './dispute.routes.js';
import aiRoutes from './ai.routes.js';
import notificationRoutes from './notification.routes.js';
import paymentRoutes from './payment.routes.js';

const router = Router();

// Main Payment and Escrow Routes
router.use('/', paymentRoutes);

// Authentication ke register, login, logout aur profile routes /auth ke neeche mount hote hain.
router.use('/auth', authRoutes);

// Project create, list aur project actions wale routes /projects ke neeche mount hote hain.
router.use('/projects', projectRoutes);

// Project-specific document routes ko parent URL se projectId milta hai.
router.use('/projects/:projectId/documents', documentRoutes);

// Milestone routes apne complete paths define karte hain, isliye root par mount hote hain.
router.use('/', milestoneRoutes);

// Project messaging routes bhi apna complete path define karke root par mount hote hain.
router.use('/', messageRoutes);

// Dispute endpoints complete /disputes path ke saath root par mount hote hain.
router.use('/', disputeRoutes);

// AI document aur dispute-assistant endpoints /ai ke neeche available hote hain.
router.use('/ai', aiRoutes);

// Notification list aur read-status routes /notifications ke neeche mount hote hain.
router.use('/notifications', notificationRoutes);

export default router;
