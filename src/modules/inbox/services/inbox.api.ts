import type { InboxAccount, InboxApiResponse, InboxQueryParams, ChatSearchParams, ChatListItem, PivotData, PredefinedText, ConfiguredMessage, ConfiguredMessageCategory, AccountInfo } from '../types';

const getTeamId = (): number => {
  const match = document.cookie.match(/(?:^|; )auth_team=([^;]*)/);
  if (!match) throw new Error('No team found in cookie');
  return JSON.parse(decodeURIComponent(match[1])).team_id;
};
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

  async searchChats(params: ChatSearchParams = {}): Promise<ChatListItem[]> {
    const { query, limit = 60, offset = 0, list_names, fourbased_id } = params;
    const queryParams = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
      ...(query ? { query } : {}),
      ...(list_names ? { list_names } : {}),
      ...(fourbased_id ? { fourbased_id } : {}),
    });
    const response = await fourbasedFetch(`${getApiUrl()}/4based/chats/search?${queryParams}`);
    if (!response.ok) {
      throw new Error(`Failed to search chats: ${response.status}`);
    }
    const raw = await response.json();
    if (Array.isArray(raw)) return raw as ChatListItem[];
    if (Array.isArray(raw?.data)) return raw.data as ChatListItem[];
    return [];
  },

  async getChatById(fourbased_id: string, chat_id: string): Promise<ChatListItem | null> {
    try {
      const queryParams = new URLSearchParams({ fourbased_id, chat_id });
      const response = await fourbasedFetch(`${getApiUrl()}/4based/chats/by-id?${queryParams}`);
      if (!response.ok) return null;
      const raw = await response.json();
      const item = raw?.data ?? raw;
      if (item && item.chat_id) return item as ChatListItem;
      return null;
    } catch {
      return null;
    }
  },

  async getAccounts(): Promise<InboxAccount[]> {
    const response = await fourbasedFetch(`${getApiUrl()}/teams/${getTeamId()}/fourbased-users`);
    if (!response.ok) {
      throw new Error(`Failed to fetch accounts: ${response.status}`);
    }
    const raw = await response.json();
    return (raw?.data?.accounts ?? []) as InboxAccount[];
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

  async getPivot(fourbasedId: string, customerId: string, chatId?: string): Promise<PivotData> {
    const params = chatId ? `?chat_id=${chatId}` : '';
    const response = await fourbasedFetch(`${getApiUrl()}/4based/users/${fourbasedId}/pivot/${customerId}${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch pivot: ${response.status}`);
    }
    const raw = await response.json();
    const base: PivotData = raw?.response ?? raw;
    if (raw?.price_override != null && base?.price_override == null) {
      base.price_override = raw.price_override;
    }
    return base;
  },

  async updatePriceOverride(fourbasedId: string, chatId: string, messagePriceCents: number): Promise<void> {
    const response = await fourbasedFetch(`${getApiUrl()}/4based/users/${fourbasedId}/chats/${chatId}/price-override`, {
      method: 'PUT',
      body: JSON.stringify({ message_price: messagePriceCents }),
    });
    if (!response.ok) {
      throw new Error(`Failed to update price override: ${response.status}`);
    }
  },

  async updatePivot(fourbasedId: string, customerId: string, data: { alias?: string; note?: string }): Promise<PivotData> {
    const response = await fourbasedFetch(`${getApiUrl()}/4based/users/${fourbasedId}/pivot/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to update pivot: ${response.status}`);
    }
    const text = await response.text();
    const raw = text ? JSON.parse(text) : {};
    return raw?.response ?? raw;
  },

  // ── Configured Messages ──────────────────────────────────────────────────────

  async getConfiguredMessages(fourbasedUserId: string): Promise<ConfiguredMessage[]> {
    const teamId = getTeamId();
    const response = await fourbasedFetch(`${getApiUrl()}/teams/${teamId}/fourbased-users/${fourbasedUserId}/configured-messages`);
    if (!response.ok) throw new Error(`Failed to fetch configured messages: ${response.status}`);
    const raw = await response.json();
    return Array.isArray(raw) ? raw : (raw?.data?.messages ?? raw?.data ?? []);
  },

  async createConfiguredMessage(fourbasedUserId: string, data: { message: string; name?: string; category_id?: string | null; file_stack_id?: string | null }): Promise<ConfiguredMessage> {
    const teamId = getTeamId();
    const response = await fourbasedFetch(`${getApiUrl()}/teams/${teamId}/fourbased-users/${fourbasedUserId}/configured-messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to create configured message: ${response.status}`);
    const raw = await response.json();
    return raw?.data?.message ?? raw?.data ?? raw;
  },

  async updateConfiguredMessage(fourbasedUserId: string, msgId: string, data: { message: string; name?: string; category_id?: string | null; file_stack_id?: string | null }): Promise<ConfiguredMessage> {
    const teamId = getTeamId();
    const response = await fourbasedFetch(`${getApiUrl()}/teams/${teamId}/fourbased-users/${fourbasedUserId}/configured-messages/${msgId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to update configured message: ${response.status}`);
    const raw = await response.json();
    return raw?.data?.message ?? raw?.data ?? raw;
  },

  async deleteConfiguredMessage(fourbasedUserId: string, msgId: string): Promise<void> {
    const teamId = getTeamId();
    const response = await fourbasedFetch(`${getApiUrl()}/teams/${teamId}/fourbased-users/${fourbasedUserId}/configured-messages/${msgId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`Failed to delete configured message: ${response.status}`);
  },

  async updateConfiguredMessageMeta(fourbasedUserId: string, msgId: string, data: { category_id?: number | null; notes?: string; sort_order?: number }): Promise<void> {
    const teamId = getTeamId();
    const response = await fourbasedFetch(`${getApiUrl()}/teams/${teamId}/fourbased-users/${fourbasedUserId}/configured-messages/${msgId}/meta`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to update configured message meta: ${response.status}`);
  },

  // ── Configured Message Categories ────────────────────────────────────────────

  async getConfiguredMessageCategories(fourbased_id: string): Promise<ConfiguredMessageCategory[]> {
    const teamId = getTeamId();
    const query = new URLSearchParams({ fourbased_id });
    const response = await fourbasedFetch(`${getApiUrl()}/teams/${teamId}/configured-message-categories?${query}`);
    if (!response.ok) throw new Error(`Failed to fetch categories: ${response.status}`);
    const raw = await response.json();
    return Array.isArray(raw) ? raw : (raw?.data?.categories ?? raw?.data ?? []);
  },

  async createConfiguredMessageCategory(fourbased_id: string, data: { name: string; color?: string }): Promise<ConfiguredMessageCategory> {
    const teamId = getTeamId();
    const response = await fourbasedFetch(`${getApiUrl()}/teams/${teamId}/configured-message-categories`, {
      method: 'POST',
      body: JSON.stringify({ ...data, fourbased_id }),
    });
    if (!response.ok) throw new Error(`Failed to create category: ${response.status}`);
    const raw = await response.json();
    return raw?.data?.category ?? raw?.data ?? raw;
  },

  async updateConfiguredMessageCategory(fourbased_id: string, categoryId: number, data: { name: string; color?: string }): Promise<ConfiguredMessageCategory> {
    const teamId = getTeamId();
    const response = await fourbasedFetch(`${getApiUrl()}/teams/${teamId}/configured-message-categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, fourbased_id }),
    });
    if (!response.ok) throw new Error(`Failed to update category: ${response.status}`);
    const raw = await response.json();
    return raw?.data?.category ?? raw?.data ?? raw;
  },

  async deleteConfiguredMessageCategory(fourbased_id: string, categoryId: number): Promise<void> {
    const teamId = getTeamId();
    const query = new URLSearchParams({ fourbased_id });
    const response = await fourbasedFetch(`${getApiUrl()}/teams/${teamId}/configured-message-categories/${categoryId}?${query}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`Failed to delete category: ${response.status}`);
  },

  // ── Account Info ─────────────────────────────────────────────────────────────

  async getAccountInfo(fourbasedUserId: string): Promise<AccountInfo | null> {
    const teamId = getTeamId();
    const response = await fourbasedFetch(`${getApiUrl()}/teams/${teamId}/fourbased-users/${fourbasedUserId}/account-info`);
    if (!response.ok) throw new Error(`Failed to fetch account info: ${response.status}`);
    const raw = await response.json();
    return raw?.data?.account_info ?? null;
  },

  async createAccountInfo(fourbasedUserId: string, data: Omit<AccountInfo, 'id' | 'fourbased_user_id' | 'created_at' | 'updated_at'>): Promise<AccountInfo> {
    const teamId = getTeamId();
    const response = await fourbasedFetch(`${getApiUrl()}/teams/${teamId}/fourbased-users/${fourbasedUserId}/account-info`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to create account info: ${response.status}`);
    const raw = await response.json();
    return raw?.data?.account_info ?? raw;
  },

  async updateAccountInfo(fourbasedUserId: string, data: Omit<AccountInfo, 'id' | 'fourbased_user_id' | 'created_at' | 'updated_at'>): Promise<AccountInfo> {
    const teamId = getTeamId();
    const response = await fourbasedFetch(`${getApiUrl()}/teams/${teamId}/fourbased-users/${fourbasedUserId}/account-info`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Failed to update account info: ${response.status}`);
    const raw = await response.json();
    return raw?.data?.account_info ?? raw;
  },
};
