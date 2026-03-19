import type { Account } from './types';
import { getConfig } from '../../lib/config';

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

export const accountsApi = {
  async getAccounts(): Promise<Account[]> {
    const response = await fourbasedFetch(`${getApiUrl()}/4based/users`);

    if (!response.ok) {
      throw new Error('Failed to fetch accounts');
    }

    const raw = await response.json();
    // Handle both { data: [...] } and a bare array response
    return (Array.isArray(raw) ? raw : raw?.data) ?? [];
  },

  async getAccount(fourbasedId: string): Promise<Account> {
    // Try a dedicated single-account endpoint first; fall back to finding in the list
    const listResponse = await fourbasedFetch(`${getApiUrl()}/4based/users`);

    if (!listResponse.ok) {
      throw new Error('Failed to fetch accounts');
    }

    const raw = await listResponse.json();
    const list: Account[] = (Array.isArray(raw) ? raw : raw?.data) ?? [];
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
