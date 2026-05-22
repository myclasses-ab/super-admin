import axios from './axios-helper';
import type { User } from '@/types';

export interface LoginRequest {
  email: string;
  password: string;
}



export interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  superAdminLogin: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>('/auth/super-admin-login', credentials);
    return response.data;
  },



  me: async (): Promise<User> => {
    const response = await axios.get<User>('/auth/me');
    return response.data;
  },

  refresh: async (): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>('/auth/refresh');
    return response.data;
  },
};
