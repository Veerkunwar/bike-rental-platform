import { Router } from 'express';
import { protect } from '../middleware/auth';
import { createBooking, listMyBookings, getBookingById, cancelBooking } from '../controllers/bookingController';

const router = Router();

router.use(protect);
router.post('/', createBooking);
router.get('/', listMyBookings);
router.get('/:id', getBookingById);
router.patch('/:id/cancel', cancelBooking);

export default router;
