import { DEMO_MODE } from '../../../demo/config';
import { teamApi as realTeamApi } from './teamApi.real';
import { teamApi as demoTeamApi } from '../../../demo/api/teamApi.mock';

export const teamApi: typeof realTeamApi = DEMO_MODE ? demoTeamApi : realTeamApi;

export type { TeamMember, RegisterMemberPayload } from './teamApi.real';
