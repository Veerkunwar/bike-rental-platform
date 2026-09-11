import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  bike: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  booking: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  photos: string[];
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    bike: { type: Schema.Types.ObjectId, ref: 'Bike', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
    photos: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const Review = mongoose.model<IReview>('Review', reviewSchema);
