import { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertCircle, RefreshCw } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { PageLoader } from '../../../components/ui/PageLoader';
import { accountsApi } from '../../../modules/accounts/accountsApi';
import type { Account } from '../../../modules/accounts/types';
import { toast } from '../../../lib/toast';

export function AccountsListPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">Accounts</h1>
        <p className="mt-1 text-sm text-gray-400">{accounts.length} account{accounts.length !== 1 ? 's' : ''} connected</p>
      </div>

      {/* Content */}
      {isLoading ? (
        <PageLoader message="Lade Accounts..." subtitle="Account-Daten werden abgerufen" />
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
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">E-Mail</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {accounts.map((account) => (
                    <AccountRow
                      key={account.fourbased_id}
                      account={account}
                      onClick={() => navigate(`/accounts/${account.fourbased_id}`)}
                      onRefresh={(updated) =>
                        setAccounts((prev) =>
                          prev.map((a) => (a.fourbased_id === updated.fourbased_id ? updated : a)),
                        )
                      }
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
  onRefresh: (updated: Account) => void;
}

const AccountRow = memo(function AccountRow({ account, onClick, onRefresh }: AccountRowProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const updated = await accountsApi.refreshAccount(account.fourbased_id);
      onRefresh({ ...account, ...updated });
      toast.success(`${account.name} aktualisiert`);
    } catch {
      toast.error(`Aktualisierung von ${account.name} fehlgeschlagen`);
    } finally {
      setIsRefreshing(false);
    }
  };

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

      {/* E-Mail */}
      <td className="px-6 py-4 text-gray-400">{account.identifier}</td>

      {/* Refresh */}
      <td className="px-6 py-4 text-right">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          title="Account-Daten aktualisieren"
          className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 hover:bg-slate-600 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </td>
    </tr>
  );
});

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
// States
// ============================================================================

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

