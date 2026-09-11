import mongoose, { Document, Schema } from 'mongoose';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'successful'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'
  | 'cash_pending'
  | 'cash_received';

export interface IPayment extends Document {
  booking: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  amount: number;
  method: 'online' | 'cash';
  status: PaymentStatus;

  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;

  cashConfirmedBy?: mongoose.Types.ObjectId;
  cashConfirmedAt?: Date;

  refundAmount?: number;
  refundReason?: string;
  refundedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['online', 'cash'], required: true },
    status: {
      type: String,
      enum: [
        'pending',
        'processing',
        'successful',
        'failed',
        'refunded',
        'partially_refunded',
        'cash_pending',
        'cash_received',
      ],
      default: 'pending',
      index: true,
    },

    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: String,
    razorpaySignature: { type: String, select: false },

    cashConfirmedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cashConfirmedAt: Date,

    refundAmount: Number,
    refundReason: String,
    refundedAt: Date,
  },
  { timestamps: true },
);

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
