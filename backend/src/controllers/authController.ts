import { Request, Response } from 'express';
import crypto from 'crypto';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { sendSuccess } from '../utils/ApiResponse';
import { User } from '../models/User';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/generateToken';
import { sendEmail, emailTemplates } from '../services/emailService';
import { issuePhoneOtp, verifyPhoneOtp } from '../services/otpService';
import { env } from '../config/env';

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const secure = env.nodeEnv === 'production';
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/api/auth/refresh',
  });
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, phone, password, confirmPassword, dateOfBirth, city } = req.body;

  if (!fullName || !email || !phone || !password) {
    throw ApiError.badRequest('Full name, email, phone and password are required.');
  }
  if (password !== confirmPassword) {
    throw ApiError.badRequest('Passwords do not match.');
  }
  if (password.length < 8) {
    throw ApiError.badRequest('Password must be at least 8 characters.');
  }

  const existing = await User.findOne({ $or: [{ email }, { phone }] });
  if (existing) throw ApiError.conflict('An account with this email or phone already exists.');

  const emailVerificationToken = crypto.randomBytes(32).toString('hex');

  const user = await User.create({
    fullName,
    email,
    phone,
    password,
    dateOfBirth,
    city,
    emailVerificationToken,
    emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  const verifyLink = `${env.clientUrl}/verify-email?token=${emailVerificationToken}`;
  await sendEmail(email, 'Verify your email', emailTemplates.verifyEmail(verifyLink));

  const accessToken = generateAccessToken({ id: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id, role: user.role });
  setAuthCookies(res, accessToken, refreshToken);

  return sendSuccess(
    res,
    { user: sanitizeUser(user), accessToken },
    'Registration successful. Please verify your email and phone number.',
    201,
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) throw ApiError.badRequest('Email and password are required.');

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password.');
  }
  if (user.isSuspended) throw ApiError.forbidden('Your account has been suspended. Contact support.');

  const accessToken = generateAccessToken({ id: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id, role: user.role });
  setAuthCookies(res, accessToken, refreshToken);

  return sendSuccess(res, { user: sanitizeUser(user), accessToken }, 'Logged in successfully.');
});

export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) throw ApiError.badRequest('Email and password are required.');

  const user = await User.findOne({ email, role: 'admin' }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid admin credentials.');
  }

  const accessToken = generateAccessToken({ id: user.id, role: 'admin' });
  const refreshToken = generateRefreshToken({ id: user.id, role: 'admin' });
  setAuthCookies(res, accessToken, refreshToken);

  return sendSuccess(res, { user: sanitizeUser(user), accessToken }, 'Admin logged in successfully.');
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  return sendSuccess(res, null, 'Logged out.');
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) throw ApiError.unauthorized('No refresh token provided.');

  const payload = verifyRefreshToken(token);
  const user = await User.findById(payload.id);
  if (!user) throw ApiError.unauthorized('Account no longer exists.');

  const accessToken = generateAccessToken({ id: user.id, role: user.role });
  const newRefreshToken = generateRefreshToken({ id: user.id, role: user.role });
  setAuthCookies(res, accessToken, newRefreshToken);

  return sendSuccess(res, { accessToken }, 'Token refreshed.');
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) throw ApiError.badRequest('Invalid or expired verification link.');

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  return sendSuccess(res, null, 'Email verified successfully.');
});

export const requestPhoneOtp = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const result = await issuePhoneOtp(req.user.id);
  return sendSuccess(res, result, 'OTP sent to your phone number.');
});

export const confirmPhoneOtp = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { code } = req.body;
  const ok = await verifyPhoneOtp(req.user.id, code);
  if (!ok) throw ApiError.badRequest('Invalid or expired OTP.');
  return sendSuccess(res, null, 'Phone number verified successfully.');
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond the same way whether or not the account exists, to avoid
  // leaking which emails are registered.
  if (user) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetLink = `${env.clientUrl}/reset-password?token=${resetToken}`;
    await sendEmail(email, 'Reset your password', emailTemplates.resetPassword(resetLink));
  }

  return sendSuccess(res, null, 'If that email is registered, a reset link has been sent.');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password, confirmPassword } = req.body;
  if (password !== confirmPassword) throw ApiError.badRequest('Passwords do not match.');

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) throw ApiError.badRequest('Invalid or expired reset link.');

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return sendSuccess(res, null, 'Password reset successfully. Please log in.');
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.notFound('User not found.');
  return sendSuccess(res, sanitizeUser(user), 'Current user fetched.');
});

const EDITABLE_PROFILE_FIELDS = ['fullName', 'phone', 'city', 'address', 'emergencyContact', 'dateOfBirth', 'profilePhotoUrl'] as const;

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const updates: Record<string, unknown> = {};
  for (const field of EDITABLE_PROFILE_FIELDS) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
  if (!user) throw ApiError.notFound('User not found.');
  return sendSuccess(res, sanitizeUser(user), 'Profile updated.');
});

export function sanitizeUser(user: any) {
  return {
    id: user._id ?? user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    city: user.city,
    profilePhotoUrl: user.profilePhotoUrl,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    documents: user.documents,
    documentsApproved: typeof user.areDocumentsApproved === 'function' ? user.areDocumentsApproved() : undefined,
  };
}
