import { DEMO_MODE } from '../../../demo/config';
import { inboxApi as realInboxApi } from './inbox.api.real';
import { inboxApi as demoInboxApi } from '../../../demo/api/inbox.api.mock';

export const inboxApi: typeof realInboxApi = DEMO_MODE ? demoInboxApi : realInboxApi;
