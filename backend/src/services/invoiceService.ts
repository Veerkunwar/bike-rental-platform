import { IBooking } from '../models/Booking';
import { IUser } from '../models/User';
import { IBike } from '../models/Bike';

export interface InvoiceData {
  invoiceNumber: string;
  companyName: string;
  bookingId: string;
  customerName: string;
  bikeName: string;
  rentalPeriod: string;
  pickupLocation: string;
  rentalCharges: number;
  taxes: number;
  discount: number;
  securityDeposit: number;
  paymentMethod: string;
  totalAmount: number;
  issuedAt: string;
}

/**
 * Builds the structured invoice payload. Rendering it to an actual PDF is
 * intentionally kept out of the hot request path here — plug in a PDF lib
 * (pdfkit / puppeteer) in a background job or a dedicated
 * GET /api/bookings/:id/invoice route that streams the PDF using this data.
 */
export function buildInvoiceData(
  booking: IBooking,
  user: Pick<IUser, 'fullName'>,
  bike: Pick<IBike, 'name'>,
  pickupLocationName: string,
): InvoiceData {
  return {
    invoiceNumber: `INV-${booking.bookingId}`,
    companyName: 'Bike Rental Platform Pvt. Ltd.',
    bookingId: booking.bookingId,
    customerName: user.fullName,
    bikeName: bike.name,
    rentalPeriod: `${booking.pickupDateTime.toISOString()} - ${booking.returnDateTime.toISOString()}`,
    pickupLocation: pickupLocationName,
    rentalCharges: booking.priceBreakdown.rentalAmount + booking.priceBreakdown.helmetCharge,
    taxes: booking.priceBreakdown.taxes,
    discount: booking.priceBreakdown.discount,
    securityDeposit: booking.priceBreakdown.securityDeposit,
    paymentMethod: booking.paymentMethod,
    totalAmount: booking.priceBreakdown.totalPayable,
    issuedAt: new Date().toISOString(),
  };
}
