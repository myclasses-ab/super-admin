import axios from './axios-helper';
import type {
  ActivityLog,
  ActivityLogPageResponse,
  ActivityLogSearchParams,
  ActivityLogStatsResponse,
} from '@/types';

export const activityLogsApi = {
  search: async (params: ActivityLogSearchParams): Promise<ActivityLogPageResponse> => {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.append('page', String(params.page));
    if (params.size !== undefined) query.append('size', String(params.size));
    if (params.actorType) query.append('actorType', params.actorType);
    if (params.actionType) query.append('actionType', params.actionType);
    if (params.entityType) query.append('entityType', params.entityType);
    if (params.actorIdentifier) query.append('actorIdentifier', params.actorIdentifier);
    if (params.instituteIdentifier) query.append('instituteIdentifier', params.instituteIdentifier);
    if (params.fromDate) query.append('fromDate', params.fromDate);
    if (params.toDate) query.append('toDate', params.toDate);
    if (params.search) query.append('search', params.search);

    const response = await axios.get<ActivityLogPageResponse>(`/activity-logs?${query.toString()}`);
    return response.data;
  },

  getById: async (identifier: string): Promise<ActivityLog> => {
    const response = await axios.get<ActivityLog>(`/activity-logs/${identifier}`);
    return response.data;
  },

  getStudentTimeline: async (identifier: string, limit = 100): Promise<ActivityLog[]> => {
    const response = await axios.get<ActivityLog[]>(`/activity-logs/student/${identifier}/timeline?limit=${limit}`);
    return response.data;
  },

  getInstituteTimeline: async (identifier: string, limit = 100): Promise<ActivityLog[]> => {
    const response = await axios.get<ActivityLog[]>(`/activity-logs/institute/${identifier}/timeline?limit=${limit}`);
    return response.data;
  },

  getStats: async (): Promise<ActivityLogStatsResponse> => {
    const response = await axios.get<ActivityLogStatsResponse>('/activity-logs/stats');
    return response.data;
  },
};
