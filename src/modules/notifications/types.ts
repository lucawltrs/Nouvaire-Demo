export type NotificationType = 'message' | 'voice_message' | 'sale' | 'tip' | 'follow' | 'like';

export interface NotificationData {
  chat_id?: string;
  [key: string]: unknown;
}

export interface NotificationFourbasedUser {
  id: number;
  name: string;
  fourbased_id: string;
  media_url?: string;
  [key: string]: unknown;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: NotificationData;
  fourbased_user?: NotificationFourbasedUser;
  read_at: string | null;
  created_at: string;
}

export interface NotificationsResponse {
  data: Notification[];
  total: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}
