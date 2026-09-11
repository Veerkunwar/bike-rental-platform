import mongoose from 'mongoose';
import { Booking } from '../models/Booking';
import { Bike } from '../models/Bike';
import { ApiError } from '../utils/ApiError';

const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed', 'payment_pending', 'ready_for_pickup', 'active'];

/**
 * The single source of truth for "is this bike free between these two timestamps".
 * Two ranges [pickupA, returnA] and [pickupB, returnB] overlap iff
 *   pickupA < returnB  AND  pickupB < returnA
 * We look for any existing, still-active booking for the bike that overlaps
 * the requested window. Cancelled/rejected/completed bookings never block.
 *
 * IMPORTANT: callers must run this inside the same DB transaction/session
 * that creates the booking (see bookingController) to avoid a race between
 * the check and the insert under concurrent requests.
 */
export async function assertBikeAvailable(
  bikeId: string | mongoose.Types.ObjectId,
  pickupDateTime: Date,
  returnDateTime: Date,
  session?: mongoose.ClientSession,
  excludeBookingId?: string | mongoose.Types.ObjectId,
): Promise<void> {
  if (pickupDateTime >= returnDateTime) {
    throw ApiError.badRequest('Return date/time must be after pickup date/time.');
  }
  if (pickupDateTime < new Date(Date.now() - 5 * 60 * 1000)) {
    throw ApiError.badRequest('Pickup date/time cannot be in the past.');
  }

  const bike = await Bike.findById(bikeId).session(session ?? null);
  if (!bike) throw ApiError.notFound('Bike not found.');
  if (bike.status === 'maintenance' || bike.status === 'disabled') {
    throw ApiError.conflict('This bike is currently unavailable for booking.');
  }

  const overlapQuery: Record<string, unknown> = {
    bike: bikeId,
    status: { $in: ACTIVE_BOOKING_STATUSES },
    pickupDateTime: { $lt: returnDateTime },
    returnDateTime: { $gt: pickupDateTime },
  };
  if (excludeBookingId) {
    overlapQuery._id = { $ne: excludeBookingId };
  }

  const overlapping = await Booking.findOne(overlapQuery).session(session ?? null);
  if (overlapping) {
    throw ApiError.conflict(
      'This bike is already booked for an overlapping period. Please choose a different time or bike.',
    );
  }
}

export async function isBikeAvailable(
  bikeId: string | mongoose.Types.ObjectId,
  pickupDateTime: Date,
  returnDateTime: Date,
): Promise<boolean> {
  try {
    await assertBikeAvailable(bikeId, pickupDateTime, returnDateTime);
    return true;
  } catch {
    return false;
  }
}
