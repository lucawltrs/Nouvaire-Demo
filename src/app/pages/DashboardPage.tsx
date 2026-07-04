import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageLoader } from '../../components/ui/PageLoader';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { IconClock, IconChevronDown, IconAlertCircle, IconUser, IconChecks, IconLoader2, IconRotate, IconSend, IconPlus, IconTrendingUp, IconUsers, IconReceipt, IconEye, IconInbox, IconCornerUpLeft, IconMessageCircle, IconHeart, IconX } from '@tabler/icons-react';
import { sendChatMessage } from '../../modules/4based/services/4based.api';
import {
  dashboardApi,
  type DashboardAccount,
  type DashboardApiResponse,
  type MergedUnreadChat,
  aggregateDashboard,
  mergeUnreadChats,
  formatCurrency,
  formatDate,
} from '../../modules/dashboard';
import { ToastContainer, toast } from '../../lib/toast';
import { unreadCountStore } from '../../lib/unreadCountStore';
import { inboxApi } from '../../modules/inbox/services/inbox.api';
import { newMessageNotifications } from '../../lib/newMessageNotifications';
import { accountsApi } from '../../modules/accounts/accountsApi';
import { massMessagesApi } from '../../modules/mass-messages/massMessagesApi';
import type { Account } from '../../modules/accounts/types';
import type { UserList } from '../../modules/mass-messages/types';
import { cn } from '../../lib/utils';

type RangeDays = 7 | 30 | 90;

