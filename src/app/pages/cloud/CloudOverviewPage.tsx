import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cloud, Search, User, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { cloudApi, relativeTime } from '../../../modules/cloud/cloudApi';
import type { CloudUser } from '../../../modules/cloud/types';

// ── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 animate-pulse">
      <div className="w-11 h-11 rounded-full bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-40 bg-gray-200 rounded" />
        <div className="h-3 w-56 bg-gray-100 rounded" />
      </div>
      <div className="h-6 w-16 bg-gray-100 rounded-full" />
      <div className="h-6 w-20 bg-gray-100 rounded-full" />
      <div className="h-8 w-20 bg-gray-100 rounded-lg" />
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function UserAvatar({ src, name }: { src?: string | null; name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  if (!src)
    return (
      <div className="w-11 h-11 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 text-gray-500 font-semibold text-sm">
        {initials || <User size={18} />}
      </div>
    );
  return (
    <img
      src={src}
      alt={name}
      className="w-11 h-11 rounded-full object-cover shrink-0 border border-gray-200"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}

// ── Sort options ──────────────────────────────────────────────────────────────

export default function CloudOverviewPage() {
  const [users, setUsers] = useState<CloudUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  // Sortierfunktion entfernt

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cloudApi.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? users.filter(
          (u) =>
            u.name.toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q),
        )
      : [...users];
  }, [users, search]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(237,76,39,0.12)' }}
          >
            <Cloud size={20} style={{ color: '#ED4C27' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cloud</h1>
            <p className="text-sm text-gray-500">Assets verwalten</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suche nach Name oder E-Mail…"
            className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
            style={{ '--tw-ring-color': '#ED4C27' } as React.CSSProperties}
          />
        </div>

        {/* Sortierfunktion entfernt */}
      </div>

      {/* Content */}
      <Card className="rounded-2xl overflow-hidden divide-y divide-gray-100">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-4">
            <AlertCircle size={36} className="text-red-400" />
            <p className="text-gray-700 font-medium">Fehler beim Laden</p>
            <p className="text-sm text-gray-500">{error}</p>
            <button
              type="button"
              onClick={load}
              className="flex items-center gap-2 mt-2 px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700"
            >
              <RefreshCw size={14} />
              Erneut versuchen
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center px-4">
            <Cloud size={36} className="text-gray-300" />
            <p className="text-gray-500 font-medium">
              {search.trim() ? 'Keine Treffer.' : 'Keine Creator-Accounts verbunden.'}
            </p>
          </div>
        ) : (
          filtered.map((user) => (
            <div key={user.fourbased_id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
              <UserAvatar src={user.img_url} name={user.name} />

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{user.name}</p>
                {user.email && (
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                {user.assets_count != null && (
                  <Badge size="sm">{user.assets_count} Assets</Badge>
                )}
                {user.last_asset_at && (
                  <Badge size="sm" variant="default">
                    {relativeTime(user.last_asset_at)}
                  </Badge>
                )}
              </div>

              <Link
                to={`/cloud/users/${user.fourbased_id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium shrink-0 transition-colors text-white"
                style={{ background: '#ED4C27' }}
              >
                Öffnen <ChevronRight size={14} />
              </Link>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
