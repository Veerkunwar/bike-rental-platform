import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation extends Document {
  city: mongoose.Types.ObjectId;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  contactNumber?: string;
  openingTime?: string;
  closingTime?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema<ILocation>(
  {
    city: { type: Schema.Types.ObjectId, ref: 'City', required: true, index: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    contactNumber: String,
    openingTime: { type: String, default: '06:00' },
    closingTime: { type: String, default: '22:00' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

locationSchema.index({ city: 1, isActive: 1 });
locationSchema.index({ latitude: 1, longitude: 1 });

export const Location = mongoose.model<ILocation>('Location', locationSchema);
