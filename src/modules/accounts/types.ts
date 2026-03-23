export interface AccountAssignedTo {
  team_user_id: number;
  role: string;
  user_name: string;
}

export interface Account {
  online_status_dot: string;
  last_activity: string;
  followers: number | null;
  revenue: string;
  fourbased_id: string;
  name: string;
  /** API returns `identifier` (email) */
  identifier: string;
  img_url?: string | null;
  is_online?: boolean;
  assigned_to?: AccountAssignedTo | null;
  // Optional – only present on detailed endpoints
  last_activity_date?: string;
  total_netto_amount?: number;
  follower_count?: number;
  likes_count?: number;
  file_stack_count?: number;
  file_stack_with_price_count?: number;
  has_subscription_configuration?: boolean;
}
