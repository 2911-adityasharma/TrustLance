import { Notification } from '../models/index.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { getPagination, getPagingData } from '../utils/pagination.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query.page, req.query.limit);

  const notificationsData = await Notification.findAndCountAll({
    where: { userId: req.user.id },
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  return sendSuccess(res, 200, 'Notifications retrieved', getPagingData(notificationsData, page, limit));
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const notification = await Notification.findOne({
    where: { id, userId: req.user.id },
  });

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  notification.isRead = true;
  await notification.save();

  return sendSuccess(res, 200, 'Notification marked as read', { notification });
});
