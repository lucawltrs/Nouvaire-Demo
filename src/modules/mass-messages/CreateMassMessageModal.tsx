import { useState, useEffect } from 'react';
import { IconSend, IconAlertCircle } from '@tabler/icons-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { Input } from '../../components/ui/Input';
import { toast } from '../../lib/toast';
import { massMessagesApi } from './massMessagesApi';
import type { MassMessage, UserList } from './types';
import type { Account } from '../accounts/types';

const FILTER_OPTIONS = [
  { value: 'users_with_purchases', label: 'Users with purchases' },
  { value: 'users_without_purchases', label: 'Users without purchases' },
  { value: 'users_with_subscription', label: 'Users with subscription' },
  { value: 'users_without_subscription', label: 'Users without subscription' },
];

type SelectionMode = 'none' | 'include' | 'exclude';

const EMPTY_FORM = {
  message: '',
  filter: [] as string[],
  exclude_filter: [] as string[],
  include_user_list: [] as string[],
  exclude_user_list: [] as string[],
  to_be_posted_at: '',
  delete_latest: false,
};

interface CreateMassMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Account is already known (e.g. selected on the page itself) — skips the account picker step. */
  accountId?: string;
  /** Accounts to choose from when no accountId is given (e.g. Dashboard quick action). */
  accounts?: Account[];
  onCreated?: (message: MassMessage | null) => void;
}