export function DashboardPage() {
  const [response, setResponse] = useState<DashboardApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState<RangeDays>(30);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [removedChatIds, setRemovedChatIds] = useState<Set<string>>(new Set());
  const [isCreateMassMessageOpen, setIsCreateMassMessageOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const syncUnreadCount = (data: DashboardApiResponse) => {
    const total = data.data.reduce((sum, acc) => sum + (acc.kpis.unread_chats ?? 0), 0);
    unreadCountStore.set(total);
  };

  const loadDashboard = useCallback(async (silent = false) => {
    try {
      if (!silent) { setIsLoading(true); setError(null); }
      const data = await dashboardApi.getDashboard(rangeDays);
      setResponse(data);
      syncUnreadCount(data);
      if (!silent) setRemovedChatIds(new Set());
    } catch (err) {
      if (!silent) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [rangeDays]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(() => loadDashboard(true), 30 * 1000);
    return () => clearInterval(interval);
  }, [rangeDays]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    accountsApi.getAccounts().then(setAccounts).catch(() => {});
  }, []);

  const handleChatMarkedAsRead = useCallback((chatKey: string, unreadCount: number) => {
    setRemovedChatIds((prev) => new Set(prev).add(chatKey));
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
      return { ...prev, data: [...updatedData] };
    });
  }, []);

  const { kpis, chats } = useMemo(() => {
    if (!response?.data) return { kpis: null, chats: [] };

    if (selectedAccountId === 'all') {
      const aggregated = aggregateDashboard(response.data);
      const merged = mergeUnreadChats(response.data)
        .filter((chat) => !removedChatIds.has(`${chat.fourbased_id}:${chat.chat_id}`));
      return { kpis: aggregated, chats: merged };
    }

    const account = response.data.find((acc) => acc.profile.fourbased_id === selectedAccountId);
    if (!account) return { kpis: null, chats: [] };

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
        .slice(0, 30),
    };
  }, [response, selectedAccountId, removedChatIds]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardHeader
          rangeDays={rangeDays} onRangeChange={setRangeDays}
          accounts={[]} selectedAccountId={selectedAccountId}
          onAccountChange={setSelectedAccountId} meta={null}
          onReload={loadDashboard} isLoading={isLoading}
        />
        <PageLoader message="Lade Performance Daten..." subtitle="KPIs, Umsatz und Chats werden geladen" />
      </div>
    );
  }

  if (error || !response) {
    return (
      <div className="space-y-6">
        <DashboardHeader
          rangeDays={rangeDays} onRangeChange={setRangeDays}
          accounts={[]} selectedAccountId={selectedAccountId}
          onAccountChange={setSelectedAccountId} meta={null}
          onReload={loadDashboard} isLoading={isLoading}
        />
        <ErrorState error={error || 'Unknown error'} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer />
      <DashboardHeader
        rangeDays={rangeDays} onRangeChange={setRangeDays}
        accounts={response.data} selectedAccountId={selectedAccountId}
        onAccountChange={setSelectedAccountId} meta={response.meta}
        onReload={loadDashboard} isLoading={isLoading}
      />

      {kpis && (
        <div className="hidden sm:block">
          <KpiGrid
            kpis={kpis}
            isAggregated={selectedAccountId === 'all'}
            onOpenCreateMassMessage={() => setIsCreateMassMessageOpen(true)}
          />
        </div>
      )}

      {isCreateMassMessageOpen && (
        <CreateMassMessageModal
          accounts={accounts}
          onClose={() => setIsCreateMassMessageOpen(false)}
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
        <Card>
          <CardContent className="py-16">
            <div className="text-center text-muted-foreground">
              <IconInbox className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No unread chats</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// Dashboard Header
// ============================================================================

interface DashboardHeaderProps {
  rangeDays: RangeDays;
  onRangeChange: (range: RangeDays) => void;
  accounts: DashboardAccount[];
  selectedAccountId: string;
  onAccountChange: (id: string) => void;
  meta: DashboardApiResponse['meta'] | null;
  onReload: () => void;
  isLoading: boolean;
}

function DashboardHeader({ rangeDays, onRangeChange, accounts, selectedAccountId, onAccountChange, meta, onReload, isLoading }: DashboardHeaderProps) {
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  const selectedLabel =
    selectedAccountId === 'all'
      ? 'All accounts'
      : accounts.find((acc) => acc.profile.fourbased_id === selectedAccountId)?.profile.name || 'Account';

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        {meta && (
          <p className="hidden sm:block mt-0.5 text-sm text-muted-foreground">
            Zuletzt aktualisiert: {formatDate(meta.generated_at)} · {meta.total_accounts} Accounts
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {/* Reload */}
        <Button
          variant="outline"
          size="sm"
          onClick={onReload}
          disabled={isLoading}
          className="hidden sm:flex h-8 w-8 p-0"
        >
          <IconRotate size={14} className={isLoading ? 'animate-spin' : ''} />
        </Button>

        {/* Range Selector */}
        <div className="hidden sm:flex rounded-lg border border-border bg-card overflow-hidden">
          {([7, 30, 90] as RangeDays[]).map((range) => (
            <button
              key={range}
              onClick={() => onRangeChange(range)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                rangeDays === range
                  ? 'bg-brand text-white'
                  : 'text-muted-foreground hover:bg-accent'
              )}
            >
              {range}d
            </button>
          ))}
        </div>

        {/* Account Selector */}
        <div className="hidden sm:block relative">
          <button
            onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-foreground bg-card border border-border rounded-lg hover:bg-accent transition-colors max-w-[180px]"
          >
            <span className="truncate">{selectedLabel}</span>
            <IconChevronDown size={14} className={cn('shrink-0 transition-transform', isAccountDropdownOpen && 'rotate-180')} />
          </button>

          {isAccountDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsAccountDropdownOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-56 bg-popover border border-border rounded-lg shadow-md overflow-hidden z-20">
                <button
                  onClick={() => { onAccountChange('all'); setIsAccountDropdownOpen(false); }}
                  className={cn(
                    'flex items-center gap-2.5 w-full text-left px-3 py-2 text-sm transition-colors',
                    selectedAccountId === 'all' ? 'bg-brand/10 text-brand font-medium' : 'text-foreground hover:bg-accent'
                  )}
                >
                  <IconUsers size={15} className="shrink-0" />
                  All accounts
                </button>
                {accounts.map((account) => (
                  <button
                    key={account.profile.fourbased_id}
                    onClick={() => { onAccountChange(account.profile.fourbased_id); setIsAccountDropdownOpen(false); }}
                    className={cn(
                      'flex items-center gap-2.5 w-full text-left px-3 py-2 text-sm transition-colors',
                      selectedAccountId === account.profile.fourbased_id ? 'bg-brand/10 text-brand font-medium' : 'text-foreground hover:bg-accent'
                    )}
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
// KPI Grid
// ============================================================================

interface KpiGridProps {
  kpis: ReturnType<typeof aggregateDashboard>;
  isAggregated: boolean;
  onOpenCreateMassMessage: () => void;
}

function KpiGrid({ kpis, onOpenCreateMassMessage }: KpiGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <KpiCard
        title="Revenue"
        value={formatCurrency(kpis.revenue_net)}
        icon={IconReceipt}
        subtitle="Net revenue"
        accent="violet"
      />
      <KpiCard
        title="Unread Chats"
        value={kpis.unread_chats.toString()}
        icon={IconInbox}
        subtitle="Needs attention"
        accent="amber"
      />
      <KpiCard
        title="Messages"
        value={kpis.unread_messages.toString()}
        icon={IconMessageCircle}
        subtitle="Unread"
        accent="blue"
      />
      <KpiCard
        title="Likes"
        value={kpis.likes.toString()}
        icon={IconHeart}
        subtitle="Total"
        accent="rose"
      />

      {/* Quick action: create mass message */}
      <button
        onClick={onOpenCreateMassMessage}
        className="group p-4 rounded-lg border-2 border-dashed border-border hover:border-brand/40 hover:bg-brand/5 transition-all flex flex-col items-center justify-center gap-2 min-h-[90px]"
      >
        <div className="w-8 h-8 rounded-lg bg-brand/10 group-hover:bg-brand/20 flex items-center justify-center transition-colors">
          <IconPlus className="w-4 h-4 text-brand" />
        </div>
        <p className="text-xs text-muted-foreground group-hover:text-brand transition-colors text-center leading-tight font-medium">
          Mass Message
        </p>
      </button>

      {/* Quick link: manage mass messages */}
      <Link
        to="/mass-messages"
        className="group p-4 rounded-lg border border-border bg-card hover:border-border/80 hover:bg-accent transition-all flex flex-col items-center justify-center gap-2 min-h-[90px]"
      >
        <div className="w-8 h-8 rounded-lg bg-muted group-hover:bg-muted/80 flex items-center justify-center transition-colors">
          <IconSend className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
        <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight font-medium">
          Manage
        </p>
      </Link>
    </div>
  );
}

const ACCENT_CLASSES = {
  violet: { bg: 'bg-violet-100 dark:bg-violet-900/30', icon: 'text-violet-600 dark:text-violet-400' },
  amber:  { bg: 'bg-amber-100  dark:bg-amber-900/30',  icon: 'text-amber-600  dark:text-amber-400'  },
  blue:   { bg: 'bg-blue-100   dark:bg-blue-900/30',   icon: 'text-blue-600   dark:text-blue-400'   },
  rose:   { bg: 'bg-rose-100   dark:bg-rose-900/30',   icon: 'text-rose-600   dark:text-rose-400'   },
  green:  { bg: 'bg-green-100  dark:bg-green-900/30',  icon: 'text-green-600  dark:text-green-400'  },
} as const;

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  subtitle: string;
  accent: keyof typeof ACCENT_CLASSES;
}

const KpiCard = memo(function KpiCard({ title, value, icon: Icon, subtitle, accent }: KpiCardProps) {
  const styles = ACCENT_CLASSES[accent];
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', styles.bg)}>
          <Icon className={cn('w-3.5 h-3.5', styles.icon)} />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground mb-0.5 leading-none">{value}</p>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <IconTrendingUp className="w-3 h-3" />
        {subtitle}
      </p>
    </Card>
  );
});

// ============================================================================
// Latest Chats Section
// ============================================================================

interface LatestChatsSectionProps {
  chats: MergedUnreadChat[];
  showAccountName: boolean;
  onChatMarkedAsRead: (chatKey: string, unreadCount: number) => void;
}

const LatestChatsSection = memo(function LatestChatsSection({ chats, showAccountName, onChatMarkedAsRead }: LatestChatsSectionProps) {
  const [loadingChats, setLoadingChats] = useState<Set<string>>(new Set());
  const [replyChat, setReplyChat] = useState<MergedUnreadChat | null>(null);
  const navigate = useNavigate();

  const handleMarkAsRead = async (chat: MergedUnreadChat) => {
    const chatKey = `${chat.fourbased_id}:${chat.chat_id}`;
    if (loadingChats.has(chatKey)) return;
    setLoadingChats((prev) => new Set(prev).add(chatKey));
    try {
      await dashboardApi.markChatAsRead(chat.fourbased_id, chat.chat_id);
      toast.success('Marked as read');
      onChatMarkedAsRead(chatKey, chat.unread_count);
    } catch {
      toast.error('Failed to mark as read');
    } finally {
      setLoadingChats((prev) => { const next = new Set(prev); next.delete(chatKey); return next; });
    }
  };

  return (
    <div>
      <h2 className="text-base font-semibold text-foreground mb-3">Latest unread chats</h2>
      <Card>
        <div className="divide-y divide-border">
          {chats.map((chat) => {
            const chatKey = `${chat.fourbased_id}:${chat.chat_id}`;
            const isLoading = loadingChats.has(chatKey);

            return (
              <div key={chatKey} className="px-4 py-3.5 hover:bg-accent transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-medium text-sm text-foreground">{chat.customer_name}</h3>
                      {chat.unread_count > 0 && (
                        <Badge className="bg-brand text-white text-[10px] px-1.5 py-0 h-4">
                          {chat.unread_count}
                        </Badge>
                      )}
                      {showAccountName && chat.account_name && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted border border-border rounded-full px-2 py-0.5">
                          <Avatar src={chat.account_img_url} alt={chat.account_name} size="sm" />
                          {chat.account_name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-1">{chat.last_message_preview}</p>
                    <div className="flex items-center text-[11px] text-muted-foreground">
                      <IconClock size={11} className="mr-1" />
                      {formatDate(chat.last_message_at)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/inbox/${chat.fourbased_id}/chat/${chat.chat_id}`)}
                      className="h-7 px-2.5 text-xs gap-1"
                    >
                      <IconEye size={13} />
                      <span className="hidden sm:inline">Öffnen</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReplyChat(chat)}
                      className="h-7 px-2.5 text-xs gap-1"
                    >
                      <IconCornerUpLeft size={13} />
                      <span className="hidden sm:inline">Reply</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleMarkAsRead(chat)}
                      disabled={isLoading}
                      className="h-7 px-2.5 text-xs gap-1"
                    >
                      {isLoading ? <IconLoader2 size={13} className="animate-spin" /> : <IconChecks size={13} />}
                      <span className="hidden sm:inline">
                        {isLoading ? 'Marking…' : 'Read'}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {replyChat && (
        <ReplyPopup chat={replyChat} onClose={() => setReplyChat(null)} />
      )}
    </div>
  );
});

// ============================================================================
// Reply Popup
// ============================================================================

interface ReplyPopupProps {
  chat: MergedUnreadChat;
  onClose: () => void;
}

function ReplyPopup({ chat, onClose }: ReplyPopupProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSend = async () => {
    const text = message.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      await sendChatMessage(chat.fourbased_id, chat.chat_id, text);
      inboxApi.markChatAsRead(chat.fourbased_id, chat.chat_id).catch(() => {});
      newMessageNotifications.markChatRead(chat.fourbased_id, chat.chat_id);
      setSent(true);
      setTimeout(onClose, 1200);
    } catch {
      setError('Nachricht konnte nicht gesendet werden.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSend(); }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl pointer-events-auto animate-slide-in">
          <div className="flex items-start justify-between px-4 py-3.5 border-b border-border">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Reply to</p>
              <p className="font-semibold text-sm text-foreground truncate">{chat.customer_name}</p>
              {chat.account_name && (
                <span className="inline-flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  <Avatar src={chat.account_img_url} alt={chat.account_name} size="sm" />
                  {chat.account_name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <Link
                to={`/inbox/${chat.fourbased_id}/chat/${chat.chat_id}`}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/70 rounded-md transition-colors"
              >
                <IconEye size={12} />
                Öffnen
              </Link>
              <button
                onClick={onClose}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <IconX size={15} />
              </button>
            </div>
          </div>

          {chat.last_message_preview && (
            <div className="px-4 py-2.5 bg-muted/50 border-b border-border">
              <p className="text-[11px] text-muted-foreground mb-0.5">Letzte Nachricht</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{chat.last_message_preview}</p>
            </div>
          )}

          <div className="p-4">
            {sent ? (
              <div className="flex items-center justify-center gap-2 py-6 text-emerald-600">
                <IconChecks size={18} />
                <span className="text-sm font-medium">Nachricht gesendet!</span>
              </div>
            ) : (
              <>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nachricht eingeben…"
                  rows={4}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring text-foreground placeholder-muted-foreground resize-none transition-colors"
                />
                {error && (
                  <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                    <IconAlertCircle size={12} /> {error}
                  </p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <p className="text-[11px] text-muted-foreground">⌘ + Enter zum Senden</p>
                  <Button
                    size="sm"
                    onClick={handleSend}
                    disabled={sending || !message.trim()}
                    className="h-8 gap-1.5"
                  >
                    {sending ? <IconLoader2 size={13} className="animate-spin" /> : <IconSend size={13} />}
                    {sending ? 'Senden…' : 'Senden'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// Error State
// ============================================================================

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="py-16">
        <div className="text-center max-w-sm mx-auto">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <IconAlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">Fehler beim Laden</h3>
          <p className="text-sm text-muted-foreground mb-5">{error}</p>
          <Button onClick={onRetry} size="sm">Erneut versuchen</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Create Mass Message Modal
// ============================================================================

const FILTER_OPTIONS = [
  { value: 'users_with_purchases', label: 'Users with purchases' },
  { value: 'users_without_purchases', label: 'Users without purchases' },
  { value: 'users_with_subscription', label: 'Users with subscription' },
  { value: 'users_without_subscription', label: 'Users without subscription' },
];

interface CreateMassMessageModalProps {
  accounts: Account[];
  onClose: () => void;
}

function CreateMassMessageModal({ accounts, onClose }: CreateMassMessageModalProps) {
  const [step, setStep] = useState<'account' | 'compose'>('account');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [userLists, setUserLists] = useState<UserList[]>([]);
  const [userListsLoading, setUserListsLoading] = useState(false);
  const [form, setForm] = useState({ message: '', filter: [] as string[], include_user_list: [] as string[], to_be_posted_at: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectAccount = (account: Account) => {
    setSelectedAccount(account);
    setStep('compose');
    setUserListsLoading(true);
    massMessagesApi.getUserLists(account.fourbased_id)
      .then(setUserLists).catch(() => setUserLists([])).finally(() => setUserListsLoading(false));
  };

  const toggleFilter = (value: string) => {
    setForm((f) => ({
      ...f,
      filter: f.filter.includes(value) ? f.filter.filter((v) => v !== value) : [...f.filter, value],
    }));
  };

  const handleCreate = async () => {
    if (!form.message.trim()) { setFormError('Nachricht ist erforderlich.'); return; }
    if (!selectedAccount) return;
    try {
      setIsSubmitting(true);
      setFormError(null);
      await massMessagesApi.create(selectedAccount.fourbased_id, {
        message: form.message.trim(),
        filter: form.filter,
        include_user_list: form.include_user_list,
        exclude_user_list: [],
        exclude_filter: [],
        file_stack_id: null,
        to_be_posted_at: form.to_be_posted_at ? form.to_be_posted_at.replace('T', ' ') + ':00' : null,
      });
      toast.success('Massennachricht erstellt.');
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Fehler beim Erstellen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Massennachricht erstellen" size="md">
      {step === 'account' ? (
        <div className="p-5 space-y-3">
          <p className="text-sm text-muted-foreground">Account auswählen:</p>
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
            {accounts.map((account) => (
              <button
                key={account.fourbased_id}
                onClick={() => handleSelectAccount(account)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-card hover:border-violet-300 hover:bg-violet-50/10 text-left transition-all"
              >
                {account.img_url ? (
                  <img src={account.img_url} alt={account.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-sm font-semibold text-muted-foreground">
                    {account.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{account.name}</p>
                  {account.followers != null && (
                    <p className="text-xs text-muted-foreground">{account.followers.toLocaleString()} followers</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-5 space-y-4">
          {selectedAccount && (
            <div className="flex items-center gap-2">
              <button onClick={() => setStep('account')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← zurück</button>
              <span className="text-xs text-muted-foreground">Account:</span>
              <span className="text-xs font-medium text-foreground">{selectedAccount.name}</span>
            </div>
          )}

          <Textarea label="Nachricht *" placeholder="Nachricht eingeben…" rows={4}
            value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />

          <div>
            <p className="text-sm font-medium text-foreground mb-2">Zielgruppe</p>
            <div className="space-y-2">
              {FILTER_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.filter.includes(opt.value)}
                    onChange={() => toggleFilter(opt.value)}
                    className="w-4 h-4 rounded border-border text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-sm text-foreground">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {userListsLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-3 h-3 border border-border border-t-violet-500 rounded-full animate-spin" />
              Userlisten werden geladen…
            </div>
          ) : userLists.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">User Lists</p>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {userLists.map((list) => (
                  <label key={list._id} className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.include_user_list.includes(list._id)}
                      onChange={() => setForm((f) => ({
                        ...f,
                        include_user_list: f.include_user_list.includes(list._id)
                          ? f.include_user_list.filter((id) => id !== list._id)
                          : [...f.include_user_list, list._id],
                      }))}
                      className="w-4 h-4 rounded border-border text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-sm text-foreground">{list.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <Input label="Geplant (optional)" type="datetime-local"
            value={form.to_be_posted_at} onChange={(e) => setForm((f) => ({ ...f, to_be_posted_at: e.target.value }))} />

          {formError && (
            <p className="text-sm text-red-500 flex items-center gap-1.5">
              <IconAlertCircle size={14} /> {formError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>Abbrechen</Button>
            <Button size="sm" onClick={handleCreate} disabled={isSubmitting} className="gap-1.5">
              <IconSend size={13} />
              {isSubmitting ? 'Senden…' : 'Erstellen'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
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

const avatarSizeClasses = { sm: 'w-5 h-5', md: 'w-7 h-7', lg: 'w-9 h-9' } as const;
const avatarIconSizes = { sm: 12, md: 14, lg: 18 } as const;

const Avatar = memo(function Avatar({ src, alt, size = 'md' }: AvatarProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={cn(avatarSizeClasses[size], 'rounded-full bg-muted flex items-center justify-center shrink-0')}>
        <IconUser size={avatarIconSizes[size]} className="text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={src} alt={alt} loading="lazy"
      className={cn(avatarSizeClasses[size], 'rounded-full object-cover shrink-0')}
      onError={() => setFailed(true)}
    />
  );
});
