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
  unread_count: number;
  is_unread: boolean;
  sales_volume: number;
  pivot: PivotData;
}

export interface DemoAccountExtras {
  configuredMessages: ConfiguredMessage[];
  configuredMessageCategories: ConfiguredMessageCategory[];
  accountInfo: AccountInfo | null;
}
