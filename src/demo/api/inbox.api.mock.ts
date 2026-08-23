import type {
  InboxAccount,
  InboxApiResponse,
  InboxQueryParams,
  ChatSearchParams,
  ChatListItem,
  PivotData,
  ConfiguredMessage,
  ConfiguredMessageCategory,
  AccountInfo,
} from '../../modules/inbox/types';
import { store } from '../store';
import { fakeLatency } from '../utils';

export const inboxApi = {
  async getChats(params: InboxQueryParams = {}): Promise<InboxApiResponse> {
    await fakeLatency();
    const { days, filter, limit, offset, scope, fourbased_id } = params;
    return store.buildInboxResponse({
      days,
      filter,
      limit,
      offset,
      fourbasedId: scope === 'single' ? fourbased_id : undefined,
    });
  },

  async searchChats(params: ChatSearchParams = {}): Promise<ChatListItem[]> {
    const result = await this.searchChatsPaginated(params);
    return result.items;
  },

  async searchChatsPaginated(params: ChatSearchParams = {}): Promise<{ items: ChatListItem[]; hasMore: boolean; total?: number }> {
    await fakeLatency();
    const { query, limit, offset, list_names, fourbased_id } = params;
    return store.searchChats({ query, limit, offset, list_names, fourbasedId: fourbased_id });
  },

  async getChatById(fourbased_id: string, chat_id: string): Promise<ChatListItem | null> {
    await fakeLatency();
    return store.getChatById(fourbased_id, chat_id);
  },

  async getAccounts(): Promise<InboxAccount[]> {
    await fakeLatency();
    return store.getInboxAccounts();
  },

  async markChatAsRead(fourbasedId: string, chatId: string): Promise<void> {
    await fakeLatency();
    store.markChatAsRead(fourbasedId, chatId);
  },

  async getPivot(fourbasedId: string, customerId: string, chatId?: string): Promise<PivotData> {
    await fakeLatency();
    const pivot = store.getPivot(fourbasedId, customerId, chatId);
    if (!pivot) throw new Error('Failed to fetch pivot: 404');
    return pivot;
  },

  async updatePriceOverride(fourbasedId: string, chatId: string, messagePriceCents: number): Promise<void> {
    await fakeLatency();
    store.updatePriceOverride(fourbasedId, chatId, messagePriceCents);
  },

  async updatePivot(fourbasedId: string, customerId: string, data: { alias?: string; note?: string }): Promise<PivotData> {
    await fakeLatency();
    const pivot = store.updatePivot(fourbasedId, customerId, data);
    if (!pivot) throw new Error('Failed to update pivot: 404');
    return pivot;
  },

  // ── Configured Messages ──────────────────────────────────────────────────
  async getConfiguredMessages(fourbasedUserId: string): Promise<ConfiguredMessage[]> {
    await fakeLatency();
    return store.getConfiguredMessages(fourbasedUserId);
  },

  async createConfiguredMessage(fourbasedUserId: string, data: { message: string; name?: string; category_id?: string | null; file_stack_id?: string | null }): Promise<ConfiguredMessage> {
    await fakeLatency();
    return store.createConfiguredMessage(fourbasedUserId, data);
  },

  async updateConfiguredMessage(fourbasedUserId: string, msgId: string, data: { message: string; name?: string; category_id?: string | null; file_stack_id?: string | null }): Promise<ConfiguredMessage> {
    await fakeLatency();
    return store.updateConfiguredMessage(fourbasedUserId, msgId, data);
  },

  async deleteConfiguredMessage(fourbasedUserId: string, msgId: string): Promise<void> {
    await fakeLatency();
    store.deleteConfiguredMessage(fourbasedUserId, msgId);
  },

  async updateConfiguredMessageMeta(fourbasedUserId: string, msgId: string, data: { category_id?: number | null; notes?: string; sort_order?: number }): Promise<void> {
    await fakeLatency();
    store.updateConfiguredMessageMeta(fourbasedUserId, msgId, data);
  },

  // ── Configured Message Categories ────────────────────────────────────────
  async getConfiguredMessageCategories(fourbased_id: string): Promise<ConfiguredMessageCategory[]> {
    await fakeLatency();
    return store.getConfiguredMessageCategories(fourbased_id);
  },

  async createConfiguredMessageCategory(fourbased_id: string, data: { name: string; color?: string }): Promise<ConfiguredMessageCategory> {
    await fakeLatency();
    return store.createConfiguredMessageCategory(fourbased_id, data);
  },

  async updateConfiguredMessageCategory(fourbased_id: string, categoryId: number, data: { name: string; color?: string }): Promise<ConfiguredMessageCategory> {
    await fakeLatency();
    return store.updateConfiguredMessageCategory(fourbased_id, categoryId, data);
  },

  async deleteConfiguredMessageCategory(fourbased_id: string, categoryId: number): Promise<void> {
    await fakeLatency();
    store.deleteConfiguredMessageCategory(fourbased_id, categoryId);
  },

  // ── Account Info ──────────────────────────────────────────────────────────
  async getAccountInfo(fourbasedUserId: string): Promise<AccountInfo | null> {
    await fakeLatency();
    return store.getAccountInfo(fourbasedUserId);
  },

  async createAccountInfo(fourbasedUserId: string, data: Omit<AccountInfo, 'id' | 'fourbased_user_id' | 'created_at' | 'updated_at'>): Promise<AccountInfo> {
    await fakeLatency();
    return store.saveAccountInfo(fourbasedUserId, data);
  },

  async updateAccountInfo(fourbasedUserId: string, data: Omit<AccountInfo, 'id' | 'fourbased_user_id' | 'created_at' | 'updated_at'>): Promise<AccountInfo> {
    await fakeLatency();
    return store.saveAccountInfo(fourbasedUserId, data);
  },
};
