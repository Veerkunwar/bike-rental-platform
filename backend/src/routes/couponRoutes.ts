import { Router } from 'express';
import { protect } from '../middleware/auth';
import { validateCoupon } from '../controllers/couponController';

const router = Router();
router.get('/validate', protect, validateCoupon);
export default router;
