import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { sendSuccess } from '../utils/ApiResponse';
import { Bike } from '../models/Bike';
import { Booking } from '../models/Booking';
import { Coupon } from '../models/Coupon';
import { User } from '../models/User';
import { assertBikeAvailable } from '../services/availabilityService';
import { calculatePrice } from '../services/pricingService';
import { generateBookingId } from '../utils/generateBookingId';
import { createOrder } from '../services/razorpayService';
import { Payment } from '../models/Payment';
import { notify } from '../services/notificationService';
import { sendEmail, emailTemplates } from '../services/emailService';

/**
 * Full booking flow, step by step per spec section 8/34/35:
 *  1. Verify the user's documents are approved (BOOK NOW gate).
 *  2. Re-validate bike availability server-side (never trust the frontend).
 *  3. Calculate price server-side (rental + helmet + taxes - discount + deposit).
 *  4. Create the booking with status=pending.
 *  5a. Online: create a Razorpay order, return it; booking flips to
 *      confirmed only after /payments/verify succeeds.
 *  5b. Cash: booking flips straight to confirmed with payment=cash_pending.
 */
export const createBooking = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();

  const {
    bikeId,
    pickupLocationId,
    pickupDateTime,
    returnDateTime,
    wantsHelmet = false,
    couponCode,
    paymentMethod, // 'online' | 'cash'
  } = req.body;

  if (!bikeId || !pickupLocationId || !pickupDateTime || !returnDateTime || !paymentMethod) {
    throw ApiError.badRequest('Missing required booking fields.');
  }
  if (!['online', 'cash'].includes(paymentMethod)) {
    throw ApiError.badRequest('Invalid payment method.');
  }

  // ---- Document gate (section 34) ----
  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.notFound('User not found.');
  if (!user.areDocumentsApproved()) {
    throw ApiError.forbidden(
      'Please upload and verify your required documents before booking a bike.',
    );
  }

  const pickup = new Date(pickupDateTime);
  const ret = new Date(returnDateTime);

  const session = await mongoose.startSession();
  let createdBooking;

  try {
    await session.withTransaction(async () => {
      // ---- Re-check availability inside the transaction to prevent races ----
      await assertBikeAvailable(bikeId, pickup, ret, session);

      const bike = await Bike.findById(bikeId).session(session);
      if (!bike) throw ApiError.notFound('Bike not found.');

      let coupon = null;
      if (couponCode) {
        coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true }).session(session);
        if (!coupon) throw ApiError.badRequest('Invalid or inactive coupon code.');
        if (coupon.expiryDate < new Date()) throw ApiError.badRequest('This coupon has expired.');
        if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
          throw ApiError.badRequest('This coupon has reached its usage limit.');
        }
        const timesUsedByUser = await Booking.countDocuments({
          user: user.id,
          coupon: coupon._id,
          status: { $nin: ['cancelled', 'rejected'] },
        }).session(session);
        if (timesUsedByUser >= coupon.perUserLimit) {
          throw ApiError.badRequest('You have already used this coupon the maximum number of times.');
        }
      }

      // ---- Server-authoritative price calculation ----
      const priceBreakdown = calculatePrice({
        bike,
        pickupDateTime: pickup,
        returnDateTime: ret,
        wantsHelmet,
        coupon,
      });

      const bookingId = await generateBookingId();

      const [booking] = await Booking.create(
        [
          {
            bookingId,
            user: user.id,
            bike: bike.id,
            pickupLocation: pickupLocationId,
            pickupDateTime: pickup,
            returnDateTime: ret,
            priceBreakdown,
            coupon: coupon?._id,
            paymentMethod,
            status: paymentMethod === 'cash' ? 'confirmed' : 'payment_pending',
          },
        ],
        { session },
      );

      // Soft-hold the bike so it doesn't show as available while payment is pending.
      bike.status = 'booked';
      await bike.save({ session });

      if (coupon) {
        coupon.usedCount += 1;
        await coupon.save({ session });
      }

      if (paymentMethod === 'cash') {
        await Payment.create(
          [
            {
              booking: booking._id,
              user: user.id,
              amount: priceBreakdown.totalPayable,
              method: 'cash',
              status: 'cash_pending',
            },
          ],
          { session },
        );
      }

      createdBooking = booking;
    });
  } finally {
    session.endSession();
  }

  if (!createdBooking) throw ApiError.internal('Booking could not be created.');

  await notify(
    user.id,
    'booking_created',
    'Booking created',
    `Your booking ${(createdBooking as any).bookingId} has been created.`,
    (createdBooking as any).id,
  );

  if (paymentMethod === 'online') {
    const order = await createOrder(
      (createdBooking as any).priceBreakdown.totalPayable,
      (createdBooking as any).bookingId,
    );
    return sendSuccess(
      res,
      { booking: createdBooking, razorpayOrder: order },
      'Booking created. Proceed to payment.',
      201,
    );
  }

  await notify(
    user.id,
    'booking_confirmed',
    'Booking confirmed (Cash)',
    `Your booking ${(createdBooking as any).bookingId} is confirmed. Pay ₹${
      (createdBooking as any).priceBreakdown.totalPayable
    } at pickup.`,
    (createdBooking as any).id,
  );
  await sendEmail(user.email, 'Booking Confirmed', emailTemplates.bookingConfirmed((createdBooking as any).bookingId));

  return sendSuccess(res, { booking: createdBooking }, 'Booking confirmed. Pay at pickup.', 201);
});

export const listMyBookings = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { status } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = { user: req.user.id };
  if (status) filter.status = status;

  const bookings = await Booking.find(filter)
    .populate('bike', 'name brand modelName photos pricePerDay')
    .populate('pickupLocation', 'name address')
    .sort({ createdAt: -1 });

  return sendSuccess(res, bookings, 'Bookings fetched.');
});

export const getBookingById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const booking = await Booking.findById(req.params.id)
    .populate('bike')
    .populate('pickupLocation')
    .populate('payment');
  if (!booking) throw ApiError.notFound('Booking not found.');

  // Ownership check: a user may only view their own booking (admins bypass via admin routes).
  if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
    throw ApiError.forbidden('You do not have access to this booking.');
  }

  return sendSuccess(res, booking, 'Booking fetched.');
});

const CANCELLABLE_STATUSES = ['pending', 'confirmed', 'payment_pending', 'ready_for_pickup'];

export const cancelBooking = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { reason } = req.body;

  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found.');
  if (booking.user.toString() !== req.user.id) throw ApiError.forbidden('You cannot cancel this booking.');
  if (!CANCELLABLE_STATUSES.includes(booking.status)) {
    throw ApiError.conflict(`A booking in "${booking.status}" status can no longer be cancelled.`);
  }

  booking.status = 'cancelled';
  booking.cancellationReason = reason || 'Cancelled by user';
  booking.cancelledBy = 'user';
  booking.cancelledAt = new Date();
  await booking.save();

  // Free up the bike again.
  await Bike.findByIdAndUpdate(booking.bike, { status: 'available' });

  await notify(
    req.user.id,
    'booking_cancelled',
    'Booking cancelled',
    `Your booking ${booking.bookingId} has been cancelled.`,
    booking.id,
  );

  return sendSuccess(res, booking, 'Booking cancelled.');
});
