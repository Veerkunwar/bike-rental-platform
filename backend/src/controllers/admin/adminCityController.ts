import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { sendSuccess } from '../../utils/ApiResponse';
import { City } from '../../models/City';
import { Location } from '../../models/Location';

export const createCity = asyncHandler(async (req: Request, res: Response) => {
  const city = await City.create(req.body);
  return sendSuccess(res, city, 'City created.', 201);
});

export const updateCity = asyncHandler(async (req: Request, res: Response) => {
  const city = await City.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!city) throw ApiError.notFound('City not found.');
  return sendSuccess(res, city, 'City updated.');
});

export const deleteCity = asyncHandler(async (req: Request, res: Response) => {
  const city = await City.findByIdAndDelete(req.params.id);
  if (!city) throw ApiError.notFound('City not found.');
  return sendSuccess(res, null, 'City deleted.');
});

export const listAllCitiesAdmin = asyncHandler(async (_req: Request, res: Response) => {
  const cities = await City.find().sort({ name: 1 });
  return sendSuccess(res, cities, 'Cities fetched.');
});

export const createLocation = asyncHandler(async (req: Request, res: Response) => {
  const location = await Location.create(req.body);
  return sendSuccess(res, location, 'Location created.', 201);
});

export const updateLocation = asyncHandler(async (req: Request, res: Response) => {
  const location = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!location) throw ApiError.notFound('Location not found.');
  return sendSuccess(res, location, 'Location updated.');
});

export const deleteLocation = asyncHandler(async (req: Request, res: Response) => {
  const location = await Location.findByIdAndDelete(req.params.id);
  if (!location) throw ApiError.notFound('Location not found.');
  return sendSuccess(res, null, 'Location deleted.');
});
