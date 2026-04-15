import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { PageLoader } from '../../../components/ui/PageLoader';
import { accountsApi } from '../../../modules/accounts/accountsApi';
import type { Account } from '../../../modules/accounts/types';
import { formatCurrency, formatRelativeTime } from '../../../modules/dashboard';
import { inboxApi } from '../../../modules/inbox/services/inbox.api';
import type { ConfiguredMessage, ConfiguredMessageCategory } from '../../../modules/inbox/types';
import { useAuthStore } from '../../../lib/auth/useAuthStore';

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
// Settings Tab
// ============================================================================

function SettingsTab({ fourbasedId }: { fourbasedId: string }) {
  const { team } = useAuthStore();
  const isAdmin = team?.role === 'admin';

  return (
    <div className="space-y-6">
      {isAdmin && <CategoriesCard fourbasedId={fourbasedId} />}
      <ConfiguredMessagesCard fourbasedId={fourbasedId} isAdmin={isAdmin} />
    </div>
  );
}

// ── Categories Card (admin only) ─────────────────────────────────────────────

function CategoriesCard({ fourbasedId }: { fourbasedId: string }) {
  const [categories, setCategories] = useState<ConfiguredMessageCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [isAdding, setIsAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setCategories(await inboxApi.getConfiguredMessageCategories(fourbasedId));
    } catch {
      setError('Kategorien konnten nicht geladen werden.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    setIsAdding(true);
    try {
      const created = await inboxApi.createConfiguredMessageCategory(fourbasedId, { name, color: newColor });
      setCategories((prev) => [...prev, created]);
      setNewName('');
    } catch {
      setError('Kategorie konnte nicht erstellt werden.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdate = async (id: number) => {
    const name = editName.trim();
    if (!name) return;
    setSavingId(id);
    try {
      const updated = await inboxApi.updateConfiguredMessageCategory(fourbasedId, id, { name, color: editColor });
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setEditId(null);
      setEditName('');
    } catch {
      setError('Kategorie konnte nicht aktualisiert werden.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await inboxApi.deleteConfiguredMessageCategory(fourbasedId, id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError('Kategorie konnte nicht gelöscht werden.');
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

      {error && (
        <div className="mb-4 flex items-center gap-2 text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
          <AlertCircle size={13} />
          {error}
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

function ConfiguredMessagesCard({ fourbasedId, isAdmin }: { fourbasedId: string; isAdmin: boolean }) {
  const [messages, setMessages] = useState<ConfiguredMessage[]>([]);
  const [categories, setCategories] = useState<ConfiguredMessageCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add form
  const [newMessage, setNewMessage] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState('');
  const [editName, setEditName] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      const [msgs, cats] = await Promise.all([
        inboxApi.getConfiguredMessages(fourbasedId),
        inboxApi.getConfiguredMessageCategories(fourbasedId),
      ]);
      setMessages(msgs);
      setCategories(cats);
    } catch {
      setError('Nachrichten konnten nicht geladen werden.');
    } finally {
      setIsLoading(false);
    }
  }, [fourbasedId]);

  useEffect(() => { fetchData(); }, [fetchData]);

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
  };

  return (
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
          {categories.length > 0 && (
            <select
              value={newCategoryId ?? ''}
              onChange={(e) => setNewCategoryId(e.target.value ? Number(e.target.value) : null)}
              className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#ED4C27] transition"
            >
              <option value="">Keine Kategorie</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          )}
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
                          {categories.length > 0 && (
                            <select
                              value={editCategoryId ?? ''}
                              onChange={(e) => setEditCategoryId(e.target.value ? Number(e.target.value) : null)}
                              className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-[#ED4C27]"
                            >
                              <option value="">Keine Kategorie</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                          )}
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
                          <div className="flex-1 min-w-0">
                            {msg.name && <p className="text-xs font-medium text-gray-400 mb-0.5 truncate">{msg.name}</p>}
                            <p className="text-sm text-gray-200 break-words">{msg.message}</p>
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

