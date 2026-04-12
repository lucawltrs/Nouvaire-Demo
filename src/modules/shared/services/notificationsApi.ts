import { getConfig } from '../../../lib/config';

export interface NotificationSettings {
  id: number;
  team_id: number;
  discord_webhook_url: string | null;
  work_sessions_enabled: boolean;
  unread_messages_enabled: boolean;
  unread_messages_threshold_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateNotificationSettingsPayload {
  discord_webhook_url?: string | null;
  work_sessions_enabled?: boolean;
  unread_messages_enabled?: boolean;
  unread_messages_threshold_minutes?: number;
}

const getApiUrl = () => getConfig().API_URL;

const notifyFetch = async (url: string, options: RequestInit = {}) => {
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

export const notificationsApi = {
  async get(): Promise<NotificationSettings> {
    const response = await notifyFetch(
      `${getApiUrl()}/teams/${getTeamId()}/notification-settings`,
    );
    if (!response.ok) throw new Error('Failed to fetch notification settings');
    const raw = await response.json();
    return raw?.message ?? raw?.data ?? raw;
  },

  async update(payload: UpdateNotificationSettingsPayload): Promise<NotificationSettings> {
    const response = await notifyFetch(
      `${getApiUrl()}/teams/${getTeamId()}/notification-settings`,
      { method: 'PUT', body: JSON.stringify(payload) },
    );
    const json = await response.json().catch(() => null);
    if (!response.ok || json?.status === 'error') {
      throw new Error(json?.message ?? 'Failed to update notification settings');
    }
    return json?.data ?? json;
  },
};
