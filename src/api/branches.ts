import axios from './axios-helper';
import type { Branch } from '@/types';

export const branchesApi = {
  getUnresolvedCoordinates: async (): Promise<Branch[]> => {
    const response = await axios.get<Branch[]>('/branches/unresolved-coordinates');
    return response.data;
  },
};
