export type InboxFilter = 'all' | 'unread' | 'online';
export type InboxListNames = 'unread' | 'online';
export type InboxScope = 'all' | 'single';

export interface InboxAccountAssignedTo {
  team_user_id: number;
  user_name: string;
}

export interface InboxAccount {
  fourbased_id: string;
  name: string;
  img_url?: string;
  identifier?: string;
  is_online?: boolean;
  online_status_dot?: string;
  revenue?: string;
  followers?: number;
  last_activity?: string;
  assigned_to?: InboxAccountAssignedTo;
}

export interface ChatListItem {
  chat_id: string;
  fourbased_id: string;
  customer_id: string;
  customer_name: string;
  customer_avatar_url?: string | null;
  account_name?: string;
  account_img_url?: string;
  last_message_preview: string;
  last_message_at: string;
  unread_count: number;
  is_unread: boolean;
  sales_volume?: number | null;
}

export interface InboxTeam {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export interface InboxChatsMeta {
  total: number;
  unread: number;
  latest_at?: string;
}

export interface InboxAccountEntry {
  fourbased_id: string;
  account_name: string;
  account_img_url?: string;
  chats: ChatListItem[];
  chats_meta: InboxChatsMeta;
}

export interface InboxMember {
  team_user_id: number;
  user_id: number;
  user_name: string;
  role: string;
  accounts: InboxAccountEntry[];
  member_meta: InboxChatsMeta;
}

export interface InboxTeamEntry {
  team: InboxTeam;
  members: InboxMember[];
}

export interface InboxApiResponse {
  data: InboxTeamEntry[];
  meta: {
    days: number;
    limit: number;
    generated_at: string;
    total_accounts: number;
    total_chats: number;
    total_unread: number;
    partial_errors: unknown[];
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

export interface ChatSearchParams {
  query?: string;
  limit?: number;
  offset?: number;
  list_names?: InboxListNames;
  fourbased_id?: string;
}

export interface ChatSearchResponse {
  data: ChatListItem[];
  pagination?: {
    limit: number;
    offset: number;
    has_more: boolean;
  };
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
