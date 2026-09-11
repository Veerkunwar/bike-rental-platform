import { api } from './api';
import { Booking } from '../types';

export const bookingService = {
  async create(payload: {
    bikeId: string; pickupLocationId: string; pickupDateTime: string;
    returnDateTime: string; wantsHelmet?: boolean; couponCode?: string;
    paymentMethod: 'online' | 'cash';
  }) {
    const { data } = await api.post('/bookings', payload);
    return data.data as { booking: Booking; razorpayOrder?: { id: string; amount: number; currency: string } };
  },
  async myBookings(status?: string) {
    const { data } = await api.get('/bookings', { params: status ? { status } : {} });
    return data.data as Booking[];
  },
  async getById(id: string) {
    const { data } = await api.get(`/bookings/${id}`);
    return data.data as Booking;
  },
  async cancel(id: string, reason?: string) {
    const { data } = await api.patch(`/bookings/${id}/cancel`, { reason });
    return data.data as Booking;
  },
};

export const paymentService = {
  async verify(payload: {
    bookingId: string; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string;
  }) {
    const { data } = await api.post('/payments/verify', payload);
    return data.data;
  },
};

export const couponService = {
  async validate(code: string, bookingAmount?: number) {
    const { data } = await api.get('/coupons/validate', { params: { code, bookingAmount } });
    return data.data;
  },
};
