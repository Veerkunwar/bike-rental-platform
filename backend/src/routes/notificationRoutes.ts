import { Router } from 'express';
import { protect } from '../middleware/auth';
import { listMyNotifications, markNotificationRead } from '../controllers/notificationController';

const router = Router();
router.use(protect);
router.get('/', listMyNotifications);
router.patch('/:id/read', markNotificationRead);
export default router;
