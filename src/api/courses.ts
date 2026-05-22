import axios from './axios-helper';
import type { InstituteCourse } from '@/types';

export const coursesApi = {
  getAll: async (): Promise<InstituteCourse[]> => {
    const response = await axios.get<InstituteCourse[]>('/institute-courses');
    return response.data;
  },

  getByInstitute: async (instituteIdentifier: string): Promise<InstituteCourse[]> => {
    const response = await axios.get<InstituteCourse[]>(`/institute-courses/institute/${instituteIdentifier}`);
    return response.data;
  },
};
