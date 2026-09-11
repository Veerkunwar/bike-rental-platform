import mongoose, { Document, Schema } from 'mongoose';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'payment_pending'
  | 'ready_for_pickup'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export interface IPriceBreakdown {
  rentalAmount: number;
  helmetCharge: number;
  taxes: number;
  discount: number;
  securityDeposit: number;
  totalPayable: number;
}

export interface IBooking extends Document {
  bookingId: string;
  user: mongoose.Types.ObjectId;
  bike: mongoose.Types.ObjectId;
  pickupLocation: mongoose.Types.ObjectId;

  pickupDateTime: Date;
  returnDateTime: Date;

  priceBreakdown: IPriceBreakdown;
  coupon?: mongoose.Types.ObjectId;

  paymentMethod: 'online' | 'cash';
  status: BookingStatus;

  payment?: mongoose.Types.ObjectId;

  actualPickupAt?: Date;
  actualReturnAt?: Date;

  cancellationReason?: string;
  cancelledBy?: 'user' | 'admin';
  cancelledAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const priceBreakdownSchema = new Schema<IPriceBreakdown>(
  {
    rentalAmount: { type: Number, required: true },
    helmetCharge: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    securityDeposit: { type: Number, default: 0 },
    totalPayable: { type: Number, required: true },
  },
  { _id: false },
);

const bookingSchema = new Schema<IBooking>(
  {
    bookingId: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bike: { type: Schema.Types.ObjectId, ref: 'Bike', required: true, index: true },
    pickupLocation: { type: Schema.Types.ObjectId, ref: 'Location', required: true },

    pickupDateTime: { type: Date, required: true, index: true },
    returnDateTime: { type: Date, required: true },

    priceBreakdown: { type: priceBreakdownSchema, required: true },
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon' },

    paymentMethod: { type: String, enum: ['online', 'cash'], required: true },
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'payment_pending',
        'ready_for_pickup',
        'active',
        'completed',
        'cancelled',
        'rejected',
      ],
      default: 'pending',
      index: true,
    },

    payment: { type: Schema.Types.ObjectId, ref: 'Payment' },

    actualPickupAt: Date,
    actualReturnAt: Date,

    cancellationReason: String,
    cancelledBy: { type: String, enum: ['user', 'admin'] },
    cancelledAt: Date,
  },
  { timestamps: true },
);

// Critical for the double-booking / overlap check (see services/availabilityService.ts)
bookingSchema.index({ bike: 1, pickupDateTime: 1, returnDateTime: 1, status: 1 });

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
