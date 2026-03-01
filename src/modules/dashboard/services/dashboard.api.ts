import type { DashboardApiResponse } from '../types';
import { getConfig } from '../../../lib/config';

const getApiUrl = () => getConfig().API_URL;
const get4basedToken = () => getConfig().FOURBASED_BEARER_TOKEN;

const fourbasedFetch = async (url: string, options: RequestInit = {}) => {
  const token = get4basedToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  return fetch(url, { ...options, headers });
};

export const dashboardApi = {
  async getDashboard(rangeDays: number = 30): Promise<DashboardApiResponse> {
    try {
      const response = await fourbasedFetch(`${getApiUrl()}/4based/dashboard?range_days=${rangeDays}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data: DashboardApiResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },
};
