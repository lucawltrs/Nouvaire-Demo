import type { FourBasedUser, UpdateFourBasedUserPayload, AssignFourBasedUserPayload } from '../../modules/shared/services/fourbasedUsersApi.real';
import { store } from '../store';
import { fakeLatency } from '../utils';

export const fourbasedUsersApi = {
  async list(): Promise<FourBasedUser[]> {
    await fakeLatency();
    return store.listFourBasedUsers();
  },

  async update(fourbasedId: string, payload: UpdateFourBasedUserPayload): Promise<FourBasedUser> {
    await fakeLatency();
    return store.updateFourBasedUser(fourbasedId, payload);
  },

  async delete(fourbasedId: string): Promise<void> {
    await fakeLatency();
    store.deleteFourBasedUser(fourbasedId);
  },

  async assign(payload: AssignFourBasedUserPayload): Promise<void> {
    await fakeLatency();
    store.assignFourBasedUser(payload.fourbased_user_id, payload.team_group_id);
  },

  async unassign(fourbasedId: string): Promise<void> {
    await fakeLatency();
    store.unassignFourBasedUser(fourbasedId);
  },
};
