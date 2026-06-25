import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconClock, IconAlertCircle, IconCalendar, IconClockHour3, IconPlayerStop, IconCurrencyDollar, IconX } from '@tabler/icons-react';
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
      const found = members.find((m) => m.user_id === id);
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
      <Card className="p-12 border border-border max-w-lg mx-auto mt-12">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <IconAlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Fehler beim Laden</h3>
          <p className="text-muted-foreground mb-6">{error ?? 'Mitglied nicht gefunden'}</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => navigate('/settings/members')}
              className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Zurück zur Übersicht
            </button>
            <button
              onClick={fetchData}
              className="px-4 py-2 text-sm bg-brand hover:bg-brand-hover text-white font-medium rounded-lg transition-colors"
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
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
        >
          <IconArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-foreground">
              {member.user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{member.user.name}</h1>
            <p className="text-sm text-muted-foreground">{member.user.email}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 rounded-lg">
              <IconClock size={18} className="text-brand" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gesamtschichten</p>
              <p className="text-xl font-bold text-foreground">{sessions.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 rounded-lg">
              <IconClockHour3 size={18} className="text-brand" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gesamtarbeitszeit</p>
              <p className="text-xl font-bold text-foreground">{formatDuration(totalMinutes)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <IconCurrencyDollar size={18} className="text-green-500 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gesamtumsatz</p>
              <p className="text-xl font-bold text-green-500 dark:text-green-400">{totalRevenue}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 rounded-lg">
              <IconCalendar size={18} className="text-brand" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rolle</p>
              <p className="text-base font-semibold text-foreground capitalize">{member.role}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Work Sessions Table */}
      <Card className="overflow-hidden border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Arbeitszeiten</h2>
        </div>

        {isLoadingSessions ? (
          <div className="flex items-center justify-center py-16">
            <span className="w-6 h-6 border-2 border-border border-t-brand rounded-full animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16">
            <IconClock className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">Keine Arbeitszeiten gefunden</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">#</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Start</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ende</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dauer</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Umsatz{chatterPercentage !== null ? ` (${chatterPercentage}%)` : ''}
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions.map((session, index) => (
                  <tr key={session.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-6 py-4 text-muted-foreground text-xs">{index + 1}</td>
                    <td className="px-6 py-4 text-foreground">{formatDateTime(session.started_at)}</td>
                    <td className="px-6 py-4 text-foreground">{formatDateTime(session.ended_at)}</td>
                    <td className="px-6 py-4 text-foreground">{formatDuration(session.duration)}</td>
                    <td className="px-6 py-4">
                      {session.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand/10 text-brand border border-brand/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                          Aktiv
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 dark:text-green-400 border border-green-500/30">
                          Beendet
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-green-500 dark:text-green-400 font-medium">{session.revenue}</td>
                    <td className="px-6 py-4 text-right">
                      {session.is_active && (
                        <button
                          onClick={() => openAdminEndModal(session)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors"
                        >
                          <IconPlayerStop size={13} />
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
            <div className="bg-muted px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-destructive/10">
                  <IconPlayerStop size={18} className="text-destructive" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Schicht admin-seitig beenden</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Session #{adminEndSession.id}</p>
                </div>
              </div>
              <button
                onClick={closeAdminEndModal}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              >
                <IconX size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Endzeitpunkt</label>
                <input
                  type="datetime-local"
                  value={adminEndedAt}
                  onChange={(e) => setAdminEndedAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm focus:outline-none focus:border-brand transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Admin-Notiz</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="z. B. Vom Admin beendet wegen Inaktivität."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:border-brand transition-colors resize-none"
                />
              </div>

              {adminEndError && (
                <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  {adminEndError}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 pb-5 flex justify-end gap-2">
              <button
                onClick={closeAdminEndModal}
                disabled={adminEndLoading}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground border border-border hover:bg-accent transition-colors disabled:opacity-60"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAdminEnd}
                disabled={adminEndLoading || !adminEndedAt}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {adminEndLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <IconPlayerStop size={15} />
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
