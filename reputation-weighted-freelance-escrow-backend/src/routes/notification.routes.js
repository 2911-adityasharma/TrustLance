import { Router } from 'express';
import { getNotifications, markNotificationRead } from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Notification endpoints use karne se pehle user ka login token verify hota hai.
router.use(authenticate);

// Logged-in user ki notifications frontend ko return karta hai.
router.get('/', getNotifications);

// Notification ID ke basis par selected notification ko read mark karta hai.
router.patch('/:id/read', markNotificationRead);

export default router;
