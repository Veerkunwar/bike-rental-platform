import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { sendSuccess } from '../../utils/ApiResponse';
import { Coupon } from '../../models/Coupon';

export const listCouponsAdmin = asyncHandler(async (_req: Request, res: Response) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  return sendSuccess(res, coupons, 'Coupons fetched.');
});

export const createCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await Coupon.create(req.body);
  return sendSuccess(res, coupon, 'Coupon created.', 201);
});

export const updateCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!coupon) throw ApiError.notFound('Coupon not found.');
  return sendSuccess(res, coupon, 'Coupon updated.');
});

export const deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw ApiError.notFound('Coupon not found.');
  return sendSuccess(res, null, 'Coupon deleted.');
});
