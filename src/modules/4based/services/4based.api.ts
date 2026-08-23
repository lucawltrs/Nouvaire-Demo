import { DEMO_MODE } from '../../../demo/config';
import * as real from './4based.api.real';
import * as demo from '../../../demo/api/4based.api.mock';

export const createFileStack: typeof real.createFileStack = DEMO_MODE ? demo.createFileStack : real.createFileStack;
export const updateFileStack: typeof real.updateFileStack = DEMO_MODE ? demo.updateFileStack : real.updateFileStack;
export const sendChatMessage: typeof real.sendChatMessage = DEMO_MODE ? demo.sendChatMessage : real.sendChatMessage;
export const fetchUserChatMessages: typeof real.fetchUserChatMessages = DEMO_MODE
  ? demo.fetchUserChatMessages
  : real.fetchUserChatMessages;
export const getRevenueForecast: typeof real.getRevenueForecast = DEMO_MODE ? demo.getRevenueForecast : real.getRevenueForecast;

export type {
  FourBasedChatMessagesQuery,
  FourBasedFileStackItem,
  FourBasedFileStack,
  FourBasedChatMessage,
  FourBasedChatMessagesResult,
  FileStackCreateBody,
  FileStackCreateResult,
  FileStackUpdateBody,
  RevenueForecastDataPoint,
  RevenueForecastResult,
} from './4based.api.real';
