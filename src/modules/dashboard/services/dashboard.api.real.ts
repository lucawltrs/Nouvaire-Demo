import type { DashboardApiResponse } from '../types';
import { getConfig } from '../../../lib/config';

const getApiUrl = () => getConfig().API_URL;

const fourbasedFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('auth_token');
  
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

  async markChatAsRead(fourbasedId: string, chatId: string): Promise<void> {
    try {
      const url = `${getApiUrl()}/4based/users/${fourbasedId}/chats/${chatId}/update-messages-status-received`;
      console.log('Marking chat as read:', { fourbasedId, chatId, url });
      
      const response = await fourbasedFetch(url, { 
        method: 'PUT'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to mark chat as read: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error marking chat as read:', error);
      throw error;
    }
  },
};
