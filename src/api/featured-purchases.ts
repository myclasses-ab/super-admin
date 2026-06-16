import axios from './axios-helper';
import type { FeaturedPurchase } from '@/types';

export const featuredPurchasesApi = {
  getAll: async (): Promise<FeaturedPurchase[]> => {
    const response = await axios.get<FeaturedPurchase[]>('/featured-purchases');
    return response.data;
  },

  getByInstitute: async (id: string): Promise<FeaturedPurchase[]> => {
    const response = await axios.get<FeaturedPurchase[]>(`/featured-purchases/institute/${id}`);
    return response.data;
  },
};