export function CreateMassMessageModal({ isOpen, onClose, accountId, accounts, onCreated }: CreateMassMessageModalProps) {
  const needsAccountSelection = !accountId;
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [step, setStep] = useState<'account' | 'compose'>(needsAccountSelection ? 'account' : 'compose');
  const [userLists, setUserLists] = useState<UserList[]>([]);
  const [userListsLoading, setUserListsLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const effectiveAccountId = accountId ?? selectedAccount?.fourbased_id ?? '';

  useEffect(() => {
    if (!isOpen) return;
    setForm(EMPTY_FORM);
    setFormError(null);
    setSelectedAccount(null);
    setStep(needsAccountSelection ? 'account' : 'compose');
    if (accountId) loadUserLists(accountId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, accountId]);

  const loadUserLists = (id: string) => {
    setUserListsLoading(true);
    massMessagesApi.getUserLists(id)
      .then(setUserLists)
      .catch(() => setUserLists([]))
      .finally(() => setUserListsLoading(false));
  };

  const handleSelectAccount = (account: Account) => {
    setSelectedAccount(account);
    setStep('compose');
    loadUserLists(account.fourbased_id);
  };

  const getFilterMode = (value: string): SelectionMode =>
    form.filter.includes(value) ? 'include' : form.exclude_filter.includes(value) ? 'exclude' : 'none';

  const setFilterMode = (value: string, mode: SelectionMode) => {
    setForm((f) => ({
      ...f,
      filter: mode === 'include' ? [...f.filter.filter((v) => v !== value), value] : f.filter.filter((v) => v !== value),
      exclude_filter: mode === 'exclude' ? [...f.exclude_filter.filter((v) => v !== value), value] : f.exclude_filter.filter((v) => v !== value),
    }));
  };

  const getUserListMode = (id: string): SelectionMode =>
    form.include_user_list.includes(id) ? 'include' : form.exclude_user_list.includes(id) ? 'exclude' : 'none';

  const setUserListMode = (id: string, mode: SelectionMode) => {
    setForm((f) => ({
      ...f,
      include_user_list: mode === 'include' ? [...f.include_user_list.filter((v) => v !== id), id] : f.include_user_list.filter((v) => v !== id),
      exclude_user_list: mode === 'exclude' ? [...f.exclude_user_list.filter((v) => v !== id), id] : f.exclude_user_list.filter((v) => v !== id),
    }));
  };

  const handleCreate = async () => {
    if (!form.message.trim()) {
      setFormError('Message text is required.');
      return;
    }
    if (!effectiveAccountId) {
      setFormError('Please select an account first.');
      return;
    }
    try {
      setIsSubmitting(true);
      setFormError(null);
      const newMsg = await massMessagesApi.create(effectiveAccountId, {
        message: form.message.trim(),
        filter: form.filter,
        include_user_list: form.include_user_list,
        exclude_user_list: form.exclude_user_list,
        exclude_filter: form.exclude_filter,
        file_stack_id: null,
        to_be_posted_at: form.to_be_posted_at ? form.to_be_posted_at.replace('T', ' ') + ':00' : null,
        delete_latest: form.delete_latest,
      });
      toast.success('Mass message created.');
      onCreated?.(newMsg);
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create mass message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Mass Message" size="md">
      {step === 'account' ? (
        <div className="p-4 sm:p-6 space-y-3">
          <p className="text-sm text-muted-foreground">Account auswählen:</p>
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
            {(accounts ?? []).map((account) => (
              <button
                key={account.fourbased_id}
                onClick={() => handleSelectAccount(account)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-card hover:border-brand/40 hover:bg-brand/5 text-left transition-all"
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
        <div className="p-4 sm:p-6 space-y-5">
          {needsAccountSelection && selectedAccount && (
            <div className="flex items-center gap-2">
              <button onClick={() => setStep('account')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← zurück</button>
              <span className="text-xs text-muted-foreground">Account:</span>
              <span className="text-xs font-medium text-foreground">{selectedAccount.name}</span>
            </div>
          )}

          <Textarea
            label="Message *"
            placeholder="Enter your message…"
            rows={4}
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          />

          {/* Target group filters */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Target Group</p>
            <div className="space-y-1.5">
              {FILTER_OPTIONS.map((opt) => {
                const mode = getFilterMode(opt.value);
                return (
                  <div key={opt.value} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-foreground">{opt.label}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setFilterMode(opt.value, mode === 'include' ? 'none' : 'include')}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                          mode === 'include' ? 'bg-brand text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Include
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterMode(opt.value, mode === 'exclude' ? 'none' : 'exclude')}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                          mode === 'exclude' ? 'bg-red-600 text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Exclude
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {form.filter.length === 0 && form.include_user_list.length === 0 && (
              <p className="mt-1.5 text-xs text-yellow-500">No target selected — add filters or include a user list.</p>
            )}
          </div>

          {/* User Lists */}
          {userListsLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-3 h-3 border border-gray-600 border-t-gray-400 rounded-full animate-spin" />
              Loading user lists…
            </div>
          ) : userLists.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">User Lists</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {userLists.map((list) => {
                  const mode = getUserListMode(list._id);
                  return (
                    <div key={list._id} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-foreground">{list.name}</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setUserListMode(list._id, mode === 'include' ? 'none' : 'include')}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                            mode === 'include' ? 'bg-brand text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Include
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserListMode(list._id, mode === 'exclude' ? 'none' : 'exclude')}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                            mode === 'exclude' ? 'bg-red-600 text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Exclude
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Delete latest sent message */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={form.delete_latest}
              onChange={(e) => setForm((f) => ({ ...f, delete_latest: e.target.checked }))}
              className="w-4 h-4 mt-0.5 rounded border-border bg-muted text-brand focus:ring-brand-500 focus:ring-offset-slate-900"
            />
            <span className="text-sm text-foreground group-hover:text-foreground transition-colors">
              Neueste bereits gesendete Nachricht löschen
              <span className="block text-xs text-muted-foreground mt-0.5">Beim Erstellen dieser Nachricht wird die aktuell neueste, bereits an die Kunden zugestellte Nachricht entfernt.</span>
            </span>
          </label>

          {/* Scheduled send */}
          <Input
            label="Schedule (optional)"
            type="datetime-local"
            value={form.to_be_posted_at}
            onChange={(e) => setForm((f) => ({ ...f, to_be_posted_at: e.target.value }))}
          />
          {!form.to_be_posted_at && (
            <p className="-mt-3 text-xs text-muted-foreground">Leave empty to send immediately.</p>
          )}

          {formError && (
            <p className="text-sm text-red-400 flex items-center gap-1.5">
              <IconAlertCircle size={14} /> {formError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting} className="flex items-center gap-2">
              <IconSend size={14} />
              {isSubmitting ? 'Sending…' : 'Create'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
