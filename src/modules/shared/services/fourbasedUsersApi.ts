import { getConfig } from '../../../lib/config';

export interface FourBasedUserAssignedTo {
  team_user_id: number;
  user_name: string;
}

export interface FourBasedUser {
  id: number;
  name: string;
  fourbased_id: string;
  identifier: string;
  img_url: string;
  is_online: boolean;
  online_status_dot: string;
  revenue: string;
  followers: number;
  last_activity: string;
  assigned_to: FourBasedUserAssignedTo | null;
}

export interface UpdateFourBasedUserPayload {
  email?: string;
  password?: string;
}

export interface AssignFourBasedUserPayload {
  fourbased_user_id: string;
  team_user_id: number;
}

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

export const fourbasedUsersApi = {
  async list(): Promise<FourBasedUser[]> {
    const res = await apiFetch(`${getBase()}/fourbased-users`);
    const raw = await res.json();
    return raw?.data?.accounts ?? [];
  },

  async update(fourbasedId: string, payload: UpdateFourBasedUserPayload): Promise<FourBasedUser> {
    const res = await apiFetch(`${getBase()}/fourbased-users/${fourbasedId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async delete(fourbasedId: string): Promise<void> {
    await apiFetch(`${getBase()}/fourbased-users/${fourbasedId}`, {
      method: 'DELETE',
    });
  },

  async assign(payload: AssignFourBasedUserPayload): Promise<void> {
    await apiFetch(`${getBase()}/fourbased-users/assign`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async unassign(fourbasedId: string): Promise<void> {
    await apiFetch(`${getBase()}/fourbased-users/${fourbasedId}/unassign`, {
      method: 'DELETE',
    });
  },
};
