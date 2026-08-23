import type { FourBasedChatMessage } from '../modules/4based/services/4based.api';
import type { PivotData, ConfiguredMessage, ConfiguredMessageCategory, AccountInfo } from '../modules/inbox/types';

/** One simulated fan conversation for a given creator account. */
export interface DemoChat {
  chat_id: string;
  fourbased_id: string;
  customer_id: string;
  customer_name: string;
  customer_avatar_url: string | null;
  customer_is_online: boolean;
  messages: FourBasedChatMessage[];
  /**
   * Count of trailing inbound (customer) messages since the chat was last
   * read. The single source of truth for "unread" — see `chatIsUnread()` in
   * store.ts. Never set this directly from anywhere other than
   * `markChatAsRead` (→ 0), `sendMessage` (creator reply → 0), or a new
   * inbound message (→ +1). Do NOT add a parallel `is_unread` flag; it is
   * always derived as `unread_count > 0`.
   */
  unread_count: number;
  sales_volume: number;
  pivot: PivotData;
}

export interface DemoAccountExtras {
  configuredMessages: ConfiguredMessage[];
  configuredMessageCategories: ConfiguredMessageCategory[];
  accountInfo: AccountInfo | null;
}
