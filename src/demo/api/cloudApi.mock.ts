import type { CloudUser, CloudAssetDetails, CloudAssetsResponse } from '../../modules/cloud/types';
import { store } from '../store';
import { fakeLatency } from '../utils';

export const cloudApi = {
  async getUsers(): Promise<CloudUser[]> {
    await fakeLatency();
    return store.getCloudUsers();
  },

  async getUser(fourbasedId: string): Promise<CloudUser> {
    await fakeLatency();
    const user = store.getCloudUser(fourbasedId);
    if (!user) throw new Error(`Failed to fetch user: 404`);
    return user;
  },

  async getAssets(
    fourbasedId: string,
    params: {
      limit?: number;
      offset?: number;
      belongs_to_folders?: string;
      file_type?: string;
      sold?: boolean;
      sent?: boolean;
      buyer_user_id?: string;
    } = {},
  ): Promise<CloudAssetsResponse> {
    await fakeLatency();
    const { response, pagination } = store.getCloudAssets(fourbasedId, params);
    return { fourbased_id: fourbasedId, status: 200, query: params, response, pagination };
  },

  async getAsset(assetId: string): Promise<CloudAssetDetails> {
    await fakeLatency();
    const asset = store.getCloudAsset(assetId);
    if (!asset) throw new Error(`Failed to fetch asset: 404`);
    return asset;
  },
};
