import { useState, useEffect, useCallback } from 'react';
import { IconSend, IconPlus, IconAlertCircle, IconChevronLeft, IconChevronRight, IconUsers, IconTrash } from '@tabler/icons-react';
import { Card } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/PageLoader';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ToastContainer, toast } from '../../lib/toast';
import { useAuthStore } from '../../lib/auth/useAuthStore';
import { accountsApi } from '../../modules/accounts/accountsApi';
import { massMessagesApi } from '../../modules/mass-messages/massMessagesApi';
import { CreateMassMessageModal } from '../../modules/mass-messages/CreateMassMessageModal';
import type { MassMessage, MassMessageStatus } from '../../modules/mass-messages/types';
import type { Account } from '../../modules/accounts/types';

const PAGE_LIMIT = 20;

const STATUS_TABS: { value: MassMessageStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'finished', label: 'Finished' },
  { value: 'failed', label: 'Failed' },
];

function statusBadge(status: MassMessageStatus) {
  const map: Record<MassMessageStatus, { variant: 'success' | 'warning' | 'default' | 'danger'; label: string }> = {
    finished: { variant: 'success', label: 'Finished' },
    pending: { variant: 'warning', label: 'Pending' },
    processing: { variant: 'default', label: 'Processing' },
    failed: { variant: 'danger', label: 'Failed' },
  };
  const { variant, label } = map[status] ?? { variant: 'default', label: status };
  return <Badge variant={variant} size="sm">{label}</Badge>;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function MassMessagesPage() {
  const { team } = useAuthStore();
  const isAdmin = team?.role === 'admin';

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  const [messages, setMessages] = useState<MassMessage[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<MassMessageStatus | ''>('');
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<MassMessage | null>(null);
  const latestSentMessage = messages.reduce<MassMessage | null>((latest, m) => {
    if (m.status !== 'finished') return latest;
    if (!latest || new Date(m.created_at) > new Date(latest.created_at)) return m;
    return latest;
  }, null);
  const isDeletingLatestSent = !!deleteTarget && deleteTarget.status === 'finished' && deleteTarget._id === latestSentMessage?._id;
  const [isDeleting, setIsDeleting] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    accountsApi.getAccounts()
      .then(setAccounts)
      .catch(() => toast.error('Failed to load accounts.'))
      .finally(() => setAccountsLoading(false));
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!selectedAccountId) return;
    try {
      setListLoading(true);
      setListError(null);
      const data = await massMessagesApi.list(selectedAccountId, {
        offset,
        limit: PAGE_LIMIT,
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      setMessages(data.messages);
      setTotalCount(data.count);
    } catch {
      setListError('Failed to load mass messages. Please try again.');
    } finally {
      setListLoading(false);
    }
  }, [selectedAccountId, offset, statusFilter]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleAccountChange = (id: string) => {
    setSelectedAccountId(id);
    setOffset(0);
    setStatusFilter('');
  };

  const handleStatusFilter = (status: MassMessageStatus | '') => {
    setStatusFilter(status);
    setOffset(0);
  };

  const handleDelete = async () => {
    if (!deleteTarget || !selectedAccountId) return;
    try {
      setIsDeleting(true);
      await massMessagesApi.delete(selectedAccountId, deleteTarget._id);
      toast.success('Mass message deleted.');
      setMessages((prev) => prev.filter((m) => m._id !== deleteTarget._id));
      setTotalCount((c) => c - 1);
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete mass message. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenCreate = () => {
    setIsCreateOpen(true);
  };

  const handleMassMessageCreated = (newMsg: MassMessage | null) => {
    if (newMsg) {
      setMessages((prev) => [newMsg, ...prev]);
      setTotalCount((c) => c + 1);
    } else {
      fetchMessages();
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_LIMIT));
  const currentPage = Math.floor(offset / PAGE_LIMIT) + 1;

  return (
    <div className="space-y-6">
      <ToastContainer />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Mass Messages</h1>
            {team?.team_name && (
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
                {team.team_name}
              </span>
            )}
          </div>
          {selectedAccountId && totalCount > 0 && (
            <p className="mt-0.5 text-sm text-muted-foreground">{totalCount} message{totalCount !== 1 ? 's' : ''}</p>
          )}
        </div>
        {selectedAccountId && (
          <Button onClick={handleOpenCreate} className="flex items-center gap-2">
            <IconPlus size={16} />
            New Message
          </Button>
        )}
      </div>

      {/* Account Selector */}
      {accountsLoading ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="shrink-0 w-40 h-20 rounded-xl bg-muted border border-border animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {accounts.map((account) => {
            const isSelected = selectedAccountId === account.fourbased_id;
            return (
              <button
                key={account.fourbased_id}
                onClick={() => handleAccountChange(account.fourbased_id)}
                className={`shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                  isSelected
                    ? 'bg-brand/15 border-brand text-foreground shadow-md shadow-brand/10'
                    : 'bg-muted border-border text-muted-foreground hover:border-slate-500 hover:text-foreground'
                }`}
              >
                {account.img_url ? (
                  <img src={account.img_url} alt={account.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold ${
                    isSelected ? 'bg-brand/30 text-brand' : 'bg-muted text-foreground'
                  }`}>
                    {account.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate max-w-[120px] ${isSelected ? 'text-foreground' : 'text-foreground'}`}>
                    {account.name}
                  </p>
                  {account.followers != null && (
                    <p className="text-xs text-muted-foreground mt-0.5">{account.followers.toLocaleString()} followers</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Messages List */}
      {selectedAccountId && (
        <>
          {/* Status Tabs */}
          <div className="flex gap-1 flex-wrap">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleStatusFilter(tab.value as MassMessageStatus | '')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === tab.value
                    ? 'bg-brand text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {listLoading ? (
            <PageLoader message="Loading messages…" subtitle="Fetching mass messages" />
          ) : listError ? (
            <Card className="p-6 border border-border">
              <div className="flex items-center gap-3 text-red-400">
                <IconAlertCircle size={18} />
                <p className="text-sm">{listError}</p>
              </div>
            </Card>
          ) : messages.length === 0 ? (
            <Card className="p-10 border border-border flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
                <IconSend size={22} className="text-brand" />
              </div>
              <p className="text-foreground font-medium">No mass messages yet</p>
              <p className="text-sm text-muted-foreground">
                {statusFilter ? `No messages with status "${statusFilter}".` : 'Create your first mass message to get started.'}
              </p>
              {!statusFilter && (
                <Button onClick={handleOpenCreate} className="mt-2 flex items-center gap-2">
                  <IconPlus size={15} />
                  New Message
                </Button>
              )}
            </Card>
          ) : (
            <Card className="overflow-hidden border border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Message</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Recipients</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Views</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Scheduled / Sent</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</th>
                      {isAdmin && <th className="px-4 py-3" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {messages.map((msg) => (
                      <tr key={msg._id} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-foreground truncate" title={msg.message}>{msg.message}</p>
                          {msg.filter && msg.filter.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{msg.filter.join(', ')}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {msg.status ? statusBadge(msg.status) : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-foreground">
                            <IconUsers size={13} className="text-muted-foreground" />
                            {msg.recipient_count != null ? msg.recipient_count.toLocaleString() : '—'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-foreground">
                          {msg.viewed_count != null ? msg.viewed_count.toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                          {formatDate(msg.to_be_posted_at)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">
                          {formatDate(msg.created_at)}
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <button
                              onClick={() => setDeleteTarget(msg)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-900/20 transition-all"
                              title="Delete"
                            >
                              <IconTrash size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalCount > PAGE_LIMIT && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setOffset((o) => Math.max(0, o - PAGE_LIMIT))}
                      disabled={offset === 0}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <IconChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setOffset((o) => o + PAGE_LIMIT)}
                      disabled={offset + PAGE_LIMIT >= totalCount}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <IconChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {/* No account selected state */}
      {!selectedAccountId && !accountsLoading && accounts.length > 0 && (
        <div className="flex flex-col items-center gap-3 text-center py-16 text-muted-foreground">
          <IconSend size={32} className="text-slate-600" />
          <p className="text-sm">Select an account above to view its mass messages.</p>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Mass Message"
        size="sm"
      >
        <div className="p-4 sm:p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Delete this mass message?
          </p>
          {deleteTarget && (
            <p className="text-sm text-foreground bg-muted rounded-lg px-3 py-2 line-clamp-3">
              "{deleteTarget.message}"
            </p>
          )}
          {isDeletingLatestSent && (
            <div className="flex items-start gap-2 text-xs text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
              <IconAlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>Dies ist die neueste Nachricht, die bereits an die Kunden gesendet wurde und diese erreicht hat. Das Löschen entfernt sie nur aus dieser Übersicht — die Zustellung wird dadurch nicht zurückgenommen.</span>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Modal */}
      <CreateMassMessageModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        accountId={selectedAccountId}
        onCreated={handleMassMessageCreated}
      />
    </div>
  );
}

