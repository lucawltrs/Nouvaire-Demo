export interface DashboardAccount {
  profile: {
    fourbased_id: string;
    name: string;
    email: string;
    img_url?: string;
  };
  kpis: {
    revenue_net: number;
    unread_chats: number;
    unread_messages: number;
    likes: number;
    followers: number;
    status: {
      is_online: boolean;
      last_activity_date: string;
    };
  };
  lists: {
    latest_unread_chats: LatestUnreadChat[];
  };
  meta: {
    range_days: number;
    generated_at: string;
  };
}

export interface LatestUnreadChat {
  customer_name: string;
  last_message_preview: string;
  unread_count: number;
  last_message_at: string;
}

export interface DashboardApiResponse {
  data: DashboardAccount[];
  meta: {
    range_days: number;
    generated_at: string;
    total_accounts: number;
  };
}

export interface AggregatedDashboard {
  revenue_net: number;
  unread_chats: number;
  unread_messages: number;
  likes: number;
  followers: number;
  status: {
    online_count: number;
    total_count: number;
    last_activity_date: string;
  };
}

export interface MergedUnreadChat extends LatestUnreadChat {
  account_name: string;
  account_img_url?: string;
}
