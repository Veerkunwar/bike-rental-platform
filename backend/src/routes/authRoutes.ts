import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimiter';
import { protect } from '../middleware/auth';
import {
  register,
  login,
  adminLogin,
  logout,
  refresh,
  verifyEmail,
  requestPhoneOtp,
  confirmPhoneOtp,
  forgotPassword,
  resetPassword,
  getMe,
  updateMe,
} from '../controllers/authController';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/admin/login', authLimiter, adminLogin);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

router.post('/otp/request', protect, requestPhoneOtp);
router.post('/otp/verify', protect, confirmPhoneOtp);

router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);

export default router;
