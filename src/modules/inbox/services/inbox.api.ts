import type { InboxAccount, InboxApiResponse, InboxQueryParams, PivotData, PredefinedText } from '../types';
import { getConfig } from '../../../lib/config';

const getApiUrl = () => getConfig().API_URL;

const fourbasedFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  return fetch(url, { ...options, headers });
};

export const inboxApi = {
  async getChats(params: InboxQueryParams = {}): Promise<InboxApiResponse> {
    const {
      days = 30,
      filter = 'all',
      limit = 30,
      offset = 0,
      scope = 'all',
      fourbased_id,
    } = params;

    const query = new URLSearchParams({
      days: String(days),
      filter,
      limit: String(limit),
      offset: String(offset),
      scope,
      ...(scope === 'single' && fourbased_id ? { fourbased_id } : {}),
    });

    const response = await fourbasedFetch(`${getApiUrl()}/4based/chats?${query}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch chats: ${response.status}`);
    }

    return response.json() as Promise<InboxApiResponse>;
  },

  async getAccounts(): Promise<InboxAccount[]> {
    const response = await fourbasedFetch(`${getApiUrl()}/4based/users`);
    if (!response.ok) {
      throw new Error(`Failed to fetch accounts: ${response.status}`);
    }
    return response.json() as Promise<InboxAccount[]>;
  },

  async markChatAsRead(fourbasedId: string, chatId: string): Promise<void> {
    const url = `${getApiUrl()}/4based/users/${fourbasedId}/chats/${chatId}/update-messages-status-received`;
    const response = await fourbasedFetch(url, { method: 'PUT' });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to mark as read: ${response.status} - ${text}`);
    }
  },

  async getPredefinedTexts(fourbasedId: string): Promise<PredefinedText[]> {
    const response = await fourbasedFetch(`${getApiUrl()}/4based/users/${fourbasedId}/predefined-texts`);
    if (!response.ok) {
      throw new Error(`Failed to fetch predefined texts: ${response.status}`);
    }
    const raw = await response.json();
    return Array.isArray(raw) ? raw : (raw?.data ?? []);
  },

  async getPivot(fourbasedId: string, customerId: string): Promise<PivotData> {
    const response = await fourbasedFetch(`${getApiUrl()}/4based/users/${fourbasedId}/pivot/${customerId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch pivot: ${response.status}`);
    }
    const raw = await response.json();
    return raw?.response ?? raw;
  },

  async updatePivot(fourbasedId: string, customerId: string, data: { alias?: string; note?: string }): Promise<PivotData> {
    const response = await fourbasedFetch(`${getApiUrl()}/4based/users/${fourbasedId}/pivot/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to update pivot: ${response.status}`);
    }
    const raw = await response.json();
    return raw?.response ?? raw;
  },
};
