import { getConfig } from '../../lib/config';
import type { CreateMassMessagePayload, MassMessage, MassMessagesListParams, MassMessagesListResponse, UserList } from './types';

const getApiUrl = () => getConfig().API_URL;

const getTeamId = (): number => {
  const match = document.cookie.match(/(?:^|; )auth_team=([^;]*)/);
  if (!match) throw new Error('No team found in cookie');
  return JSON.parse(decodeURIComponent(match[1])).team_id;
};

const getBase = () => `${getApiUrl()}/teams/${getTeamId()}`;

const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }
  return response;
};

export const massMessagesApi = {
  async list(fourbasedId: string, params: MassMessagesListParams = {}): Promise<MassMessagesListResponse> {
    const query = new URLSearchParams();
    if (params.offset !== undefined) query.set('offset', String(params.offset));
    if (params.limit !== undefined) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);
    const qs = query.toString();
    const url = `${getBase()}/fourbased-users/${fourbasedId}/mass-messages${qs ? `?${qs}` : ''}`;
    const res = await apiFetch(url);
    const raw = await res.json();
    return {
      messages: raw?.data?.messages ?? [],
      count: raw?.data?.count ?? 0,
      offset: raw?.data?.offset ?? 0,
      limit: raw?.data?.limit ?? 20,
    };
  },

  async create(fourbasedId: string, payload: CreateMassMessagePayload): Promise<MassMessage> {
    const res = await apiFetch(`${getBase()}/fourbased-users/${fourbasedId}/mass-messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const raw = await res.json();
    return raw?.data?.mass_message;
  },

  async delete(fourbasedId: string, massMessageId: string): Promise<void> {
    await apiFetch(`${getBase()}/fourbased-users/${fourbasedId}/mass-messages/${massMessageId}`, {
      method: 'DELETE',
    });
  },

  async getUserLists(fourbasedId: string): Promise<UserList[]> {
    const res = await apiFetch(`${getBase()}/fourbased-users/${fourbasedId}/user-lists`);
    const raw = await res.json();
    return raw?.data?.user_lists ?? [];
  },
};
