import { Router } from 'express';
import { protect } from '../middleware/auth';
import { createReview } from '../controllers/reviewController';

const router = Router();
router.post('/', protect, createReview);
export default router;
