import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight, AlertCircle, Circle, RefreshCw, UserPlus } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { accountsApi } from '../../../modules/accounts/accountsApi';
import type { Account } from '../../../modules/accounts/types';
import { ToastContainer, toast } from '../../../lib/toast';

export function AccountsListPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await accountsApi.getAccounts();
      setAccounts(data ?? []);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
      setError('Failed to load accounts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleSyncAll = async () => {
    try {
      setIsSyncing(true);
      await accountsApi.syncAll();
      toast.success('Sync started successfully');
      await fetchAccounts();
    } catch (err) {
      console.error('Failed to sync:', err);
      toast.error('Sync failed. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddAccount = async (identifier: string, password: string) => {
    await accountsApi.addAccount(identifier, password);
    toast.success('Account added successfully');
    setIsAddModalOpen(false);
    await fetchAccounts();
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
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">Accounts</h1>
          <p className="mt-1 text-sm text-gray-400">{accounts.length} account{accounts.length !== 1 ? 's' : ''} connected</p>
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

      {/* Content */}
      {isLoading ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={fetchAccounts} />
      ) : accounts.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="overflow-hidden border border-slate-600">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Account</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Identifier</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Revenue</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Followers</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Last Activity</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {accounts.map((account) => (
                    <AccountRow
                      key={account.fourbased_id}
                      account={account}
                      onClick={() => navigate(`/accounts/${account.fourbased_id}`)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Account Row
// ============================================================================

interface AccountRowProps {
  account: Account;
  onClick: () => void;
}

function AccountRow({ account, onClick }: AccountRowProps) {
  return (
    <tr
      className="hover:bg-slate-700/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* Avatar + Name */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <AccountAvatar src={account.img_url ?? undefined} alt={account.name} />
          <span className="font-medium text-gray-100">{account.name}</span>
        </div>
      </td>

      {/* Identifier */}
      <td className="px-6 py-4 text-gray-400">{account.identifier}</td>

      {/* Online status */}
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
            account.is_online === true
              ? 'bg-green-900/40 text-green-400'
              : 'bg-slate-700 text-gray-400'
          }`}
        >
          <Circle
            size={7}
            style={{ color: account.online_status_dot === 'green' ? '#22c55e' : '#64748b' }}
            className={account.is_online === true ? 'fill-green-400' : 'fill-gray-500'}
          />
          {account.is_online === true ? 'Online' : account.is_online === false ? 'Offline' : '—'}
        </span>
      </td>

      {/* Revenue */}
      <td className="px-6 py-4 text-right font-medium text-gray-100">
        {account.revenue ?? '—'}
      </td>

      {/* Followers */}
      <td className="px-6 py-4 text-right text-gray-300">
        {account.followers != null ? (account.followers as number).toLocaleString() : '—'}
      </td>

      {/* Last Activity */}
      <td className="px-6 py-4 text-gray-400">
        {account.last_activity ?? '—'}
      </td>

      {/* Action */}
      <td className="px-6 py-4">
        <button
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 rounded-lg transition-all"
        >
          Open
          <ChevronRight size={14} />
        </button>
      </td>
    </tr>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function AccountAvatar({ src, alt }: { src?: string; alt: string }) {
  const [imgError, setImgError] = useState(false);

  if (!src || imgError) {
    return (
      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
        <Users size={14} className="text-gray-500" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-8 h-8 rounded-full object-cover shrink-0"
      onError={() => setImgError(true)}
    />
  );
}

// ============================================================================
// Skeletons / States
// ============================================================================

function TableSkeleton() {
  return (
    <Card className="overflow-hidden border border-slate-600 animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/50">
              {['Account', 'Identifier', 'Status', 'Revenue', 'Followers', 'Last Activity', ''].map((h) => (
                <th key={h} className="px-6 py-3">
                  <div className="h-3 bg-slate-700 rounded w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700" />
                    <div className="h-4 bg-slate-700 rounded w-28" />
                  </div>
                </td>
                <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded w-40" /></td>
                <td className="px-6 py-4"><div className="h-6 bg-slate-700 rounded-full w-16" /></td>
                <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded w-20 ml-auto" /></td>
                <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded w-16 ml-auto" /></td>
                <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded w-16" /></td>
                <td className="px-6 py-4"><div className="h-7 bg-slate-700 rounded w-16" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="p-12 border border-slate-600">
      <div className="text-center">
        <Users className="w-12 h-12 mx-auto mb-3 text-gray-600" />
        <p className="text-gray-400 font-medium">No accounts connected yet</p>
        <p className="text-gray-500 text-sm mt-1">Add your first account to get started.</p>
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

// ============================================================================
// Add Account Modal
// ============================================================================

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (identifier: string, password: string) => Promise<void>;
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
          <p className="text-sm text-red-400">{formError}</p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-[#ED4C27] hover:bg-[#D8431F] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding…' : 'Add Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
}