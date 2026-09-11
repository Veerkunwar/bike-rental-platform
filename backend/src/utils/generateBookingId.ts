import { Booking } from '../models/Booking';

export async function generateBookingId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `BR-${year}-`;

  const last = await Booking.findOne({ bookingId: { $regex: `^${prefix}` } })
    .sort({ createdAt: -1 })
    .select('bookingId')
    .lean();

  let nextNumber = 1;
  if (last?.bookingId) {
    const lastNumber = parseInt(last.bookingId.split('-')[2], 10);
    if (!Number.isNaN(lastNumber)) nextNumber = lastNumber + 1;
  }

  return `${prefix}${String(nextNumber).padStart(6, '0')}`;
}
