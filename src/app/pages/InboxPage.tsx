import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/PageLoader';
import { IconChecks, IconMessage, IconUser, IconLoader2, IconAlertCircle, IconRotate, IconMessageOff, IconSearch, IconChevronsDown, IconX } from '@tabler/icons-react';
import { inboxApi } from '../../modules/inbox/services/inbox.api';
import type { ChatListItem, InboxAccount, InboxFilter } from '../../modules/inbox/types';
import { ToastContainer, toast } from '../../lib/toast';
import { formatRelativeTime } from '../../modules/dashboard';
import { unreadCountStore } from '../../lib/unreadCountStore';
import { newMessageNotifications } from '../../lib/newMessageNotifications';

// ============================================================================
// InboxPage
// ============================================================================

const PAGE_SIZE = 60;

export function InboxPage() {
  // Accounts (tabs)
  const [accounts, setAccounts] = useState<InboxAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [activeTabId, setActiveTabId] = useState<string>('__all__');

  // Chats for the active tab
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatsError, setChatsError] = useState<string | null>(null);

  const [filter, setFilter] = useState<InboxFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatListItem[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Pagination / infinite scroll
  const [hasMoreChats, setHasMoreChats] = useState(false);
  const [loadingMoreChats, setLoadingMoreChats] = useState(false);
  const chatOffsetRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Per-row loading state (mark as read)
  const [rowLoading, setRowLoading] = useState<Set<string>>(new Set());
  const rowLoadingRef = useRef(rowLoading);
  useEffect(() => { rowLoadingRef.current = rowLoading; }, [rowLoading]);

  const setRowLoadingKey = (key: string, loading: boolean) => {
    setRowLoading((prev) => {
      const next = new Set(prev);
      loading ? next.add(key) : next.delete(key);
      return next;
    });
  };

  // Load account list once on mount
  useEffect(() => {
    (async () => {
      try {
        setAccountsLoading(true);
        setAccountsError(null);
        const data = await inboxApi.getAccounts();
        setAccounts(data);
      } catch {
        setAccountsError('Failed to load accounts.');
      } finally {
        setAccountsLoading(false);
      }
    })();
  }, []);

  const loadChats = useCallback(
    async (fourbasedId: string, options: { silent?: boolean; append?: boolean } = {}) => {
      const { silent = false, append = false } = options;
      if (!fourbasedId) return;
      const isAll = fourbasedId === '__all__';
      const offset = append ? chatOffsetRef.current : 0;
      try {
        if (!silent && !append) { setChatsLoading(true); setChatsError(null); }
        if (append) setLoadingMoreChats(true);
        let resolved: ChatListItem[] = [];
        let pageHasMore = false;
        if (filter === 'all') {
          const data = await inboxApi.getChats({
            days: 30,
            filter: 'all',
            limit: PAGE_SIZE,
            offset,
            scope: isAll ? 'all' : 'single',
            ...(isAll ? {} : { fourbased_id: fourbasedId }),
          });
          resolved = data.data.flatMap((entry) =>
            entry.members.flatMap((m) =>
              m.accounts
                .filter((a) => isAll || a.fourbased_id === fourbasedId)
                .flatMap((a) => a.chats)
            )
          );
          pageHasMore = offset + resolved.length < data.meta.total_chats;
        } else {
          const result = await inboxApi.searchChatsPaginated({
            list_names: filter,
            limit: PAGE_SIZE,
            offset,
            ...(isAll ? {} : { fourbased_id: fourbasedId }),
          });
          resolved = result.items;
          pageHasMore = result.hasMore;
        }
        if (append) {
          setChats((prev) => [...prev, ...resolved]);
          chatOffsetRef.current += resolved.length;
          setHasMoreChats(pageHasMore);
        } else if (silent) {
          setChats((prev) => {
            const resolvedMap = new Map(resolved.map((c) => [`${c.fourbased_id}:${c.chat_id}`, c]));
            const prevIds = new Set(prev.map((c) => `${c.fourbased_id}:${c.chat_id}`));
            const newChats = resolved.filter((c) => !prevIds.has(`${c.fourbased_id}:${c.chat_id}`));
            const updated = prev.map((c) => resolvedMap.get(`${c.fourbased_id}:${c.chat_id}`) ?? c);
            return newChats.length > 0 ? [...newChats, ...updated] : updated;
          });
          newMessageNotifications.check(resolved);
          if (isAll) {
            const unreadCount = filter === 'unread'
              ? resolved.length
              : resolved.filter((c) => c.is_unread).length;
            unreadCountStore.set(unreadCount);
          }
        } else {
          setChats(resolved);
          chatOffsetRef.current = resolved.length;
          setHasMoreChats(pageHasMore);
        }
      } catch {
        if (!silent && !append) setChatsError('Failed to load chats. Please try again.');
      } finally {
        if (!silent && !append) setChatsLoading(false);
        if (append) setLoadingMoreChats(false);
      }
    },
    [filter]
  );

  // Reload chats when tab or filter changes
  useEffect(() => {
    if (!activeTabId) return;
    setChats([]);
    setSearchQuery('');
    setSearchResults(null);
    loadChats(activeTabId);
  }, [activeTabId, loadChats]);

  // Debounced API search
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 3) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const isAll = activeTabId === '__all__';
        const results = await inboxApi.searchChats({
          query: q,
          limit: PAGE_SIZE,
          ...(isAll ? {} : { fourbased_id: activeTabId }),
        });
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => {
      clearTimeout(timeoutId);
      setSearchLoading(false);
    };
  }, [searchQuery, activeTabId]);

  // Silent background refresh for the chat list (every 30 seconds)
  useEffect(() => {
    if (!activeTabId) return;
    const interval = setInterval(() => loadChats(activeTabId, { silent: true }), 30 * 1000);
    return () => clearInterval(interval);
  }, [activeTabId, loadChats]);

  // Infinite scroll: load more when sentinel enters viewport
  const loadMoreChats = useCallback(() => {
    if (!hasMoreChats || loadingMoreChats || chatsLoading) return;
    loadChats(activeTabId, { append: true });
  }, [hasMoreChats, loadingMoreChats, chatsLoading, activeTabId, loadChats]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMoreChats(); },
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMoreChats]);

  // React to chats being marked as read from other pages
  useEffect(() => {
    return newMessageNotifications.onChatRead((fourbasedId, chatId) => {
      const key = `${fourbasedId}:${chatId}`;
      if (filter === 'unread') {
        setChats((prev) => prev.filter((c) => `${c.fourbased_id}:${c.chat_id}` !== key));
      } else {
        setChats((prev) =>
          prev.map((c) =>
            `${c.fourbased_id}:${c.chat_id}` === key
              ? { ...c, is_unread: false, unread_count: 0 }
              : c
          )
        );
      }
    });
  }, [filter]);

  const handleMarkAsRead = useCallback(
    async (chat: ChatListItem) => {
      const key = `${chat.fourbased_id}:${chat.chat_id}`;
      if (rowLoadingRef.current.has(key)) return;
      setRowLoadingKey(key, true);
      const loadingId = toast.info('Marking as read…', 0);
      try {
        await inboxApi.markChatAsRead(chat.fourbased_id, chat.chat_id);
        newMessageNotifications.markChatRead(chat.fourbased_id, chat.chat_id);
        toast.dismiss(loadingId);
        toast.success('Marked as read');
        if (filter === 'unread') {
          setChats((prev) => prev.filter((c) => `${c.fourbased_id}:${c.chat_id}` !== key));
        } else {
          setChats((prev) =>
            prev.map((c) =>
              `${c.fourbased_id}:${c.chat_id}` === key
                ? { ...c, is_unread: false, unread_count: 0 }
                : c
            )
          );
        }
      } catch {
        toast.dismiss(loadingId);
        toast.error('Failed to mark as read');
      } finally {
        setRowLoadingKey(key, false);
      }
    },
    [filter]
  );

  const displayedChats = searchQuery.trim().length >= 3 ? (searchResults ?? []) : chats;
  const isDisplayLoading = chatsLoading || (searchQuery.trim().length >= 3 && searchLoading);

  return (
    <div className="space-y-6">
      <ToastContainer />

      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Inbox</h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Last 30 days</p>
      </div>

      {/* Account tabs */}
      {accountsLoading ? (
        <PageLoader message="Lade Inbox..." subtitle="Accounts werden abgerufen" />
      ) : accountsError ? (
        <div className="flex items-center gap-2 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
          <IconAlertCircle size={16} className="shrink-0" />
          {accountsError}
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {/* All-accounts tab */}
          <button
            onClick={() => setActiveTabId('__all__')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border shrink-0 ${
              activeTabId === '__all__'
                ? 'bg-brand border-brand text-white'
                : 'bg-card border-border text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            All
          </button>
          {accounts.map((acc) => (
            <button
              key={acc.fourbased_id}
              onClick={() => setActiveTabId(acc.fourbased_id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border shrink-0 ${
                activeTabId === acc.fourbased_id
                  ? 'bg-brand border-brand text-white'
                  : 'bg-card border-border text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <AccountAvatar src={acc.img_url} name={acc.name} size="sm" />
              {acc.name}
            </button>
          ))}
        </div>
      )}

      {/* Controls: search + reload + filter */}
      {!accountsLoading && !accountsError && (
        <div className="flex flex-wrap gap-3 items-center">
          {activeTabId !== '__all__' && (
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats…"
                className="w-full pl-8 pr-8 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand text-foreground placeholder-muted-foreground transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <IconX size={14} />
                </button>
              )}
            </div>
          )}

          <div className="flex-1" />

          {/* Reload */}
          <button
            onClick={() => loadChats(activeTabId)}
            disabled={chatsLoading}
            title="Reload"
            className={`flex items-center justify-center px-3 py-2 bg-brand hover:bg-brand-hover border border-brand rounded-lg transition-colors shadow-sm ${
              chatsLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            <IconRotate
              size={18}
              className="text-white"
              style={chatsLoading ? { animation: 'spin-ccw 1s linear infinite' } : {}}
            />
          </button>

          {/* Filter: All / Online / Unread */}
          <div className="flex rounded-lg border border-border bg-card overflow-hidden">
            {([['all', 'All'], ['online', 'Online'], ['unread', 'Unread']] as [InboxFilter, string][]).map(([f, label]) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                  filter === f ? 'bg-brand text-white' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat list */}
      {!accountsLoading && !accountsError && (
        isDisplayLoading ? (
          <PageLoader message="Lade Chats..." subtitle="Nachrichten der letzten 30 Tage werden abgerufen" />
        ) : chatsError ? (
          <ErrorState error={chatsError} onRetry={() => loadChats(activeTabId)} />
        ) : displayedChats.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <>
            <Card className="divide-y divide-border border border-border overflow-hidden">
              {displayedChats.map((chat) => {
                const key = `${chat.fourbased_id}:${chat.chat_id}`;
                return (
                  <ChatRow
                    key={key}
                    chat={chat}
                    isLoading={rowLoading.has(key)}
                    onMarkAsRead={handleMarkAsRead}
                  />
                );
              })}
            </Card>
            {/* Infinite scroll sentinel */}
            {searchQuery.trim().length < 3 && (
              <div ref={sentinelRef} className="flex items-center justify-center py-4">
                {loadingMoreChats ? (
                  <IconLoader2 size={18} className="animate-spin text-muted-foreground" />
                ) : hasMoreChats ? (
                  <button
                    onClick={loadMoreChats}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <IconChevronsDown size={16} />
                    Mehr laden
                  </button>
                ) : null}
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}

// ============================================================================
// Chat Row
// ============================================================================

interface ChatRowProps {
  chat: ChatListItem;
  isLoading: boolean;
  onMarkAsRead: (chat: ChatListItem) => void;
}

const ChatRow = memo(function ChatRow({ chat, isLoading, onMarkAsRead }: ChatRowProps) {
  return (
    <Link
      to={`/inbox/${chat.fourbased_id}/chat/${chat.chat_id}`}
      className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-accent/50 transition-colors group"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      {/* Avatar */}
      <AccountAvatar src={chat.customer_avatar_url ?? undefined} name={chat.customer_name} size="md" isOnline={chat.customer_is_online} />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="font-semibold text-sm text-foreground truncate">{chat.customer_name}</span>

          {/* Sales badge */}
          {typeof chat.sales_volume === 'number' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 bg-brand/10 text-brand">
              ${ (chat.sales_volume / 100).toFixed(2) }
            </span>
          )}

          {chat.is_unread && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 bg-brand/10 text-brand">
              {chat.unread_count > 0 ? `${chat.unread_count} new` : 'Unread'}
            </span>
          )}
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground truncate">{chat.last_message_preview}</p>
      </div>

      {/* Right: time + actions */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatRelativeTime(chat.last_message_at)}
        </span>

        <div className="flex items-center gap-1.5">
          {/* Mark as read — only shown when is_unread */}
          {chat.is_unread && (
            <button
              onClick={e => { e.preventDefault(); onMarkAsRead(chat); }}
              disabled={isLoading}
              title="Mark as read"
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-white bg-brand hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1"
            >
              {isLoading ? (
                <IconLoader2 size={14} className="animate-spin" />
              ) : (
                <IconChecks size={14} />
              )}
            </button>
          )}

          {/* Chat öffnen */}
          <span
            title="Chat öffnen"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground bg-muted hover:bg-accent border border-border transition-colors focus:outline-none group-hover:border-brand"
            style={{ pointerEvents: 'none' }}
          >
            <IconMessage size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
});

// ============================================================================
// Account Avatar
// ============================================================================

interface AccountAvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md';
  isOnline?: boolean;
}

const AccountAvatar = memo(function AccountAvatar({ src, name, size = 'md', isOnline }: AccountAvatarProps) {
  const [failed, setFailed] = useState(false);
  const sizeClass = { xs: 'w-4 h-4', sm: 'w-6 h-6', md: 'w-9 h-9' }[size];
  const iconSize = { xs: 10, sm: 12, md: 16 }[size];
  const textClass = { xs: 'text-[8px]', sm: 'text-[10px]', md: 'text-sm' }[size];
  const dotClass = { xs: 'w-1.5 h-1.5', sm: 'w-2 h-2', md: 'w-2.5 h-2.5' }[size];

  const avatar = !src || failed ? (
    <div
      className={`${sizeClass} rounded-full bg-muted border border-border flex items-center justify-center shrink-0 text-muted-foreground font-semibold ${textClass}`}
    >
      {(name ?? '').split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || <IconUser size={iconSize} />}
    </div>
  ) : (
    <img
      src={src}
      alt={name}
      loading="lazy"
      className={`${sizeClass} rounded-full object-cover shrink-0`}
      onError={() => setFailed(true)}
    />
  );

  if (!isOnline) return avatar;

  return (
    <div className="relative shrink-0">
      {avatar}
      <span
        className={`absolute bottom-0 right-0 ${dotClass} rounded-full bg-green-500 ring-2 ring-background`}
      />
    </div>
  );
});

// ============================================================================
// Empty State
// ============================================================================

function EmptyState({ filter }: { filter: InboxFilter }) {
  return (
    <Card className="p-12 border border-border">
      <div className="text-center text-muted-foreground">
        <IconMessageOff className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="font-medium text-muted-foreground">
          {filter === 'unread' ? 'No unread chats' : 'No chats found'}
        </p>
        <p className="text-sm mt-1 text-muted-foreground/70">
          {filter === 'unread' ? 'All caught up!' : 'No chats in the last 30 days.'}
        </p>
      </div>
    </Card>
  );
}

// ============================================================================
// Error State
// ============================================================================

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <Card className="p-12 border border-border">
      <div className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <IconAlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Error loading inbox</h3>
        <p className="text-muted-foreground mb-6 text-sm">{error}</p>
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-brand hover:bg-brand-hover text-white text-sm font-medium rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    </Card>
  );
}
