import { useState, useEffect, useCallback } from 'react';
import { Clock, AlertCircle, Timer, DollarSign, TrendingUp } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { PageLoader } from '../../components/ui/PageLoader';
import {
  getSessionOverview,
  type SessionOverviewSession,
} from '../../modules/work-sessions/services/workSession.api';
import { useAuthStore } from '../../lib/auth/useAuthStore';

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

export function MyProfilePage() {
  const { user } = useAuthStore();

  const [sessions, setSessions] = useState<SessionOverviewSession[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<string>('$ 0.00');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        </div>
      </div>

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
