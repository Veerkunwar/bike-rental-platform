import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { Location } from '../models/Location';

export const listLocations = asyncHandler(async (req: Request, res: Response) => {
  const { city } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = { isActive: true };
  if (city) filter.city = city;
  const locations = await Location.find(filter).populate('city', 'name');
  return sendSuccess(res, locations, 'Locations fetched.');
});
