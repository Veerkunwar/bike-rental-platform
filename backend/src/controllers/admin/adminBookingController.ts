import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { sendSuccess } from '../../utils/ApiResponse';
import { Booking } from '../../models/Booking';
import { Bike } from '../../models/Bike';
import { Payment } from '../../models/Payment';
import { notify } from '../../services/notificationService';

export const listAllBookingsAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { bookingId, city, status, dateFrom, dateTo, page = '1', limit = '20' } = req.query as Record<
    string,
    string
  >;

  const filter: Record<string, unknown> = {};
  if (bookingId) filter.bookingId = new RegExp(bookingId, 'i');
  if (status) filter.status = status;
  if (dateFrom || dateTo) {
    filter.pickupDateTime = {
      ...(dateFrom ? { $gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { $lte: new Date(dateTo) } : {}),
    };
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

  let query = Booking.find(filter)
    .populate({ path: 'bike', select: 'name city', populate: { path: 'city', select: 'name' } })
    .populate('user', 'fullName email phone')
    .populate('pickupLocation', 'name');

  if (city) {
    // filter by populated bike.city after population isn't ideal at scale;
    // for production, denormalize city onto Booking or use an aggregation pipeline.
    const all = await query;
    const filtered = all.filter((b: any) => b.bike?.city?.name === city);
    return sendSuccess(res, filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum), 'Bookings fetched.', 200, {
      page: pageNum,
      limit: limitNum,
      total: filtered.length,
    });
  }

  const [bookings, total] = await Promise.all([
    query
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Booking.countDocuments(filter),
  ]);

  return sendSuccess(res, bookings, 'Bookings fetched.', 200, { page: pageNum, limit: limitNum, total });
});

export const updateBookingStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  const valid = [
    'pending',
    'confirmed',
    'payment_pending',
    'ready_for_pickup',
    'active',
    'completed',
    'cancelled',
    'rejected',
  ];
  if (!valid.includes(status)) throw ApiError.badRequest('Invalid booking status.');

  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found.');

  booking.status = status;

  if (status === 'ready_for_pickup') {
    // no-op besides status; bike stays 'booked' until actual pickup marked
  } else if (status === 'active') {
    booking.actualPickupAt = new Date();
    await Bike.findByIdAndUpdate(booking.bike, { status: 'rented' });
  } else if (status === 'completed') {
    booking.actualReturnAt = new Date();
    await Bike.findByIdAndUpdate(booking.bike, { status: 'available' });
  } else if (status === 'cancelled' || status === 'rejected') {
    booking.cancelledBy = 'admin';
    booking.cancelledAt = new Date();
    await Bike.findByIdAndUpdate(booking.bike, { status: 'available' });
  }

  await booking.save();

  await notify(
    booking.user.toString(),
    status === 'confirmed' ? 'booking_confirmed' : 'booking_cancelled',
    `Booking ${status}`,
    `Your booking ${booking.bookingId} status changed to "${status}".`,
    booking.id,
  );

  return sendSuccess(res, booking, 'Booking status updated.');
});

export const confirmCashPayment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { received } = req.body as { received: boolean };

  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found.');
  if (booking.paymentMethod !== 'cash') throw ApiError.badRequest('This booking is not a cash booking.');

  const payment = await Payment.findOneAndUpdate(
    { booking: booking.id },
    {
      status: received ? 'cash_received' : 'cash_pending',
      cashConfirmedBy: received ? req.user.id : undefined,
      cashConfirmedAt: received ? new Date() : undefined,
    },
    { new: true, upsert: true },
  );

  return sendSuccess(res, payment, `Cash payment marked as ${received ? 'received' : 'not received'}.`);
});
