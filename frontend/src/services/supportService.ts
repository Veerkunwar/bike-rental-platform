import { api } from './api';

export const supportService = {
  async create(payload: { category: string; subject: string; message: string; relatedBooking?: string }) {
    const { data } = await api.post('/support', payload);
    return data.data;
  },
  async myTickets() {
    const { data } = await api.get('/support');
    return data.data;
  },
};
