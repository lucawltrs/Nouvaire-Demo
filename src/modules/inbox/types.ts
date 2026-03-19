export type InboxFilter = 'all' | 'unread';
export type InboxScope = 'all' | 'single';

export interface InboxAccount {
  fourbased_id: string;
  name: string;
  img_url?: string;
  identifier?: string;
}

export interface ChatListItem {
  chat_id: string;
  fourbased_id: string;
  customer_name: string;
  last_message_preview: string;
  last_message_at: string;
  is_unread: boolean;
  unread_count: number;
  account_name?: string;
  account_img_url?: string;
  sales_volume?: number;
  customer_avatar_url?: string;
}

export interface InboxApiResponse {
  data: ChatListItem[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface InboxQueryParams {
  days?: number;
  filter?: InboxFilter;
  limit?: number;
  offset?: number;
  scope?: InboxScope;
  fourbased_id?: string;
}

export interface PredefinedText {
  id: string | number;
  message: string;
}

export interface PivotData {
  _id?: string;
  alias?: string;
  note?: string;
  interaction?: boolean;
  last_interaction_at?: string;
  auto_follow_message_sent?: boolean;
  has_payed_chat_unlock_price?: boolean;
  created_at?: string;
}
