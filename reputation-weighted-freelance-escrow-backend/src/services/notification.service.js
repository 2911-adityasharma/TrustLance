import { Notification } from '../models/index.js';

export const createNotification = async ({ userId, projectId, disputeId, type, title, message }) => {
  return Notification.create({
    userId,
    projectId,
    disputeId,
    type,
    title,
    message,
  });
};
