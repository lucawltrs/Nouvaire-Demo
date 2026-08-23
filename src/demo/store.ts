import type { Account, AccountEmoji } from '../modules/accounts/types';
import type {
  ChatListItem,
  InboxAccount,
  InboxApiResponse,
  InboxFilter,
  PivotData,
  ConfiguredMessage,
  ConfiguredMessageCategory,
  AccountInfo,
} from '../modules/inbox/types';
import type { CloudAsset, CloudUser } from '../modules/cloud/types';
import type { FourBasedChatMessage, FourBasedFileStack, RevenueForecastResult } from '../modules/4based/services/4based.api.real';
import type { MassMessage, CreateMassMessagePayload, UserList } from '../modules/mass-messages/types';
import type { FourBasedUser } from '../modules/shared/services/fourbasedUsersApi.real';
import type { Group } from '../modules/shared/services/groupsApi.real';
import type { TeamMember } from '../modules/shared/services/teamApi.real';
import type { TeamSettings, UpdateTeamSettingsPayload } from '../modules/shared/services/settingsApi.real';
import type {
  ActiveWorkSession,
  WorkSession,
  SessionOverview,
  SessionOverviewSession,
} from '../modules/work-sessions/services/workSession.api.real';
import type { NotificationsResponse } from '../modules/notifications/types';
import type { DashboardApiResponse } from '../modules/dashboard/types';
import type { DemoChat } from './types';
import { buildDemoSnapshot, type DemoSnapshot } from './seed';
import { DEMO_ACCOUNT_DETAILS } from './seed/accounts';
import { DEMO_USER } from './seed/auth';
import { generateId, pickRandom, randomInt } from './utils';

const FAN_REPLIES = [
  'Omg thank you! 😍',
  "You're the best, appreciate you!",
  'Just sent, let me know when you get it 💸',
  "Can't wait to see more!",
  'Definitely worth it 🔥',
];

let state: DemoSnapshot = buildDemoSnapshot();

// ── helpers ──────────────────────────────────────────────────────────────

function findChat(fourbasedId: string, chatId: string): DemoChat | undefined {
  return state.chats[fourbasedId]?.find((c) => c.chat_id === chatId);
}

function findChatByCustomer(fourbasedId: string, customerId: string): DemoChat | undefined {
  return state.chats[fourbasedId]?.find((c) => c.customer_id === customerId);
}

/**
 * Single source of truth for "is this chat unread / needs a reply": true iff
 * there are inbound (customer) messages since the chat was last read. Never
 * derive this any other way — `unread_count` is the only stored state, kept
 * consistent by `markChatAsRead` (→ 0), `sendMessage` (creator reply → 0),
 * and new inbound messages (→ +1).
 */
function chatIsUnread(chat: DemoChat): boolean {
  return chat.unread_count > 0;
}

function accountName(fourbasedId: string): { name?: string; img_url?: string } {
  const account = state.accounts.find((a) => a.fourbased_id === fourbasedId);
  return { name: account?.name, img_url: account?.img_url ?? undefined };
}

function toChatListItem(chat: DemoChat): ChatListItem {
  const last = chat.messages[chat.messages.length - 1];
  const account = accountName(chat.fourbased_id);
  return {
    chat_id: chat.chat_id,
    fourbased_id: chat.fourbased_id,
    customer_id: chat.customer_id,
    customer_name: chat.customer_name,
    customer_avatar_url: chat.customer_avatar_url,
    account_name: account.name,
    account_img_url: account.img_url,
    last_message_preview: last?.message ?? '',
    last_message_at: last?.created_at ?? '',
    unread_count: chat.unread_count,
    is_unread: chatIsUnread(chat),
    sales_volume: chat.sales_volume,
    customer_is_online: chat.customer_is_online,
  };
}

function allChats(): DemoChat[] {
  return Object.values(state.chats).flat();
}

function fileStackRegistry(): Map<string, FourBasedFileStack> {
  return fileStacks;
}

// In-memory registry of file stacks created via createFileStack, so that
// sendChatMessage can embed the right description/price/type into the
// message it appends to the chat.
const fileStacks = new Map<string, FourBasedFileStack>();

// ── store ────────────────────────────────────────────────────────────────

