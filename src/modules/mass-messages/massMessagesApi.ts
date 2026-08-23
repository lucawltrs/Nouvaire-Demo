import { DEMO_MODE } from '../../demo/config';
import { massMessagesApi as realMassMessagesApi } from './massMessagesApi.real';
import { massMessagesApi as demoMassMessagesApi } from '../../demo/api/massMessagesApi.mock';

export const massMessagesApi: typeof realMassMessagesApi = DEMO_MODE ? demoMassMessagesApi : realMassMessagesApi;
