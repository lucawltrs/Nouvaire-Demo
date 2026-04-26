export type MassMessageStatus = 'finished' | 'pending' | 'processing' | 'failed';

export interface MassMessage {
  _id: string;
  user_id: string;
  message: string;
  target_group: string;
  filter: string[];
  status: MassMessageStatus | null;
  recipient_count: number | null;
  viewed_count: number | null;
  to_be_posted_at: string | null;
  processing_finished_at: string | null;
  created_at: string;
  updated_at: string;
  file_stack: unknown;
  file_stack_id: string | null;
}

export interface CreateMassMessagePayload {
  message: string;
  filter?: string[];
  include_user_list?: string[];
  exclude_user_list?: string[];
  exclude_filter?: string[];
  user_ids?: string[];
  exclude_ids?: string[];
  user_list_id?: string | null;
  exclude_user_ids?: string[] | null;
  file_stack_id?: string | null;
  to_be_posted_at?: string | null;
}

export interface UserList {
  _id: string;
  name: string;
  position: number;
}

export interface MassMessagesListParams {
  offset?: number;
  limit?: number;
  status?: MassMessageStatus;
}

export interface MassMessagesListResponse {
  messages: MassMessage[];
  count: number;
  offset: number;
  limit: number;
}
