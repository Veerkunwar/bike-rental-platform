import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'registration'
  | 'document_uploaded'
  | 'document_approved'
  | 'document_rejected'
  | 'booking_created'
  | 'booking_confirmed'
  | 'payment_successful'
  | 'payment_failed'
  | 'booking_cancelled'
  | 'pickup_reminder'
  | 'return_reminder'
  | 'refund_processed';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedBooking?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    relatedBooking: { type: Schema.Types.ObjectId, ref: 'Booking' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

notificationSchema.index({ user: 1, isRead: 1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
