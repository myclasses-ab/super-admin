import axios from './axios-helper';
import type { User } from '@/types';

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const response = await axios.get<User[]>('/users');
    return response.data;
  },

  getById: async (identifier: string): Promise<User> => {
    const response = await axios.get<User>(`/users/${identifier}`);
    return response.data;
  },
};
