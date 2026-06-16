import axios from './axios-helper';
import type { CreditTopUpRequest } from '@/types';

export interface ApproveCreditTopUpPayload {
  approvedBy: string;
  adminNotes: string;
}

export const creditTopUpsApi = {
  getAll: async (): Promise<CreditTopUpRequest[]> => {
    const response = await axios.get<CreditTopUpRequest[]>('/credit-top-ups');
    return response.data;
  },

  getPending: async (): Promise<CreditTopUpRequest[]> => {
    const response = await axios.get<CreditTopUpRequest[]>('/credit-top-ups/pending');
    return response.data;
  },

  getByInstitute: async (id: string): Promise<CreditTopUpRequest[]> => {
    const response = await axios.get<CreditTopUpRequest[]>(`/credit-top-ups/institute/${id}`);
    return response.data;
  },

  approve: async (id: string, data: ApproveCreditTopUpPayload): Promise<CreditTopUpRequest> => {
    const response = await axios.put<CreditTopUpRequest>(`/credit-top-ups/${id}/approve`, data);
    return response.data;
  },

  reject: async (id: string, adminNotes: string): Promise<CreditTopUpRequest> => {
    const response = await axios.put<CreditTopUpRequest>(`/credit-top-ups/${id}/reject`, { adminNotes });
    return response.data;
  },
};
