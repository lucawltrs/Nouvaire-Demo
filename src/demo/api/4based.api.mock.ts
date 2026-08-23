import type {
  FourBasedChatMessagesQuery,
  FourBasedChatMessagesResult,
  FileStackCreateBody,
  FileStackCreateResult,
  FileStackUpdateBody,
  RevenueForecastResult,
} from '../../modules/4based/services/4based.api.real';
import { store } from '../store';
import { fakeLatency } from '../utils';

export const createFileStack = async (
  fourbasedId: string,
  body: FileStackCreateBody,
): Promise<FileStackCreateResult> => {
  await fakeLatency();
  const stack = store.createFileStack(fourbasedId, body.description, body.price);
  return {
    fourbased_id: fourbasedId,
    url: `demo://4based/users/${fourbasedId}/file-stack`,
    status: 200,
    payload: { ...body },
    response: { ...stack },
  };
};

export const updateFileStack = async (
  fourbasedId: string,
  fileStackId: string,
  body: FileStackUpdateBody,
): Promise<void> => {
  await fakeLatency();
  store.updateFileStack(fourbasedId, fileStackId, body.description, body.price);
};

export const sendChatMessage = async (
  fourbasedId: string,
  chatId: string,
  message: string,
  messagePrice = 0,
  fileStackId: string | null = null,
) => {
  await fakeLatency();
  return store.sendMessage(fourbasedId, chatId, message, messagePrice, fileStackId);
};

export const fetchUserChatMessages = async (
  fourbasedId: string,
  chatId: string,
  query: FourBasedChatMessagesQuery = {},
): Promise<FourBasedChatMessagesResult> => {
  await fakeLatency();
  const { limit = 20, offset = 0 } = query;
  const { response, pagination } = store.fetchMessages(fourbasedId, chatId, limit, offset);
  return {
    fourbased_id: fourbasedId,
    chat_id: chatId,
    url: `demo://4based/users/${fourbasedId}/chats/${chatId}/messages`,
    status: 200,
    query: { ...query },
    pagination,
    response,
  };
};

export const getRevenueForecast = async (
  fourbasedUserId: string,
  days: number,
): Promise<RevenueForecastResult> => {
  await fakeLatency();
  return store.getRevenueForecast(fourbasedUserId, days);
};