export const store = {
  // ── Accounts ──────────────────────────────────────────────────────────
  getAccounts(): Account[] {
    return state.accounts;
  },

  getAccount(fourbasedId: string): Account | undefined {
    return state.accounts.find((a) => a.fourbased_id === fourbasedId);
  },

  syncAllAccounts(): void {
    state.accounts = state.accounts.map((a) => ({
      ...a,
      last_activity: 'Gerade eben',
      last_activity_date: new Date().toISOString(),
      is_online: true,
      online_status_dot: 'green',
    }));
  },

  refreshAccount(fourbasedId: string): Account | undefined {
    const account = this.getAccount(fourbasedId);
    if (!account) return undefined;
    const bump = randomInt(5, 80);
    const netto = (state.accountNetto[fourbasedId] ?? 0) + bump;
    state.accountNetto[fourbasedId] = netto;
    account.revenue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(netto);
    account.last_activity = 'Gerade eben';
    account.last_activity_date = new Date().toISOString();
    return account;
  },

  addAccount(email: string): Account {
    const fourbasedId = generateId('acc');
    const account: Account = {
      online_status_dot: 'green',
      last_activity: 'Gerade eben',
      followers: 0,
      revenue: '$0.00',
      fourbased_id: fourbasedId,
      name: email.split('@')[0],
      identifier: email,
      img_url: null,
      is_online: true,
      assigned_to: null,
      last_activity_date: new Date().toISOString(),
    };
    state.accountNetto[fourbasedId] = 0;
    state.accounts.push(account);
    state.chats[fourbasedId] = [];
    state.cloudAssets[fourbasedId] = [];
    state.massMessages[fourbasedId] = [];
    state.userLists[fourbasedId] = [
      { _id: generateId('list'), name: 'VIP Spender', position: 0 },
      { _id: generateId('list'), name: 'Neue Fans', position: 1 },
    ];
    state.accountExtras[fourbasedId] = { configuredMessages: [], configuredMessageCategories: [], accountInfo: null };
    state.accountEmojis[fourbasedId] = [];
    return account;
  },

  deleteAccount(fourbasedId: string): void {
    state.accounts = state.accounts.filter((a) => a.fourbased_id !== fourbasedId);
    delete state.chats[fourbasedId];
    delete state.cloudAssets[fourbasedId];
    delete state.massMessages[fourbasedId];
    delete state.userLists[fourbasedId];
    delete state.accountExtras[fourbasedId];
    delete state.accountEmojis[fourbasedId];
    delete state.accountNetto[fourbasedId];
    delete fourBasedGroupAssignment[fourbasedId];
  },

  // ── Account emojis ────────────────────────────────────────────────────
  getAccountEmojis(fourbasedId: string): AccountEmoji[] {
    return state.accountEmojis[fourbasedId] ?? [];
  },

  createAccountEmoji(fourbasedId: string, emoji: string): AccountEmoji {
    const list = (state.accountEmojis[fourbasedId] ??= []);
    const created: AccountEmoji = { id: Date.now(), emoji, fourbased_user_id: Number(fourbasedId) || 0, team_id: 1 };
    list.push(created);
    return created;
  },

  updateAccountEmoji(fourbasedId: string, id: number, emoji: string): AccountEmoji | undefined {
    const list = state.accountEmojis[fourbasedId] ?? [];
    const entry = list.find((e) => e.id === id);
    if (entry) entry.emoji = emoji;
    return entry;
  },

  deleteAccountEmoji(fourbasedId: string, id: number): void {
    state.accountEmojis[fourbasedId] = (state.accountEmojis[fourbasedId] ?? []).filter((e) => e.id !== id);
  },

  // ── Inbox / chats ─────────────────────────────────────────────────────
  getInboxAccounts(): InboxAccount[] {
    return state.accounts.map((a) => ({
      fourbased_id: a.fourbased_id,
      name: a.name,
      img_url: a.img_url ?? undefined,
      identifier: a.identifier,
      is_online: a.is_online,
      online_status_dot: a.online_status_dot,
      revenue: a.revenue,
      followers: a.followers ?? undefined,
      last_activity: a.last_activity,
      assigned_to: a.assigned_to ? { team_user_id: a.assigned_to.team_user_id, user_name: a.assigned_to.user_name } : undefined,
    }));
  },

  buildInboxResponse(params: { days?: number; filter?: InboxFilter; limit?: number; offset?: number; fourbasedId?: string }): InboxApiResponse {
    const { days = 30, filter = 'all', limit = 30, offset = 0, fourbasedId } = params;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    let items = allChats()
      .filter((c) => !fourbasedId || c.fourbased_id === fourbasedId)
      .filter((c) => {
        const last = c.messages[c.messages.length - 1];
        return last ? new Date(last.created_at ?? 0).getTime() >= cutoff : true;
      })
      .filter((c) => (filter === 'unread' ? chatIsUnread(c) : filter === 'online' ? c.customer_is_online : true))
      .sort((a, b) => {
        const at = a.messages[a.messages.length - 1]?.created_at ?? '';
        const bt = b.messages[b.messages.length - 1]?.created_at ?? '';
        return bt.localeCompare(at);
      });

    const total = items.length;
    items = items.slice(offset, offset + limit);

    // Group the page by the team member the account is assigned to.
    const byMember = new Map<number, DemoChat[]>();
    for (const chat of items) {
      const account = this.getAccount(chat.fourbased_id);
      const teamUserId = account?.assigned_to?.team_user_id ?? 1;
      const list = byMember.get(teamUserId) ?? [];
      list.push(chat);
      byMember.set(teamUserId, list);
    }

    const members = Array.from(byMember.entries()).map(([teamUserId, chats]) => {
      const member = state.teamMembers.find((m) => m.user_id === teamUserId);
      const byAccount = new Map<string, DemoChat[]>();
      for (const chat of chats) {
        const list = byAccount.get(chat.fourbased_id) ?? [];
        list.push(chat);
        byAccount.set(chat.fourbased_id, list);
      }
      const accounts = Array.from(byAccount.entries()).map(([fbId, accChats]) => {
        const account = accountName(fbId);
        const chatItems = accChats.map(toChatListItem);
        return {
          fourbased_id: fbId,
          account_name: account.name ?? fbId,
          account_img_url: account.img_url,
          chats: chatItems,
          chats_meta: {
            total: chatItems.length,
            unread: chatItems.filter((c) => c.is_unread).length,
            latest_at: chatItems[0]?.last_message_at,
          },
        };
      });
      const allMemberChats = accounts.flatMap((a) => a.chats);
      return {
        team_user_id: teamUserId,
        user_id: member?.user_id ?? teamUserId,
        user_name: member?.user.name ?? 'Unassigned',
        role: member?.role ?? 'chatter',
        accounts,
        member_meta: {
          total: allMemberChats.length,
          unread: allMemberChats.filter((c) => c.is_unread).length,
          latest_at: allMemberChats[0]?.last_message_at,
        },
      };
    });

    return {
      data: [
        {
          team: { id: 1, name: 'Nouvaire Demo Team', slug: 'nouvaire-demo', description: 'Demo-Team' },
          members,
        },
      ],
      meta: {
        days,
        limit,
        generated_at: new Date().toISOString(),
        total_accounts: state.accounts.length,
        total_chats: total,
        total_unread: allChats().filter(chatIsUnread).length,
        partial_errors: [],
      },
    };
  },

  searchChats(params: { query?: string; limit?: number; offset?: number; list_names?: 'unread' | 'online'; fourbasedId?: string }): { items: ChatListItem[]; hasMore: boolean; total: number } {
    const { query, limit = 60, offset = 0, list_names, fourbasedId } = params;
    let items = allChats().filter((c) => !fourbasedId || c.fourbased_id === fourbasedId);
    if (list_names === 'unread') items = items.filter(chatIsUnread);
    if (list_names === 'online') items = items.filter((c) => c.customer_is_online);
    if (query) {
      const q = query.toLowerCase();
      items = items.filter(
        (c) => c.customer_name.toLowerCase().includes(q) || c.messages.some((m) => m.message?.toLowerCase().includes(q)),
      );
    }
    const total = items.length;
    const page = items.slice(offset, offset + limit).map(toChatListItem);
    return { items: page, hasMore: offset + page.length < total, total };
  },

  getChatById(fourbasedId: string, chatId: string): ChatListItem | null {
    const chat = findChat(fourbasedId, chatId);
    return chat ? toChatListItem(chat) : null;
  },

  markChatAsRead(fourbasedId: string, chatId: string): void {
    const chat = findChat(fourbasedId, chatId);
    if (chat) {
      chat.unread_count = 0;
    }
  },

  // ── Chat messages ─────────────────────────────────────────────────────
  fetchMessages(fourbasedId: string, chatId: string, limit: number, offset: number) {
    const chat = findChat(fourbasedId, chatId);
    const all = chat ? [...chat.messages].reverse() : []; // newest first, like the real API's default sort
    const page = all.slice(offset, offset + limit);
    return {
      response: page,
      pagination: {
        limit,
        offset,
        count: all.length,
        has_more: offset + page.length < all.length,
        next_offset: offset + page.length,
      },
    };
  },

  sendMessage(fourbasedId: string, chatId: string, message: string, messagePrice: number, fileStackId: string | null): FourBasedChatMessage {
    const chat = findChat(fourbasedId, chatId);
    if (!chat) throw new Error('Chat not found');
    const now = new Date().toISOString();
    const sent: FourBasedChatMessage = {
      type: fileStackId ? 'file_stack' : 'text',
      _id: generateId('msg'),
      chat_id: chatId,
      user_id: fourbasedId,
      receiver_user_id: chat.customer_id,
      message,
      sender_status: 'sent',
      created_at: now,
      updated_at: now,
      ...(messagePrice > 0 ? { categories: ['ppv'] } : {}),
      ...(fileStackId && fileStackRegistry().has(fileStackId) ? { file_stack: fileStackRegistry().get(fileStackId) } : {}),
    };
    chat.messages.push(sent);
    // The creator just replied — last message is now outbound, so the chat
    // is answered (see `chatIsUnread`).
    chat.unread_count = 0;

    // Occasionally simulate a fan reply a few seconds later so the inbox feels alive.
    if (Math.random() < 0.5) {
      const replyDelay = 4000 + Math.random() * 5000;
      setTimeout(() => {
        const stillExists = findChat(fourbasedId, chatId);
        if (!stillExists) return;
        const replyAt = new Date().toISOString();
        stillExists.messages.push({
          type: 'text',
          _id: generateId('msg'),
          chat_id: chatId,
          user_id: stillExists.customer_id,
          receiver_user_id: fourbasedId,
          message: pickRandom(FAN_REPLIES),
          sender_status: 'sent',
          created_at: replyAt,
          updated_at: replyAt,
        });
        stillExists.unread_count += 1;
      }, replyDelay);
    }

    return sent;
  },

  createFileStack(fourbasedId: string, description: string, price: number): FourBasedFileStack {
    const id = generateId('fs');
    const stack: FourBasedFileStack = {
      _id: id,
      code: id,
      type: 'image/jpeg',
      extension: 'jpg',
      fileStackType: 'image',
      price,
      own: true,
      user_paid: [],
    };
    void description; // description is only echoed back through the message text itself
    void fourbasedId;
    fileStackRegistry().set(id, stack);
    return stack;
  },

  updateFileStack(fourbasedId: string, fileStackId: string, description: string, price: number): void {
    const stack = fileStackRegistry().get(fileStackId);
    if (stack) {
      stack.price = price;
    }
    void description;
    // Patch any already-sent messages referencing this file stack.
    for (const chat of state.chats[fourbasedId] ?? []) {
      for (const msg of chat.messages) {
        if (msg.file_stack?._id === fileStackId) {
          msg.file_stack = { ...msg.file_stack, price };
        }
      }
    }
  },

  // ── Pivot / configured messages / account info ───────────────────────
  getPivot(fourbasedId: string, customerId: string, chatId?: string): PivotData | undefined {
    const chat = chatId ? findChat(fourbasedId, chatId) : findChatByCustomer(fourbasedId, customerId);
    return chat?.pivot;
  },

  updatePivot(fourbasedId: string, customerId: string, data: { alias?: string; note?: string }): PivotData | undefined {
    const chat = findChatByCustomer(fourbasedId, customerId);
    if (!chat) return undefined;
    chat.pivot = { ...chat.pivot, ...data };
    return chat.pivot;
  },

  updatePriceOverride(fourbasedId: string, chatId: string, messagePriceCents: number): void {
    const chat = findChat(fourbasedId, chatId);
    if (!chat) return;
    chat.pivot.price_override = {
      data: {
        effective_message_price: messagePriceCents,
        is_override: true,
        global_message_price: 500,
        cooldown_active: false,
        cooldown_expires_at: null,
      },
    };
  },

  getConfiguredMessages(fourbasedId: string): ConfiguredMessage[] {
    return state.accountExtras[fourbasedId]?.configuredMessages ?? [];
  },

  createConfiguredMessage(fourbasedId: string, data: { message: string; name?: string; category_id?: string | null; file_stack_id?: string | null }): ConfiguredMessage {
    const extras = (state.accountExtras[fourbasedId] ??= { configuredMessages: [], configuredMessageCategories: [], accountInfo: null });
    const category = extras.configuredMessageCategories.find((c) => String(c.id) === data.category_id) ?? null;
    const fileStack = data.file_stack_id ? fileStackRegistry().get(data.file_stack_id) : undefined;
    const created: ConfiguredMessage = {
      _id: generateId('cm'),
      message: data.message,
      name: data.name,
      type: 'text',
      file_stack_id: data.file_stack_id ?? undefined,
      file_stack: fileStack ?? null,
      sort_order: extras.configuredMessages.length,
      internal: { category, notes: null, sort_order: extras.configuredMessages.length },
    };
    extras.configuredMessages.push(created);
    return created;
  },

  updateConfiguredMessage(fourbasedId: string, msgId: string, data: { message: string; name?: string; category_id?: string | null; file_stack_id?: string | null }): ConfiguredMessage {
    const extras = state.accountExtras[fourbasedId];
    const msg = extras?.configuredMessages.find((m) => m._id === msgId);
    if (!msg) throw new Error('Configured message not found');
    msg.message = data.message;
    msg.name = data.name;
    if (data.file_stack_id !== undefined) {
      msg.file_stack_id = data.file_stack_id ?? undefined;
      msg.file_stack = data.file_stack_id ? fileStackRegistry().get(data.file_stack_id) ?? null : null;
    }
    if (data.category_id !== undefined) {
      const category = extras?.configuredMessageCategories.find((c) => String(c.id) === data.category_id) ?? null;
      msg.internal = { ...(msg.internal ?? { notes: null }), category };
    }
    return msg;
  },

  deleteConfiguredMessage(fourbasedId: string, msgId: string): void {
    const extras = state.accountExtras[fourbasedId];
    if (extras) extras.configuredMessages = extras.configuredMessages.filter((m) => m._id !== msgId);
  },

  updateConfiguredMessageMeta(fourbasedId: string, msgId: string, data: { category_id?: number | null; notes?: string; sort_order?: number }): void {
    const extras = state.accountExtras[fourbasedId];
    const msg = extras?.configuredMessages.find((m) => m._id === msgId);
    if (!msg) return;
    const category = data.category_id != null ? extras?.configuredMessageCategories.find((c) => c.id === data.category_id) ?? null : msg.internal?.category ?? null;
    msg.internal = { category, notes: data.notes ?? msg.internal?.notes ?? null, sort_order: data.sort_order ?? msg.internal?.sort_order };
    if (data.sort_order != null) msg.sort_order = data.sort_order;
  },

  getConfiguredMessageCategories(fourbasedId: string): ConfiguredMessageCategory[] {
    return state.accountExtras[fourbasedId]?.configuredMessageCategories ?? [];
  },

  createConfiguredMessageCategory(fourbasedId: string, data: { name: string; color?: string }): ConfiguredMessageCategory {
    const extras = (state.accountExtras[fourbasedId] ??= { configuredMessages: [], configuredMessageCategories: [], accountInfo: null });
    const created: ConfiguredMessageCategory = { id: Date.now(), name: data.name, color: data.color };
    extras.configuredMessageCategories.push(created);
    return created;
  },

  updateConfiguredMessageCategory(fourbasedId: string, categoryId: number, data: { name: string; color?: string }): ConfiguredMessageCategory {
    const category = state.accountExtras[fourbasedId]?.configuredMessageCategories.find((c) => c.id === categoryId);
    if (!category) throw new Error('Category not found');
    category.name = data.name;
    category.color = data.color;
    return category;
  },

  deleteConfiguredMessageCategory(fourbasedId: string, categoryId: number): void {
    const extras = state.accountExtras[fourbasedId];
    if (extras) extras.configuredMessageCategories = extras.configuredMessageCategories.filter((c) => c.id !== categoryId);
  },

  getAccountInfo(fourbasedId: string): AccountInfo | null {
    return state.accountExtras[fourbasedId]?.accountInfo ?? null;
  },

  saveAccountInfo(fourbasedId: string, data: Omit<AccountInfo, 'id' | 'fourbased_user_id' | 'created_at' | 'updated_at'>): AccountInfo {
    const extras = (state.accountExtras[fourbasedId] ??= { configuredMessages: [], configuredMessageCategories: [], accountInfo: null });
    const now = new Date().toISOString();
    extras.accountInfo = { ...extras.accountInfo, ...data, created_at: extras.accountInfo?.created_at ?? now, updated_at: now };
    return extras.accountInfo;
  },

  // ── Cloud ─────────────────────────────────────────────────────────────
  getCloudUsers(): CloudUser[] {
    // The real cloudApi.getUsers()/getUser() only proxy the basic
    // /teams/:id/fourbased-users list (same endpoint as accountsApi) — it
    // never returns `assets_count` or `last_asset_at`, so those badges never
    // show in production. Don't set them here either.
    return state.accounts.map((a) => ({
      fourbased_id: a.fourbased_id,
      name: a.name,
      email: a.identifier,
      img_url: a.img_url,
      folders: Array.from(new Set((state.cloudAssets[a.fourbased_id] ?? []).flatMap((c) => c.folders ?? []))),
    }));
  },

  getCloudUser(fourbasedId: string): CloudUser | undefined {
    return this.getCloudUsers().find((u) => u.fourbased_id === fourbasedId);
  },

  getCloudAssets(fourbasedId: string, params: { limit?: number; offset?: number; file_type?: string; sold?: boolean } = {}): { response: CloudAsset[]; pagination: { limit: number; offset: number; count: number; has_more: boolean; next_offset: number } } {
    const { limit = 60, offset = 0, file_type, sold } = params;
    let assets = state.cloudAssets[fourbasedId] ?? [];
    if (file_type) assets = assets.filter((a) => a.fileStackType === file_type);
    if (sold !== undefined) assets = assets.filter((a) => (sold ? a.price === 0 : a.price > 0));
    const page = assets.slice(offset, offset + limit);
    return {
      response: page,
      pagination: { limit, offset, count: assets.length, has_more: offset + page.length < assets.length, next_offset: offset + page.length },
    };
  },

  getCloudAsset(assetId: string): CloudAsset | undefined {
    return Object.values(state.cloudAssets).flat().find((a) => a._id === assetId);
  },

  // ── Mass messages ─────────────────────────────────────────────────────
  listMassMessages(fourbasedId: string, params: { offset?: number; limit?: number; status?: string } = {}) {
    const { offset = 0, limit = 20, status } = params;
    let messages = state.massMessages[fourbasedId] ?? [];
    if (status) messages = messages.filter((m) => m.status === status);
    const sorted = [...messages].sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { messages: sorted.slice(offset, offset + limit), count: sorted.length, offset, limit };
  },

  createMassMessage(fourbasedId: string, payload: CreateMassMessagePayload): MassMessage {
    const lists = state.userLists[fourbasedId] ?? [];
    const includedLists = (payload.include_user_list ?? []).length;
    const baseAudience = 60 + includedLists * 120 + (payload.filter?.length ?? 0) * 90;
    const recipientCount = Math.max(20, baseAudience + randomInt(-15, 40));
    const now = new Date().toISOString();
    const isScheduled = Boolean(payload.to_be_posted_at);

    const created: MassMessage = {
      _id: generateId('mm'),
      user_id: fourbasedId,
      message: payload.message,
      target_group: payload.filter?.[0] ?? lists[0]?.name ?? 'all',
      filter: payload.filter ?? [],
      status: isScheduled ? 'pending' : 'finished',
      recipient_count: isScheduled ? null : recipientCount,
      viewed_count: isScheduled ? null : Math.round(recipientCount * (0.4 + Math.random() * 0.3)),
      to_be_posted_at: payload.to_be_posted_at ?? now,
      processing_finished_at: isScheduled ? null : now,
      created_at: now,
      updated_at: now,
      file_stack: null,
      file_stack_id: payload.file_stack_id ?? null,
    };

    const list = (state.massMessages[fourbasedId] ??= []);
    list.unshift(created);
    return created;
  },

  deleteMassMessage(fourbasedId: string, massMessageId: string): void {
    state.massMessages[fourbasedId] = (state.massMessages[fourbasedId] ?? []).filter((m) => m._id !== massMessageId);
  },

  getUserLists(fourbasedId: string): UserList[] {
    return [...(state.userLists[fourbasedId] ?? [])].sort((a, b) => a.position - b.position);
  },

  // ── FourBased users (settings > accounts) ────────────────────────────
  listFourBasedUsers(): FourBasedUser[] {
    return state.accounts.map((a, idx) => {
      const assignment = fourBasedGroupAssignment[a.fourbased_id];
      const group = assignment ? state.groups.find((g) => g.id === assignment.team_group_id) : undefined;
      return {
        id: idx + 1,
        name: a.name,
        fourbased_id: a.fourbased_id,
        identifier: a.identifier,
        img_url: a.img_url ?? '',
        is_online: a.is_online ?? false,
        online_status_dot: a.online_status_dot,
        revenue: a.revenue,
        followers: a.followers ?? 0,
        last_activity: a.last_activity,
        assigned_to: group ? { team_group_id: group.id, team_group_name: group.name } : null,
      };
    });
  },

  updateFourBasedUser(fourbasedId: string, payload: { email?: string }): FourBasedUser {
    const account = this.getAccount(fourbasedId);
    if (!account) throw new Error('Account not found');
    if (payload.email) account.identifier = payload.email;
    const updated = this.listFourBasedUsers().find((u) => u.fourbased_id === fourbasedId);
    if (!updated) throw new Error('Account not found');
    return updated;
  },

  deleteFourBasedUser(fourbasedId: string): void {
    this.deleteAccount(fourbasedId);
  },

  assignFourBasedUser(fourbasedId: string, teamGroupId: number): void {
    fourBasedGroupAssignment[fourbasedId] = { team_group_id: teamGroupId };
  },

  unassignFourBasedUser(fourbasedId: string): void {
    delete fourBasedGroupAssignment[fourbasedId];
  },

  // ── Groups ────────────────────────────────────────────────────────────
  listGroups(): Group[] {
    return state.groups;
  },

  createGroup(payload: { name: string; description?: string }): Group {
    const created: Group = {
      id: Date.now(),
      name: payload.name,
      description: payload.description ?? null,
      team_id: 1,
      team_users: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    state.groups.push(created);
    return created;
  },

  assignGroupMember(groupId: number, teamUserId: number): void {
    const group = state.groups.find((g) => g.id === groupId);
    const member = state.teamMembers.find((m) => m.id === teamUserId || m.user_id === teamUserId);
    if (!group || !member) return;
    if (group.team_users.some((tu) => tu.user_id === member.user_id)) return;
    group.team_users.push({ id: member.id, user_id: member.user_id, team_id: 1, role: member.role, team_group_id: groupId, user: member.user });
  },

  removeGroupMember(groupId: number, teamUserId: number): void {
    const group = state.groups.find((g) => g.id === groupId);
    if (!group) return;
    group.team_users = group.team_users.filter((tu) => tu.user_id !== teamUserId && tu.id !== teamUserId);
  },

  // ── Team members ──────────────────────────────────────────────────────
  getTeamMembers(): TeamMember[] {
    return state.teamMembers;
  },

  registerTeamMember(payload: { name: string; email: string }): TeamMember {
    const nextId = Math.max(...state.teamMembers.map((m) => m.id), 0) + 1;
    const created: TeamMember = {
      id: nextId,
      user_id: nextId,
      team_id: 1,
      role: 'chatter',
      active_shift: false,
      user: { id: nextId, name: payload.name, email: payload.email },
      team: state.teamMembers[0]?.team ?? { id: 1, name: 'Nouvaire Demo Team', slug: 'nouvaire-demo', description: '' },
    };
    state.teamMembers.push(created);
    return created;
  },

  // ── Settings ──────────────────────────────────────────────────────────
  getSettings(): TeamSettings {
    return state.settings;
  },

  updateSettings(payload: UpdateTeamSettingsPayload): TeamSettings {
    state.settings = { ...state.settings, ...payload, updated_at: new Date().toISOString() };
    return state.settings;
  },

  // ── Work sessions ─────────────────────────────────────────────────────
  getActiveWorkSession(): ActiveWorkSession | null {
    return state.activeWorkSession;
  },

  startWorkSession(startedAt: string): { started_at: string; id: number } {
    const id = Date.now();
    state.activeWorkSession = {
      id,
      team_user_id: DEMO_USER.id,
      started_at: startedAt,
      ended_at: null,
      duration: null,
      ended_by_admin: false,
      admin_note: null,
      team_user: {},
    };
    return { started_at: startedAt, id };
  },

  endWorkSession(id: number, endedAt: string, adminNote?: string, endedByAdmin = false): void {
    void adminNote;
    void endedByAdmin;

    // Case 1: ending the demo admin's own tracked active session (self-service end-shift).
    const active = state.activeWorkSession;
    if (active?.id === id) {
      const durationMinutes = Math.max(0, Math.round((new Date(endedAt).getTime() - new Date(active.started_at).getTime()) / 60000));
      const overview: SessionOverviewSession = {
        id,
        started_at: active.started_at,
        ended_at: endedAt,
        duration: durationMinutes,
        is_active: false,
        revenue: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(randomInt(40, 260)),
      };
      (state.sessionOverviews[DEMO_USER.id] ??= []).unshift(overview);
      (state.workSessions[DEMO_USER.id] ??= []).unshift({
        id,
        team_user_id: DEMO_USER.id,
        started_at: active.started_at,
        ended_at: endedAt,
        duration: durationMinutes,
        created_at: active.started_at,
        updated_at: endedAt,
      });
      state.activeWorkSession = null;
      return;
    }

    // Case 2: admin ending another team member's already-seeded active session row.
    for (const [userIdStr, sessions] of Object.entries(state.sessionOverviews)) {
      const session = sessions.find((s) => s.id === id && s.is_active);
      if (!session) continue;
      const userId = Number(userIdStr);
      const durationMinutes = Math.max(0, Math.round((new Date(endedAt).getTime() - new Date(session.started_at).getTime()) / 60000));
      session.ended_at = endedAt;
      session.duration = durationMinutes;
      session.is_active = false;
      (state.workSessions[userId] ??= []).unshift({
        id,
        team_user_id: userId,
        started_at: session.started_at,
        ended_at: endedAt,
        duration: durationMinutes,
        created_at: session.started_at,
        updated_at: endedAt,
      });
      return;
    }
  },

  getWorkSessionsForUser(userId: number, from?: string, till?: string): WorkSession[] {
    return filterByDateRange(state.workSessions[userId] ?? [], (s) => s.started_at, from, till);
  },

  getSessionOverview(userId: number, from?: string, till?: string): SessionOverview {
    const member = state.teamMembers.find((m) => m.user_id === userId);
    const sessions = filterByDateRange(state.sessionOverviews[userId] ?? [], (s) => s.started_at, from, till);
    const totalCents = sessions.reduce((sum, s) => sum + parsePrice(s.revenue), 0);
    return {
      user: { id: userId, name: member?.user.name ?? 'Unbekannt', email: member?.user.email ?? '' },
      sessions,
      total_revenue: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalCents),
      chatter_percentage: state.settings.chatter_percentage,
    };
  },

  // ── Notifications ─────────────────────────────────────────────────────
  getNotifications(type?: string, limit = 20): NotificationsResponse {
    const filtered = type ? state.notifications.filter((n) => n.type === type) : state.notifications;
    return { data: filtered.slice(0, limit), total: filtered.length, limit, offset: 0 };
  },

  getUnreadNotificationCount(): number {
    return state.notifications.filter((n) => !n.read_at).length;
  },

  markNotificationRead(id: string): void {
    const notif = state.notifications.find((n) => n.id === id);
    if (notif) notif.read_at = new Date().toISOString();
  },

  markAllNotificationsRead(): void {
    const now = new Date().toISOString();
    state.notifications.forEach((n) => { n.read_at = n.read_at ?? now; });
  },

  // ── Dashboard ─────────────────────────────────────────────────────────
  getDashboard(rangeDays: number): DashboardApiResponse {
    const generatedAt = new Date().toISOString();
    const data = state.accounts.map((account) => {
      const chats = state.chats[account.fourbased_id] ?? [];
      const unreadChats = chats.filter(chatIsUnread);
      return {
        profile: { fourbased_id: account.fourbased_id, name: account.name, email: account.identifier, img_url: account.img_url ?? undefined },
        kpis: {
          revenue_net: state.accountNetto[account.fourbased_id] ?? 0,
          unread_chats: unreadChats.length,
          unread_messages: chats.reduce((sum, c) => sum + c.unread_count, 0),
          likes: DEMO_ACCOUNT_DETAILS[account.fourbased_id]?.likes ?? 0,
          followers: account.followers ?? 0,
          status: { is_online: account.is_online ?? false, last_activity_date: account.last_activity_date ?? generatedAt },
        },
        lists: {
          latest_unread_chats: unreadChats.slice(0, 5).map((c) => ({
            chat_id: c.chat_id,
            fourbased_id: c.fourbased_id,
            customer_name: c.customer_name,
            last_message_preview: c.messages[c.messages.length - 1]?.message ?? '',
            unread_count: c.unread_count,
            last_message_at: c.messages[c.messages.length - 1]?.created_at ?? generatedAt,
          })),
        },
        meta: { range_days: rangeDays, generated_at: generatedAt },
      };
    });
    return { data, meta: { range_days: rangeDays, generated_at: generatedAt, total_accounts: data.length } };
  },

  getRevenueForecast(fourbasedUserId: string, days: number): RevenueForecastResult {
    const dailyAverage = (state.accountNetto[fourbasedUserId] ?? 3000) / 90;
    const today = new Date();
    const historical = Array.from({ length: days }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (days - i));
      return { date: date.toISOString().slice(0, 10), amount: Math.max(0, Math.round((dailyAverage * (0.7 + Math.random() * 0.6)) * 100) / 100) };
    });
    const trendUp = Math.random() > 0.4;
    const forecast = Array.from({ length: Math.min(days, 14) }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() + i + 1);
      const growth = trendUp ? 1 + i * 0.015 : 1 - i * 0.01;
      return { date: date.toISOString().slice(0, 10), amount: Math.max(0, Math.round(dailyAverage * growth * 100) / 100) };
    });
    return { historical, forecast, trend: trendUp ? 'rising' : 'falling', daily_average: Math.round(dailyAverage * 100) / 100 };
  },

  // ── Reset ─────────────────────────────────────────────────────────────
  reset(): void {
    state = buildDemoSnapshot();
    fileStacks.clear();
    Object.keys(fourBasedGroupAssignment).forEach((k) => delete fourBasedGroupAssignment[k]);
  },
};

// fourbased_id -> group assignment (settings > accounts "assign to group" flow).
// Kept outside `state` since it's not part of the seed snapshot shape but must
// still be cleared on reset.
const fourBasedGroupAssignment: Record<string, { team_group_id: number } | null> = {};

function filterByDateRange<T>(items: T[], getDate: (item: T) => string, from?: string, till?: string): T[] {
  if (!from && !till) return items;
  return items.filter((item) => {
    const d = getDate(item).slice(0, 10);
    if (from && d < from) return false;
    if (till && d > till) return false;
    return true;
  });
}

function parsePrice(formatted: string): number {
  const numeric = Number(formatted.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

/** Resets the entire demo store back to its factory seed state. */
export function resetDemoStore(): void {
  store.reset();
}
