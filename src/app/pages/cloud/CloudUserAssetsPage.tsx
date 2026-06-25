import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { IconArrowLeft, IconMovie, IconLoader2, IconRefresh, IconAlertCircle, IconUser, IconCopy, IconExternalLink, IconPhoto, IconLayoutGrid } from '@tabler/icons-react';
import { cloudApi, relativeTime, unblurUrl } from '../../../modules/cloud/cloudApi';
import { PageLoader } from '../../../components/ui/PageLoader';
import { toast } from '../../../lib/toast';
import { ToastContainer } from '../../../lib/toast';
import type { CloudAsset, CloudUser } from '../../../modules/cloud/types';

// ── Filter chip ───────────────────────────────────────────────────────────────
type AssetType = 'all' | 'image' | 'video';

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors border"
      style={
        active
          ? {
              background: 'rgba(237,76,39,0.12)',
              color: '#ED4C27',
              borderColor: 'rgba(237,76,39,0.3)',
            }
          : { background: '#1E293B', color: '#9CA3AF', borderColor: '#334155' }
      }
    >
      {label}
    </button>
  );
}

// ── Asset tile ────────────────────────────────────────────────────────────────
function AssetTile({ asset }: { asset: CloudAsset }) {

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(unblurUrl(asset.img_url));
      toast.success('Link kopiert!');
    } catch {
      toast.error('Kopieren fehlgeschlagen');
    }
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(unblurUrl(asset.img_url), '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => window.open(unblurUrl(asset.img_url), '_blank', 'noopener,noreferrer')}
      onKeyDown={(e) => {
        if (e.key === 'Enter') window.open(unblurUrl(asset.img_url), '_blank', 'noopener,noreferrer');
      }}
      className="group relative rounded-xl overflow-hidden border border-border hover:shadow-lg transition-shadow cursor-pointer bg-card"
    >
      {/* Preview */}
      <div className="aspect-square bg-muted overflow-hidden">
        {asset.fileStackType === 'video' ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-900 relative">
            <img
              src={unblurUrl(asset.img_url)}
              alt={asset.description ?? asset._id}
              className="w-full h-full object-cover opacity-70"
              loading="lazy"
            />
            <IconMovie size={32} className="absolute text-white drop-shadow" />
          </div>
        ) : (
          <img
            src={unblurUrl(asset.img_url)}
            alt={asset.description ?? asset._id}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        )}
      </div>

      {/* Hover overlay actions */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl" />
      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={handleCopy}
          title="Link kopieren"
          className="w-7 h-7 bg-muted/90 hover:bg-muted rounded-lg flex items-center justify-center shadow text-foreground transition-colors"
        >
          <IconCopy size={13} />
        </button>
        <button
          type="button"
          onClick={handleOpen}
          title="Original öffnen"
          className="w-7 h-7 bg-muted/90 hover:bg-muted rounded-lg flex items-center justify-center shadow text-foreground transition-colors"
        >
          <IconExternalLink size={13} />
        </button>
      </div>

      {/* Footer */}
      <div className="px-2 py-1.5 border-t border-border">
        <p className="text-[11px] text-muted-foreground truncate">{relativeTime(asset.created_at)}</p>
      </div>
    </div>
  );
}

