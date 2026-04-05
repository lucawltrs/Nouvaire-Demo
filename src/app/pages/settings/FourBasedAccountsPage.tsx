import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  AlertCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserMinus,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { PageLoader } from '../../../components/ui/PageLoader';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useAuthStore } from '../../../lib/auth/useAuthStore';
import { ToastContainer, toast } from '../../../lib/toast';
import {
  fourbasedUsersApi,
  type FourBasedUser,
  type UpdateFourBasedUserPayload,
} from '../../../modules/shared/services/fourbasedUsersApi';
import { groupsApi, type Group } from '../../../modules/shared/services/groupsApi';
import { accountsApi } from '../../../modules/accounts/accountsApi';

// ─── Page ────────────────────────────────────────────────────────────────────

export function FourBasedAccountsPage() {
  const navigate = useNavigate();
  const { team } = useAuthStore();
  const [accounts, setAccounts] = useState<FourBasedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // modal state
  const [editTarget, setEditTarget] = useState<FourBasedUser | null>(null);
  const [assignTarget, setAssignTarget] = useState<FourBasedUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FourBasedUser | null>(null);
  const [unassignTarget, setUnassignTarget] = useState<FourBasedUser | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const accountsData = await fourbasedUsersApi.list();
      setAccounts(accountsData);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
      setError('Failed to load accounts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSyncAll = async () => {
    try {
      setIsSyncing(true);
      await accountsApi.syncAll();
      toast.success('Sync started successfully');
      await fetchData();
    } catch (err) {
      console.error('Failed to sync:', err);
      toast.error('Sync failed. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddAccount = async (email: string, password: string) => {
    await accountsApi.addAccount(email, password);
    toast.success('Account added successfully');
    setIsAddModalOpen(false);
    await fetchData();
  };

  const handleEditSave = async (fourbasedId: string, payload: UpdateFourBasedUserPayload) => {
    await fourbasedUsersApi.update(fourbasedId, payload);
    setEditTarget(null);
    toast.success('Credentials updated successfully');
  };

  const handleAssignSave = async (fourbasedId: string, teamGroupId: number) => {
    await fourbasedUsersApi.assign({ fourbased_user_id: fourbasedId, team_group_id: teamGroupId });
    setAssignTarget(null);
    fetchData();
  };

  const handleUnassign = async () => {
    if (!unassignTarget) return;
    await fourbasedUsersApi.unassign(unassignTarget.fourbased_id);
    setUnassignTarget(null);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fourbasedUsersApi.delete(deleteTarget.fourbased_id);
    setDeleteTarget(null);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <ToastContainer />
      <AddAccountModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddAccount}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-slate-700 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">Account Management</h1>
              {team?.team_name && (
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-gray-300 border border-slate-600">
                  {team.team_name}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-gray-400">
              {accounts.length} account{accounts.length !== 1 ? 's' : ''} in this team
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSyncAll}
            disabled={isSyncing || isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-card border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing…' : 'Sync All'}
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#ED4C27] hover:bg-[#D8431F] rounded-lg transition-colors shadow-sm"
          >
            <UserPlus size={16} />
            Add Account
          </button>
        </div>
      </div>

      {isLoading ? (
        <PageLoader message="Lade Accounts..." subtitle="4Based Accounts und Berechtigungen werden abgerufen" />
      ) : error ? (
        <ErrorState error={error} onRetry={fetchData} />
      ) : accounts.length === 0 ? (
        <EmptyState />
      ) : (
        <Card className="overflow-hidden border border-slate-600">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Account</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Revenue</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Followers</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Assigned To</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {accounts.map((account) => (
                  <AccountRow
                    key={account.fourbased_id}
                    account={account}
                    onEdit={() => setEditTarget(account)}
                    onAssign={() => setAssignTarget(account)}
                    onUnassign={() => setUnassignTarget(account)}
                    onDelete={() => setDeleteTarget(account)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Edit Credentials Modal */}
      <EditCredentialsModal
        account={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleEditSave}
      />

      {/* Assign Modal */}
      <AssignModal
        account={assignTarget}
        onClose={() => setAssignTarget(null)}
        onSave={handleAssignSave}
      />

      {/* Unassign Confirm */}
      <ConfirmModal
        isOpen={!!unassignTarget}
        title="Remove Assignment"
        message={`Remove "${unassignTarget?.assigned_to?.team_group_name}" from "${unassignTarget?.name}"? The account will remain in the team.`}
        confirmLabel="Remove"
        danger={false}
        onClose={() => setUnassignTarget(null)}
        onConfirm={handleUnassign}
      />

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Account"
        message={`Permanently delete the account "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────

interface AccountRowProps {
  account: FourBasedUser;
  onEdit: () => void;
  onAssign: () => void;
  onUnassign: () => void;
  onDelete: () => void;
}

function AccountRow({ account, onEdit, onAssign, onUnassign, onDelete }: AccountRowProps) {
  return (
    <tr className="hover:bg-slate-700/30 transition-colors">
      {/* Name + avatar */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            {account.img_url ? (
              <img
                src={account.img_url}
                alt={account.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                <span className="text-xs font-semibold text-gray-300">
                  {account.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card"
              style={{ backgroundColor: account.online_status_dot === 'green' ? '#22c55e' : '#6b7280' }}
            />
          </div>
          <div>
            <p className="font-medium text-gray-100">{account.name}</p>
            <p className="text-xs text-gray-500">@{account.identifier}</p>
          </div>
        </div>
      </td>

      <td className="px-6 py-4 text-gray-300">{account.revenue}</td>
      <td className="px-6 py-4 text-gray-300">{account.followers.toLocaleString()}</td>

      {/* Assigned to */}
      <td className="px-6 py-4">
        {account.assigned_to ? (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-brand-primary/20 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-semibold text-brand-primary">
                {(account.assigned_to.team_group_name ?? '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-gray-300">{account.assigned_to.team_group_name ?? '—'}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-500 italic">Unassigned</span>
        )}
      </td>

      <td className="px-6 py-4">
        <ActionsMenu
          account={account}
          onEdit={onEdit}
          onAssign={onAssign}
          onUnassign={onUnassign}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
}

// ─── Actions Menu ─────────────────────────────────────────────────────────────

function ActionsMenu({ account, onEdit, onAssign, onUnassign, onDelete }: AccountRowProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + window.scrollY + 4, right: window.innerWidth - rect.right });
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('scroll', close, true);
    };
  }, [open]);

  const action = (fn: () => void) => { setOpen(false); fn(); };

  return (
    <div className="flex justify-end">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-slate-700 transition-all"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && createPortal(
        <div
          style={{ position: 'absolute', top: pos.top, right: pos.right }}
          className="w-44 bg-card border border-slate-600 rounded-lg shadow-xl overflow-hidden z-[9999]"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-slate-700 hover:text-gray-100 transition-colors"
            onClick={() => action(onEdit)}
          >
            <Pencil size={14} />
            Edit Credentials
          </button>

          {account.assigned_to ? (
            <button
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-slate-700 hover:text-gray-100 transition-colors"
              onClick={() => action(onUnassign)}
            >
              <UserMinus size={14} />
              Remove Assignment
            </button>
          ) : (
            <button
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-slate-700 hover:text-gray-100 transition-colors"
              onClick={() => action(onAssign)}
            >
              <UserPlus size={14} />
              Assign to Group
            </button>
          )}

          <div className="border-t border-slate-700" />

          <button
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
            onClick={() => action(onDelete)}
          >
            <Trash2 size={14} />
            Delete Account
          </button>
        </div>,
        document.body,
      )}
    </div>
  );
}

// ─── Edit Credentials Modal ───────────────────────────────────────────────────

interface EditCredentialsModalProps {
  account: FourBasedUser | null;
  onClose: () => void;
  onSave: (fourbasedId: string, payload: UpdateFourBasedUserPayload) => Promise<void>;
}

function EditCredentialsModal({ account, onClose, onSave }: EditCredentialsModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (account) {
      setEmail('');
      setPassword('');
      setError(null);
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    if (!email && !password) {
      setError('Please fill in at least one field.');
      return;
    }
    try {
      setIsSaving(true);
      setError(null);
      const payload: UpdateFourBasedUserPayload = {};
      if (email) payload.email = email;
      if (password) payload.password = password;
      await onSave(account.fourbased_id, payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update credentials.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={!!account} onClose={onClose} title="Edit Credentials" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-400">
          Update credentials for <span className="text-gray-200 font-medium">{account?.name}</span>.
          Leave a field blank to keep the current value.
        </p>

        <Input
          label="New Email"
          type="email"
          placeholder="neue@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="off"
        />

        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />

        {error && (
          <p className="text-sm text-red-400 flex items-center gap-1.5">
            <AlertCircle size={14} /> {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 bg-[#ED4C27] hover:bg-[#D8431F] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Assign Modal ─────────────────────────────────────────────────────────────

interface AssignModalProps {
  account: FourBasedUser | null;
  onClose: () => void;
  onSave: (fourbasedId: string, teamGroupId: number) => Promise<void>;
}

function AssignModal({ account, onClose, onSave }: AssignModalProps) {
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!account) return;
    setSelectedGroupId('');
    setError(null);
    setIsLoadingGroups(true);
    groupsApi.list()
      .then(setGroups)
      .catch(() => setError('Failed to load groups.'))
      .finally(() => setIsLoadingGroups(false));
  }, [account]);

  const groupOptions = groups.map((g) => ({
    value: String(g.id),
    label: g.name,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !selectedGroupId) {
      setError('Please select a group.');
      return;
    }
    try {
      setIsSaving(true);
      setError(null);
      await onSave(account.fourbased_id, Number(selectedGroupId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign account.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={!!account} onClose={onClose} title="Assign to Group" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-400">
          Assign <span className="text-gray-200 font-medium">{account?.name}</span> to a group.
          Each account can only be assigned to one group.
        </p>

        <Select
          label="Group"
          options={isLoadingGroups ? [{ value: '', label: 'Loading…' }] : [{ value: '', label: 'Select a group…' }, ...groupOptions]}
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          disabled={isLoadingGroups}
        />

        {error && (
          <p className="text-sm text-red-400 flex items-center gap-1.5">
            <AlertCircle size={14} /> {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || !selectedGroupId}
            className="px-5 py-2 bg-[#ED4C27] hover:bg-[#D8431F] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isSaving ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

function ConfirmModal({ isOpen, title, message, confirmLabel, danger, onClose, onConfirm }: ConfirmModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) setError(null);
  }, [isOpen]);

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-400">{message}</p>

        {error && (
          <p className="text-sm text-red-400 flex items-center gap-1.5">
            <AlertCircle size={14} /> {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`px-5 py-2 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors ${
              danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#ED4C27] hover:bg-[#D8431F]'
            }`}
          >
            {isProcessing ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Add Account Modal ────────────────────────────────────────────────────────

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string, password: string) => Promise<void>;
}

function AddAccountModal({ isOpen, onClose, onSubmit }: AddAccountModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setFormError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(email.trim(), password);
      setEmail('');
      setPassword('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Account" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="E-Mail"
          type="email"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {formError && (
          <p className="text-sm text-red-400 flex items-center gap-1.5">
            <AlertCircle size={14} /> {formError}
          </p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-[#ED4C27] hover:bg-[#D8431F] disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isSubmitting ? 'Adding…' : 'Add Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Empty / Error ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <Card className="p-12 border border-slate-600">
      <div className="text-center">
        <Users className="w-12 h-12 mx-auto mb-3 text-gray-600" />
        <p className="text-gray-400 font-medium">No accounts found</p>
      </div>
    </Card>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <Card className="p-12 border border-slate-600">
      <div className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-100 mb-2">Error loading accounts</h3>
        <p className="text-gray-400 mb-6">{error}</p>
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
