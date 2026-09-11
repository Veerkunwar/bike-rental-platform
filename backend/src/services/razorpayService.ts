import crypto from 'crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

/**
 * Wraps Razorpay so the rest of the app doesn't care whether real test/live
 * keys are configured yet. With PAYMENTS_MOCK_MODE=true (the default until
 * real keys are supplied), orders and signature verification are simulated
 * deterministically so the full booking -> pay -> confirm flow can be
 * exercised and demoed without a Razorpay account.
 *
 * Swap to real payments: set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET /
 * RAZORPAY_WEBHOOK_SECRET to your Test (or Live) keys and set
 * PAYMENTS_MOCK_MODE=false. No controller code needs to change.
 */

const razorpayInstance = env.razorpay.mockMode
  ? null
  : new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });

export interface RazorpayOrder {
  id: string;
  amount: number; // in paise
  currency: string;
}

export async function createOrder(amountInRupees: number, receipt: string): Promise<RazorpayOrder> {
  const amountInPaise = Math.round(amountInRupees * 100);

  if (env.razorpay.mockMode || !razorpayInstance) {
    return {
      id: `order_mock_${crypto.randomBytes(10).toString('hex')}`,
      amount: amountInPaise,
      currency: 'INR',
    };
  }

  const order = await razorpayInstance.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt,
  });

  return { id: order.id, amount: Number(order.amount), currency: order.currency };
}

/**
 * Verifies the checkout signature returned by Razorpay Checkout.js.
 * NEVER trust a "payment succeeded" flag sent directly from the frontend —
 * this HMAC check against the (order_id + '|' + payment_id) using the
 * account secret is the only trustworthy confirmation.
 */
export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (env.razorpay.mockMode) {
    // Deterministic mock signature so the mock checkout page (frontend) can
    // "pass" verification without a real Razorpay account.
    const expected = crypto
      .createHash('sha256')
      .update(`${params.orderId}|${params.paymentId}|mock`)
      .digest('hex');
    return expected === params.signature;
  }

  const expectedSignature = crypto
    .createHmac('sha256', env.razorpay.keySecret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest('hex');

  return expectedSignature === params.signature;
}

/** Verifies the raw webhook body signature Razorpay sends in the X-Razorpay-Signature header. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (env.razorpay.mockMode) return true;

  if (!env.razorpay.webhookSecret) {
    throw ApiError.internal('Razorpay webhook secret is not configured.');
  }

  const expected = crypto.createHmac('sha256', env.razorpay.webhookSecret).update(rawBody).digest('hex');
  return expected === signature;
}

export async function initiateRefund(paymentId: string, amountInRupees: number): Promise<{ id: string }> {
  if (env.razorpay.mockMode || !razorpayInstance) {
    return { id: `rfnd_mock_${crypto.randomBytes(10).toString('hex')}` };
  }

  const refund = await razorpayInstance.payments.refund(paymentId, {
    amount: Math.round(amountInRupees * 100),
  });

  return { id: refund.id };
}
