export interface Account {
  online_status_dot: string;
  last_activity: string;
  followers: null;
  revenue: string;
  fourbased_id: string;
  name: string;
  /** API returns `identifier` (email) */
  identifier: string;
  img_url?: string | null;
  // Optional – only present on detailed endpoints
  is_online?: boolean;
  last_activity_date?: string;
  total_netto_amount?: number;
  follower_count?: number;
  likes_count?: number;
  file_stack_count?: number;
  file_stack_with_price_count?: number;
  has_subscription_configuration?: boolean;
}

/** @deprecated API now returns a bare array */
export interface AccountsApiResponse {
  data: Account[];
}
