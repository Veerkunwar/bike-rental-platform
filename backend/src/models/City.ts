import mongoose, { Document, Schema } from 'mongoose';

export interface ICity extends Document {
  name: string;
  state: string;
  description?: string;
  thumbnailUrl?: string;
  popularity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const citySchema = new Schema<ICity>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    state: { type: String, required: true },
    description: String,
    thumbnailUrl: String,
    popularity: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

citySchema.index({ isActive: 1 });

export const City = mongoose.model<ICity>('City', citySchema);
