import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { sendSuccess } from '../utils/ApiResponse';
import { Booking } from '../models/Booking';
import { Payment } from '../models/Payment';
import { verifyPaymentSignature, verifyWebhookSignature } from '../services/razorpayService';
import { notify } from '../services/notificationService';
import { sendEmail, emailTemplates } from '../services/emailService';
import { User } from '../models/User';

/**
 * Called by the frontend right after Razorpay Checkout succeeds on the
 * client. We NEVER trust the "it worked" flag from the browser — the
 * signature is re-derived server-side against the Razorpay secret before
 * anything is marked as paid or the booking is confirmed.
 */
export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw ApiError.badRequest('Missing payment verification fields.');
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found.');
  if (booking.user.toString() !== req.user.id) throw ApiError.forbidden();

  const isValid = verifyPaymentSignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  const payment = await Payment.findOneAndUpdate(
    { booking: booking.id },
    {
      booking: booking.id,
      user: req.user.id,
      amount: booking.priceBreakdown.totalPayable,
      method: 'online',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      status: isValid ? 'successful' : 'failed',
    },
    { upsert: true, new: true },
  );

  if (!isValid) {
    booking.status = 'payment_pending';
    await booking.save();
    await notify(req.user.id, 'payment_failed', 'Payment failed', 'Your payment could not be verified. Please retry.', booking.id);
    throw ApiError.badRequest('Payment verification failed. Please retry the payment.');
  }

  booking.status = 'confirmed';
  booking.payment = payment.id;
  await booking.save();

  const user = await User.findById(req.user.id);
  await notify(req.user.id, 'payment_successful', 'Payment successful', `Payment for booking ${booking.bookingId} was successful.`, booking.id);
  await notify(req.user.id, 'booking_confirmed', 'Booking confirmed', `Your booking ${booking.bookingId} is confirmed.`, booking.id);
  if (user) await sendEmail(user.email, 'Booking Confirmed', emailTemplates.bookingConfirmed(booking.bookingId));

  return sendSuccess(res, { booking, payment }, 'Payment verified. Booking confirmed.');
});

/**
 * Razorpay server-to-server webhook (payment.captured / payment.failed / refund.processed).
 * This is the source of truth of last resort if the client never calls
 * /verify (e.g. browser closed mid-checkout). Must be mounted with the RAW
 * body parser (see routes/paymentRoutes.ts) so the HMAC check is against the
 * exact bytes Razorpay signed.
 */
export const razorpayWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const rawBody = (req as any).rawBody as string;

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    throw ApiError.unauthorized('Invalid webhook signature.');
  }

  const event = req.body?.event;
  const paymentEntity = req.body?.payload?.payment?.entity;

  if (event === 'payment.captured' && paymentEntity?.order_id) {
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: paymentEntity.order_id },
      { status: 'successful', razorpayPaymentId: paymentEntity.id },
      { new: true },
    );
    if (payment) {
      await Booking.findByIdAndUpdate(payment.booking, { status: 'confirmed', payment: payment.id });
    }
  } else if (event === 'payment.failed' && paymentEntity?.order_id) {
    await Payment.findOneAndUpdate({ razorpayOrderId: paymentEntity.order_id }, { status: 'failed' });
  }

  // Always 200 quickly so Razorpay doesn't keep retrying.
  return sendSuccess(res, null, 'Webhook processed.');
});

export const getPaymentForBooking = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const payment = await Payment.findOne({ booking: req.params.bookingId });
  if (!payment) throw ApiError.notFound('Payment not found for this booking.');
  if (payment.user.toString() !== req.user.id && req.user.role !== 'admin') throw ApiError.forbidden();
  return sendSuccess(res, payment, 'Payment fetched.');
});
