export interface CloudUser {
  fourbased_id: string;
  name: string;
  email?: string;
  img_url?: string | null;
  assets_count?: number;
  last_asset_at?: string | null;
}

/** Matches the real 4based vault API response item */
export interface CloudAsset {
  _id: string;
  code: string;
  status: string;
  is_vault_item: boolean;
  categories: string[];
  private: boolean;
  description?: string | null;
  tag: string[];
  crop?: { x1: number; y1: number; x2: number; y2: number };
  /** MIME type, e.g. "image/jpeg" */
  type: string;
  /** Media kind: "image" | "video" | "audio" | … */
  fileStackType: string;
  user_id: string;
  extension: string;
  width?: number;
  height?: number;
  dominantColor?: [number, number, number];
  in_trend: boolean;
  media_language?: string;
  created_at: string;
  status_media_controlled?: string;
  belongs_to_folders: string[];
  /** Top-level folder list returned by the vault endpoint */
  folders?: string[];
  is_subscription_item: boolean;
  price: number;
  own: boolean;
  collection: unknown[];
  /** Preview / CDN thumbnail URL */
  img_url: string;
}

/** CloudAssetDetails — same shape, all fields already present in CloudAsset */
export type CloudAssetDetails = CloudAsset;

export interface CloudAssetsResponse {
  fourbased_id: string;
  status: number;
  query: Record<string, unknown>;
  response: CloudAsset[];
  pagination?: {
    limit: number;
    offset: number;
    count: number;
    has_more: boolean;
    next_offset: number;
  };
}
