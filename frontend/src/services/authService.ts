import { api, setAccessToken } from './api';
import { User } from '../types';

export const authService = {
  async register(payload: {
    fullName: string; email: string; phone: string; password: string;
    confirmPassword: string; dateOfBirth?: string; city?: string;
  }) {
    const { data } = await api.post('/auth/register', payload);
    setAccessToken(data.data.accessToken);
    return data.data.user as User;
  },
  async login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.data.accessToken);
    return data.data.user as User;
  },
  async adminLogin(email: string, password: string) {
    const { data } = await api.post('/auth/admin/login', { email, password });
    setAccessToken(data.data.accessToken);
    return data.data.user as User;
  },
  async logout() {
    await api.post('/auth/logout');
    setAccessToken(null);
  },
  async me() {
    const { data } = await api.get('/auth/me');
    return data.data as User;
  },
  async forgotPassword(email: string) {
    await api.post('/auth/forgot-password', { email });
  },
  async resetPassword(token: string, password: string, confirmPassword: string) {
    await api.post('/auth/reset-password', { token, password, confirmPassword });
  },
  async verifyEmail(token: string) {
    await api.post('/auth/verify-email', { token });
  },
  async requestOtp() {
    const { data } = await api.post('/auth/otp/request');
    return data.data as { otpForDev?: string };
  },
  async confirmOtp(code: string) {
    await api.post('/auth/otp/verify', { code });
  },
};