// ── IconUser avatar ───────────────────────────────────────────────────────────────
function UserAvatar({ src, name, size = 'sm' }: { src?: string | null; name: string; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-10 h-10' : 'w-8 h-8';
  const iconSz = size === 'md' ? 18 : 14;
  if (!src)
    return (
      <div className={`${cls} rounded-full bg-muted border border-border flex items-center justify-center shrink-0 text-muted-foreground font-semibold text-xs`}>
        <IconUser size={iconSz} />
      </div>
    );
  return (
        <img src={src} alt={name} className={`${cls} rounded-full object-cover shrink-0 border border-border`} />
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CloudUserAssetsPage() {
  const { fourbased_id } = useParams<{ fourbased_id: string }>();
  const [user, setUser] = useState<CloudUser | null>(null);
  const [assets, setAssets] = useState<CloudAsset[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState<AssetType>('all');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadInitial = useCallback(
    async (type: AssetType, folder: string | null) => {
      if (!fourbased_id) return;
      setLoading(true);
      setError(null);
      setAssets([]);
      setNextOffset(null);
      setHasMore(false);
      try {
        const [userData, assetsData] = await Promise.all([
          cloudApi.getUser(fourbased_id).catch(() => null),
          cloudApi.getAssets(fourbased_id, {
            fileStackType: type === 'all' ? undefined : type,
            belongs_to_folders: folder ?? undefined,
          }),
        ]);
        setUser(userData ?? { fourbased_id, name: fourbased_id });
        setAssets(assetsData.response);
        setNextOffset(assetsData.pagination?.next_offset ?? null);
        setHasMore(assetsData.pagination?.has_more ?? false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden');
      } finally {
        setLoading(false);
      }
    },
    [fourbased_id],
  );

  useEffect(() => {
    loadInitial(filter, activeFolder);
  }, [loadInitial, filter, activeFolder]);

  // Folders come from the user account object
  const allFolders = user?.folders ?? [];

  const visibleAssets = assets;

  const loadMore = useCallback(async () => {
    if (!fourbased_id || !hasMore || nextOffset === null || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await cloudApi.getAssets(fourbased_id, {
        fileStackType: filter === 'all' ? undefined : filter,
        belongs_to_folders: activeFolder ?? undefined,
        offset: nextOffset,
      });
      setAssets((prev) => [...prev, ...data.response]);
      setNextOffset(data.pagination?.next_offset ?? null);
      setHasMore(data.pagination?.has_more ?? false);
    } catch {
      toast.error('Weitere Assets konnten nicht geladen werden.');
    } finally {
      setLoadingMore(false);
    }
  }, [fourbased_id, hasMore, nextOffset, loadingMore, filter, activeFolder]);

  const loadMoreRef = useRef(loadMore);
  useEffect(() => { loadMoreRef.current = loadMore; }, [loadMore]);

  // Infinite scroll via IntersectionObserver – set up once, always uses latest loadMore via ref
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreRef.current();
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="space-y-5">
      <ToastContainer />

      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          to="/cloud"
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-card shadow-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          aria-label="Zurück zur Übersicht"
        >
          <IconArrowLeft size={16} />
        </Link>

        {user ? (
          <>
            <UserAvatar src={user.img_url} name={user.name} size="md" />
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">{user.name}</h1>
              {user.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
            </div>
            {user.assets_count != null && (
              <span
                className="ml-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(237,76,39,0.12)', color: '#ED4C27' }}
              >
                {user.assets_count} Assets
              </span>
            )}
            <div className="flex-1" />
            <a
              href="https://4based.com/cloud"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white font-medium shadow hover:bg-[#d13e1e] transition-colors"
              style={{ marginLeft: 'auto' }}
            >
              <IconExternalLink size={16} />
              IconCloud öffnen
            </a>
          </>
        ) : (
          <div className="h-6 w-40 bg-muted rounded animate-pulse" />
        )}
      </div>

      {/* Type filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterChip label="Alle" active={filter === 'all'} onClick={() => { setFilter('all'); setActiveFolder(null); }} />
        <FilterChip
          label={<span className="flex items-center gap-1"><IconPhoto size={12} />Bilder</span>}
          active={filter === 'image'}
          onClick={() => { setFilter('image'); setActiveFolder(null); }}
        />
        <FilterChip
          label={<span className="flex items-center gap-1"><IconMovie size={12} />Videos</span>}
          active={filter === 'video'}
          onClick={() => { setFilter('video'); setActiveFolder(null); }}
        />
      </div>

      {/* Folder filter chips – only shown when folders are available */}
      {allFolders.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide shrink-0">Ordner</span>
          <FilterChip label="Alle" active={activeFolder === null} onClick={() => setActiveFolder(null)} />
          {allFolders.map((folder) => (
            <FilterChip
              key={folder}
              label={folder}
              active={activeFolder === folder}
              onClick={() => setActiveFolder(f => f === folder ? null : folder)}
            />
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <PageLoader message="Lade Assets..." subtitle="Mediendateien werden geladen" />
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <IconAlertCircle size={36} className="text-red-400" />
          <p className="text-foreground font-medium">Fehler beim Laden</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            type="button"
            onClick={() => loadInitial(filter, activeFolder)}
            className="flex items-center gap-2 mt-2 px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors text-foreground"
          >
            <IconRefresh size={14} /> Erneut versuchen
          </button>
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
          <IconLayoutGrid size={36} className="text-foreground" />
          <p className="text-muted-foreground font-medium">Keine Assets gefunden.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {visibleAssets.map((asset) => (
            <AssetTile key={asset._id} asset={asset} />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel – always in the DOM so the observer can attach */}
      <div ref={sentinelRef} className="flex justify-center py-4">
        {loadingMore && <IconLoader2 size={22} className="animate-spin text-muted-foreground" />}
      </div>
    </div>
  );
}
