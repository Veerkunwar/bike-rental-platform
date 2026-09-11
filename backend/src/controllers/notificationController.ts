import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { sendSuccess } from '../utils/ApiResponse';
import { Notification } from '../models/Notification';

export const listMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(100);
  return sendSuccess(res, notifications, 'Notifications fetched.');
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { isRead: true },
    { new: true },
  );
  if (!notification) throw ApiError.notFound('Notification not found.');
  return sendSuccess(res, notification, 'Notification marked as read.');
});
