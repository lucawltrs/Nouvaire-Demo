import type { CreateMassMessagePayload, MassMessage, MassMessagesListParams, MassMessagesListResponse, UserList } from '../../modules/mass-messages/types';
import { store } from '../store';
import { fakeLatency } from '../utils';

export const massMessagesApi = {
  async list(fourbasedId: string, params: MassMessagesListParams = {}): Promise<MassMessagesListResponse> {
    await fakeLatency();
    return store.listMassMessages(fourbasedId, params);
  },

  async create(fourbasedId: string, payload: CreateMassMessagePayload): Promise<MassMessage> {
    await fakeLatency();
    return store.createMassMessage(fourbasedId, payload);
  },

  async delete(fourbasedId: string, massMessageId: string): Promise<void> {
    await fakeLatency();
    store.deleteMassMessage(fourbasedId, massMessageId);
  },

  async getUserLists(fourbasedId: string): Promise<UserList[]> {
    await fakeLatency();
    return store.getUserLists(fourbasedId);
  },
};
