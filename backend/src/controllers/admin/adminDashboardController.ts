import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import { User } from '../../models/User';
import { Bike } from '../../models/Bike';
import { Booking } from '../../models/Booking';
import { Payment } from '../../models/Payment';

export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const [
    totalUsers,
    totalBikes,
    availableBikes,
    activeRentals,
    totalBookings,
    pendingBookings,
    cancelledBookings,
    pendingDocuments,
    revenueAgg,
    pendingPaymentsCount,
    cashPaymentsCount,
    onlinePaymentsCount,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Bike.countDocuments(),
    Bike.countDocuments({ status: 'available' }),
    Booking.countDocuments({ status: 'active' }),
    Booking.countDocuments(),
    Booking.countDocuments({ status: { $in: ['pending', 'payment_pending'] } }),
    Booking.countDocuments({ status: 'cancelled' }),
    User.countDocuments({
      $or: [
        { 'documents.governmentId.status': 'pending' },
        { 'documents.drivingLicense.status': 'pending' },
        { 'documents.selfie.status': 'pending' },
      ],
    }),
    Payment.aggregate([
      { $match: { status: { $in: ['successful', 'cash_received'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Payment.countDocuments({ status: { $in: ['pending', 'processing', 'cash_pending'] } }),
    Payment.countDocuments({ method: 'cash' }),
    Payment.countDocuments({ method: 'online' }),
  ]);

  return sendSuccess(res, {
    totalUsers,
    totalBikes,
    availableBikes,
    activeRentals,
    totalBookings,
    pendingBookings,
    cancelledBookings,
    pendingDocuments,
    revenue: revenueAgg[0]?.total || 0,
    pendingPayments: pendingPaymentsCount,
    cashPayments: cashPaymentsCount,
    onlinePayments: onlinePaymentsCount,
  }, 'Dashboard stats fetched.');
});

export const getChartsData = asyncHandler(async (_req: Request, res: Response) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [dailyBookings, monthlyRevenue, popularCities, popularBikes, paymentMethods, userRegistrations] =
    await Promise.all([
      Booking.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Payment.aggregate([
        { $match: { status: { $in: ['successful', 'cash_received'] }, createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, total: { $sum: '$amount' } } },
      ]),
      Booking.aggregate([
        { $lookup: { from: 'bikes', localField: 'bike', foreignField: '_id', as: 'bikeDoc' } },
        { $unwind: '$bikeDoc' },
        { $lookup: { from: 'cities', localField: 'bikeDoc.city', foreignField: '_id', as: 'cityDoc' } },
        { $unwind: '$cityDoc' },
        { $group: { _id: '$cityDoc.name', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      Booking.aggregate([
        { $group: { _id: '$bike', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'bikes', localField: '_id', foreignField: '_id', as: 'bikeDoc' } },
        { $unwind: '$bikeDoc' },
        { $project: { name: '$bikeDoc.name', count: 1 } },
      ]),
      Payment.aggregate([{ $group: { _id: '$method', count: { $sum: 1 } } }]),
      User.aggregate([
        { $match: { role: 'user', createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

  return sendSuccess(res, {
    dailyBookings,
    monthlyRevenue,
    popularCities,
    popularBikes,
    paymentMethods,
    userRegistrations,
  }, 'Chart data fetched.');
});
