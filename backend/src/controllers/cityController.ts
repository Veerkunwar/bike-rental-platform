import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { City } from '../models/City';

export const listCities = asyncHandler(async (_req: Request, res: Response) => {
  const cities = await City.find({ isActive: true }).sort({ popularity: -1, name: 1 });
  return sendSuccess(res, cities, 'Cities fetched.');
});
