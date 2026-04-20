import { useState, useEffect, useCallback, FormEvent } from 'react';
import { Clock, AlertCircle, Timer, DollarSign, TrendingUp, Trophy, Lock, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/PageLoader';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { OtpInput } from '../../components/ui/OtpInput';
import {
  getSessionOverview,
  type SessionOverviewSession,
} from '../../modules/work-sessions/services/workSession.api';
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
  const { user } = useAuthStore();
  const loginWithToken = useAuthStore((state) => state.loginWithToken);

  const [sessions, setSessions] = useState<SessionOverviewSession[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<string>('$ 0.00');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
          <span className="text-lg font-bold text-gray-300">
            {user?.name?.charAt(0).toUpperCase() ?? '?'}
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-100">{user?.name}</h1>
          <p className="text-sm text-gray-400">{user?.email}</p>
          <button
            onClick={openPwModal}
            className="mt-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Passwort ändern
          </button>
        </div>
      </div>

      {/* Password change modal */}
      <Modal isOpen={pwModalOpen} onClose={closePwModal} title="Passwort ändern" size="sm">
        {pwStep === 'idle' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Wir senden einen 6-stelligen Code an{' '}
              <span className="text-gray-300 font-medium">{user?.email}</span>.
            </p>
            {pwError && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
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
            <p className="text-sm text-gray-400">
              Code wurde an <span className="text-gray-300 font-medium">{user?.email}</span> gesendet.
            </p>
            {pwError && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                {pwError}
              </div>
            )}
            <div>
              <p className="block text-sm font-medium text-gray-300 mb-3">6-stelliger Code</p>
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
              <CheckCircle2 size={28} className="text-green-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-100 mb-1">Passwort geändert!</p>
              <p className="text-sm text-gray-400">Dein Passwort wurde erfolgreich aktualisiert.</p>
            </div>
            <Button size="sm" onClick={closePwModal}>Schließen</Button>
          </div>
        )}
      </Modal>

      {/* Error state */}
      {error && (
        <Card className="p-6 border border-red-800/40">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={fetchData}
              className="ml-auto px-3 py-1.5 text-xs font-medium text-gray-300 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Erneut versuchen
            </button>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <p className="text-xs text-gray-400">Gesamtumsatz (20%)</p>
              <p className="text-xl font-bold text-green-400">{totalRevenue}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-slate-600">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <TrendingUp size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Abgeschlossen</p>
              <p className="text-xl font-bold text-gray-100">{completedSessions}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue Roadmap */}
      <Card className="p-6 border border-slate-600">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <Trophy size={18} className="text-yellow-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-100">Revenue Roadmap</h2>
            <p className="text-xs text-gray-400">
              {nextMilestone
                ? `Noch $${(nextMilestone - revenueValue).toFixed(2)} bis zum nächsten Meilenstein`
                : 'Alle Meilensteine erreicht — Legend!'}
            </p>
          </div>
        </div>

        {/* Progress bar to next milestone */}
        {nextMilestone && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>${prevMilestone.toLocaleString()}</span>
              <span className="font-medium text-gray-300">${revenueValue.toFixed(2)}</span>
              <span>${nextMilestone.toLocaleString()}</span>
            </div>
            <div className="h-2.5 w-full bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-right text-xs text-gray-500 mt-1">{progress.toFixed(1)}%</p>
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
                    ? 'bg-green-900/30 text-green-400 border-green-800/50'
                    : isCurrent
                    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                    : 'bg-slate-800 text-gray-500 border-slate-700'
                }`}
              >
                {done ? (
                  <CheckCircle2 size={12} />
                ) : isCurrent ? (
                  <Trophy size={12} />
                ) : (
                  <Lock size={12} />
                )}
                ${milestone.toLocaleString()}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Sessions Table */}
      <Card className="overflow-hidden border border-slate-600">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-100">Meine Arbeitszeiten</h2>
          {sessions.some((s) => s.is_active) && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
              Schicht aktiv
            </span>
          )}
        </div>

        {sessions.length === 0 ? (
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
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Umsatz (20%)</th>
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
                    <td className="px-6 py-4 font-medium text-green-400">{session.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Revenue info note */}
      <p className="text-xs text-gray-500 px-1">
        Der Umsatz entspricht deinem 20%-Anteil am Gruppenerlös der jeweiligen Schicht (ohne Subscription-Umsätze).
      </p>
    </div>
  );
}
