import { useState } from 'react';
import { IconClock, IconPlayerPlay, IconClockHour3 } from '@tabler/icons-react';
import { useWorkSessionStore } from '../store/useWorkSessionStore';
import { postStartWorkSession } from '../services/workSession.api';
import { useAuthStore } from '../../../lib/auth/useAuthStore';

export function WorkSessionModal() {
  const { showModal, startSession, snooze } = useWorkSessionStore();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  if (!showModal) return null;

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    const now = new Date();
    const tzOffsetMin = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - tzOffsetMin * 60000);
    const sign = tzOffsetMin <= 0 ? '+' : '-';
    const absMin = Math.abs(tzOffsetMin);
    const tzStr = `${sign}${String(Math.floor(absMin / 60)).padStart(2, '0')}:${String(absMin % 60).padStart(2, '0')}`;
    const localStartedAt = localDate.toISOString().slice(0, 23) + tzStr;
    try {
      let startedAt = localStartedAt;
      if (token) {
        const result = await postStartWorkSession(localStartedAt, token);
        startedAt = result.started_at;
        startSession(startedAt, result.id);
      } else {
        startSession(startedAt, 0);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Schicht konnte nicht gestartet werden. Bitte versuche es erneut.';
      setError(message);
      setBlocked(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSnooze = () => {
    snooze();
  };

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-muted px-6 py-5 border-b border-border flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand/20">
            <IconClock size={20} className="text-brand" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Keine aktive Schicht</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Arbeitszeiterfassung</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-foreground leading-relaxed">
            Du hast aktuell keine Schicht gestartet. Möchtest du deine Arbeitszeit jetzt erfassen?
          </p>

          {error && (
            <p className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col gap-2">
          <button
            onClick={handleStart}
            disabled={loading || blocked}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-white font-medium text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <IconPlayerPlay size={16} />
            )}
            Schicht jetzt starten
          </button>

          <button
            onClick={handleSnooze}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted font-medium text-sm transition-all disabled:opacity-60"
          >
            <IconClockHour3 size={16} />
            Später erinnern (5 Min.)
          </button>
        </div>
      </div>
    </div>
  );
}
