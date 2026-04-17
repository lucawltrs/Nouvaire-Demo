import { getConfig } from "../../../lib/config";

export interface FourBasedAccount {
  name: string;
  fourbased_id: string;
  identifier: string;
  img_url: string;
  total_netto_amount?: number;
}

export interface FourBasedStatisticsQuery {
  statistic_type?: string;
  limit?: number;
  sort?: string;
  offset?: number;
  bookingdate_from?: string;
  bookingdate_to?: string;
  type?: string;
  with_invoice?: boolean;
  with_buyer?: boolean;
  with_file_stack?: boolean;
}

export interface FourBasedStatisticsResult {
  fourbased_id: string;
  url: string;
  status: number;
  query: FourBasedStatisticsQuery;
  response: Record<string, number>;
}

export interface FourBasedChatUser {
  _id: string;
  name: string;
}

export interface FourBasedChatLastMessage {
  message: string;
  sender_status?: string;
  receiver_status?: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

export interface FourBasedChatItem {
  _id: string;
  img_url?: string;
  updated_at?: string;
  users?: FourBasedChatUser[];
  last_message?: FourBasedChatLastMessage;
  sales_volume?: number;
}

export interface FourBasedChatsResult {
  fourbased_id: string;
  url: string;
  status: number;
  query: Record<string, unknown>;
  response: FourBasedChatItem[];
}

export interface FourBasedUnreadMessagesResult {
  fourbased_id: string;
  url: string;
  status: number;
  response: Record<string, number>;
}

export interface FourBasedDashboardResult {
  fourbased_id: string;
  name: string;
  email: string;
  statistics: {
    query: FourBasedStatisticsQuery;
    status: number;
    total_netto_amount: number;
    error: string | null;
  };
  unread_messages: {
    status: number;
    total_unread_messages: number;
    total_unread_chats: number;
    error: string | null;
    response: Record<string, number>;
  };
}

export interface FourBasedChatMessagesQuery {
  limit?: number;
  offset?: number;
  sort?: string;
  with_file_stack?: boolean;
  with_tip?: boolean;
}

export interface FourBasedFileStackItem {
  _id: string;
  code: string;
  type: string;
  extension: string;
  fileStackType: string;
  width?: number;
  height?: number;
  dominantColor?: [number, number, number];
  price?: number;
  own?: boolean;
  collection_id?: string;
  [key: string]: unknown;
}

export interface FourBasedFileStack extends FourBasedFileStackItem {
  user_paid?: string[];
  collection?: FourBasedFileStackItem[];
  status_controlled?: string;
}

export interface FourBasedChatMessage {
  type: string;
  _id: string;
  chat_id: string;
  user_id: string;
  receiver_user_id?: string;
  message?: string;
  img_preview_link?: string;
  file_stack?: FourBasedFileStack;
  sender_status?: string;
  receiver_status?: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

export interface FourBasedChatMessagesResult {
  fourbased_id: string;
  chat_id: string;
  url: string;
  status: number;
  query: Record<string, unknown>;
  pagination?: {
    limit: number;
    offset: number;
    count: number;
    has_more: boolean;
    next_offset: number;
  };
  response: FourBasedChatMessage[];
}

const getApiUrl = () => getConfig().API_URL;
const API_BASE = `${getApiUrl()}/4based`;

const getTeamId = (): number => {
  const match = document.cookie.match(/(?:^|; )auth_team=([^;]*)/);
  if (!match) throw new Error('No team found in cookie');
  return JSON.parse(decodeURIComponent(match[1])).team_id;
};

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
  "Content-Type": "application/json",
});

const parseJson = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`4Based API error ${response.status}: ${errorText}`);
  }

  return response.json();
};

