import type { Account, AccountEmoji } from './types';
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

const CACHE_KEY = 'accounts_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface AccountsCache {
  data: Account[];
  timestamp: number;
  teamId: number;
}

// In-memory cache for the current session (avoids localStorage parse overhead)
let memoryCache: AccountsCache | null = null;

function readCache(teamId: number): Account[] | null {
  if (memoryCache && memoryCache.teamId === teamId && Date.now() - memoryCache.timestamp < CACHE_TTL_MS) {
    return memoryCache.data;
  }
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: AccountsCache = JSON.parse(raw);
    if (parsed.teamId !== teamId || Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
    memoryCache = parsed;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(teamId: number, data: Account[]) {
  const entry: AccountsCache = { data, timestamp: Date.now(), teamId };
  memoryCache = entry;
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(entry)); } catch { /* quota exceeded */ }
}

export function invalidateAccountsCache() {
  memoryCache = null;
  localStorage.removeItem(CACHE_KEY);
}

export const accountsApi = {
  async getAccounts(force = false): Promise<Account[]> {
    const teamId = getTeamId();
    if (!force) {
      const cached = readCache(teamId);
      if (cached) return cached;
    }

    const response = await fourbasedFetch(`${getApiUrl()}/teams/${teamId}/fourbased-users`);

    if (!response.ok) {
      throw new Error('Failed to fetch accounts');
    }

    const raw = await response.json();
    const accounts: Account[] = raw?.data?.accounts ?? [];
    writeCache(teamId, accounts);
    return accounts;
  },

  async getAccount(fourbasedId: string): Promise<Account> {
    const list = await accountsApi.getAccounts();
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

  async getAccountEmojis(fourbasedId: string): Promise<AccountEmoji[]> {
    const response = await fourbasedFetch(
      `${getApiUrl()}/teams/${getTeamId()}/fourbased-users/${fourbasedId}/account-emojis`,
    );
    if (!response.ok) throw new Error('Failed to fetch account emojis');
    const raw = await response.json();
    return raw?.data?.data ?? raw?.data ?? [];
  },

  async createAccountEmoji(fourbasedId: string, emoji: string): Promise<AccountEmoji> {
    const response = await fourbasedFetch(
      `${getApiUrl()}/teams/${getTeamId()}/fourbased-users/${fourbasedId}/account-emojis`,
      { method: 'POST', body: JSON.stringify({ emoji }) },
    );
    if (!response.ok) throw new Error('Failed to create emoji');
    const raw = await response.json();
    return raw?.data?.data ?? raw?.data ?? raw;
  },

  async updateAccountEmoji(fourbasedId: string, id: number, emoji: string): Promise<AccountEmoji> {
    const response = await fourbasedFetch(
      `${getApiUrl()}/teams/${getTeamId()}/fourbased-users/${fourbasedId}/account-emojis/${id}`,
      { method: 'PUT', body: JSON.stringify({ emoji }) },
    );
    if (!response.ok) throw new Error('Failed to update emoji');
    const raw = await response.json();
    return raw?.data?.data ?? raw?.data ?? raw;
  },

  async deleteAccountEmoji(fourbasedId: string, id: number): Promise<void> {
    const response = await fourbasedFetch(
      `${getApiUrl()}/teams/${getTeamId()}/fourbased-users/${fourbasedId}/account-emojis/${id}`,
      { method: 'DELETE' },
    );
    if (!response.ok) throw new Error('Failed to delete emoji');
  },


  async refreshAccount(fourbasedId: string): Promise<Account> {
    const teamId = getTeamId();
    const response = await fourbasedFetch(
      `${getApiUrl()}/teams/${teamId}/fourbased-users/${fourbasedId}/refresh`,
      { method: 'POST' },
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message ?? 'Failed to refresh account');
    }
    const raw = await response.json();
    const updated: Account = raw?.data?.account ?? raw?.data ?? raw;

    // Update the cached account in place
    if (memoryCache) {
      memoryCache.data = memoryCache.data.map((a) =>
        a.fourbased_id === fourbasedId ? { ...a, ...updated } : a,
      );
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(memoryCache)); } catch { /* quota */ }
    }

    return updated;
  },

  async addAccount(email: string, password: string): Promise<void> {
    const response = await fourbasedFetch(`${getApiUrl()}/4based/store/credentials`, {
      method: 'POST',
      body: JSON.stringify({ team_id: getTeamId(), email, password }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message ?? 'Failed to add account');
    }
  },
};
