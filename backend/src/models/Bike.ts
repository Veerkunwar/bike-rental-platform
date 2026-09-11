import mongoose, { Document, Schema } from 'mongoose';

export type BikeCategory =
  | 'scooty'
  | 'scooter'
  | 'commuter'
  | 'sports'
  | 'cruiser'
  | 'adventure'
  | 'electric';

export type BikeStatus = 'available' | 'booked' | 'rented' | 'maintenance' | 'disabled';

export interface IBike extends Document {
  name: string;
  brand: string;
  modelName: string;
  manufacturingYear: number;
  category: BikeCategory;
  engineCC?: number;
  mileageKmpl?: number;
  fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  transmission: 'manual' | 'automatic';
  helmetIncluded: boolean;

  photos: string[];

  city: mongoose.Types.ObjectId;
  pickupLocation: mongoose.Types.ObjectId;

  pricePerHour: number;
  pricePerDay: number;
  securityDeposit: number;

  status: BikeStatus;
  rentalTerms?: string;
  cancellationPolicy?: string;

  averageRating: number;
  reviewCount: number;

  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bikeSchema = new Schema<IBike>(
  {
    name: { type: String, required: true },
    brand: { type: String, required: true },
    modelName: { type: String, required: true },
    manufacturingYear: { type: Number, required: true },
    category: {
      type: String,
      enum: ['scooty', 'scooter', 'commuter', 'sports', 'cruiser', 'adventure', 'electric'],
      required: true,
    },
    engineCC: Number,
    mileageKmpl: Number,
    fuelType: { type: String, enum: ['petrol', 'diesel', 'electric', 'hybrid'], default: 'petrol' },
    transmission: { type: String, enum: ['manual', 'automatic'], default: 'manual' },
    helmetIncluded: { type: Boolean, default: true },

    photos: { type: [String], default: [] },

    city: { type: Schema.Types.ObjectId, ref: 'City', required: true, index: true },
    pickupLocation: { type: Schema.Types.ObjectId, ref: 'Location', required: true },

    pricePerHour: { type: Number, required: true },
    pricePerDay: { type: Number, required: true },
    securityDeposit: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['available', 'booked', 'rented', 'maintenance', 'disabled'],
      default: 'available',
      index: true,
    },
    rentalTerms: String,
    cancellationPolicy: String,

    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },

    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

bikeSchema.index({ city: 1, status: 1 });
bikeSchema.index({ category: 1 });
bikeSchema.index({ pricePerDay: 1 });
bikeSchema.index({ name: 'text', brand: 'text', modelName: 'text' });

export const Bike = mongoose.model<IBike>('Bike', bikeSchema);
