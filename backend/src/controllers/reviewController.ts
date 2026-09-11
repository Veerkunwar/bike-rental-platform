import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { sendSuccess } from '../utils/ApiResponse';
import { Review } from '../models/Review';
import { Booking } from '../models/Booking';
import { Bike } from '../models/Bike';

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { bookingId, rating, comment, photos = [] } = req.body;

  if (!bookingId || !rating) throw ApiError.badRequest('bookingId and rating are required.');

  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found.');
  if (booking.user.toString() !== req.user.id) throw ApiError.forbidden();
  if (booking.status !== 'completed') {
    throw ApiError.conflict('You can only review a bike after your rental is completed.');
  }

  const existing = await Review.findOne({ booking: booking.id });
  if (existing) throw ApiError.conflict('You have already reviewed this booking.');

  const review = await Review.create({
    bike: booking.bike,
    user: req.user.id,
    booking: booking.id,
    rating,
    comment,
    photos,
  });

  const stats = await Review.aggregate([
    { $match: { bike: booking.bike } },
    { $group: { _id: '$bike', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats[0]) {
    await Bike.findByIdAndUpdate(booking.bike, {
      averageRating: Math.round(stats[0].avg * 10) / 10,
      reviewCount: stats[0].count,
    });
  }

  return sendSuccess(res, review, 'Review submitted.', 201);
});

export const listBikeReviews = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await Review.find({ bike: req.params.bikeId })
    .populate('user', 'fullName profilePhotoUrl')
    .sort({ createdAt: -1 });
  return sendSuccess(res, reviews, 'Reviews fetched.');
});
