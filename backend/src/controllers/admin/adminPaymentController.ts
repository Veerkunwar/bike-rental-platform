import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { sendSuccess } from '../../utils/ApiResponse';
import { Payment } from '../../models/Payment';
import { Refund } from '../../models/Refund';
import { Booking } from '../../models/Booking';
import { initiateRefund } from '../../services/razorpayService';
import { notify } from '../../services/notificationService';

export const listAllPaymentsAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { status, method, page = '1', limit = '20' } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (method) filter.method = method;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate('booking', 'bookingId')
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Payment.countDocuments(filter),
  ]);

  return sendSuccess(res, payments, 'Payments fetched.', 200, { page: pageNum, limit: limitNum, total });
});

export const processRefund = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { bookingId, amount, reason } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found.');

  const payment = await Payment.findOne({ booking: booking.id });
  if (!payment) throw ApiError.notFound('Payment not found for this booking.');
  if (payment.method !== 'online' || !payment.razorpayPaymentId) {
    throw ApiError.badRequest('Only successfully paid online payments can be refunded through Razorpay.');
  }

  const razorpayRefund = await initiateRefund(payment.razorpayPaymentId, amount);

  const refund = await Refund.create({
    booking: booking.id,
    payment: payment.id,
    user: booking.user,
    amount,
    reason,
    status: 'processing',
    razorpayRefundId: razorpayRefund.id,
    processedBy: req.user.id,
  });

  payment.status = amount >= payment.amount ? 'refunded' : 'partially_refunded';
  payment.refundAmount = amount;
  payment.refundReason = reason;
  payment.refundedAt = new Date();
  await payment.save();

  await notify(
    booking.user.toString(),
    'refund_processed',
    'Refund processed',
    `A refund of ₹${amount} has been processed for booking ${booking.bookingId}.`,
    booking.id,
  );

  return sendSuccess(res, refund, 'Refund processed.', 201);
});
