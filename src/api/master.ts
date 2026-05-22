import axios from './axios-helper';
import type { City, ExamType } from '@/types';

export const masterApi = {
  getCities: async (): Promise<City[]> => {
    const response = await axios.get<City[]>('/cities');
    return response.data;
  },

  getExamTypes: async (): Promise<ExamType[]> => {
    const response = await axios.get<ExamType[]>('/exam-types');
    return response.data;
  },
};
