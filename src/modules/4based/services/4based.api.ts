import { getConfig } from "../../../lib/config";

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
  media_url?: string;
  /** Clip length in seconds. Only set when fileStackType is "video" or "audio". */
  duration?: number;
  /** Clip length pre-formatted as "mm:ss" by the API. Only set when fileStackType is "video" or "audio". */
  duration_formatted?: string;
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
  categories?: string[];
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

export interface RevenueForecastDataPoint {
  date: string;
  amount: number;
}

export interface RevenueForecastResult {
  historical: RevenueForecastDataPoint[];
  forecast: RevenueForecastDataPoint[];
  trend: 'up' | 'down' | 'stable' | 'rising' | 'falling';
  daily_average: number;
}

export const getRevenueForecast = async (
  fourbasedUserId: string,
  days: number
): Promise<RevenueForecastResult> => {
  const teamId = getTeamId();
  const response = await fetch(
    `${getApiUrl()}/teams/${teamId}/fourbased-users/${fourbasedUserId}/revenue/forecast?days=${days}`,
    { method: 'GET', headers: getAuthHeaders() }
  );

  const json = await parseJson(response) as { data: RevenueForecastResult };
  return json.data;
};

