import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, AlertCircle, Calendar, Timer, StopCircle, X, DollarSign } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { PageLoader } from '../../../components/ui/PageLoader';
import { teamApi, type TeamMember } from '../../../modules/shared/services/teamApi';
import {
  getSessionOverview,
  postAdminEndWorkSession,
  type SessionOverviewSession,
} from '../../../modules/work-sessions/services/workSession.api';
import { settingsApi } from '../../../modules/shared/services/settingsApi';
import { useAuthStore } from '../../../lib/auth/useAuthStore';

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function formatDuration(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return '—';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function TeamMemberDetailPage() {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();

  const { token } = useAuthStore();
  const [member, setMember] = useState<TeamMember | null>(null);
  const [sessions, setSessions] = useState<SessionOverviewSession[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<string>('$ 0.00');
  const [chatterPercentage, setChatterPercentage] = useState<number | null>(null);
  const [isLoadingMember, setIsLoadingMember] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin-end modal state
  const [adminEndSession, setAdminEndSession] = useState<SessionOverviewSession | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [adminEndedAt, setAdminEndedAt] = useState('');
  const [adminEndLoading, setAdminEndLoading] = useState(false);
  const [adminEndError, setAdminEndError] = useState<string | null>(null);

  const openAdminEndModal = (session: SessionOverviewSession) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setAdminEndSession(session);
    setAdminNote('');
    setAdminEndedAt(local);
    setAdminEndError(null);
  };

  const closeAdminEndModal = () => {
    setAdminEndSession(null);
    setAdminNote('');
    setAdminEndedAt('');
    setAdminEndError(null);
  };

  const handleAdminEnd = async () => {
    if (!adminEndSession || !token || !memberId) return;
    setAdminEndLoading(true);
    setAdminEndError(null);
    try {
      const endedAtIso = new Date(adminEndedAt).toISOString().slice(0, 19);
      await postAdminEndWorkSession(adminEndSession.id, adminNote, endedAtIso, token);
      closeAdminEndModal();
      const overview = await getSessionOverview(Number(memberId));
      setSessions(overview?.sessions ?? []);
      setTotalRevenue(overview?.total_revenue ?? '$ 0.00');
    } catch (err) {
      setAdminEndError(err instanceof Error ? err.message : 'Fehler beim Beenden der Schicht.');
    } finally {
      setAdminEndLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!memberId) return;
    const id = Number(memberId);

    setIsLoadingMember(true);
    setIsLoadingSessions(true);
    setError(null);

    try {
      const members = await teamApi.getMembers();
      const found = members.find((m) => m.user_id === id || m.id === id);
      setMember(found ?? null);
    } catch {
      setError('Mitglied konnte nicht geladen werden.');
    } finally {
      setIsLoadingMember(false);
    }

    try {
      const overview = await getSessionOverview(id);
      setSessions(overview?.sessions ?? []);
      setTotalRevenue(overview?.total_revenue ?? '$ 0.00');
    } catch {
      setSessions([]);
      setTotalRevenue('$ 0.00');
    } finally {
      setIsLoadingSessions(false);
    }

    try {
      const teamSettings = await settingsApi.get();
      setChatterPercentage(teamSettings.chatter_percentage);
    } catch {
      // leave null, fallback shown in header
    }
  }, [memberId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoadingMember) {
    return <PageLoader message="Lade Mitglied..." subtitle="Profil und Arbeitszeiten werden abgerufen" />;
  }

  if (error || !member) {
    return (
      <Card className="p-12 border border-slate-600 max-w-lg mx-auto mt-12">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-100 mb-2">Fehler beim Laden</h3>
          <p className="text-gray-400 mb-6">{error ?? 'Mitglied nicht gefunden'}</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => navigate('/settings/members')}
              className="px-4 py-2 text-sm text-gray-300 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Zurück zur Übersicht
            </button>
            <button
              onClick={fetchData}
              className="px-4 py-2 text-sm bg-[#ED4C27] hover:bg-[#D8431F] text-white font-medium rounded-lg transition-colors"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      </Card>
    );
  }

  const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/settings/members')}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-slate-700 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-gray-300">
              {member.user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">{member.user.name}</h1>
            <p className="text-sm text-gray-400">{member.user.email}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border border-slate-600">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-primary/10 rounded-lg">
              <Clock size={18} className="text-brand-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Gesamtschichten</p>
              <p className="text-xl font-bold text-gray-100">{sessions.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-slate-600">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-primary/10 rounded-lg">
              <Timer size={18} className="text-brand-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Gesamtarbeitszeit</p>
              <p className="text-xl font-bold text-gray-100">{formatDuration(totalMinutes)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-slate-600">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign size={18} className="text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Gesamtumsatz</p>
              <p className="text-xl font-bold text-green-400">{totalRevenue}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-slate-600">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-primary/10 rounded-lg">
              <Calendar size={18} className="text-brand-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Rolle</p>
              <p className="text-base font-semibold text-gray-100 capitalize">{member.role}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Work Sessions Table */}
      <Card className="overflow-hidden border border-slate-600">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-base font-semibold text-gray-100">Arbeitszeiten</h2>
        </div>

        {isLoadingSessions ? (
          <div className="flex items-center justify-center py-16">
            <span className="w-6 h-6 border-2 border-slate-600 border-t-brand-primary rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-10 h-10 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400">Keine Arbeitszeiten gefunden</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">#</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Start</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Ende</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Dauer</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Umsatz{chatterPercentage !== null ? ` (${chatterPercentage}%)` : ''}
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {sessions.map((session, index) => (
                  <tr key={session.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 text-gray-500 text-xs">{index + 1}</td>
                    <td className="px-6 py-4 text-gray-300">{formatDateTime(session.started_at)}</td>
                    <td className="px-6 py-4 text-gray-300">{formatDateTime(session.ended_at)}</td>
                    <td className="px-6 py-4 text-gray-300">{formatDuration(session.duration)}</td>
                    <td className="px-6 py-4">
                      {session.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                          Aktiv
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-800/40">
                          Beendet
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-green-400 font-medium">{session.revenue}</td>
                    <td className="px-6 py-4 text-right">
                      {session.is_active && (
                        <button
                          onClick={() => openAdminEndModal(session)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-400 border border-red-800/40 hover:bg-red-900/20 transition-colors"
                        >
                          <StopCircle size={13} />
                          Admin-Beenden
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Admin-End Modal */}
      {adminEndSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-800 px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-red-500/10">
                  <StopCircle size={18} className="text-red-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-100">Schicht admin-seitig beenden</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Session #{adminEndSession.id}</p>
                </div>
              </div>
              <button
                onClick={closeAdminEndModal}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-slate-700 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Endzeitpunkt</label>
                <input
                  type="datetime-local"
                  value={adminEndedAt}
                  onChange={(e) => setAdminEndedAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-gray-100 text-sm focus:outline-none focus:border-brand-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Admin-Notiz</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="z. B. Vom Admin beendet wegen Inaktivität."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-brand-primary transition-colors resize-none"
                />
              </div>

              {adminEndError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {adminEndError}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 pb-5 flex justify-end gap-2">
              <button
                onClick={closeAdminEndModal}
                disabled={adminEndLoading}
                className="px-4 py-2 rounded-lg text-sm text-gray-300 border border-slate-600 hover:bg-slate-700 transition-colors disabled:opacity-60"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAdminEnd}
                disabled={adminEndLoading || !adminEndedAt}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {adminEndLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <StopCircle size={15} />
                )}
                Schicht beenden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
