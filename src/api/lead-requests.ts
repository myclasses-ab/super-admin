import axios from './axios-helper';
import type { LeadRequest } from '@/types';

export interface UpdateLeadRequestStatusPayload {
  status: 'APPROVED' | 'REJECTED';
  adminNotes: string;
}

export const leadRequestsApi = {
  getAll: async (): Promise<LeadRequest[]> => {
    const response = await axios.get<LeadRequest[]>('/lead-requests');
    return response.data;
  },

  getPending: async (): Promise<LeadRequest[]> => {
    const response = await axios.get<LeadRequest[]>('/lead-requests/pending');
    return response.data;
  },

  getByInstitute: async (id: string): Promise<LeadRequest[]> => {
    const response = await axios.get<LeadRequest[]>(`/lead-requests/institute/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, data: UpdateLeadRequestStatusPayload): Promise<LeadRequest> => {
    const response = await axios.put<LeadRequest>(`/lead-requests/${id}/status`, data);
    return response.data;
  },

  fulfill: async (id: string): Promise<LeadRequest> => {
    const response = await axios.patch<LeadRequest>(`/lead-requests/${id}/fulfill`);
    return response.data;
  },
};
