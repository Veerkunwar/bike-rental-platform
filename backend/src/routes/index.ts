import { Router } from 'express';
import authRoutes from './authRoutes';
import documentRoutes from './documentRoutes';
import bikeRoutes from './bikeRoutes';
import bookingRoutes from './bookingRoutes';
import paymentRoutes from './paymentRoutes';
import cityRoutes from './cityRoutes';
import locationRoutes from './locationRoutes';
import reviewRoutes from './reviewRoutes';
import couponRoutes from './couponRoutes';
import supportRoutes from './supportRoutes';
import notificationRoutes from './notificationRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/bikes', bikeRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/cities', cityRoutes);
router.use('/locations', locationRoutes);
router.use('/reviews', reviewRoutes);
router.use('/coupons', couponRoutes);
router.use('/support', supportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

export default router;
