import { getConfig } from '../../lib/config';
import type { CloudUser, CloudAssetDetails, CloudAssetsResponse } from './types';

const getTeamId = (): number => {
  const match = document.cookie.match(/(?:^|; )auth_team=([^;]*)/);
  if (!match) throw new Error('No team found in cookie');
  const team = JSON.parse(decodeURIComponent(match[1]));
  return team.team_id;
};

const apiFetch = async (path: string, options: RequestInit = {}) => {
  const { API_URL } = getConfig();
  const token = localStorage.getItem('auth_token');
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
};

export const cloudApi = {
  /** List all connected creator accounts */
  async getUsers(): Promise<CloudUser[]> {
    const response = await apiFetch(`/teams/${getTeamId()}/fourbased-users`);
    if (!response.ok) throw new Error(`Failed to fetch users: ${response.status}`);
    const raw = await response.json();
    return (raw?.data?.accounts ?? raw) as CloudUser[];
  },

  /** Single creator account */
  async getUser(fourbasedId: string): Promise<CloudUser> {
    const response = await apiFetch(`/teams/${getTeamId()}/fourbased-users/${fourbasedId}`);
    if (!response.ok) throw new Error(`Failed to fetch user: ${response.status}`);
    const raw = await response.json();
    return (raw?.data?.account ?? raw) as CloudUser;
  },

  /** Paginated asset list for one creator */
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
    const q = new URLSearchParams();
    q.set('limit', String(params.limit ?? 60));
    q.set('offset', String(params.offset ?? 0));
    q.set('sort', JSON.stringify({ created_at: 'desc' }));
    q.set('with_source', 'true');
    if (params.belongs_to_folders) q.set('belongs_to_folders', params.belongs_to_folders);
    if (params.file_type) q.set('file_type', params.file_type);
    if (params.sold !== undefined) q.set('sold', String(params.sold));
    if (params.sent !== undefined) q.set('sent', String(params.sent));
    if (params.buyer_user_id) q.set('buyer_user_id', params.buyer_user_id);
    const response = await apiFetch(`/4based/users/${fourbasedId}/vault?${q}`);
    if (!response.ok) throw new Error(`Failed to fetch assets: ${response.status}`);
    return response.json() as Promise<CloudAssetsResponse>;
  },

  /** Single asset details */
  async getAsset(assetId: string): Promise<CloudAssetDetails> {
    const response = await apiFetch(`/cloud/assets/${assetId}`);
    if (!response.ok) throw new Error(`Failed to fetch asset: ${response.status}`);
    return response.json() as Promise<CloudAssetDetails>;
  },
};

// ── helpers ────────────────────────────────────────────────────────────────

export function formatBytes(bytes?: number | null): string {
  if (bytes == null) return '–';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function relativeTime(dateStr?: string | null): string {
  if (!dateStr) return '–';
  const ms = Date.now() - new Date(dateStr.replace(' ', 'T')).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return 'Gerade eben';
  const m = Math.floor(s / 60);
  if (m < 60) return `vor ${m} Min.`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.floor(h / 24);
  if (d < 30) return `vor ${d} Tag${d === 1 ? '' : 'en'}`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `vor ${mo} Monat${mo === 1 ? '' : 'en'}`;
  return `vor ${Math.floor(mo / 12)} Jahr${Math.floor(mo / 12) === 1 ? '' : 'en'}`;
}

/**
 * Strips the 4based blur/obscure flag (?o=1) from a CDN URL so the
 * full-quality unblurred image is displayed.
 */
export function unblurUrl(url?: string | null): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    u.searchParams.delete('o');
    return u.toString();
  } catch {
    return url.replace(/([?&])o=1(&|$)/, (_m, prefix, suffix) =>
      suffix === '&' ? prefix : '',
    );
  }
}
