import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { sendSuccess } from '../utils/ApiResponse';
import { Bike } from '../models/Bike';

export const listBikes = asyncHandler(async (req: Request, res: Response) => {
  const {
    city,
    category,
    minPrice,
    maxPrice,
    brand,
    transmission,
    fuelType,
    minRating,
    sort,
    page = '1',
    limit = '12',
    q,
  } = req.query as Record<string, string>;

  const filter: Record<string, unknown> = { status: 'available' };
  if (city) filter.city = city;
  if (category) filter.category = category;
  if (brand) filter.brand = new RegExp(brand, 'i');
  if (transmission) filter.transmission = transmission;
  if (fuelType) filter.fuelType = fuelType;
  if (minRating) filter.averageRating = { $gte: Number(minRating) };
  if (minPrice || maxPrice) {
    filter.pricePerDay = {
      ...(minPrice ? { $gte: Number(minPrice) } : {}),
      ...(maxPrice ? { $lte: Number(maxPrice) } : {}),
    };
  }
  if (q) filter.$text = { $search: q };

  let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
  if (sort === 'price_asc') sortOption = { pricePerDay: 1 };
  if (sort === 'price_desc') sortOption = { pricePerDay: -1 };
  if (sort === 'rating') sortOption = { averageRating: -1 };
  if (sort === 'popular') sortOption = { reviewCount: -1 };

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));

  const [bikes, total] = await Promise.all([
    Bike.find(filter)
      .populate('city', 'name state')
      .populate('pickupLocation', 'name address latitude longitude')
      .sort(sortOption)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Bike.countDocuments(filter),
  ]);

  return sendSuccess(res, bikes, 'Bikes fetched.', 200, {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  });
});

export const getBikeById = asyncHandler(async (req: Request, res: Response) => {
  const bike = await Bike.findById(req.params.id)
    .populate('city', 'name state')
    .populate('pickupLocation', 'name address latitude longitude contactNumber openingTime closingTime');
  if (!bike) throw ApiError.notFound('Bike not found.');
  return sendSuccess(res, bike, 'Bike details fetched.');
});
