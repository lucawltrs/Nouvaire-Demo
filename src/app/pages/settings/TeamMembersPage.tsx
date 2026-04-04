import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Shield, AlertCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { PageLoader } from '../../../components/ui/PageLoader';
import { useAuthStore } from '../../../lib/auth/useAuthStore';
import { teamApi, type TeamMember } from '../../../modules/shared/services/teamApi';

export function TeamMembersPage() {
  const navigate = useNavigate();
  const { team } = useAuthStore();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, [fetchMembers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/settings')}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-slate-700 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">User Management</h1>
            {team?.team_name && (
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-gray-300 border border-slate-600">
                {team.team_name}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-gray-400">{members.length} member{members.length !== 1 ? 's' : ''} in this team</p>
        </div>
      </div>

      {isLoading ? (
        <PageLoader message="Lade Team-Mitglieder..." subtitle="Nutzer und Rollen werden abgerufen" />
      ) : error ? (
        <ErrorState error={error} onRetry={fetchMembers} />
      ) : members.length === 0 ? (
        <EmptyState />
      ) : (
        <Card className="overflow-hidden border border-slate-600">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Role</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {members.map((member) => (
                  <MemberRow key={member.id} member={member} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function MemberRow({ member }: { member: TeamMember }) {
  const navigate = useNavigate();
  const isAdmin = member.role === 'admin';
  return (
    <tr
      className="hover:bg-slate-700/30 transition-colors cursor-pointer"
      onClick={() => navigate(`/settings/members/${member.user_id}`)}
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-gray-300">
              {member.user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="font-medium text-gray-100">{member.user.name}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-gray-400">{member.user.email}</td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            isAdmin
              ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
              : 'bg-slate-700 text-gray-300 border border-slate-600'
          }`}
        >
          <Shield size={11} />
          {member.role}
        </span>
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
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-slate-700 transition-all"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && createPortal(
        <div
          style={{ position: 'absolute', top: pos.top, right: pos.right }}
          className="w-40 bg-card border border-slate-600 rounded-lg shadow-xl overflow-hidden z-[9999]"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-slate-700 hover:text-gray-100 transition-colors"
            onClick={() => setOpen(false)}
          >
            <Pencil size={14} />
            Edit Role
          </button>
          <button
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
            onClick={() => setOpen(false)}
          >
            <Trash2 size={14} />
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
    <Card className="p-12 border border-slate-600">
      <div className="text-center">
        <Users className="w-12 h-12 mx-auto mb-3 text-gray-600" />
        <p className="text-gray-400 font-medium">No members found</p>
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
        <h3 className="text-lg font-semibold text-gray-100 mb-2">Error loading members</h3>
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
