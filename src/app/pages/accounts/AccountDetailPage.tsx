import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  Circle,
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
  Tag,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Camera,
  Film,
  CheckCircle,
  Smile,
} from 'lucide-react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { Card } from '../../../components/ui/Card';
import { PageLoader } from '../../../components/ui/PageLoader';
import { Modal } from '../../../components/ui/Modal';
import { accountsApi } from '../../../modules/accounts/accountsApi';
import type { Account } from '../../../modules/accounts/types';
import { formatCurrency, formatRelativeTime } from '../../../modules/dashboard';
import { inboxApi } from '../../../modules/inbox/services/inbox.api';
import type { ConfiguredMessage, ConfiguredMessageCategory, AccountInfo } from '../../../modules/inbox/types';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../lib/auth/useAuthStore';
import { cloudApi, unblurUrl } from '../../../modules/cloud/cloudApi';
import type { CloudAsset } from '../../../modules/cloud/types';
import { createFileStack } from '../../../modules/4based/services/4based.api';

type Tab = 'overview' | 'settings';

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
    return <PageLoader message="Lade Account..." subtitle="Account-Details und Statistiken werden geladen" />;
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

        </div>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 gap-1">
        {(['overview', 'settings'] as Tab[]).map((tab) => (
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
      {activeTab === 'settings' && <SettingsTab fourbasedId={account.fourbased_id} />}
    </div>
  );
}

// ============================================================================
// Overview Tab
// ============================================================================

function OverviewTab({ account }: { account: Account }) {
  const { team } = useAuthStore();
  const isAdmin = team?.role === 'admin';

  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [isAccountInfoLoading, setIsAccountInfoLoading] = useState(true);
  const [isEditingAccountInfo, setIsEditingAccountInfo] = useState(false);
  const [isSavingAccountInfo, setIsSavingAccountInfo] = useState(false);
  const [accountInfoError, setAccountInfoError] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editOrigin, setEditOrigin] = useState('');
  const [editOccupation, setEditOccupation] = useState('');
  const [editBraSize, setEditBraSize] = useState('');
  const [editTaboos, setEditTaboos] = useState('');
  const [editHobbies, setEditHobbies] = useState('');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    if (!account.fourbased_id) return;
    setIsAccountInfoLoading(true);
    inboxApi.getAccountInfo(account.fourbased_id)
      .then(setAccountInfo)
      .catch(() => setAccountInfo(null))
      .finally(() => setIsAccountInfoLoading(false));
  }, [account.fourbased_id]);

  useEffect(() => {
    setEditName(accountInfo?.name ?? '');
    setEditAge(accountInfo?.age != null ? String(accountInfo.age) : '');
    setEditOrigin(accountInfo?.origin ?? '');
    setEditOccupation(accountInfo?.occupation ?? '');
    setEditBraSize(accountInfo?.bra_size ?? '');
    setEditTaboos((accountInfo?.taboos ?? []).join(', '));
    setEditHobbies((accountInfo?.hobbies ?? []).join(', '));
    setEditNotes(accountInfo?.notes ?? '');
    setIsEditingAccountInfo(false);
  }, [accountInfo]);

  const handleSaveAccountInfo = async () => {
    if (!account.fourbased_id) return;
    setIsSavingAccountInfo(true);
    setAccountInfoError(null);
    try {
      const payload = {
        name: editName.trim() || undefined,
        age: editAge.trim() !== '' ? parseInt(editAge, 10) : undefined,
        origin: editOrigin.trim() || undefined,
        occupation: editOccupation.trim() || undefined,
        bra_size: editBraSize.trim() || undefined,
        taboos: editTaboos.trim() ? editTaboos.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        hobbies: editHobbies.trim() ? editHobbies.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        notes: editNotes.trim() || undefined,
      };
      const updated = accountInfo
        ? await inboxApi.updateAccountInfo(account.fourbased_id, payload)
        : await inboxApi.createAccountInfo(account.fourbased_id, payload);
      setAccountInfo(updated);
    } catch {
      setAccountInfoError('Account Info konnte nicht gespeichert werden.');
    } finally {
      setIsSavingAccountInfo(false);
    }
  };

  const hasStats =
    account.total_netto_amount != null ||
    account.follower_count != null ||
    account.likes_count != null ||
    account.file_stack_count != null ||
    account.file_stack_with_price_count != null ||
    account.has_subscription_configuration != null;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {hasStats && (
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
      )}

      {/* Account Info Card */}
      <Card className="p-4 border border-slate-600">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-100">Account Info</h2>
          {isAdmin && !isAccountInfoLoading && (
            !isEditingAccountInfo ? (
              <button
                type="button"
                onClick={() => setIsEditingAccountInfo(true)}
                className="text-sm text-[#ED4C27] hover:underline"
              >
                Bearbeiten
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditName(accountInfo?.name ?? '');
                  setEditAge(accountInfo?.age != null ? String(accountInfo.age) : '');
                  setEditOrigin(accountInfo?.origin ?? '');
                  setEditOccupation(accountInfo?.occupation ?? '');
                  setEditBraSize(accountInfo?.bra_size ?? '');
                  setEditTaboos((accountInfo?.taboos ?? []).join(', '));
                  setEditHobbies((accountInfo?.hobbies ?? []).join(', '));
                  setEditNotes(accountInfo?.notes ?? '');
                  setIsEditingAccountInfo(false);
                  setAccountInfoError(null);
                }}
                className="text-sm text-gray-400 hover:underline"
              >
                Abbrechen
              </button>
            )
          )}
        </div>

        {isAccountInfoLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 size={18} className="animate-spin text-gray-400" />
          </div>
        ) : isEditingAccountInfo ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Name</p>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name…" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Alter</p>
              <Input type="number" value={editAge} onChange={(e) => setEditAge(e.target.value)} placeholder="z.B. 24" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Herkunft</p>
              <Input value={editOrigin} onChange={(e) => setEditOrigin(e.target.value)} placeholder="z.B. Deutschland" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Beruf</p>
              <Input value={editOccupation} onChange={(e) => setEditOccupation(e.target.value)} placeholder="z.B. Model" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">BH-Größe</p>
              <Input value={editBraSize} onChange={(e) => setEditBraSize(e.target.value)} placeholder="z.B. 75C" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Taboos (kommagetrennt)</p>
              <Input value={editTaboos} onChange={(e) => setEditTaboos(e.target.value)} placeholder="z.B. Gesicht, Real meets" />
            </div>
            <div className="col-span-2 sm:col-span-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Hobbys (kommagetrennt)</p>
              <Input value={editHobbies} onChange={(e) => setEditHobbies(e.target.value)} placeholder="z.B. Fitness, Gaming" />
            </div>
            <div className="col-span-2 sm:col-span-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Notizen</p>
              <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Notizen…" rows={2} />
            </div>
            {accountInfoError && (
              <p className="col-span-2 sm:col-span-3 text-xs text-red-400">{accountInfoError}</p>
            )}
            <div className="col-span-2 sm:col-span-3">
              <Button onClick={handleSaveAccountInfo} disabled={isSavingAccountInfo}>
                {isSavingAccountInfo ? 'Speichert…' : 'Speichern'}
              </Button>
            </div>
          </div>
        ) : accountInfo ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
            {accountInfo.name && (
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Name</p>
                <p className="text-xs text-gray-100">{accountInfo.name}</p>
              </div>
            )}
            {accountInfo.age != null && (
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Alter</p>
                <p className="text-xs text-gray-100">{accountInfo.age}</p>
              </div>
            )}
            {accountInfo.origin && (
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Herkunft</p>
                <p className="text-xs text-gray-100">{accountInfo.origin}</p>
              </div>
            )}
            {accountInfo.occupation && (
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Beruf</p>
                <p className="text-xs text-gray-100">{accountInfo.occupation}</p>
              </div>
            )}
            {accountInfo.bra_size && (
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">BH-Größe</p>
                <p className="text-xs text-gray-100">{accountInfo.bra_size}</p>
              </div>
            )}
            {accountInfo.taboos && accountInfo.taboos.length > 0 && (
              <div className="col-span-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Taboos</p>
                <div className="flex flex-wrap gap-1">
                  {accountInfo.taboos.map((t) => (
                    <span key={t} className="text-[10px] bg-slate-700 text-gray-300 rounded px-1.5 py-0.5">{t}</span>
                  ))}
                </div>
              </div>
            )}
            {accountInfo.hobbies && accountInfo.hobbies.length > 0 && (
              <div className="col-span-2">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Hobbys</p>
                <div className="flex flex-wrap gap-1">
                  {accountInfo.hobbies.map((h) => (
                    <span key={h} className="text-xs bg-slate-700 text-gray-300 rounded px-2 py-0.5">{h}</span>
                  ))}
                </div>
              </div>
            )}
            {accountInfo.notes && (
              <div className="col-span-2 sm:col-span-3 lg:col-span-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Notizen</p>
                <p className="text-xs text-gray-300 whitespace-pre-wrap">{accountInfo.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p className="text-xs">Keine Account Infos hinterlegt.</p>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsEditingAccountInfo(true)}
                className="mt-2 text-sm text-[#ED4C27] hover:underline"
              >
                Jetzt hinzufügen
              </button>
            )}
          </div>
        )}
      </Card>
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
// Settings Tab
// ============================================================================

