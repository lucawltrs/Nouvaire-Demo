import { getConfig } from '../../../lib/config';

export interface PushSubscribePayload {
  endpoint: string;
  public_key: string;
  auth_token: string;
  team_id: number;
  user_agent: string;
}

const getApiUrl = () => getConfig().API_URL;

const pushFetch = async (url: string, options: RequestInit = {}) => {
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

export const pushApi = {
  async getVapidPublicKey(): Promise<string> {
    const response = await fetch(`${getApiUrl()}/push/vapid-public-key`);
    if (!response.ok) throw new Error('Failed to fetch VAPID public key');
    const raw = await response.json();
    return (raw?.message ?? raw?.data ?? raw).public_key;
  },

  async subscribe(payload: PushSubscribePayload): Promise<void> {
    const response = await pushFetch(`${getApiUrl()}/push/subscribe`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const json = await response.json().catch(() => null);
    if (!response.ok || json?.status === 'error') {
      throw new Error(json?.message ?? 'Failed to subscribe to push notifications');
    }
  },

  async unsubscribe(endpoint: string): Promise<void> {
    const response = await pushFetch(`${getApiUrl()}/push/unsubscribe`, {
      method: 'DELETE',
      body: JSON.stringify({ endpoint }),
    });
    const json = await response.json().catch(() => null);
    if (!response.ok || json?.status === 'error') {
      throw new Error(json?.message ?? 'Failed to unsubscribe from push notifications');
    }
  },
};
