import { api } from './api';
import { Notification } from '../types';

export const notificationService = {
  async list() {
    const { data } = await api.get('/notifications');
    return data.data as Notification[];
  },
  async markRead(id: string) {
    await api.patch(`/notifications/${id}/read`);
  },
};
