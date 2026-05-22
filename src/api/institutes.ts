import axios from './axios-helper';
import type { Institute } from '@/types';

export const institutesApi = {
  getAll: async (): Promise<Institute[]> => {
    const response = await axios.get<Institute[]>('/institutes');
    return response.data;
  },

  getById: async (identifier: string): Promise<Institute> => {
    const response = await axios.get<Institute>(`/institutes/${identifier}`);
    return response.data;
  },

  getBySlug: async (slug: string): Promise<Institute> => {
    const response = await axios.get<Institute>(`/institutes/slug/${slug}`);
    return response.data;
  },

  delete: async (identifier: string): Promise<void> => {
    await axios.delete(`/institutes/${identifier}`);
  },
};
