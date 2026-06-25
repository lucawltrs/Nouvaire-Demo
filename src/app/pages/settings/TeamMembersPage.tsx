import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconUsers, IconShield, IconAlertCircle, IconDots, IconPencil, IconTrash, IconUserPlus, IconClock, IconArrowsUpDown, IconArrowUp, IconArrowDown } from '@tabler/icons-react';
import { Card } from '../../../components/ui/Card';
import { PageLoader } from '../../../components/ui/PageLoader';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { useAuthStore } from '../../../lib/auth/useAuthStore';
import { teamApi, type TeamMember } from '../../../modules/shared/services/teamApi';

export function TeamMembersPage() {
  const navigate = useNavigate();
  const { team } = useAuthStore();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [shiftSort, setShiftSort] = useState<'none' | 'asc' | 'desc'>('none');

  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await teamApi.getMembers();
      setMembers(data);
    } catch (err) {
      console.error('Failed to fetch team members:', err);
      setError('Failed to load team members. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();

    const POLL_INTERVAL = 5 * 60 * 1000;
    const interval = setInterval(() => {
      if (!document.hidden) fetchMembers();
    }, POLL_INTERVAL);

    const handleVisibility = () => {
      if (!document.hidden) fetchMembers();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchMembers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/settings')}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
        >
          <IconArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">User Management</h1>
            {team?.team_name && (
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                {team.team_name}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{members.length} member{members.length !== 1 ? 's' : ''} in this team</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-medium transition-all"
        >
          <IconUserPlus size={16} />
          Mitglied hinzufügen
        </button>
      </div>

      <AddMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => { setShowAddModal(false); fetchMembers(); }}
      />

      {isLoading ? (
        <PageLoader message="Lade Team-Mitglieder..." subtitle="Nutzer und Rollen werden abgerufen" />
      ) : error ? (
        <ErrorState error={error} onRetry={fetchMembers} />
      ) : members.length === 0 ? (
        <EmptyState />
      ) : (() => {
        const sorted = shiftSort === 'none'
          ? members
          : [...members].sort((a, b) => {
              if (shiftSort === 'desc') return (b.active_shift ? 1 : 0) - (a.active_shift ? 1 : 0);
              return (a.active_shift ? 1 : 0) - (b.active_shift ? 1 : 0);
            });
        const cycleSort = () =>
          setShiftSort((s) => s === 'none' ? 'desc' : s === 'desc' ? 'asc' : 'none');
        const SortIcon = shiftSort === 'desc' ? IconArrowDown : shiftSort === 'asc' ? IconArrowUp : IconArrowsUpDown;
        return (
          <Card className="overflow-hidden border border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role</th>
                    <th className="px-6 py-3">
                      <button
                        onClick={cycleSort}
                        className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
                      >
                        Schicht
                        <SortIcon size={13} className={shiftSort !== 'none' ? 'text-brand' : ''} />
                      </button>
                    </th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sorted.map((member) => (
                    <MemberRow key={member.id} member={member} />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })()}
    </div>
  );
}

function MemberRow({ member }: { member: TeamMember }) {
  const navigate = useNavigate();
  const isAdmin = member.role === 'admin';
  return (
    <tr
      className="hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={() => navigate(`/settings/members/${member.user_id}`)}
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-foreground">
              {member.user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="font-medium text-foreground">{member.user.name}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-muted-foreground">{member.user.email}</td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            isAdmin
              ? 'bg-brand/10 text-brand border border-brand/20'
              : 'bg-muted text-muted-foreground border border-border'
          }`}
        >
          <IconShield size={11} />
          {member.role}
        </span>
      </td>
      <td className="px-6 py-4">
        {member.active_shift ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 dark:text-green-400 border border-green-500/20">
            <IconClock size={11} />
            Aktiv
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
            <IconClock size={11} />
            Keine
          </span>
        )}
      </td>
      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
        <ActionsMenu />
      </td>
    </tr>
  );
}

function ActionsMenu() {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY + 4,
        right: window.innerWidth - rect.right,
      });
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

  return (
    <div className="flex justify-end">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
      >
        <IconDots size={16} />
      </button>

      {open && createPortal(
        <div
          style={{ position: 'absolute', top: pos.top, right: pos.right }}
          className="w-40 bg-popover border border-border rounded-lg shadow-xl overflow-hidden z-[9999]"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
            onClick={() => setOpen(false)}
          >
            <IconPencil size={14} />
            Edit Role
          </button>
          <button
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            onClick={() => setOpen(false)}
          >
            <IconTrash size={14} />
            Remove
          </button>
        </div>,
        document.body,
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="p-12 border border-border">
      <div className="text-center">
        <IconUsers className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
        <p className="text-muted-foreground font-medium">No members found</p>
      </div>
    </Card>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <Card className="p-12 border border-border">
      <div className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <IconAlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Error loading members</h3>
        <p className="text-muted-foreground mb-6">{error}</p>
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-brand hover:bg-brand-hover text-white font-medium rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    </Card>
  );
}

function AddMemberModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      setError('Passwörter stimmen nicht überein.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await teamApi.registerMember(form);
      setForm({ name: '', email: '', password: '', password_confirmation: '' });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Hinzufügen des Mitglieds.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({ name: '', email: '', password: '', password_confirmation: '' });
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Mitglied hinzufügen" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Name" name="name" value={form.name} onChange={handleChange} placeholder="Max Mustermann" required />
        <Input label="E-Mail" name="email" type="email" value={form.email} onChange={handleChange} placeholder="max@example.com" required />
        <Input label="Passwort" name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" required />
        <Input label="Passwort bestätigen" name="password_confirmation" type="password" value={form.password_confirmation} onChange={handleChange} placeholder="••••••••" required />

        {error && (
          <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent text-sm font-medium transition-all disabled:opacity-60"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <IconUserPlus size={15} />}
            Hinzufügen
          </button>
        </div>
      </form>
    </Modal>
  );
}
