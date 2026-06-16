import axios from './axios-helper';
import type { InstituteCredit, CreditTransaction } from '@/types';

export interface GrantCreditsRequest {
  instituteIdentifier: string;
  amount: number;
  description: string;
}

export const creditsApi = {
  grant: async (data: GrantCreditsRequest): Promise<InstituteCredit> => {
    const response = await axios.post<InstituteCredit>('/credits/grant', data);
    return response.data;
  },

  getBalance: async (instituteId: string): Promise<InstituteCredit> => {
    const response = await axios.get<InstituteCredit>(`/credits/institute/${instituteId}`);
    return response.data;
  },

  getTransactions: async (instituteId: string): Promise<CreditTransaction[]> => {
    const response = await axios.get<CreditTransaction[]>(`/credits/institute/${instituteId}/transactions`);
    return response.data;
  },
};
