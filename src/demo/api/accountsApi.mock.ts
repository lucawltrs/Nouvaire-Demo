import type { Account, AccountEmoji } from '../../modules/accounts/types';
import { store } from '../store';
import { fakeLatency } from '../utils';

export const accountsApi = {
  async getAccounts(): Promise<Account[]> {
    await fakeLatency();
    return store.getAccounts();
  },

  async getAccount(fourbasedId: string): Promise<Account> {
    await fakeLatency();
    const account = store.getAccount(fourbasedId);
    if (!account) throw new Error('Account not found');
    return account;
  },

  async syncAll(): Promise<void> {
    await fakeLatency();
    store.syncAllAccounts();
  },

  async getAccountEmojis(fourbasedId: string): Promise<AccountEmoji[]> {
    await fakeLatency();
    return store.getAccountEmojis(fourbasedId);
  },

  async createAccountEmoji(fourbasedId: string, emoji: string): Promise<AccountEmoji> {
    await fakeLatency();
    return store.createAccountEmoji(fourbasedId, emoji);
  },

  async updateAccountEmoji(fourbasedId: string, id: number, emoji: string): Promise<AccountEmoji> {
    await fakeLatency();
    const updated = store.updateAccountEmoji(fourbasedId, id, emoji);
    if (!updated) throw new Error('Failed to update emoji');
    return updated;
  },

  async deleteAccountEmoji(fourbasedId: string, id: number): Promise<void> {
    await fakeLatency();
    store.deleteAccountEmoji(fourbasedId, id);
  },

  async refreshAccount(fourbasedId: string): Promise<Account> {
    await fakeLatency();
    const updated = store.refreshAccount(fourbasedId);
    if (!updated) throw new Error('Failed to refresh account');
    return updated;
  },

  async addAccount(email: string): Promise<void> {
    await fakeLatency();
    store.addAccount(email);
  },
};

/** No-op in DEMO_MODE — the demo store never persists an accounts cache. */
export function invalidateAccountsCache(): void {}
