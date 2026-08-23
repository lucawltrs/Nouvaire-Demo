import { DEMO_MODE } from '../../../demo/config';
import { pushApi as realPushApi } from './pushApi.real';
import { pushApi as demoPushApi } from '../../../demo/api/pushApi.mock';

export const pushApi: typeof realPushApi = DEMO_MODE ? demoPushApi : realPushApi;

export type { PushSubscribePayload } from './pushApi.real';
