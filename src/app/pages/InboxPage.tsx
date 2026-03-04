import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import {
  CheckCheck,
  MessageSquare,
  User,
  Loader2,
  AlertCircle,
  ChevronDown,
  Users,
  RotateCcw,
  MessageSquareOff,
  Search,
} from 'lucide-react';
import { inboxApi } from '../../modules/inbox/services/inbox.api';
import type { ChatListItem, InboxFilter, InboxScope } from '../../modules/inbox/types';
import { ToastContainer, toast } from '../../lib/toast';
import { formatRelativeTime } from '../../modules/dashboard';

// ============================================================================
// Types
// ============================================================================

interface AccountOption {
  fourbased_id: string;
  name: string;
  img_url?: string;
}

// ============================================================================
// InboxPage
// ============================================================================

const PAGE_SIZE = 30;

export function InboxPage() {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const [filter, setFilter] = useState<InboxFilter>('all');
  const [scope, setScope] = useState<InboxScope>('all');
  const [selectedFourbasedId, setSelectedFourbasedId] = useState<string>('');
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Track loading state per chat row
  const [rowLoading, setRowLoading] = useState<Set<string>>(new Set());

  const setRowLoadingKey = (key: string, loading: boolean) => {
    setRowLoading((prev) => {
      const next = new Set(prev);
      loading ? next.add(key) : next.delete(key);
      return next;
    });
  };

  // Fetch chats (reset or append)
  const fetchChats = useCallback(
    async (newOffset: number, append = false) => {
      try {
        append ? setIsLoadingMore(true) : setIsLoading(true);
        setError(null);

        const data = await inboxApi.getChats({
          days: 30,
          filter,
          limit: PAGE_SIZE,
          offset: newOffset,
          scope,
          fourbased_id: scope === 'single' ? selectedFourbasedId : undefined,
        });

        setChats((prev) => (append ? [...prev, ...data.data] : data.data));
        setHasMore(data.meta.has_more);
        setOffset(newOffset);

        // Collect unique accounts from the results for the scope dropdown
        if (!append && scope === 'all') {
          const seen = new Map<string, AccountOption>();
          data.data.forEach((chat) => {
            if (chat.fourbased_id && !seen.has(chat.fourbased_id)) {
              seen.set(chat.fourbased_id, {
                fourbased_id: chat.fourbased_id,
                name: chat.account_name ?? chat.fourbased_id,
                img_url: chat.account_img_url,
              });
            }
          });
          if (seen.size > 0) {
            setAccounts(Array.from(seen.values()));
          }
        }
      } catch (err) {
        console.error('Failed to fetch chats:', err);
        setError('Failed to load chats. Please try again.');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [filter, scope, selectedFourbasedId]
  );

  // Reset + fetch on param changes
  useEffect(() => {
    fetchChats(0, false);
  }, [fetchChats]);

  // Mark as read handler
  const handleMarkAsRead = useCallback(
    async (chat: ChatListItem) => {
      const key = `${chat.fourbased_id}:${chat.chat_id}`;
      if (rowLoading.has(key)) return;

      setRowLoadingKey(key, true);
      const loadingId = toast.info('Marking as read…', 0);

      try {
        await inboxApi.markChatAsRead(chat.fourbased_id, chat.chat_id);
        toast.dismiss(loadingId);
        toast.success('Marked as read');

        // Optimistic update
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
      } catch (err) {
        console.error('Failed to mark as read:', err);
        toast.dismiss(loadingId);
        toast.error('Failed to mark as read');
      } finally {
        setRowLoadingKey(key, false);
      }
    },
    [filter, rowLoading]
  );

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchChats(offset + PAGE_SIZE, true);
    }
  };

  const handleScopeChange = (newScope: InboxScope, fourbasedId = '') => {
    setScope(newScope);
    setSelectedFourbasedId(fourbasedId);
  };

  const selectedAccountName =
    scope === 'single'
      ? accounts.find((a) => a.fourbased_id === selectedFourbasedId)?.name ?? selectedFourbasedId
      : 'All accounts';

  return (
    <div className="space-y-6">
      <ToastContainer />

      {/* Header */}
      <InboxHeader
        filter={filter}
        onFilterChange={(f) => setFilter(f)}
        accounts={accounts}
        scope={scope}
        selectedFourbasedId={selectedFourbasedId}
        selectedAccountName={selectedAccountName}
        onScopeChange={handleScopeChange}
        isLoading={isLoading}
        onReload={() => fetchChats(0, false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Content */}
      {(() => {
        const filteredChats = searchQuery.trim()
          ? chats.filter(
              (c) =>
                c.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.last_message_preview ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.account_name ?? '').toLowerCase().includes(searchQuery.toLowerCase())
            )
          : chats;
        return isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState error={error} onRetry={() => fetchChats(0, false)} />
        ) : filteredChats.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <>
            <Card className="divide-y divide-slate-700 border border-slate-600 overflow-hidden">
              {filteredChats.map((chat) => {
              const key = `${chat.fourbased_id}:${chat.chat_id}`;
              return (
                <ChatRow
                  key={key}
                  chat={chat}
                  showAccountName={scope === 'all'}
                  isLoading={rowLoading.has(key)}
                  onMarkAsRead={handleMarkAsRead}
                />
              );
            })}
            </Card>

            {hasMore && !searchQuery.trim() && (
              <div className="flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-[#ED4C27] hover:bg-[#D8431F] rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Loading…
                    </>
                  ) : (
                    'Load more'
                  )}
                </button>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}

// ============================================================================
// Inbox Header
// ============================================================================

interface InboxHeaderProps {
  filter: InboxFilter;
  onFilterChange: (f: InboxFilter) => void;
  accounts: AccountOption[];
  scope: InboxScope;
  selectedFourbasedId: string;
  selectedAccountName: string;
  onScopeChange: (scope: InboxScope, fourbasedId?: string) => void;
  isLoading: boolean;
  onReload: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

function InboxHeader({
  filter,
  onFilterChange,
  accounts,
  scope,
  selectedFourbasedId,
  selectedAccountName,
  onScopeChange,
  isLoading,
  onReload,
  searchQuery,
  onSearchChange,
}: InboxHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {/* Title row */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">Inbox</h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-400">Last 30 days</p>
      </div>

      {/* Controls row: search (left) + actions (right) */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search bar */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search chats…"
            className="w-full pl-8 pr-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ED4C27]/40 focus:border-[#ED4C27] text-gray-100 placeholder-gray-500 transition-colors"
          />
        </div>

        {/* Spacer pushes actions to the right */}
        <div className="flex-1" />

        {/* Reload */}
        <button
          onClick={onReload}
          disabled={isLoading}
          title="Reload"
          className={`flex items-center justify-center px-3 py-2 bg-[#ED4C27] hover:bg-[#D8431F] border border-[#ED4C27] hover:border-[#D8431F] rounded-lg transition-colors shadow-sm hover:shadow-md ${
            isLoading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          <RotateCcw
            size={18}
            className="text-white"
            style={isLoading ? { animation: 'spin-ccw 1s linear infinite' } : {}}
          />
        </button>

        {/* Filter tabs: All / Unread */}
        <div className="flex rounded-lg border border-slate-600 bg-card overflow-hidden">
          {(['all', 'unread'] as InboxFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`px-4 py-2 text-xs sm:text-sm font-medium transition-colors capitalize ${
                filter === f ? 'bg-[#ED4C27] text-white' : 'text-gray-300 hover:bg-slate-700'
              }`}
            >
              {f === 'all' ? 'All' : 'Unread'}
            </button>
          ))}
        </div>

        {/* Scope / account dropdown */}
        {accounts.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen((o) => !o)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-300 bg-card border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors max-w-[180px] sm:max-w-none"
            >
              <span className="truncate">{selectedAccountName}</span>
              <ChevronDown
                size={16}
                className={`transition-transform shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-slate-600 rounded-lg shadow-lg z-20 overflow-hidden">
                  <button
                    onClick={() => {
                      onScopeChange('all');
                      setIsDropdownOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      scope === 'all'
                        ? 'bg-[#ED4C27] text-white'
                        : 'text-gray-300 hover:bg-slate-700'
                    }`}
                  >
                    <Users size={16} className="shrink-0" />
                    <span>All accounts</span>
                  </button>
                  {accounts.map((acc) => (
                    <button
                      key={acc.fourbased_id}
                      onClick={() => {
                        onScopeChange('single', acc.fourbased_id);
                        setIsDropdownOpen(false);
                      }}
                      className={`flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        scope === 'single' && selectedFourbasedId === acc.fourbased_id
                          ? 'bg-[#ED4C27] text-white'
                          : 'text-gray-300 hover:bg-slate-700'
                      }`}
                    >
                      <AccountAvatar src={acc.img_url} name={acc.name} size="sm" />
                      <span className="truncate">{acc.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Chat Row
// ============================================================================

interface ChatRowProps {
  chat: ChatListItem;
  showAccountName: boolean;
  isLoading: boolean;
  onMarkAsRead: (chat: ChatListItem) => void;
}

function ChatRow({ chat, showAccountName, isLoading, onMarkAsRead }: ChatRowProps) {
  return (
    <Link
      to={`/inbox/${chat.fourbased_id}/chat/${chat.chat_id}`}
      className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-slate-700/50 transition-colors group"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      {/* Avatar */}
      <AccountAvatar src={chat.customer_avatar_url} name={chat.customer_name} size="md" />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="font-semibold text-sm text-gray-100 truncate">{chat.customer_name}</span>

          {/* Sales badge */}
          {typeof chat.sales_volume === 'number' && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold shrink-0"
              style={{ background: 'rgba(237,76,39,0.12)', color: '#ED4C27' }}
            >
              ${ (chat.sales_volume / 100).toFixed(2) }
            </span>
          )}

          {chat.is_unread && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold shrink-0"
              style={{ background: 'rgba(237,76,39,0.12)', color: '#ED4C27' }}
            >
              {chat.unread_count > 0 ? `${chat.unread_count} new` : 'Unread'}
            </span>
          )}

          {showAccountName && chat.account_name && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-gray-400 shrink-0">
              <AccountAvatar src={chat.account_img_url} name={chat.account_name} size="xs" />
              {chat.account_name}
            </span>
          )}
        </div>

        <p className="text-xs sm:text-sm text-gray-500 truncate">{chat.last_message_preview}</p>
      </div>

      {/* Right: time + actions */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {formatRelativeTime(chat.last_message_at)}
        </span>

        <div className="flex items-center gap-1.5">
          {/* Mark as read — only shown when is_unread */}
          {chat.is_unread && (
            <button
              onClick={e => { e.preventDefault(); onMarkAsRead(chat); }}
              disabled={isLoading}
              title="Mark as read"
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-white bg-[#ED4C27] hover:bg-[#D8431F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#ED4C27] focus:ring-offset-1"
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCheck size={14} />
              )}
            </button>
          )}

          {/* Chat öffnen */}
          <span
            title="Chat öffnen"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 group-hover:border-[#ED4C27]"
            style={{ pointerEvents: 'none' }}
          >
            <MessageSquare size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ============================================================================
// Account Avatar
// ============================================================================

interface AccountAvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md';
}

function AccountAvatar({ src, name, size = 'md' }: AccountAvatarProps) {
  const sizeClass = { xs: 'w-4 h-4', sm: 'w-6 h-6', md: 'w-9 h-9' }[size];
  const iconSize = { xs: 10, sm: 12, md: 16 }[size];
  const textClass = { xs: 'text-[8px]', sm: 'text-[10px]', md: 'text-sm' }[size];

  if (!src) {
    const initials = name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');

    return (
      <div
        className={`${sizeClass} rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0 text-gray-400 font-semibold ${textClass}`}
      >
        {initials || <User size={iconSize} />}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={`${sizeClass} rounded-full object-cover shrink-0`}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function LoadingSkeleton() {
  return (
    <Card className="divide-y divide-slate-700 border border-slate-600 overflow-hidden animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4">
          <div className="w-9 h-9 rounded-full bg-slate-700 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-slate-700 rounded w-32" />
            <div className="h-3 bg-slate-700 rounded w-48" />
          </div>
          <div className="h-3 bg-slate-700 rounded w-12" />
        </div>
      ))}
    </Card>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState({ filter }: { filter: InboxFilter }) {
  return (
    <Card className="p-12 border border-slate-600">
      <div className="text-center text-gray-500">
        <MessageSquareOff className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium text-gray-400">
          {filter === 'unread' ? 'No unread chats' : 'No chats found'}
        </p>
        <p className="text-sm mt-1">
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
    <Card className="p-12 border border-slate-600">
      <div className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-100 mb-2">Error loading inbox</h3>
        <p className="text-gray-400 mb-6 text-sm">{error}</p>
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-[#ED4C27] hover:bg-[#D8431F] text-white text-sm font-medium rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    </Card>
  );
}