export const fetchUsers = async () => {
  const response = await fetch(`${API_BASE}/users`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return parseJson(response) as Promise<FourBasedAccount[]>;
};

export const fetchUserByFourBasedId = async (fourbasedId: string) => {
  const response = await fetch(`${API_BASE}/users/${fourbasedId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return parseJson(response) as Promise<FourBasedAccount>;
};

export const fetchUserChats = async (fourbasedId: string) => {
  const response = await fetch(`${API_BASE}/users/${fourbasedId}/chats`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return parseJson(response) as Promise<FourBasedChatsResult>;
};

export const fetchUserUnreadMessages = async (fourbasedId: string) => {
  const response = await fetch(`${API_BASE}/users/${fourbasedId}/chat/unread-messages`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`4Based API error ${response.status}: ${errorText}`);
  }

  const text = await response.text();
  if (!text) {
    return {
      fourbased_id: fourbasedId,
      url: `${API_BASE}/users/${fourbasedId}/chat/unread-messages`,
      status: response.status,
      response: {},
    } as FourBasedUnreadMessagesResult;
  }

  return JSON.parse(text) as FourBasedUnreadMessagesResult;
};

export const fetchUserDashboard = async (fourbasedId: string) => {
  const response = await fetch(`${API_BASE}/users/${fourbasedId}/dashboard`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return parseJson(response) as Promise<FourBasedDashboardResult>;
};

export interface FileStackCreateBody {
  ids: string[];
  description: string;
  price: number;
}

export interface FileStackCreateResult {
  fourbased_id: string;
  url: string;
  status: number;
  payload: Record<string, unknown>;
  response: {
    _id: string;
    [key: string]: unknown;
  };
}

export const createFileStack = async (
  fourbasedId: string,
  body: FileStackCreateBody,
): Promise<FileStackCreateResult> => {
  const response = await fetch(`${API_BASE}/users/${fourbasedId}/file-stack`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });

  return parseJson(response) as Promise<FileStackCreateResult>;
};

export interface FileStackUpdateBody {
  description: string;
  price: number;
  tag: string[];
  is_subscription_item: boolean;
}

export const updateFileStack = async (
  fourbasedId: string,
  fileStackId: string,
  body: FileStackUpdateBody,
): Promise<void> => {
  const response = await fetch(`${API_BASE}/users/${fourbasedId}/file-stack/${fileStackId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });

  return parseJson(response) as Promise<void>;
};

export const sendChatMessage = async (
  fourbasedId: string,
  chatId: string,
  message: string,
  messagePrice = 0,
  fileStackId: string | null = null,
) => {
  const response = await fetch(`${API_BASE}/users/${fourbasedId}/chats/${chatId}/message`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ message, message_price: messagePrice, file_stack_id: fileStackId }),
  });

  return parseJson(response);
};

export const markAllUserMessagesAsReceived = async (fourbasedId: string) => {
  const response = await fetch(`${API_BASE}/users/${fourbasedId}/chats/update-messages-status-received/bulk`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`4Based API error ${response.status}: ${errorText}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : { status: response.status };
};

export const getTotalUnreadMessages = (unreadByChat: Record<string, number>) => {
  return Object.values(unreadByChat).reduce((sum, value) => sum + value, 0);
};

export const fetchUserChatMessages = async (
  fourbasedId: string,
  chatId: string,
  query: FourBasedChatMessagesQuery = {
    limit: 20,
    offset: 0,
    sort: '{"created_at":"desc"}',
    with_file_stack: true,
    with_tip: true,
  }
) => {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (typeof value === "boolean") {
      params.append(key, value ? "true" : "false");
      return;
    }

    params.append(key, String(value));
  });

  const response = await fetch(`${API_BASE}/users/${fourbasedId}/chats/${chatId}/messages?${params.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return parseJson(response) as Promise<FourBasedChatMessagesResult>;
};

export const fetchUserStatistics = async (
  fourbasedId: string,
  query: FourBasedStatisticsQuery
) => {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (typeof value === "boolean") {
      params.append(key, value ? "true" : "false");
      return;
    }

    params.append(key, String(value));
  });

  const response = await fetch(`${API_BASE}/users/${fourbasedId}/statistics?${params.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  return parseJson(response) as Promise<FourBasedStatisticsResult>;
};

export const storeCredentials = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE}/store/credentials`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ team_id: getTeamId(), email, password }),
  });

  return parseJson(response);
};

export const syncBulkLogin = async () => {
  const response = await fetch(`${API_BASE}/bulk/login`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  return parseJson(response);
};
