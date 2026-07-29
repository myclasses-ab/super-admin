import axios from './axios-helper';
import type { User } from '@/types';

export const usersApi = {
  getById: async (identifier: string): Promise<User> => {
    const response = await axios.get<User>(`/users/${identifier}`);
    return response.data;
  },
};
