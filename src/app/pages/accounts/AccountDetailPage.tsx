import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Circle,
  Inbox,
  Cloud,
  DollarSign,
  Heart,
  Image,
  Users,
  AlertCircle,
  Layers,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Loader2,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { getConfig } from '../../../lib/config';
import { accountsApi } from '../../../modules/accounts/accountsApi';
import type { Account } from '../../../modules/accounts/types';
import { formatCurrency, formatRelativeTime } from '../../../modules/dashboard';

type Tab = 'overview' | 'inbox' | 'cloud' | 'settings';

interface PredefinedText {
  id: number | string;
  message: string;
}

export function AccountDetailPage() {
  const { fourbased_id } = useParams<{ fourbased_id: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const fetchAccount = useCallback(async () => {
    if (!fourbased_id) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await accountsApi.getAccount(fourbased_id);
      setAccount(data);
    } catch (err) {
      console.error('Failed to fetch account:', err);
      setError('Failed to load account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [fourbased_id]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !account) {
    return (
      <Card className="p-12 border border-slate-600 max-w-lg mx-auto mt-12">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-100 mb-2">Error loading account</h3>
          <p className="text-gray-400 mb-6">{error || 'Account not found'}</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => navigate('/accounts')}
              className="px-4 py-2 text-sm text-gray-300 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Back to Accounts
            </button>
            <button
              onClick={fetchAccount}
              className="px-4 py-2 text-sm bg-[#ED4C27] hover:bg-[#D8431F] text-white font-medium rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate('/accounts')}
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-100 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Accounts
      </button>

      {/* Profile Header Card */}
      <Card className="p-6 border border-slate-600">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: avatar + info */}
          <div className="flex items-center gap-4">
            <AccountAvatar src={account.img_url ?? undefined} alt={account.name} />
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-100">{account.name}</h1>
                {account.is_online != null && (
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                      account.is_online
                        ? 'bg-green-900/40 text-green-400'
                        : 'bg-slate-700 text-gray-400'
                    }`}
                  >
                    <Circle size={7} className={account.is_online ? 'fill-green-400' : 'fill-gray-500'} />
                    {account.is_online ? 'Online' : 'Offline'}
                  </span>
                )}
                {account.total_netto_amount != null && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#ED4C27]/15 text-[#ED4C27] border border-[#ED4C27]/30">
                    <DollarSign size={11} />
                    {formatCurrency(account.total_netto_amount)}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-1">{account.identifier}</p>
              {account.last_activity_date && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Last active: {formatRelativeTime(account.last_activity_date)}
                </p>
              )}
            </div>
          </div>

          {/* Right: action buttons */}
          <div className="flex gap-3 flex-wrap">
            <Link
              to={`/inbox?fourbased_id=${account.fourbased_id}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-card border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <Inbox size={16} />
              Open Inbox
            </Link>
            <Link
              to={`/cloud/users/${account.fourbased_id}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#ED4C27] hover:bg-[#D8431F] rounded-lg transition-colors shadow-sm"
            >
              <Cloud size={16} />
              Open Cloud
            </Link>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 gap-1">
        {(['overview', 'inbox', 'cloud', 'settings'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-[#ED4C27] text-[#ED4C27]'
                : 'border-transparent text-gray-400 hover:text-gray-100'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab account={account} />}
      {activeTab === 'inbox' && <InboxTab fourbasedId={account.fourbased_id} />}
      {activeTab === 'cloud' && <CloudTab fourbasedId={account.fourbased_id} />}
      {activeTab === 'settings' && <SettingsTab fourbasedId={account.fourbased_id} />}
    </div>
  );
}

// ============================================================================
// Overview Tab
// ============================================================================

function OverviewTab({ account }: { account: Account }) {
  const hasStats =
    account.total_netto_amount != null ||
    account.follower_count != null ||
    account.likes_count != null ||
    account.file_stack_count != null ||
    account.file_stack_with_price_count != null ||
    account.has_subscription_configuration != null;

  if (!hasStats) {
    return (
      <Card className="p-8 border border-slate-600">
        <div className="text-center text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Detailed stats are not available for this account.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {account.total_netto_amount != null && (
        <KpiCard
          title="Revenue"
          value={formatCurrency(account.total_netto_amount)}
          icon={DollarSign}
          gradient="from-[#ED4C27] to-[#D8431F]"
          subtitle="Net total"
        />
      )}
      {account.follower_count != null && (
        <KpiCard
          title="Followers"
          value={account.follower_count.toLocaleString()}
          icon={Users}
          gradient="from-[#ED4C27] to-[#D8431F]"
          subtitle="Total followers"
        />
      )}
      {account.likes_count != null && (
        <KpiCard
          title="Likes"
          value={account.likes_count.toLocaleString()}
          icon={Heart}
          gradient="from-pink-500 to-rose-500"
          subtitle="Total likes"
        />
      )}
      {account.file_stack_count != null && (
        <KpiCard
          title="File Stack"
          value={account.file_stack_count.toLocaleString()}
          icon={Image}
          gradient="from-violet-500 to-purple-500"
          subtitle="Total files"
        />
      )}
      {account.file_stack_with_price_count != null && (
        <KpiCard
          title="Paid Content"
          value={account.file_stack_with_price_count.toLocaleString()}
          icon={Layers}
          gradient="from-blue-500 to-indigo-500"
          subtitle="Files with price"
        />
      )}
      {account.has_subscription_configuration != null && (
        <KpiCard
          title="Subscription"
          value={account.has_subscription_configuration ? 'Configured' : 'Not set'}
          icon={account.has_subscription_configuration ? CheckCircle2 : XCircle}
          gradient={
            account.has_subscription_configuration
              ? 'from-green-500 to-emerald-500'
              : 'from-gray-500 to-slate-500'
          }
          subtitle={account.has_subscription_configuration ? 'Active configuration' : 'No configuration'}
        />
      )}
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
    <Card className="p-5 border border-slate-600 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-400">{title}</p>
        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-100 mb-1">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </Card>
  );
}

// ============================================================================
// Inbox Tab
// ============================================================================

function InboxTab({ fourbasedId }: { fourbasedId: string }) {
  return (
    <Card className="p-8 border border-slate-600">
      <div className="text-center max-w-sm mx-auto">
        <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4">
          <Inbox size={24} className="text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-100 mb-2">View this account's inbox</h3>
        <p className="text-sm text-gray-400 mb-5">
          All conversations for this account are managed in the Inbox section.
        </p>
        <Link
          to={`/inbox?fourbased_id=${fourbasedId}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#ED4C27] hover:bg-[#D8431F] rounded-lg transition-colors shadow-sm"
        >
          <Inbox size={16} />
          Open Inbox
        </Link>
      </div>
    </Card>
  );
}

// ============================================================================
// Cloud Tab
// ============================================================================

function CloudTab({ fourbasedId }: { fourbasedId: string }) {
  return (
    <Card className="p-8 border border-slate-600">
      <div className="text-center max-w-sm mx-auto">
        <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4">
          <Cloud size={24} className="text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-100 mb-2">View this account's cloud assets</h3>
        <p className="text-sm text-gray-400 mb-5">
          All media and files for this account are stored in the Cloud section.
        </p>
        <Link
          to={`/cloud/users/${fourbasedId}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#ED4C27] hover:bg-[#D8431F] rounded-lg transition-colors shadow-sm"
        >
          <Cloud size={16} />
          Open Cloud
        </Link>
      </div>
    </Card>
  );
}

// ============================================================================
// Settings Tab
// ============================================================================

function SettingsTab({ fourbasedId }: { fourbasedId: string }) {
  return (
    <div className="space-y-6">
      <PredefinedTextsCard fourbasedId={fourbasedId} />
      {/* Placeholder for future settings sections */}
      <Card className="p-6 border border-dashed border-slate-700">
        <p className="text-sm text-gray-500 text-center">Weitere Einstellungen folgen…</p>
      </Card>
    </div>
  );
}

function PredefinedTextsCard({ fourbasedId }: { fourbasedId: string }) {
  const [texts, setTexts] = useState<PredefinedText[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editId, setEditId] = useState<number | string | null>(null);
  const [editMessage, setEditMessage] = useState('');
  const [savingId, setSavingId] = useState<number | string | null>(null);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  const apiBase = `${getConfig().API_URL}/4based/users/${fourbasedId}/predefined-texts`;

  const authHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      ...(localStorage.getItem('auth_token')
        ? { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
        : {}),
    }),
    [],
  );

  const fetchTexts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(apiBase, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const raw = await res.json();
      setTexts(Array.isArray(raw) ? raw : (raw?.data ?? []));
    } catch {
      setError('Vordefinierte Texte konnten nicht geladen werden.');
    } finally {
      setIsLoading(false);
    }
  }, [apiBase, authHeaders]);

  useEffect(() => {
    fetchTexts();
  }, [fetchTexts]);

  const handleAdd = async () => {
    const msg = newMessage.trim();
    if (!msg) return;
    setIsAdding(true);
    try {
      const res = await fetch(apiBase, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ message: msg }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setTexts((prev) => [...prev, created?.data ?? created]);
      setNewMessage('');
    } catch {
      setError('Text konnte nicht hinzugefügt werden.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdate = async (id: number | string) => {
    const msg = editMessage.trim();
    if (!msg) return;
    setSavingId(id);
    try {
      const res = await fetch(`${apiBase}/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ message: msg }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setTexts((prev) =>
        prev.map((t) => (t.id === id ? (updated?.data ?? updated) : t)),
      );
      setEditId(null);
      setEditMessage('');
    } catch {
      setError('Text konnte nicht aktualisiert werden.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: number | string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${apiBase}/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      setTexts((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError('Text konnte nicht gelöscht werden.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="p-6 border border-slate-600">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-[#ED4C27]/15 flex items-center justify-center">
          <MessageSquare size={16} className="text-[#ED4C27]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-100">Vordefinierte Texte</h3>
          <p className="text-xs text-gray-500">Schnellantworten für diesen Account</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
          <AlertCircle size={13} />
          {error}
        </div>
      )}

      {/* Add new */}
      <div className="flex gap-2 mb-5">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Neuen Text eingeben…"
          disabled={isAdding}
          className="flex-1 min-w-0 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#ED4C27] focus:ring-1 focus:ring-[#ED4C27]/30 disabled:opacity-50 transition"
        />
        <button
          onClick={handleAdd}
          disabled={isAdding}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-[#ED4C27] hover:bg-[#D8431F] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {isAdding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Hinzufügen
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-slate-700 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : texts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Noch keine vordefinierten Texte</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {texts.map((text) => (
            <li
              key={text.id}
              className="flex items-center gap-2 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 group"
            >
              {editId === text.id ? (
                <>
                  <input
                    type="text"
                    value={editMessage}
                    onChange={(e) => setEditMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdate(text.id);
                      if (e.key === 'Escape') { setEditId(null); setEditMessage(''); }
                    }}
                    autoFocus
                    className="flex-1 min-w-0 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-gray-100 focus:outline-none focus:border-[#ED4C27]"
                  />
                  <button
                    onClick={() => handleUpdate(text.id)}
                    disabled={savingId === text.id}
                    className="p-1.5 text-green-400 hover:text-green-300 disabled:opacity-50 transition-colors"
                    title="Speichern"
                  >
                    {savingId === text.id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Save size={14} />}
                  </button>
                  <button
                    onClick={() => { setEditId(null); setEditMessage(''); }}
                    className="p-1.5 text-gray-400 hover:text-gray-200 transition-colors"
                    title="Abbrechen"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-gray-200 truncate">{text.message}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditId(text.id); setEditMessage(text.message); }}
                      className="p-1.5 text-gray-400 hover:text-gray-100 transition-colors"
                      title="Bearbeiten"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(text.id)}
                      disabled={deletingId === text.id}
                      className="p-1.5 text-gray-400 hover:text-red-400 disabled:opacity-50 transition-colors"
                      title="Löschen"
                    >
                      {deletingId === text.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : <Trash2 size={13} />}
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function AccountAvatar({ src, alt }: { src?: string; alt: string }) {
  const [imgError, setImgError] = useState(false);

  if (!src || imgError) {
    return (
      <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
        <Users size={24} className="text-gray-500" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-16 h-16 rounded-full object-cover shrink-0"
      onError={() => setImgError(true)}
    />
  );
}

// ============================================================================
// Detail Skeleton
// ============================================================================

function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-5 w-32 bg-slate-700 rounded" />
      <Card className="p-6 border border-slate-600">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-700 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-slate-700 rounded w-40" />
            <div className="h-4 bg-slate-700 rounded w-48" />
            <div className="h-3 bg-slate-700 rounded w-24" />
          </div>
        </div>
      </Card>
      <div className="flex gap-1 border-b border-slate-700 pb-0">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-20 bg-slate-700 rounded-t" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border border-slate-700 rounded-2xl p-5">
            <div className="h-4 bg-slate-700 rounded w-20 mb-3" />
            <div className="h-8 bg-slate-700 rounded w-28 mb-1" />
            <div className="h-3 bg-slate-700 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
