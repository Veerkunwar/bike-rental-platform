import { api } from './api';

export const adminService = {
  dashboard: {
    stats: async () => (await api.get('/admin/dashboard/stats')).data.data,
    charts: async () => (await api.get('/admin/dashboard/charts')).data.data,
  },
  users: {
    list: async (params: Record<string, string> = {}) => (await api.get('/admin/users', { params })).data,
    suspend: async (id: string) => (await api.patch(`/admin/users/${id}/suspend`)).data.data,
    activate: async (id: string) => (await api.patch(`/admin/users/${id}/activate`)).data.data,
    remove: async (id: string) => api.delete(`/admin/users/${id}`),
  },
  documents: {
    pending: async () => (await api.get('/admin/documents/pending')).data.data,
    approve: async (userId: string, docType: string) =>
      (await api.patch(`/admin/documents/${userId}/${docType}/approve`)).data.data,
    reject: async (userId: string, docType: string, reason: string) =>
      (await api.patch(`/admin/documents/${userId}/${docType}/reject`, { reason })).data.data,
  },
  bikes: {
    list: async (params: Record<string, string> = {}) => (await api.get('/admin/bikes', { params })).data,
    create: async (formData: FormData) =>
      (await api.post('/admin/bikes', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data,
    update: async (id: string, formData: FormData) =>
      (await api.patch(`/admin/bikes/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data,
    remove: async (id: string) => api.delete(`/admin/bikes/${id}`),
    setStatus: async (id: string, status: string) => (await api.patch(`/admin/bikes/${id}/status`, { status })).data.data,
  },
  bookings: {
    list: async (params: Record<string, string> = {}) => (await api.get('/admin/bookings', { params })).data,
    updateStatus: async (id: string, status: string) =>
      (await api.patch(`/admin/bookings/${id}/status`, { status })).data.data,
    confirmCash: async (id: string, received: boolean) =>
      (await api.patch(`/admin/bookings/${id}/cash-payment`, { received })).data.data,
  },
  payments: {
    list: async (params: Record<string, string> = {}) => (await api.get('/admin/payments', { params })).data,
    refund: async (payload: { bookingId: string; amount: number; reason: string }) =>
      (await api.post('/admin/refunds', payload)).data.data,
  },
  cities: {
    list: async () => (await api.get('/admin/cities')).data.data,
    create: async (payload: Record<string, unknown>) => (await api.post('/admin/cities', payload)).data.data,
    update: async (id: string, payload: Record<string, unknown>) => (await api.patch(`/admin/cities/${id}`, payload)).data.data,
    remove: async (id: string) => api.delete(`/admin/cities/${id}`),
  },
  coupons: {
    list: async () => (await api.get('/admin/coupons')).data.data,
    create: async (payload: Record<string, unknown>) => (await api.post('/admin/coupons', payload)).data.data,
    remove: async (id: string) => api.delete(`/admin/coupons/${id}`),
  },
  support: {
    list: async (params: Record<string, string> = {}) => (await api.get('/admin/support', { params })).data.data,
    updateStatus: async (id: string, status: string) => (await api.patch(`/admin/support/${id}/status`, { status })).data.data,
  },
};
