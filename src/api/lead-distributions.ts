import axios from './axios-helper';
import type { LeadDistribution } from '@/types';

export interface CreateDistributionRequest {
  userIdentifiers: string[];
  instituteIdentifier: string;
  notes?: string;
}

export const leadDistributionApi = {
  getAll: async (): Promise<LeadDistribution[]> => {
    const response = await axios.get<LeadDistribution[]>('/lead-distributions');
    return response.data;
  },

  getByInstitute: async (instituteIdentifier: string): Promise<LeadDistribution[]> => {
    const response = await axios.get<LeadDistribution[]>(`/lead-distributions/institute/${instituteIdentifier}`);
    return response.data;
  },

  create: async (data: CreateDistributionRequest): Promise<LeadDistribution[]> => {
    const response = await axios.post<LeadDistribution[]>('/lead-distributions', data);
    return response.data;
  },

  update: async (identifier: string, status: string): Promise<LeadDistribution> => {
    const response = await axios.patch<LeadDistribution>(`/lead-distributions/${identifier}`, { status });
    return response.data;
  },
};
