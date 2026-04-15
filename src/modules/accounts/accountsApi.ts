import type { Account } from './types';
import { getConfig } from '../../lib/config';

const getApiUrl = () => getConfig().API_URL;

const getTeamId = (): number => {
  const match = document.cookie.match(/(?:^|; )auth_team=([^;]*)/);
  if (!match) throw new Error('No team found in cookie');
  const team = JSON.parse(decodeURIComponent(match[1]));
  return team.team_id;
};

const fourbasedFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('auth_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  return fetch(url, { ...options, headers });
};

let accountsCache: Account[] | null = null;

export const accountsApi = {
  async getAccounts(): Promise<Account[]> {
    const response = await fourbasedFetch(`${getApiUrl()}/teams/${getTeamId()}/fourbased-users`);

    if (!response.ok) {
      throw new Error('Failed to fetch accounts');
    }

    const raw = await response.json();
    const accounts: Account[] = raw?.data?.accounts ?? [];
    accountsCache = accounts;
    return accounts;
  },

  async getAccount(fourbasedId: string): Promise<Account> {
    const list = accountsCache ?? await accountsApi.getAccounts();
    const account = list.find((a) => a.fourbased_id === fourbasedId);

    if (!account) {
      throw new Error('Account not found');
    }

    return account;
  },

  async syncAll(): Promise<void> {
    const response = await fourbasedFetch(`${getApiUrl()}/4based/bulk/login`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to sync accounts');
    }
  },

   async addAccount(email: string, password: string): Promise<void> {
    const response = await fourbasedFetch(`${getApiUrl()}/4based/store/credentials`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message ?? 'Failed to add account');
    }
  },
};
