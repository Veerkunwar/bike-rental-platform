import mongoose, { Document, Schema } from 'mongoose';

export interface IRefund extends Document {
  booking: mongoose.Types.ObjectId;
  payment: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  amount: number;
  reason: string;
  status: 'initiated' | 'processing' | 'completed' | 'failed';
  razorpayRefundId?: string;
  processedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const refundSchema = new Schema<IRefund>(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    payment: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['initiated', 'processing', 'completed', 'failed'], default: 'initiated' },
    razorpayRefundId: String,
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const Refund = mongoose.model<IRefund>('Refund', refundSchema);
