import type { Group, CreateGroupPayload } from '../../modules/shared/services/groupsApi.real';
import { store } from '../store';
import { fakeLatency } from '../utils';

export const groupsApi = {
  async list(): Promise<Group[]> {
    await fakeLatency();
    return store.listGroups();
  },

  async create(payload: CreateGroupPayload): Promise<Group> {
    await fakeLatency();
    return store.createGroup(payload);
  },

  async assignMember(groupId: number, teamUserId: number): Promise<void> {
    await fakeLatency();
    store.assignGroupMember(groupId, teamUserId);
  },

  async removeMember(groupId: number, teamUserId: number): Promise<void> {
    await fakeLatency();
    store.removeGroupMember(groupId, teamUserId);
  },
};
