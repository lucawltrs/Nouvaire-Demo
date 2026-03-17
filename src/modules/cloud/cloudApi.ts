import { getConfig } from '../../lib/config';
import type { CloudUser, CloudAssetDetails, CloudAssetsResponse } from './types';

const apiFetch = async (path: string, options: RequestInit = {}) => {
  const { API_URL } = getConfig();
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
};

export const cloudApi = {
  /** List all connected creator accounts */
  getUsers(): Promise<CloudUser[]> {
    return apiFetch('/4based/users');
  },

  /** Single creator account */
  getUser(fourbasedId: string): Promise<CloudUser> {
    return apiFetch(`/4based/users/${fourbasedId}`);
  },

  /** Paginated asset list for one creator */
  getAssets(
    fourbasedId: string,
    params: { fileStackType?: string; limit?: number; offset?: number } = {},
  ): Promise<CloudAssetsResponse> {
    const q = new URLSearchParams();
    if (params.fileStackType) q.set('fileStackType', params.fileStackType);
    q.set('limit', String(params.limit ?? 60));
    q.set('offset', String(params.offset ?? 0));
    q.set('sort', JSON.stringify({ created_at: 'desc' }));
    q.set('with_source', 'true');
    return apiFetch(`/4based/users/${fourbasedId}/vault?${q}`);
  },

  /** Single asset details */
  getAsset(assetId: string): Promise<CloudAssetDetails> {
    return apiFetch(`/cloud/assets/${assetId}`);
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
export function unblurUrl(url: string): string {
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
