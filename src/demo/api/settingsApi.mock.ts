import type { TeamSettings, UpdateTeamSettingsPayload } from '../../modules/shared/services/settingsApi.real';
import { store } from '../store';
import { fakeLatency } from '../utils';

export const settingsApi = {
  async get(): Promise<TeamSettings> {
    await fakeLatency();
    return store.getSettings();
  },

  async update(payload: UpdateTeamSettingsPayload): Promise<TeamSettings> {
    await fakeLatency();
    return store.updateSettings(payload);
  },
};
