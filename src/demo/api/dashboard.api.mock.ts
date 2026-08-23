import type { DashboardApiResponse } from '../../modules/dashboard/types';
import { store } from '../store';
import { fakeLatency } from '../utils';

export const dashboardApi = {
  async getDashboard(rangeDays: number = 30): Promise<DashboardApiResponse> {
    await fakeLatency();
    return store.getDashboard(rangeDays);
  },

  async markChatAsRead(fourbasedId: string, chatId: string): Promise<void> {
    await fakeLatency();
    store.markChatAsRead(fourbasedId, chatId);
  },
};
