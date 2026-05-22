import axios from './axios-helper';
import type { User, LeadFilters } from '@/types';

export const leadsApi = {
  getAll: async (filters?: LeadFilters): Promise<User[]> => {
    const params = new URLSearchParams();
    if (filters?.cityIdentifier) params.append('city', filters.cityIdentifier);
    if (filters?.examTypeIdentifier) params.append('exam', filters.examTypeIdentifier);
    if (filters?.search) params.append('search', filters.search);
    const response = await axios.get<User[]>(`/users/leads?${params.toString()}`);
    return response.data;
  },
};
