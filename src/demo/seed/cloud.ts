import type { CloudAsset } from '../../modules/cloud/types';
import { DEMO_ACCOUNTS } from './accounts';

const FOLDERS = ['Feed', 'PPV', 'Story Archiv', 'Customs'];

const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();

function buildAssetsForAccount(fourbasedId: string, count: number): CloudAsset[] {
  const assets: CloudAsset[] = [];
  for (let i = 0; i < count; i++) {
    const isVideo = i % 4 === 0;
    const folder = FOLDERS[i % FOLDERS.length];
    const sold = i % 5 === 0;
    assets.push({
      _id: `asset_${fourbasedId}_${i}`,
      code: `A${i.toString().padStart(4, '0')}`,
      status: 'active',
      is_vault_item: true,
      categories: [folder],
      private: i % 3 === 0,
      description: `Vault-Inhalt #${i + 1}`,
      tag: [folder.toLowerCase()],
      type: isVideo ? 'video/mp4' : 'image/jpeg',
      fileStackType: isVideo ? 'video' : 'image',
      user_id: fourbasedId,
      extension: isVideo ? 'mp4' : 'jpg',
      width: 1080,
      height: 1350,
      dominantColor: [200, 120, 150],
      in_trend: i % 7 === 0,
      created_at: daysAgo(i * 2 + 1),
      belongs_to_folders: [folder],
      folders: FOLDERS,
      is_subscription_item: i % 6 === 0,
      price: sold ? 0 : (i % 3 === 0 ? 0 : 9.99 + (i % 5) * 5),
      own: true,
      collection: [],
      duration: isVideo ? 45 + i * 3 : undefined,
      duration_formatted: isVideo ? `0:${String(45 + (i * 3) % 60).padStart(2, '0')}` : undefined,
    });
  }
  return assets;
}

/** fourbased_id -> vault assets for that creator account. */
export const DEMO_CLOUD_ASSETS: Record<string, CloudAsset[]> = Object.fromEntries(
  DEMO_ACCOUNTS.map((account, idx) => [account.fourbased_id, buildAssetsForAccount(account.fourbased_id, 18 + (idx % 3) * 6)]),
);
