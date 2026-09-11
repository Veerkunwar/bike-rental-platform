import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { sendSuccess } from '../../utils/ApiResponse';
import { Bike } from '../../models/Bike';
import { saveFile } from '../../config/storage';

export const createBike = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];
  const photos = await Promise.all(files.map((f) => saveFile(f.buffer, f.originalname, 'bikes')));

  const bike = await Bike.create({
    ...req.body,
    photos: photos.map((p) => p.url),
  });

  return sendSuccess(res, bike, 'Bike created.', 201);
});

export const updateBike = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];
  const update = { ...req.body };

  if (files.length) {
    const photos = await Promise.all(files.map((f) => saveFile(f.buffer, f.originalname, 'bikes')));
    update.photos = photos.map((p) => p.url);
  }

  const bike = await Bike.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!bike) throw ApiError.notFound('Bike not found.');
  return sendSuccess(res, bike, 'Bike updated.');
});

export const deleteBike = asyncHandler(async (req: Request, res: Response) => {
  const bike = await Bike.findByIdAndDelete(req.params.id);
  if (!bike) throw ApiError.notFound('Bike not found.');
  return sendSuccess(res, null, 'Bike deleted.');
});

export const setBikeStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  const valid = ['available', 'booked', 'rented', 'maintenance', 'disabled'];
  if (!valid.includes(status)) throw ApiError.badRequest('Invalid bike status.');

  const bike = await Bike.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!bike) throw ApiError.notFound('Bike not found.');
  return sendSuccess(res, bike, 'Bike status updated.');
});

export const listAllBikesAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { city, status, page = '1', limit = '20' } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};
  if (city) filter.city = city;
  if (status) filter.status = status;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const [bikes, total] = await Promise.all([
    Bike.find(filter)
      .populate('city', 'name')
      .populate('pickupLocation', 'name')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Bike.countDocuments(filter),
  ]);

  return sendSuccess(res, bikes, 'Bikes fetched.', 200, { page: pageNum, limit: limitNum, total });
});
