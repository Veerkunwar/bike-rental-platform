import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  discountPercentage?: number;
  fixedDiscount?: number;
  minBookingAmount: number;
  maxDiscount?: number;
  expiryDate: Date;
  usageLimit: number;
  perUserLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountPercentage: Number,
    fixedDiscount: Number,
    minBookingAmount: { type: Number, default: 0 },
    maxDiscount: Number,
    expiryDate: { type: Date, required: true },
    usageLimit: { type: Number, default: 0 }, // 0 = unlimited
    perUserLimit: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema);
