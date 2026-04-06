import { getConfig } from '../../../lib/config';

interface StartWorkSessionResponse {
  started_at: string;
  id: number;
}

export interface WorkSession {
  id: number;
  team_user_id: number;
  started_at: string;
  ended_at: string | null;
  duration: number | null;
  created_at: string;
  updated_at: string;
}

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

export async function getWorkSessionsForUser(userId: number): Promise<WorkSession[]> {
  const res = await apiFetch(
    `${getConfig().API_URL}/members/${userId}/work-sessions`,
  );
  const raw = await res.json();
  return raw?.message ?? [];
}

export async function postStartWorkSession(startedAt: string, token: string): Promise<StartWorkSessionResponse> {
  const response = await fetch(`${getConfig().API_URL}/work-sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ started_at: startedAt }),
  });

  const json = await response.json();

  if (!response.ok || json?.status === 'error') {
    throw new Error(json?.message ?? 'Failed to start work session');
  }

  return {
    started_at: json.message?.started_at ?? startedAt,
    id: json.message?.id ?? 0,
  };
}

export async function putEndWorkSession(id: number, endedAt: string, token: string): Promise<void> {
  const response = await fetch(`${getConfig().API_URL}/work-sessions/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ended_at: endedAt }),
  });

  if (!response.ok) {
    throw new Error('Failed to end work session');
  }
}

export async function postAdminEndWorkSession(
  id: number,
  adminNote: string,
  endedAt: string,
  token: string,
): Promise<void> {
  const response = await fetch(`${getConfig().API_URL}/work-sessions/${id}/admin-end`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ admin_note: adminNote, ended_at: endedAt }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }
}
