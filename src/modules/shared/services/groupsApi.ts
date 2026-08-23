import { DEMO_MODE } from '../../../demo/config';
import { groupsApi as realGroupsApi } from './groupsApi.real';
import { groupsApi as demoGroupsApi } from '../../../demo/api/groupsApi.mock';

export const groupsApi: typeof realGroupsApi = DEMO_MODE ? demoGroupsApi : realGroupsApi;

export type { Group, GroupTeamUser, CreateGroupPayload } from './groupsApi.real';
