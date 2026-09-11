import { Router } from 'express';
import { protect } from '../middleware/auth';
import { verifyPayment, getPaymentForBooking } from '../controllers/paymentController';

const router = Router();

router.post('/verify', protect, verifyPayment);
router.get('/booking/:bookingId', protect, getPaymentForBooking);

// NOTE: the actual /webhook route is mounted separately in app.ts with the
// raw-body parser (Razorpay signs the exact raw bytes), not through this router.

export default router;
