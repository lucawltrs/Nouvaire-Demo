import type { TeamMember, RegisterMemberPayload } from '../../modules/shared/services/teamApi.real';
import { store } from '../store';
import { fakeLatency } from '../utils';

export const teamApi = {
  async getMembers(): Promise<TeamMember[]> {
    await fakeLatency();
    return store.getTeamMembers();
  },

  async registerMember(payload: RegisterMemberPayload): Promise<void> {
    await fakeLatency();
    store.registerTeamMember(payload);
  },
};
