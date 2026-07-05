import { useState, useEffect, useCallback, FormEvent } from 'react';
import { IconClock, IconAlertCircle, IconClockHour3, IconCurrencyDollar, IconTrendingUp, IconTrophy, IconLock, IconCircleCheck, IconPlayerPlay } from '@tabler/icons-react';
import { Card } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/PageLoader';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { OtpInput } from '../../components/ui/OtpInput';
import {
  getSessionOverview,
  postStartWorkSession,
  type SessionOverviewSession,
} from '../../modules/work-sessions/services/workSession.api';
import { useWorkSessionStore } from '../../modules/work-sessions/store/useWorkSessionStore';
import { useAuthStore } from '../../lib/auth/useAuthStore';
import { forgotPassword, resetPassword } from '../../lib/auth/authApi';

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

type PwStep = 'idle' | 'sending' | 'otp' | 'success';

export function MyProfilePage() {
  const { user, token } = useAuthStore();
  const loginWithToken = useAuthStore((state) => state.loginWithToken);
  const { active, startSession } = useWorkSessionStore();

  const [sessions, setSessions] = useState<SessionOverviewSession[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<string>('$ 0.00');
  const [chatterPercentage, setChatterPercentage] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [startLoading, setStartLoading] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const handleStartSession = async () => {
    setStartLoading(true);
    setStartError(null);
    const now = new Date();
    const tzOffsetMin = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - tzOffsetMin * 60000);
    const sign = tzOffsetMin <= 0 ? '+' : '-';
    const absMin = Math.abs(tzOffsetMin);
    const tzStr = `${sign}${String(Math.floor(absMin / 60)).padStart(2, '0')}:${String(absMin % 60).padStart(2, '0')}`;
    const localStartedAt = localDate.toISOString().slice(0, 23) + tzStr;
    try {
      if (token) {
        const result = await postStartWorkSession(localStartedAt, token);
        startSession(result.started_at, result.id);
      } else {
        startSession(localStartedAt, 0);
      }
      fetchData();
    } catch (err) {
      setStartError(err instanceof Error ? err.message : 'Schicht konnte nicht gestartet werden.');
    } finally {
      setStartLoading(false);
    }
  };

  // Password change modal
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [pwStep, setPwStep] = useState<PwStep>('idle');
  const [pwOtp, setPwOtp] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');

  const openPwModal = () => {
    setPwStep('idle');
    setPwOtp('');
    setPwNew('');
    setPwConfirm('');
    setPwError('');
    setPwModalOpen(true);
  };

  const closePwModal = () => {
    setPwModalOpen(false);
  };

  const handleSendCode = async () => {
    if (!user?.email) return;
    setPwLoading(true);
    setPwError('');
    try {
      await forgotPassword(user.email);
      setPwStep('otp');
    } catch {
      setPwError('Fehler beim Senden des Codes. Bitte versuche es erneut.');
    } finally {
      setPwLoading(false);
    }
  };

  const handlePwSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (pwOtp.length < 6) {
      setPwError('Bitte gib den vollständigen 6-stelligen Code ein.');
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwError('Die Passwörter stimmen nicht überein.');
      return;
    }
    setPwLoading(true);
    setPwError('');
    try {
      const token = await resetPassword(user!.email, pwOtp, pwNew, pwConfirm);
      await loginWithToken(token);
      setPwStep('success');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Fehler beim Zurücksetzen.');
    } finally {
      setPwLoading(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const overview = await getSessionOverview(user.id);
      setSessions(overview?.sessions ?? []);
      setTotalRevenue(overview?.total_revenue ?? '$ 0.00');
      setChatterPercentage(overview?.chatter_percentage ?? null);
    } catch {
      setError('Deine Arbeitszeiten konnten nicht geladen werden.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return <PageLoader message="Lade Profil..." subtitle="Deine Arbeitszeiten und Umsätze werden abgerufen" />;
  }

  const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration ?? 0), 0);
  const completedSessions = sessions.filter((s) => !s.is_active).length;

  const revenueValue = parseFloat(totalRevenue.replace(/[^0-9.]/g, '')) || 0;
  const MILESTONES = [100, 250, 500, 1000, 2500, 5000, 10000];
  const nextMilestone = MILESTONES.find((m) => m > revenueValue) ?? null;
  const prevMilestone = nextMilestone
    ? (MILESTONES[MILESTONES.indexOf(nextMilestone) - 1] ?? 0)
    : MILESTONES[MILESTONES.length - 1];
  const progress = nextMilestone
    ? Math.min(100, ((revenueValue - prevMilestone) / (nextMilestone - prevMilestone)) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
          <span className="text-lg font-bold text-foreground">
            {user?.name?.charAt(0).toUpperCase() ?? '?'}
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{user?.name}</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <button
            onClick={openPwModal}
            className="mt-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Passwort ändern
          </button>
        </div>
      </div>

      {/* Start shift banner – shown when no active session */}
      {!active && (
        <Card className="p-4 border border-border">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand/10 rounded-lg">
                <IconClock size={18} className="text-brand" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Keine aktive Schicht</p>
                <p className="text-xs text-muted-foreground">Starte jetzt deine Arbeitszeit</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={handleStartSession}
                disabled={startLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {startLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <IconPlayerPlay size={14} />
                )}
                Schicht jetzt starten
              </button>
              {startError && (
                <p className="text-xs text-destructive">{startError}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Password change modal */}
      <Modal isOpen={pwModalOpen} onClose={closePwModal} title="Passwort ändern" size="sm">
        {pwStep === 'idle' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Wir senden einen 6-stelligen Code an{' '}
              <span className="text-foreground font-medium">{user?.email}</span>.
            </p>
            {pwError && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm">
                {pwError}
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" size="sm" onClick={closePwModal}>Abbrechen</Button>
              <Button size="sm" isLoading={pwLoading} onClick={handleSendCode}>
                Code senden
              </Button>
            </div>
          </div>
        )}

        {pwStep === 'otp' && (
          <form onSubmit={handlePwSubmit} className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Code wurde an <span className="text-foreground font-medium">{user?.email}</span> gesendet.
            </p>
            {pwError && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm">
                {pwError}
              </div>
            )}
            <div>
              <p className="block text-sm font-medium text-foreground mb-3">6-stelliger Code</p>
              <OtpInput value={pwOtp} onChange={setPwOtp} disabled={pwLoading} />
            </div>
            <Input
              label="Neues Passwort"
              type="password"
              placeholder="••••••••"
              value={pwNew}
              onChange={(e) => setPwNew(e.target.value)}
              required
            />
            <Input
              label="Passwort bestätigen"
              type="password"
              placeholder="••••••••"
              value={pwConfirm}
              onChange={(e) => setPwConfirm(e.target.value)}
              required
            />
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={closePwModal}>Abbrechen</Button>
              <Button type="submit" size="sm" isLoading={pwLoading} disabled={pwOtp.length < 6}>
                Passwort ändern
              </Button>
            </div>
          </form>
        )}

        {pwStep === 'success' && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
              <IconCircleCheck size={28} className="text-green-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground mb-1">Passwort geändert!</p>
              <p className="text-sm text-muted-foreground">Dein Passwort wurde erfolgreich aktualisiert.</p>
            </div>
            <Button size="sm" onClick={closePwModal}>Schließen</Button>
          </div>
        )}
      </Modal>

      {/* Error state */}
      {error && (
        <Card className="p-6 border border-destructive/30">
          <div className="flex items-center gap-3">
            <IconAlertCircle className="w-5 h-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={fetchData}
              className="ml-auto px-3 py-1.5 text-xs font-medium text-muted-foreground border border-border rounded-lg hover:bg-accent hover:text-foreground transition-colors"
            >
              Erneut versuchen
            </button>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <p className="text-xs text-muted-foreground">
                Gesamtumsatz{chatterPercentage !== null ? ` (${chatterPercentage}%)` : ''}
              </p>
              <p className="text-xl font-bold text-green-500 dark:text-green-400">{totalRevenue}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <IconTrendingUp size={18} className="text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Abgeschlossen</p>
              <p className="text-xl font-bold text-foreground">{completedSessions}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue Roadmap */}
      <Card className="p-6 border border-border">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <IconTrophy size={18} className="text-yellow-500 dark:text-yellow-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Revenue Roadmap</h2>
            <p className="text-xs text-muted-foreground">
              {nextMilestone
                ? `Noch $${(nextMilestone - revenueValue).toFixed(2)} bis zum nächsten Meilenstein`
                : 'Alle Meilensteine erreicht — Legend!'}
            </p>
          </div>
        </div>

        {/* Progress bar to next milestone */}
        {nextMilestone && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>${prevMilestone.toLocaleString()}</span>
              <span className="font-medium text-foreground">${revenueValue.toFixed(2)}</span>
              <span>${nextMilestone.toLocaleString()}</span>
            </div>
            <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-right text-xs text-muted-foreground mt-1">{progress.toFixed(1)}%</p>
          </div>
        )}

        {/* Milestone badges */}
        <div className="flex flex-wrap gap-2">
          {MILESTONES.map((milestone) => {
            const done = revenueValue >= milestone;
            const isCurrent = milestone === nextMilestone;
            return (
              <div
                key={milestone}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  done
                    ? 'bg-green-500/10 text-green-500 dark:text-green-400 border-green-500/30'
                    : isCurrent
                    ? 'bg-yellow-500/10 text-yellow-500 dark:text-yellow-400 border-yellow-500/30'
                    : 'bg-muted text-muted-foreground border-border'
                }`}
              >
                {done ? (
                  <IconCircleCheck size={12} />
                ) : isCurrent ? (
                  <IconTrophy size={12} />
                ) : (
                  <IconLock size={12} />
                )}
                ${milestone.toLocaleString()}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Sessions Table */}
      <Card className="overflow-hidden border border-border">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Meine Arbeitszeiten</h2>
          {sessions.some((s) => s.is_active) && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-brand/10 text-brand border border-brand/20">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
              Schicht aktiv
            </span>
          )}
        </div>

        {sessions.length === 0 ? (
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
                    <td className="px-6 py-4 font-medium text-green-500 dark:text-green-400">{session.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Revenue info note */}
      <p className="text-xs text-muted-foreground px-1">
        Der Umsatz entspricht deinem {chatterPercentage !== null ? `${chatterPercentage}%` : ''}-Anteil am Gruppenerlös der jeweiligen Schicht (ohne Subscription-Umsätze).
      </p>
    </div>
  );
}
