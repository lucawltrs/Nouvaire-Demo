import { getConfig } from '../../../lib/config';

export interface TeamMember {
  id: number;
  user_id: number;
  team_id: number;
  role: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  team: {
    id: number;
    name: string;
    slug: string;
    description: string;
  };
}

const getApiUrl = () => getConfig().API_URL;

const teamFetch = async (url: string, options: RequestInit = {}) => {
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

export interface RegisterMemberPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export const teamApi = {
  async getMembers(): Promise<TeamMember[]> {
    const response = await teamFetch(`${getApiUrl()}/teams/${getTeamId()}/members`);
    if (!response.ok) throw new Error('Failed to fetch team members');
    const raw = await response.json();
    return raw?.members ?? [];
  },

  async registerMember(payload: RegisterMemberPayload): Promise<void> {
    const response = await teamFetch(
      `${getApiUrl()}/teams/${getTeamId()}/members/register`,
      { method: 'POST', body: JSON.stringify(payload) },
    );
    const json = await response.json().catch(() => null);
    if (!response.ok || json?.status === 'error') {
      throw new Error(json?.message ?? 'Failed to register member');
    }
  },
};
