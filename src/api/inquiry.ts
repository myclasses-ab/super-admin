import axios from './axios-helper';
import type { Inquiry } from '@/types';

export const inquiryApi = {
  getAll: async (): Promise<Inquiry[]> => {
    const response = await axios.get<Inquiry[]>('/inquiries');
    return response.data;
  },
};