function SettingsTab({ fourbasedId }: { fourbasedId: string }) {
  const { team } = useAuthStore();
  const isAdmin = team?.role === 'admin';
  const [categories, setCategories] = useState<ConfiguredMessageCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      setCategories(await inboxApi.getConfiguredMessageCategories(fourbasedId));
    } catch {
      setCategoriesError('Kategorien konnten nicht geladen werden.');
    } finally {
      setCategoriesLoading(false);
    }
  }, [fourbasedId]);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  return (
    <div className="space-y-6">
      {isAdmin && (
        <CategoriesCard
          fourbasedId={fourbasedId}
          categories={categories}
          isLoading={categoriesLoading}
          error={categoriesError}
          onRefresh={loadCategories}
        />
      )}
      <ConfiguredMessagesCard
        fourbasedId={fourbasedId}
        isAdmin={isAdmin}
        categories={categories}
      />
    </div>
  );
}

// ── Categories Card (admin only) ─────────────────────────────────────────────

function CategoriesCard({ fourbasedId, categories, isLoading, error, onRefresh }: {
  fourbasedId: string;
  categories: ConfiguredMessageCategory[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [isAdding, setIsAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [mutationError, setMutationError] = useState<string | null>(null);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    setIsAdding(true);
    setMutationError(null);
    try {
      await inboxApi.createConfiguredMessageCategory(fourbasedId, { name, color: newColor });
      setNewName('');
      onRefresh();
    } catch {
      setMutationError('Kategorie konnte nicht erstellt werden.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdate = async (id: number) => {
    const name = editName.trim();
    if (!name) return;
    setSavingId(id);
    setMutationError(null);
    try {
      await inboxApi.updateConfiguredMessageCategory(fourbasedId, id, { name, color: editColor });
      setEditId(null);
      setEditName('');
      onRefresh();
    } catch {
      setMutationError('Kategorie konnte nicht aktualisiert werden.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setMutationError(null);
    try {
      await inboxApi.deleteConfiguredMessageCategory(fourbasedId, id);
      onRefresh();
    } catch {
      setMutationError('Kategorie konnte nicht gelöscht werden.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="p-6 border border-slate-600">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-[#ED4C27]/15 flex items-center justify-center">
          <Tag size={16} className="text-[#ED4C27]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-100">Kategorien</h3>
          <p className="text-xs text-gray-500">Kategorien für vordefinierte Nachrichten verwalten</p>
        </div>
      </div>

      {(error ?? mutationError) && (
        <div className="mb-4 flex items-center gap-2 text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
          <AlertCircle size={13} />
          {error ?? mutationError}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          disabled={isAdding}
          className="w-10 h-10 rounded-lg border border-slate-600 bg-slate-800 cursor-pointer disabled:opacity-50 shrink-0"
          title="Farbe wählen"
        />
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Neue Kategorie…"
          disabled={isAdding}
          className="flex-1 min-w-0 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#ED4C27] focus:ring-1 focus:ring-[#ED4C27]/30 disabled:opacity-50 transition"
        />
        <button
          onClick={handleAdd}
          disabled={isAdding || !newName.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-[#ED4C27] hover:bg-[#D8431F] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {isAdding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Hinzufügen
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-9 bg-slate-700 rounded-lg animate-pulse" />)}
        </div>
      ) : categories.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">Noch keine Kategorien vorhanden</p>
      ) : (
        <ul className="space-y-2">
          {categories.map((cat) => (
            <li key={cat.id} className="flex items-center gap-2 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 group">
              {editId === cat.id ? (
                <>
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-600 bg-slate-700 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdate(cat.id);
                      if (e.key === 'Escape') { setEditId(null); setEditName(''); }
                    }}
                    autoFocus
                    className="flex-1 min-w-0 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-gray-100 focus:outline-none focus:border-[#ED4C27]"
                  />
                  <button onClick={() => handleUpdate(cat.id)} disabled={savingId === cat.id} className="p-1.5 text-green-400 hover:text-green-300 disabled:opacity-50 transition-colors" title="Speichern">
                    {savingId === cat.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  </button>
                  <button onClick={() => { setEditId(null); setEditName(''); }} className="p-1.5 text-gray-400 hover:text-gray-200 transition-colors" title="Abbrechen">
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color ?? '#6366f1' }}
                  />
                  <span className="flex-1 text-sm text-gray-200 truncate">{cat.name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditId(cat.id); setEditName(cat.name); setEditColor(cat.color ?? '#6366f1'); }} className="p-1.5 text-gray-400 hover:text-gray-100 transition-colors" title="Bearbeiten">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} disabled={deletingId === cat.id} className="p-1.5 text-gray-400 hover:text-red-400 disabled:opacity-50 transition-colors" title="Löschen">
                      {deletingId === cat.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
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

// ── Configured Messages Card ─────────────────────────────────────────────────

function ConfiguredMessagesCard({ fourbasedId, isAdmin, categories }: { fourbasedId: string; isAdmin: boolean; categories: ConfiguredMessageCategory[] }) {
  const [messages, setMessages] = useState<ConfiguredMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add form
  const [newMessage, setNewMessage] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState<number | null>(null);
  const [newFileStackId, setNewFileStackId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState('');
  const [editName, setEditName] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [editFileStackId, setEditFileStackId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Vault modal state
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  // 'add' | 'edit' — which form triggered the vault modal
  const [vaultTarget, setVaultTarget] = useState<'add' | 'edit'>('add');
  const [vaultItems, setVaultItems] = useState<CloudAsset[]>([]);
  const [isLoadingVault, setIsLoadingVault] = useState(false);
  const [vaultError, setVaultError] = useState<string | null>(null);
  const [vaultOffset, setVaultOffset] = useState(0);
  const [vaultHasMore, setVaultHasMore] = useState(false);
  const [vaultFolders, setVaultFolders] = useState<string[]>([]);
  const [activeVaultFolder, setActiveVaultFolder] = useState<string | null>(null);
  const [vaultFileType, setVaultFileType] = useState<string | null>(null);
  const [selectedVaultItems, setSelectedVaultItems] = useState<CloudAsset[]>([]);
  const [vaultStep, setVaultStep] = useState<1 | 2>(1);
  const [isSavingVault, setIsSavingVault] = useState(false);

  // Collapsed category groups
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Drag-and-drop state
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOverCategoryEnd, setDragOverCategoryEnd] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setMessages(await inboxApi.getConfiguredMessages(fourbasedId));
    } catch {
      setError('Nachrichten konnten nicht geladen werden.');
    } finally {
      setIsLoading(false);
    }
  }, [fourbasedId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchVault = useCallback(async (
    offset = 0,
    folder: string | null = null,
    fileType: string | null = null,
  ) => {
    setIsLoadingVault(true);
    setVaultError(null);
    try {
      const data = await cloudApi.getAssets(fourbasedId, {
        offset,
        belongs_to_folders: folder ?? undefined,
        file_type: fileType ?? undefined,
      });
      const items = data.response;
      setVaultItems(prev => offset === 0 ? items : [...prev, ...items]);
      setVaultHasMore(data.pagination?.has_more ?? items.length === 60);
      setVaultOffset(data.pagination?.next_offset ?? offset + items.length);
    } catch {
      setVaultError('Vault konnte nicht geladen werden.');
    } finally {
      setIsLoadingVault(false);
    }
  }, [fourbasedId]);

  const handleOpenVault = (target: 'add' | 'edit') => {
    setVaultTarget(target);
    setIsVaultModalOpen(true);
    setVaultItems([]);
    setVaultOffset(0);
    setVaultHasMore(false);
    setActiveVaultFolder(null);
    setVaultFolders([]);
    setVaultFileType(null);
    setSelectedVaultItems([]);
    setVaultStep(1);
    cloudApi.getUser(fourbasedId)
      .then(u => { if ((u.folders ?? []).length > 0) setVaultFolders(u.folders ?? []); })
      .catch(() => {});
    fetchVault(0, null, null);
  };

  const handleSaveVaultItem = async (description: string, priceInCents: number) => {
    if (selectedVaultItems.length === 0 || isSavingVault) return;
    setIsSavingVault(true);
    try {
      const result = await createFileStack(fourbasedId, {
        ids: selectedVaultItems.map(i => i._id),
        description,
        price: priceInCents,
      });
      const fileStackId = result.response._id;
      if (vaultTarget === 'add') {
        setNewFileStackId(fileStackId);
      } else {
        setEditFileStackId(fileStackId);
      }
      setIsVaultModalOpen(false);
    } catch {
      setVaultError('Fehler beim Erstellen des File Stacks.');
    } finally {
      setIsSavingVault(false);
    }
  };

  // Group messages by internal.category.id (numeric), sorted by sort_order within each group
  const grouped = useMemo(() => {
    const byCategory = new Map<string, { category: ConfiguredMessageCategory | null; items: ConfiguredMessage[] }>();
    const uncategorized: ConfiguredMessage[] = [];

    for (const msg of messages) {
      const cat = msg.internal?.category ?? null;
      if (cat) {
        const key = String(cat.id);
        if (!byCategory.has(key)) byCategory.set(key, { category: cat, items: [] });
        byCategory.get(key)!.items.push(msg);
      } else {
        uncategorized.push(msg);
      }
    }

    const sortItems = (items: ConfiguredMessage[]) =>
      [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    const result: { key: string; category: ConfiguredMessageCategory | null; items: ConfiguredMessage[] }[] = [];
    byCategory.forEach((val, key) => result.push({ key, category: val.category, items: sortItems(val.items) }));
    if (uncategorized.length > 0) result.push({ key: '__none__', category: null, items: sortItems(uncategorized) });
    return result;
  }, [messages]);

  const toggleCategory = (key: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Central drop handler: inserts dragId before position toIndex in targetCategoryKey
  const performDrop = async (targetCategoryKey: string, toIndex: number) => {
    if (!dragId) return;

    const sourceGroup = grouped.find(g => g.items.some(i => i._id === dragId));
    const targetGroup = grouped.find(g => g.key === targetCategoryKey);
    if (!sourceGroup || !targetGroup) return;

    const draggedItem = sourceGroup.items.find(i => i._id === dragId)!;
    const isSameCategory = sourceGroup.key === targetCategoryKey;

    if (isSameCategory) {
      const fromIndex = sourceGroup.items.findIndex(i => i._id === dragId);
      // Adjust index: removing the item shifts subsequent indices
      const adjustedTo = fromIndex < toIndex ? toIndex - 1 : toIndex;
      if (fromIndex === adjustedTo) return;

      const reordered = [...sourceGroup.items];
      reordered.splice(fromIndex, 1);
      reordered.splice(adjustedTo, 0, draggedItem);

      setMessages(prev =>
        prev.map(m => {
          const idx = reordered.findIndex(r => r._id === m._id);
          return idx !== -1 ? { ...m, sort_order: idx } : m;
        })
      );
      try {
        await Promise.all(
          reordered.map((item, idx) =>
            inboxApi.updateConfiguredMessageMeta(fourbasedId, item._id, { sort_order: idx })
          )
        );
      } catch {
        setError('Reihenfolge konnte nicht gespeichert werden.');
        fetchData();
      }
    } else {
      // Cross-category: remove from source, insert at toIndex in target
      const newSourceItems = sourceGroup.items.filter(i => i._id !== dragId);
      const newTargetItems = [...targetGroup.items];
      newTargetItems.splice(toIndex, 0, draggedItem);
      const newCategory = targetGroup.category;

      setMessages(prev =>
        prev.map(m => {
          if (m._id === dragId) {
            return {
              ...m,
              sort_order: newTargetItems.findIndex(r => r._id === dragId),
              internal: { ...m.internal, category: newCategory, notes: m.internal?.notes ?? null },
            };
          }
          const srcIdx = newSourceItems.findIndex(r => r._id === m._id);
          if (srcIdx !== -1) return { ...m, sort_order: srcIdx };
          const tgtIdx = newTargetItems.findIndex(r => r._id === m._id);
          if (tgtIdx !== -1) return { ...m, sort_order: tgtIdx };
          return m;
        })
      );
      try {
        await Promise.all([
          inboxApi.updateConfiguredMessageMeta(fourbasedId, dragId, {
            category_id: newCategory?.id ?? null,
            sort_order: newTargetItems.findIndex(r => r._id === dragId),
          }),
          ...newSourceItems.map((item, idx) =>
            inboxApi.updateConfiguredMessageMeta(fourbasedId, item._id, { sort_order: idx })
          ),
          ...newTargetItems
            .filter(i => i._id !== dragId)
            .map(item =>
              inboxApi.updateConfiguredMessageMeta(fourbasedId, item._id, {
                sort_order: newTargetItems.findIndex(r => r._id === item._id),
              })
            ),
        ]);
      } catch {
        setError('Reihenfolge konnte nicht gespeichert werden.');
        fetchData();
      }
    }
  };

  const handleDropOnItem = (targetId: string, targetCategoryKey: string) => {
    if (!dragId || dragId === targetId) return;
    const targetGroup = grouped.find(g => g.key === targetCategoryKey);
    const toIndex = targetGroup?.items.findIndex(i => i._id === targetId) ?? -1;
    if (toIndex === -1) return;
    performDrop(targetCategoryKey, toIndex);
  };

  const handleDropAtEnd = (targetCategoryKey: string) => {
    if (!dragId) return;
    const targetGroup = grouped.find(g => g.key === targetCategoryKey);
    if (!targetGroup) return;
    performDrop(targetCategoryKey, targetGroup.items.length);
  };

  const handleAdd = async () => {
    const msg = newMessage.trim();
    if (!msg) return;
    setIsAdding(true);
    try {
      // Step 1: create the message on 4based
      const created = await inboxApi.createConfiguredMessage(fourbasedId, {
        message: msg,
        name: newName.trim() || undefined,
        file_stack_id: newFileStackId ?? undefined,
      });
      // Step 2: if a category is selected, set it via /meta
      if (newCategoryId !== null) {
        await inboxApi.updateConfiguredMessageMeta(fourbasedId, created._id, { category_id: newCategoryId });
        // Reflect category in local state optimistically
        created.internal = { category: categories.find(c => c.id === newCategoryId) ?? null, notes: null };
      }
      setMessages((prev) => [...prev, created]);
      setNewMessage('');
      setNewName('');
      setNewCategoryId(null);
      setNewFileStackId(null);
    } catch {
      setError('Nachricht konnte nicht hinzugefügt werden.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdate = async (id: string) => {
    const msg = editMessage.trim();
    if (!msg) return;
    setSavingId(id);
    try {
      const original = messages.find(m => m._id === id);
      const originalCatId = original?.internal?.category?.id ?? null;

      // Update message text/name on 4based
      const updated = await inboxApi.updateConfiguredMessage(fourbasedId, id, {
        message: msg,
        name: editName.trim() || undefined,
        file_stack_id: editFileStackId ?? undefined,
      });

      // Update category via /meta if it changed
      if (editCategoryId !== originalCatId) {
        await inboxApi.updateConfiguredMessageMeta(fourbasedId, id, { category_id: editCategoryId });
        updated.internal = { category: editCategoryId !== null ? (categories.find(c => c.id === editCategoryId) ?? null) : null, notes: original?.internal?.notes ?? null };
      } else {
        updated.internal = original?.internal ?? { category: null, notes: null };
      }

      setMessages((prev) => prev.map((m) => (m._id === id ? updated : m)));
      setEditId(null);
    } catch {
      setError('Nachricht konnte nicht aktualisiert werden.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await inboxApi.deleteConfiguredMessage(fourbasedId, id);
      setMessages((prev) => prev.filter((m) => m._id !== id));
    } catch {
      setError('Nachricht konnte nicht gelöscht werden.');
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (msg: ConfiguredMessage) => {
    setEditId(msg._id);
    setEditMessage(msg.message);
    setEditName(msg.name ?? '');
    setEditCategoryId(msg.internal?.category?.id ?? null);
    setEditFileStackId(msg.file_stack_id ?? null);
  };

  return (
    <>
    <Card className="p-6 border border-slate-600">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-[#ED4C27]/15 flex items-center justify-center">
          <MessageSquare size={16} className="text-[#ED4C27]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-100">Vordefinierte Nachrichten</h3>
          <p className="text-xs text-gray-500">Schnellantworten für diesen Account</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
          <AlertCircle size={13} />
          {error}
        </div>
      )}

      {/* Add form — admin only */}
      {isAdmin && (
        <div className="flex flex-col gap-2 mb-5">
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name / Titel…"
              disabled={isAdding}
              className="w-40 shrink-0 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#ED4C27] focus:ring-1 focus:ring-[#ED4C27]/30 disabled:opacity-50 transition"
            />
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAdd()}
              placeholder="Nachrichtentext…"
              disabled={isAdding}
              className="flex-1 min-w-0 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#ED4C27] focus:ring-1 focus:ring-[#ED4C27]/30 disabled:opacity-50 transition"
            />
            <button
              onClick={handleAdd}
              disabled={isAdding || !newMessage.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-[#ED4C27] hover:bg-[#D8431F] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {isAdding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Hinzufügen
            </button>
          </div>
          <div className="flex items-center gap-2">
            {categories.length > 0 && (
              <select
                value={newCategoryId ?? ''}
                onChange={(e) => setNewCategoryId(e.target.value ? Number(e.target.value) : null)}
                className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#ED4C27] transition"
              >
                <option value="">Keine Kategorie</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            )}
            {/* Photo/vault button */}
            <button
              type="button"
              onClick={() => handleOpenVault('add')}
              disabled={isAdding}
              title={newFileStackId ? 'Foto ausgewählt – klicken zum Ändern' : 'Foto aus Vault auswählen'}
              className={[
                'flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors shrink-0 disabled:opacity-50',
                newFileStackId
                  ? 'bg-[#ED4C27]/15 border-[#ED4C27]/40 text-[#ED4C27]'
                  : 'bg-slate-800 border-slate-600 text-gray-400 hover:text-gray-100 hover:border-slate-500',
              ].join(' ')}
            >
              <Camera size={14} />
              {newFileStackId ? 'Foto ✓' : 'Foto'}
            </button>
            {newFileStackId && (
              <button
                type="button"
                onClick={() => setNewFileStackId(null)}
                className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                title="Foto entfernen"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* List grouped by category */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-slate-700 rounded-lg animate-pulse" />)}
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Noch keine vordefinierten Nachrichten</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ key, category, items }) => (
            <div key={key}>
              {/* Category header */}
              <button
                type="button"
                onClick={() => toggleCategory(key)}
                className="w-full flex items-center gap-2 mb-2 group/header"
              >
                {collapsedCategories.has(key)
                  ? <ChevronRight size={14} className="text-gray-500 shrink-0" />
                  : <ChevronDown size={14} className="text-gray-500 shrink-0" />}
                {category?.color
                  ? <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
                  : <Tag size={12} className="text-gray-500 shrink-0" />}
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 group-hover/header:text-gray-300 transition-colors">
                  {category ? category.name : 'Ohne Kategorie'}
                </span>
                <span className="text-xs text-gray-600 ml-auto">{items.length}</span>
              </button>

              {!collapsedCategories.has(key) && (
                <ul className="space-y-2 pl-4">
                  {items.map((msg) => (
                    <li
                      key={msg._id}
                      draggable={isAdmin && editId !== msg._id}
                      onDragStart={() => isAdmin && setDragId(msg._id)}
                      onDragOver={(e) => { if (!isAdmin) return; e.preventDefault(); setDragOverId(msg._id); setDragOverCategoryEnd(null); }}
                      onDrop={() => isAdmin && handleDropOnItem(msg._id, key)}
                      onDragEnd={() => { setDragId(null); setDragOverId(null); setDragOverCategoryEnd(null); }}
                      className={[
                        'flex items-start gap-2 bg-slate-800/60 border rounded-lg px-3 py-2 group transition-colors',
                        dragId === msg._id ? 'opacity-40' : '',
                        dragOverId === msg._id && dragId !== msg._id ? 'border-[#ED4C27]' : 'border-slate-700',
                      ].join(' ')}
                    >
                      {editId === msg._id ? (
                        <div className="flex flex-col gap-2 flex-1 min-w-0">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Name / Titel…"
                              className="w-36 shrink-0 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-gray-100 focus:outline-none focus:border-[#ED4C27]"
                            />
                            <input
                              type="text"
                              value={editMessage}
                              onChange={(e) => setEditMessage(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdate(msg._id);
                                if (e.key === 'Escape') setEditId(null);
                              }}
                              autoFocus
                              className="flex-1 min-w-0 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-gray-100 focus:outline-none focus:border-[#ED4C27]"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            {categories.length > 0 && (
                              <select
                                value={editCategoryId ?? ''}
                                onChange={(e) => setEditCategoryId(e.target.value ? Number(e.target.value) : null)}
                                className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-[#ED4C27]"
                              >
                                <option value="">Keine Kategorie</option>
                                {categories.map((cat) => (
                                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                              </select>
                            )}
                            {/* Photo/vault button */}
                            <button
                              type="button"
                              onClick={() => handleOpenVault('edit')}
                              title={editFileStackId ? 'Foto ausgewählt – klicken zum Ändern' : 'Foto aus Vault auswählen'}
                              className={[
                                'flex items-center gap-1 px-2 py-1 text-xs rounded border transition-colors shrink-0',
                                editFileStackId
                                  ? 'bg-[#ED4C27]/15 border-[#ED4C27]/40 text-[#ED4C27]'
                                  : 'bg-slate-700 border-slate-600 text-gray-400 hover:text-gray-100',
                              ].join(' ')}
                            >
                              <Camera size={12} />
                              {editFileStackId ? '✓' : 'Foto'}
                            </button>
                            {editFileStackId && (
                              <button
                                type="button"
                                onClick={() => setEditFileStackId(null)}
                                className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                                title="Foto entfernen"
                              >
                                <X size={11} />
                              </button>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => handleUpdate(msg._id)} disabled={savingId === msg._id} className="flex items-center gap-1 px-2 py-1 text-xs text-green-400 hover:text-green-300 disabled:opacity-50 transition-colors">
                              {savingId === msg._id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                              Speichern
                            </button>
                            <button onClick={() => setEditId(null)} className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-gray-200 transition-colors">
                              <X size={12} />
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {isAdmin && <GripVertical size={14} className="text-gray-600 cursor-grab active:cursor-grabbing shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                          {msg.img_url && (
                            <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
                              <img
                                src={unblurUrl(msg.img_url)}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            {msg.name && <p className="text-xs font-medium text-gray-400 mb-0.5 truncate">{msg.name}</p>}
                            <p className="text-sm text-gray-200 break-words">{msg.message}</p>
                            {typeof msg.file_stack?.price === 'number' && msg.file_stack.price > 0 && (
                              <p className="text-[10px] text-[#ED4C27] mt-0.5">
                                ${(msg.file_stack.price / 1.21 / 100).toFixed(2)}
                              </p>
                            )}
                          </div>
                          {isAdmin && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button onClick={() => startEdit(msg)} className="p-1.5 text-gray-400 hover:text-gray-100 transition-colors" title="Bearbeiten">
                                <Pencil size={13} />
                              </button>
                              <button onClick={() => handleDelete(msg._id)} disabled={deletingId === msg._id} className="p-1.5 text-gray-400 hover:text-red-400 disabled:opacity-50 transition-colors" title="Löschen">
                                {deletingId === msg._id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </li>
                  ))}
                  {/* Drop zone at end of category — admin only */}
                  {isAdmin && dragId && (
                    <li
                      onDragOver={(e) => { e.preventDefault(); setDragOverId(null); setDragOverCategoryEnd(key); }}
                      onDrop={() => handleDropAtEnd(key)}
                      onDragLeave={() => setDragOverCategoryEnd(null)}
                      className={[
                        'h-7 rounded-lg border border-dashed transition-colors',
                        dragOverCategoryEnd === key ? 'border-[#ED4C27] bg-[#ED4C27]/5' : 'border-slate-700/50',
                      ].join(' ')}
                    />
                  )}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>

    {/* Vault Modal */}
    <Modal
      isOpen={isVaultModalOpen}
      onClose={() => setIsVaultModalOpen(false)}
      title={vaultStep === 1 ? 'Vault – Foto auswählen' : 'Foto konfigurieren'}
      size="xl"
    >
      {vaultStep === 2 && selectedVaultItems.length > 0 ? (
        <VaultConfigStep
          items={selectedVaultItems}
          onBack={() => setVaultStep(1)}
          onSave={handleSaveVaultItem}
          isSaving={isSavingVault}
        />
      ) : (
        <>
          {/* File type filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            {([null, 'image', 'video'] as const).map((ft) => (
              <CfgVaultChip
                key={ft ?? 'all'}
                label={ft === null ? 'Alle' : ft === 'image' ? 'Bild' : 'Video'}
                active={vaultFileType === ft}
                onClick={() => {
                  setVaultFileType(ft);
                  setVaultItems([]);
                  setVaultOffset(0);
                  fetchVault(0, activeVaultFolder, ft);
                }}
              />
            ))}
          </div>

          {/* Folder filter */}
          {vaultFolders.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <CfgVaultChip label="Alle" active={activeVaultFolder === null} onClick={() => { setActiveVaultFolder(null); setVaultItems([]); setVaultOffset(0); fetchVault(0, null, vaultFileType); }} />
              {vaultFolders.map(folder => (
                <CfgVaultChip
                  key={folder}
                  label={folder}
                  active={activeVaultFolder === folder}
                  onClick={() => { setActiveVaultFolder(folder); setVaultItems([]); setVaultOffset(0); fetchVault(0, folder, vaultFileType); }}
                />
              ))}
            </div>
          )}

          {isLoadingVault && vaultItems.length === 0 ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 size={28} className="animate-spin text-gray-400" />
            </div>
          ) : vaultError ? (
            <p className="text-red-500 text-sm">{vaultError}</p>
          ) : vaultItems.length === 0 ? (
            <p className="text-gray-400 text-sm">Keine Inhalte gefunden.</p>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2">
                {vaultItems.map((item) => (
                  <CfgVaultThumbnail
                    key={item._id}
                    item={item}
                    isSelected={selectedVaultItems.some(s => s._id === item._id)}
                    onSelect={(i) => setSelectedVaultItems(prev =>
                      prev.some(s => s._id === i._id)
                        ? prev.filter(s => s._id !== i._id)
                        : [...prev, i]
                    )}
                  />
                ))}
              </div>
              {vaultHasMore && (
                <div className="mt-4 flex justify-center">
                  <Button onClick={() => fetchVault(vaultOffset, activeVaultFolder, vaultFileType)} disabled={isLoadingVault}>
                    {isLoadingVault ? <Loader2 size={16} className="animate-spin" /> : 'Mehr laden'}
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Sticky footer for step 1 when items are selected */}
      {vaultStep === 1 && selectedVaultItems.length > 0 && (
        <div className="sticky bottom-0 left-0 right-0 mt-4 pt-4 border-t border-slate-700 bg-card flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1 overflow-x-auto pb-1">
            {selectedVaultItems.map(item => (
              <div key={item._id} className="relative shrink-0">
                <img
                  src={unblurUrl(item.img_url)}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover border border-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setSelectedVaultItems(prev => prev.filter(s => s._id !== item._id))}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
            <span className="text-sm text-gray-400 shrink-0 ml-1">
              {selectedVaultItems.length} ausgewählt
            </span>
          </div>
          <Button onClick={() => setVaultStep(2)}>Weiter →</Button>
        </div>
      )}
    </Modal>
    </>
  );
}

// ============================================================================
// Vault helpers (for ConfiguredMessagesCard)
// ============================================================================

function CfgVaultChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1 rounded-full text-xs font-medium transition-colors border"
      style={
        active
          ? { background: 'rgba(237,76,39,0.12)', color: '#ED4C27', borderColor: 'rgba(237,76,39,0.3)' }
          : { background: '#1E293B', color: '#9CA3AF', borderColor: '#334155' }
      }
    >
      {label}
    </button>
  );
}

function CfgVaultThumbnail({
  item,
  isSelected = false,
  onSelect,
}: {
  item: CloudAsset;
  isSelected?: boolean;
  onSelect?: (item: CloudAsset) => void;
}) {
  const isVideo = item.fileStackType === 'video';
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(item)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect?.(item); }}
      className={`relative aspect-square rounded-lg overflow-hidden bg-slate-800 border-2 transition-all cursor-pointer group ${
        isSelected ? 'border-[#ED4C27] ring-2 ring-[#ED4C27]/40' : 'border-slate-700 hover:border-slate-500'
      }`}
    >
      <img
        src={unblurUrl(item.img_url)}
        alt={item.description ?? item._id}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-9 h-9 rounded-full bg-black/60 flex items-center justify-center">
            <Film size={16} className="text-white" />
          </div>
        </div>
      )}
      {isSelected && (
        <div className="absolute top-1.5 right-1.5 pointer-events-none">
          <CheckCircle size={18} className="text-[#ED4C27] drop-shadow" fill="white" />
        </div>
      )}
      {typeof item.price === 'number' && item.price > 0 && (
        <span className="absolute bottom-1 right-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-black/70 text-[#ED4C27]">
          ${(item.price / 100).toFixed(2)}
        </span>
      )}
    </div>
  );
}

function VaultConfigStep({
  items,
  onBack,
  onSave,
  isSaving = false,
}: {
  items: CloudAsset[];
  onBack: () => void;
  onSave: (description: string, priceInCents: number) => void;
  isSaving?: boolean;
}) {
  const firstItem = items[0];
  const isVideo = firstItem.fileStackType === 'video';
  const [description, setDescription] = useState('');
  const [priceInput, setPriceInput] = useState(
    typeof firstItem.price === 'number' && firstItem.price > 0 ? (firstItem.price / 100).toFixed(2) : '',
  );
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isEmojiPickerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (emojiBtnRef.current && emojiBtnRef.current.contains(target)) return;
      const pickerEl = document.getElementById('cfg-vault-emoji-picker-portal');
      if (pickerEl && pickerEl.contains(target)) return;
      setIsEmojiPickerOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEmojiPickerOpen]);

  const handleEmojiBtnClick = () => {
    if (!isEmojiPickerOpen && emojiBtnRef.current) {
      const rect = emojiBtnRef.current.getBoundingClientRect();
      setPickerPos({ top: rect.top - 440, left: rect.right - 352 });
    }
    setIsEmojiPickerOpen(prev => !prev);
  };

  const handleEmojiSelect = (emoji: { native: string }) => {
    const textarea = descTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart ?? description.length;
      const end = textarea.selectionEnd ?? description.length;
      const newValue = description.slice(0, start) + emoji.native + description.slice(end);
      setDescription(newValue);
      requestAnimationFrame(() => {
        textarea.focus();
        const pos = start + emoji.native.length;
        textarea.setSelectionRange(pos, pos);
      });
    } else {
      setDescription(prev => prev + emoji.native);
    }
    setIsEmojiPickerOpen(false);
  };

  const VAT_RATE = 0.21;
  const CREATOR_SHARE = 0.70;
  const MIN_PRICE = 3.00;
  const basePrice = parseFloat(priceInput || '0') || 0;
  const vatAmount = basePrice * VAT_RATE;
  const userPrice = basePrice + vatAmount;
  const creatorAmount = basePrice * CREATOR_SHARE;
  const isPriceInvalid = basePrice > 0 && basePrice < MIN_PRICE;

  const handleSave = () => {
    if (isPriceInvalid) return;
    const priceWithVat = Math.round(basePrice * (1 + VAT_RATE) * 100);
    const priceInCents = Number.isNaN(priceWithVat) ? 0 : priceWithVat;
    onSave(description, priceInCents);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-5 items-start">
        {/* Preview */}
        <div className="relative w-48 shrink-0 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 aspect-square">
          <img
            src={unblurUrl(firstItem.img_url)}
            alt={firstItem.description ?? firstItem._id}
            className="w-full h-full object-cover"
          />
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                <Film size={22} className="text-white" />
              </div>
            </div>
          )}
          {items.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/70 rounded-full px-2 py-0.5 text-xs text-white font-semibold">
              +{items.length - 1}
            </div>
          )}
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          {/* Description */}
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
              Beschreibung <span className="text-red-400">*</span>
            </p>
            <Textarea
              ref={descTextareaRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreibung eingeben…"
              rows={4}
            />
            <div className="flex justify-end mt-1">
              <button
                ref={emojiBtnRef}
                type="button"
                onClick={handleEmojiBtnClick}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-600 bg-slate-700 text-gray-400 hover:text-[#ED4C27] hover:border-[#ED4C27] transition-colors"
                title="Emoji einfügen"
              >
                <Smile size={15} />
              </button>
              {isEmojiPickerOpen && createPortal(
                <div
                  id="cfg-vault-emoji-picker-portal"
                  style={{ position: 'fixed', top: pickerPos.top, left: pickerPos.left, zIndex: 9999 }}
                >
                  <Picker
                    data={data}
                    onEmojiSelect={handleEmojiSelect}
                    theme="dark"
                    locale="de"
                    previewPosition="none"
                    skinTonePosition="search"
                  />
                </div>,
                document.body,
              )}
            </div>
          </div>

          {/* Price */}
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Preis ($)</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">$</span>
              <Input
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="Preis in $"
                className={`pl-6 ${isPriceInvalid ? 'border-red-500 focus:border-red-500' : ''}`}
              />
            </div>
            {isPriceInvalid && (
              <p className="text-[10px] text-red-400 mt-1">Mindestpreis: $3.00</p>
            )}
            {basePrice >= MIN_PRICE && (
              <div className="mt-2 rounded-lg bg-slate-800/60 border border-slate-700 p-2.5 flex flex-col gap-1.5 text-[11px]">
                <div>
                  <span className="text-gray-500">Deine Provision:</span>
                  <span className="text-gray-300 ml-1">
                    ${basePrice.toFixed(2)} × 70% = <span className="text-green-400 font-semibold">${creatorAmount.toFixed(2)}</span>
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Preis für User:</span>
                  <span className="text-gray-300 ml-1">
                    ${basePrice.toFixed(2)} + ${vatAmount.toFixed(2)} <span className="text-gray-500">(MwSt.)</span> = <span className="text-[#ED4C27] font-semibold">${userPrice.toFixed(2)}</span>
                  </span>
                </div>
                <p className="text-gray-600 leading-tight">
                  Die MwSt. wird direkt abgeführt.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-700">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-100 transition-colors"
          disabled={isSaving}
        >
          <ArrowLeft size={15} /> Zurück
        </button>
        <Button onClick={handleSave} disabled={isSaving || isPriceInvalid || !description.trim()}>
          {isSaving ? <Loader2 size={15} className="animate-spin" /> : 'Speichern'}
        </Button>
      </div>
    </div>
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

