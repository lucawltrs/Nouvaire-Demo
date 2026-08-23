import { DEMO_MODE } from '../../../demo/config';
import { settingsApi as realSettingsApi } from './settingsApi.real';
import { settingsApi as demoSettingsApi } from '../../../demo/api/settingsApi.mock';

export const settingsApi: typeof realSettingsApi = DEMO_MODE ? demoSettingsApi : realSettingsApi;

export type { TeamSettings, UpdateTeamSettingsPayload } from './settingsApi.real';
