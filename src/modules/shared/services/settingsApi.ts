import { getConfig } from '../../../lib/config';

export interface TeamSettings {
  id: number;
  team_id: number;
  discord_webhook_url: string | null;
  work_sessions_enabled: boolean;
  unread_messages_enabled: boolean;
  unread_messages_threshold_minutes: number | null;
  chatter_percentage: number | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateTeamSettingsPayload {
  discord_webhook_url?: string | null;
  work_sessions_enabled?: boolean;
  unread_messages_enabled?: boolean;
  unread_messages_threshold_minutes?: number;
  chatter_percentage?: number | null;
}

const getApiUrl = () => getConfig().API_URL;

const settingsFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('auth_token');
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
};

const getTeamId = (): number => {
  const match = document.cookie.match(/(?:^|; )auth_team=([^;]*)/);
  if (!match) throw new Error('No team found in cookie');
  return JSON.parse(decodeURIComponent(match[1])).team_id;
};

export const settingsApi = {
  async get(): Promise<TeamSettings> {
    const response = await settingsFetch(
      `${getApiUrl()}/teams/${getTeamId()}/settings`,
    );
    if (!response.ok) throw new Error('Failed to fetch settings');
    const raw = await response.json();
    return raw?.message ?? raw?.data ?? raw;
  },

  async update(payload: UpdateTeamSettingsPayload): Promise<TeamSettings> {
    const response = await settingsFetch(
      `${getApiUrl()}/teams/${getTeamId()}/settings`,
      { method: 'PUT', body: JSON.stringify(payload) },
    );
    const json = await response.json().catch(() => null);
    if (!response.ok || json?.status === 'error') {
      throw new Error(json?.message ?? 'Failed to update settings');
    }
    return json?.data ?? json;
  },
};
