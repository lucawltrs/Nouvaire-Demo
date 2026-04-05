import { getConfig } from '../../../lib/config';

export interface GroupTeamUser {
  id: number;
  user_id: number;
  team_id: number;
  role: string;
  team_group_id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export interface Group {
  id: number;
  name: string;
  description: string | null;
  team_id: number;
  team_users: GroupTeamUser[];
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
}

const getApiUrl = () => getConfig().API_URL;

const groupsFetch = async (url: string, options: RequestInit = {}) => {
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

export const groupsApi = {
  async list(): Promise<Group[]> {
    const response = await groupsFetch(`${getApiUrl()}/teams/${getTeamId()}/groups`);
    if (!response.ok) throw new Error('Failed to fetch groups');
    const raw = await response.json();
    return raw?.message ?? [];
  },

  async create(payload: CreateGroupPayload): Promise<Group> {
    const response = await groupsFetch(`${getApiUrl()}/teams/${getTeamId()}/groups`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to create group');
    const raw = await response.json();
    return raw?.group ?? raw;
  },

  async assignMember(groupId: number, teamUserId: number): Promise<void> {
    const response = await groupsFetch(
      `${getApiUrl()}/teams/${getTeamId()}/groups/${groupId}/members`,
      { method: 'POST', body: JSON.stringify({ team_user_id: teamUserId }) },
    );
    if (!response.ok) throw new Error('Failed to assign member');
  },

  async removeMember(groupId: number, teamUserId: number): Promise<void> {
    const response = await groupsFetch(
      `${getApiUrl()}/teams/${getTeamId()}/groups/${groupId}/members/${teamUserId}`,
      { method: 'DELETE' },
    );
    if (!response.ok) throw new Error('Failed to remove member');
  },
};
