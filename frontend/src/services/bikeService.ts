import { api } from './api';
import { Bike } from '../types';

export interface BikeFilters {
  city?: string; category?: string; minPrice?: string; maxPrice?: string;
  brand?: string; transmission?: string; fuelType?: string; minRating?: string;
  sort?: string; page?: string; limit?: string; q?: string;
}

export const bikeService = {
  async list(filters: BikeFilters = {}) {
    const { data } = await api.get('/bikes', { params: filters });
    return { bikes: data.data as Bike[], meta: data.meta };
  },
  async getById(id: string) {
    const { data } = await api.get(`/bikes/${id}`);
    return data.data as Bike;
  },
  async reviews(bikeId: string) {
    const { data } = await api.get(`/bikes/${bikeId}/reviews`);
    return data.data;
  },
};

export const cityService = {
  async list() {
    const { data } = await api.get('/cities');
    return data.data;
  },
};

export const locationService = {
  async list(cityId?: string) {
    const { data } = await api.get('/locations', { params: cityId ? { city: cityId } : {} });
    return data.data;
  },
};
