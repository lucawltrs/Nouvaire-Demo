import { DEMO_MODE } from '../../../demo/config';
import { fourbasedUsersApi as realFourbasedUsersApi } from './fourbasedUsersApi.real';
import { fourbasedUsersApi as demoFourbasedUsersApi } from '../../../demo/api/fourbasedUsersApi.mock';

export const fourbasedUsersApi: typeof realFourbasedUsersApi = DEMO_MODE ? demoFourbasedUsersApi : realFourbasedUsersApi;

export type {
  FourBasedUser,
  FourBasedUserAssignedTo,
  UpdateFourBasedUserPayload,
  AssignFourBasedUserPayload,
} from './fourbasedUsersApi.real';
