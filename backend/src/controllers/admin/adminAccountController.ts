import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { sendSuccess } from '../../utils/ApiResponse';
import { User } from '../../models/User';

/**
 * Admin-account management. Every route here is already behind
 * `protect, authorize('admin')` in routes/adminRoutes.ts, so only an
 * authenticated existing admin can reach these — there is no public or
 * user-role path to create an admin account.
 */

export const listAdmins = asyncHandler(async (_req: Request, res: Response) => {
  const admins = await User.find({ role: 'admin' }).sort({ createdAt: -1 });
  return sendSuccess(res, admins, 'Admins fetched.');
});

export const createAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, phone, password, confirmPassword } = req.body;

  if (!fullName || !email || !phone || !password) {
    throw ApiError.badRequest('Full name, email, phone and password are required.');
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    throw ApiError.badRequest('Passwords do not match.');
  }
  if (password.length < 8) {
    throw ApiError.badRequest('Password must be at least 8 characters.');
  }

  const existing = await User.findOne({ $or: [{ email }, { phone }] });
  if (existing) throw ApiError.conflict('An account with this email or phone already exists.');

  const admin = await User.create({
    fullName,
    email,
    phone,
    password, // hashed automatically by the User model's pre-save hook
    role: 'admin',
    isEmailVerified: true,
    isPhoneVerified: true,
  });

  return sendSuccess(res, sanitizeAdmin(admin), 'Admin account created.', 201);
});

export const removeAdmin = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();

  if (req.params.id === req.user.id) {
    throw ApiError.badRequest('You cannot remove your own admin account while logged in as it.');
  }

  const totalAdmins = await User.countDocuments({ role: 'admin' });
  if (totalAdmins <= 1) {
    throw ApiError.badRequest('Cannot remove the last remaining admin account.');
  }

  const admin = await User.findOneAndDelete({ _id: req.params.id, role: 'admin' });
  if (!admin) throw ApiError.notFound('Admin not found.');

  return sendSuccess(res, null, 'Admin account removed.');
});

function sanitizeAdmin(user: any) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
  };
}
