import { useEffect, useRef, useState } from 'react';
import { Clock, Square } from 'lucide-react';
import { useWorkSessionStore } from '../store/useWorkSessionStore';
import { putEndWorkSession } from '../services/workSession.api';
import { useAuthStore } from '../../../lib/auth/useAuthStore';

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function WorkSessionTimer() {
  const { active, startedAt, sessionId, endSession } = useWorkSessionStore();
  const { token } = useAuthStore();
  const [elapsed, setElapsed] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !startedAt) return;
    const calcElapsed = () => {
      const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      setElapsed(Math.max(0, diff));
    };
    calcElapsed();
    const interval = setInterval(calcElapsed, 1000);
    return () => clearInterval(interval);
  }, [active, startedAt]);

  // Close popover on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setError(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!active || !startedAt) return null;

  const handleEnd = async () => {
    setLoading(true);
    setError(null);
    try {
      if (token && sessionId) {
        await putEndWorkSession(sessionId, new Date().toISOString(), token);
      }
      endSession();
      setOpen(false);
    } catch {
      setError('Schicht konnte nicht beendet werden.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen((o) => !o); setError(null); }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary/10 border border-brand-primary/30 text-brand-primary text-sm font-mono hover:bg-brand-primary/20 transition-all select-none"
      >
        <Clock size={14} className="shrink-0 animate-pulse" />
        <span>{formatElapsed(elapsed)}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs text-gray-400">Aktive Schicht</p>
            <p className="text-sm font-semibold text-gray-100 font-mono mt-0.5">{formatElapsed(elapsed)}</p>
          </div>

          {error && (
            <p className="mx-3 mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="p-3">
            <button
              onClick={handleEnd}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-brand-primary hover:bg-brand-hover text-white text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Square size={14} />
              )}
              Schicht beenden
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
