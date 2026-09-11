import { Router } from 'express';
import { listBikes, getBikeById } from '../controllers/bikeController';
import { listBikeReviews } from '../controllers/reviewController';

const router = Router();

router.get('/', listBikes);
router.get('/:id', getBikeById);
router.get('/:bikeId/reviews', listBikeReviews);

export default router;
