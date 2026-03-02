import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Receipt, Inbox, MessageSquareText, Heart, Users, Circle, Clock, ChevronDown, AlertCircle, User, CheckCheck, CornerUpLeft, Loader2 } from 'lucide-react';
import { 
  dashboardApi, 
  type DashboardAccount,
  type DashboardApiResponse,
  type MergedUnreadChat,
  aggregateDashboard,
  mergeUnreadChats,
  formatCurrency,
  formatDate,
  formatRelativeTime,
} from '../../modules/dashboard';
import { ToastContainer, toast } from '../../lib/toast';

type RangeDays = 7 | 30 | 90;

export function DashboardPage() {
  const [response, setResponse] = useState<DashboardApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState<RangeDays>(30);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [removedChatIds, setRemovedChatIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await dashboardApi.getDashboard(rangeDays);
        setResponse(data);
        setRemovedChatIds(new Set()); // Reset removed chats on new data
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [rangeDays]);

  // Handler to update KPIs after marking a chat as read
  const handleChatMarkedAsRead = useCallback((chatKey: string, unreadCount: number) => {
    setRemovedChatIds((prev) => new Set(prev).add(chatKey));
    // Update KPIs und erzwinge neue Referenz für das Array
    setResponse((prev) => {
      if (!prev) return prev;
      const updatedData = prev.data.map((account) => {
        const chatBelongsToAccount = account.lists.latest_unread_chats.some(
          (chat) => `${chat.fourbased_id || account.profile.fourbased_id}:${chat.chat_id}` === chatKey
        );
        if (!chatBelongsToAccount) return account;
        return {
          ...account,
          kpis: {
            ...account.kpis,
            unread_chats: Math.max(0, account.kpis.unread_chats - 1),
            unread_messages: Math.max(0, account.kpis.unread_messages - unreadCount),
          },
        };
      });
      // Neue Referenz für das Array erzwingen
      return {
        ...prev,
        data: [...updatedData],
      };
    });
  }, []);

  // Compute aggregated or single account data
  const { kpis, chats } = useMemo(() => {
    if (!response?.data) {
      return { kpis: null, chats: [] };
    }

    if (selectedAccountId === 'all') {
      const aggregated = aggregateDashboard(response.data);
      const merged = mergeUnreadChats(response.data)
        .filter((chat) => !removedChatIds.has(`${chat.fourbased_id}:${chat.chat_id}`));
      return { kpis: aggregated, chats: merged };
    }

    const account = response.data.find((acc) => acc.profile.fourbased_id === selectedAccountId);
    if (!account) {
      return { kpis: null, chats: [] };
    }

    return {
      kpis: {
        revenue_net: account.kpis.revenue_net,
        unread_chats: account.kpis.unread_chats,
        unread_messages: account.kpis.unread_messages,
        likes: account.kpis.likes,
        followers: account.kpis.followers,
        status: {
          online_count: account.kpis.status.is_online ? 1 : 0,
          total_count: 1,
          last_activity_date: account.kpis.status.last_activity_date,
        },
      },
      chats: account.lists.latest_unread_chats
        .map(chat => ({
          ...chat,
          fourbased_id: chat.fourbased_id || account.profile.fourbased_id,
          account_name: account.profile.name,
          account_img_url: account.profile.img_url,
        }))
        .filter((chat) => !removedChatIds.has(`${chat.fourbased_id}:${chat.chat_id}`))
        .slice(0, 10),
    };
  }, [response, selectedAccountId, removedChatIds]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <DashboardHeader
          rangeDays={rangeDays}
          onRangeChange={setRangeDays}
          accounts={[]}
          selectedAccountId={selectedAccountId}
          onAccountChange={setSelectedAccountId}
          meta={null}
        />
        <LoadingSkeleton />
      </div>
    );
  }

  if (error || !response) {
    return (
      <div className="space-y-8">
        <DashboardHeader
          rangeDays={rangeDays}
          onRangeChange={setRangeDays}
          accounts={[]}
          selectedAccountId={selectedAccountId}
          onAccountChange={setSelectedAccountId}
          meta={null}
        />
        <ErrorState error={error || 'Unknown error'} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ToastContainer />
      <DashboardHeader
        rangeDays={rangeDays}
        onRangeChange={setRangeDays}
        accounts={response.data}
        selectedAccountId={selectedAccountId}
        onAccountChange={setSelectedAccountId}
        meta={response.meta}
      />

      {kpis && (
        <KpiGrid 
          kpis={kpis} 
          isAggregated={selectedAccountId === 'all'}
        />
      )}

      {chats.length > 0 && (
        <LatestChatsSection 
          chats={chats} 
          showAccountName={selectedAccountId === 'all'}
          onChatMarkedAsRead={handleChatMarkedAsRead}
        />
      )}

      {chats.length === 0 && (
        <Card className="p-12">
          <div className="text-center text-gray-500">
            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No unread chats</p>
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// Dashboard Header Component
// ============================================================================

interface DashboardHeaderProps {
  rangeDays: RangeDays;
  onRangeChange: (range: RangeDays) => void;
  accounts: DashboardAccount[];
  selectedAccountId: string;
  onAccountChange: (id: string) => void;
  meta: DashboardApiResponse['meta'] | null;
}

function DashboardHeader({
  rangeDays,
  onRangeChange,
  accounts,
  selectedAccountId,
  onAccountChange,
  meta,
}: DashboardHeaderProps) {
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  const selectedLabel =
    selectedAccountId === 'all'
      ? 'All accounts'
      : accounts.find((acc) => acc.profile.fourbased_id === selectedAccountId)?.profile.name || 'Account';

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        {meta && (
          <p className="mt-2 text-xs sm:text-sm text-gray-500">
            Last updated: {formatDate(meta.generated_at)} • Accounts: {meta.total_accounts}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Range Selector */}
        <div className="flex rounded-lg border border-gray-300 bg-white overflow-hidden">
          {([7, 30, 90] as RangeDays[]).map((range) => (
            <button
              key={range}
              onClick={() => onRangeChange(range)}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                rangeDays === range
                  ? 'bg-[#ED4C27] text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {range} days
            </button>
          ))}
        </div>

        {/* Account Selector */}
        <div className="relative">
          <button
            onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-w-0 max-w-[200px] sm:max-w-none"
          >
            <span className="truncate">{selectedLabel}</span>
            <ChevronDown size={16} className={`transition-transform shrink-0 ${isAccountDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isAccountDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsAccountDropdownOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 sm:w-64 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden z-20">
                <button
                  onClick={() => {
                    onAccountChange('all');
                    setIsAccountDropdownOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full text-left px-4 py-2 text-xs sm:text-sm transition-colors ${
                    selectedAccountId === 'all'
                      ? 'bg-[#ED4C27] text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Users size={18} className="shrink-0" />
                  <span>All accounts</span>
                </button>
                {accounts.map((account) => (
                  <button
                    key={account.profile.fourbased_id}
                    onClick={() => {
                      onAccountChange(account.profile.fourbased_id);
                      setIsAccountDropdownOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full text-left px-4 py-2 text-xs sm:text-sm transition-colors ${
                      selectedAccountId === account.profile.fourbased_id
                        ? 'bg-[#ED4C27] text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Avatar src={account.profile.img_url} alt={account.profile.name} size="sm" />
                    <span className="truncate">{account.profile.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// KPI Grid Component
// ============================================================================

interface KpiGridProps {
  kpis: ReturnType<typeof aggregateDashboard>;
  isAggregated: boolean;
}

function KpiGrid({ kpis, isAggregated }: KpiGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
      <KpiCard
        title="Revenue"
        value={formatCurrency(kpis.revenue_net)}
        icon={Receipt}
        gradient="from-[#ED4C27] to-[#D8431F]"
        subtitle="Net revenue"
      />
      <KpiCard
        title="Unread Chats"
        value={kpis.unread_chats.toString()}
        icon={Inbox}
        gradient="from-[#ED4C27] to-[#D8431F]"
        subtitle="Needs attention"
      />
      <KpiCard
        title="Messages"
        value={kpis.unread_messages.toString()}
        icon={MessageSquareText}
        gradient="from-[#ED4C27] to-[#D8431F]"
        subtitle="Unread"
      />
      <KpiCard
        title="Likes"
        value={kpis.likes.toString()}
        icon={Heart}
        gradient="from-[#ED4C27] to-[#D8431F]"
        subtitle="Total"
      />
      <KpiCard
        title="Followers"
        value={kpis.followers.toString()}
        icon={Users}
        gradient="from-[#ED4C27] to-[#D8431F]"
        subtitle="Active"
      />
      <KpiCard
        title="Status"
        value={
          isAggregated
            ? `${kpis.status.online_count} / ${kpis.status.total_count}`
            : kpis.status.online_count > 0
            ? 'Online'
            : 'Offline'
        }
        icon={Circle}
        gradient={
          isAggregated || kpis.status.online_count > 0
            ? 'from-green-500 to-emerald-500'
            : 'from-gray-400 to-gray-500'
        }
        subtitle={formatRelativeTime(kpis.status.last_activity_date)}
      />
    </div>
  );
}

interface KpiCardProps {
  title: string;
  value: string;
  icon: any;
  gradient: string;
  subtitle: string;
}

function KpiCard({ title, value, icon: Icon, gradient, subtitle }: KpiCardProps) {
  return (
    <Card className="p-4 sm:p-6 bg-white border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </Card>
  );
}

// ============================================================================
// Latest Chats Section
// ============================================================================

interface LatestChatsSectionProps {
  chats: MergedUnreadChat[];
  showAccountName: boolean;
  onChatMarkedAsRead: (chatKey: string, unreadCount: number) => void;
}

function LatestChatsSection({ chats, showAccountName, onChatMarkedAsRead }: LatestChatsSectionProps) {
  const [loadingChats, setLoadingChats] = useState<Set<string>>(new Set());

  const handleMarkAsRead = async (chat: MergedUnreadChat) => {
    const chatKey = `${chat.fourbased_id}:${chat.chat_id}`;
    
    console.log('Chat object:', chat);
    console.log('fourbased_id:', chat.fourbased_id);
    console.log('chat_id:', chat.chat_id);
    
    if (loadingChats.has(chatKey)) return;

    setLoadingChats((prev) => new Set(prev).add(chatKey));

    try {
      await dashboardApi.markChatAsRead(chat.fourbased_id, chat.chat_id);
      toast.success('Marked as read');
      onChatMarkedAsRead(chatKey, chat.unread_count);
    } catch (error) {
      console.error('Failed to mark chat as read:', error);
      toast.error('Failed to mark as read');
    } finally {
      setLoadingChats((prev) => {
        const next = new Set(prev);
        next.delete(chatKey);
        return next;
      });
    }
  };

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Latest unread chats</h2>
      <Card className="divide-y divide-gray-200 bg-white border border-gray-200">
        {chats.map((chat) => {
          const chatKey = `${chat.fourbased_id}:${chat.chat_id}`;
          const isLoading = loadingChats.has(chatKey);
          
          return (
            <div key={chatKey} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900">{chat.customer_name}</h3>
                    {chat.unread_count > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#ED4C27] text-white shrink-0">
                        {chat.unread_count} new
                      </span>
                    )}
                    {showAccountName && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 shrink-0">
                        <Avatar src={chat.account_img_url} alt={chat.account_name} size="sm" />
                        <span>{chat.account_name}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2">{chat.last_message_preview}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock size={12} className="mr-1" />
                    {formatDate(chat.last_message_at)}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Reply Button */}
                  <Link
                    to={`/4based/models/${chat.fourbased_id}/chats/${chat.chat_id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-white bg-white hover:bg-gray-600 border border-gray-300 hover:border-gray-600 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
                    title="Reply"
                  >
                    <CornerUpLeft size={16} />
                    <span className="hidden sm:inline">Reply</span>
                  </Link>

                  {/* Mark as Read Button */}
                  <button
                    onClick={() => handleMarkAsRead(chat)}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-white bg-[#ED4C27] hover:bg-[#D8431F] border border-[#ED4C27] hover:border-[#D8431F] rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#ED4C27] focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    title="Mark as read"
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCheck size={16} />
                    )}
                    <span className="hidden sm:inline">
                      {isLoading ? 'Marking...' : 'Mark as read'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="h-4 bg-gray-200 rounded w-20 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="mb-4">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Error State
// ============================================================================

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <Card className="p-12 bg-white border border-gray-200">
      <div className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading dashboard</h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-[#ED4C27] hover:bg-[#D8431F] text-white font-medium rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    </Card>
  );
}

// ============================================================================
// Avatar Component
// ============================================================================

interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
}

function Avatar({ src, alt, size = 'md' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 20,
  };

  if (!src) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center shrink-0`}>
        <User size={iconSizes[size]} className="text-gray-500" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${sizeClasses[size]} rounded-full object-cover shrink-0`}
      onError={(e) => {
        // Fallback to icon if image fails to load
        e.currentTarget.style.display = 'none';
        const parent = e.currentTarget.parentElement;
        if (parent) {
          parent.innerHTML = `<div class="${sizeClasses[size]} rounded-full bg-gray-200 flex items-center justify-center shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="${iconSizes[size]}" height="${iconSizes[size]}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>`;
        }
      }}
    />
  );
}
