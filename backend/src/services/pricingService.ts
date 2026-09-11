import { IBike } from '../models/Bike';
import { ICoupon } from '../models/Coupon';
import { ApiError } from '../utils/ApiError';
import { IPriceBreakdown } from '../models/Booking';

const TAX_RATE = 0.18; // 18% GST-style rate, adjust as needed

/**
 * Server-authoritative price calculation. The frontend may show an estimate,
 * but this function's output is the only number that is ever persisted or
 * charged — never trust a total sent from the client.
 */
export function calculateRentalDurationHours(pickup: Date, ret: Date): number {
  const ms = ret.getTime() - pickup.getTime();
  return Math.ceil(ms / (1000 * 60 * 60));
}

export function calculatePrice(params: {
  bike: Pick<IBike, 'pricePerHour' | 'pricePerDay' | 'securityDeposit' | 'helmetIncluded'>;
  pickupDateTime: Date;
  returnDateTime: Date;
  wantsHelmet: boolean;
  coupon?: ICoupon | null;
}): IPriceBreakdown {
  const { bike, pickupDateTime, returnDateTime, wantsHelmet, coupon } = params;

  const totalHours = calculateRentalDurationHours(pickupDateTime, returnDateTime);
  if (totalHours <= 0) throw ApiError.badRequest('Invalid rental duration.');

  const fullDays = Math.floor(totalHours / 24);
  const remainderHours = totalHours % 24;

  // Whichever is cheaper: pure hourly vs day-rate + remainder hourly.
  const hourlyTotal = totalHours * bike.pricePerHour;
  const dayRateTotal = fullDays * bike.pricePerDay + remainderHours * bike.pricePerHour;
  const rentalAmount = Math.round(Math.min(hourlyTotal, dayRateTotal));

  const helmetCharge = wantsHelmet && !bike.helmetIncluded ? 100 : 0;

  const subtotalBeforeDiscount = rentalAmount + helmetCharge;

  let discount = 0;
  if (coupon) {
    if (subtotalBeforeDiscount < coupon.minBookingAmount) {
      throw ApiError.badRequest(`This coupon requires a minimum booking amount of ₹${coupon.minBookingAmount}.`);
    }
    if (coupon.discountPercentage) {
      discount = (subtotalBeforeDiscount * coupon.discountPercentage) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else if (coupon.fixedDiscount) {
      discount = coupon.fixedDiscount;
    }
    discount = Math.round(Math.min(discount, subtotalBeforeDiscount));
  }

  const taxableAmount = subtotalBeforeDiscount - discount;
  const taxes = Math.round(taxableAmount * TAX_RATE);

  const securityDeposit = bike.securityDeposit || 0;

  const totalPayable = taxableAmount + taxes + securityDeposit;

  return {
    rentalAmount,
    helmetCharge,
    taxes,
    discount,
    securityDeposit,
    totalPayable: Math.round(totalPayable),
  };
}
