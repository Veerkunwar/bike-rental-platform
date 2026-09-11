import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { sendSuccess } from '../../utils/ApiResponse';
import { User } from '../../models/User';

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { search, status, page = '1', limit = '20' } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = { role: 'user' };
  if (search) {
    filter.$or = [
      { fullName: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { phone: new RegExp(search, 'i') },
    ];
  }
  if (status === 'suspended') filter.isSuspended = true;
  if (status === 'active') filter.isSuspended = false;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
    User.countDocuments(filter),
  ]);

  return sendSuccess(res, users, 'Users fetched.', 200, { page: pageNum, limit: limitNum, total });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');
  return sendSuccess(res, user, 'User fetched.');
});

export const suspendUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isSuspended: true }, { new: true });
  if (!user) throw ApiError.notFound('User not found.');
  return sendSuccess(res, user, 'User suspended.');
});

export const activateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isSuspended: false }, { new: true });
  if (!user) throw ApiError.notFound('User not found.');
  return sendSuccess(res, user, 'User activated.');
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');
  return sendSuccess(res, null, 'User deleted.');
});
