import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { sendSuccess } from '../utils/ApiResponse';
import { Coupon } from '../models/Coupon';

export const validateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const { code, bookingAmount } = req.query as Record<string, string>;
  if (!code) throw ApiError.badRequest('Coupon code is required.');

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) throw ApiError.notFound('Invalid coupon code.');
  if (coupon.expiryDate < new Date()) throw ApiError.badRequest('This coupon has expired.');
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    throw ApiError.badRequest('This coupon has reached its usage limit.');
  }
  if (bookingAmount && Number(bookingAmount) < coupon.minBookingAmount) {
    throw ApiError.badRequest(`Minimum booking amount for this coupon is ₹${coupon.minBookingAmount}.`);
  }

  return sendSuccess(res, coupon, 'Coupon is valid.');
});
