import { useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import type { Notification } from '../modules/notifications/types';

const TOAST_DURATION_MS = 8_000;

function Toast({
  notification,
  onDismiss,
  onOpen,
}: {
  notification: Notification;
  onDismiss: (id: string) => void;
  onOpen: (n: Notification) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(notification.id), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  return (
    <div className="flex items-start gap-3 w-80 bg-card border border-border rounded-xl shadow-2xl p-4 pointer-events-auto animate-in slide-in-from-right">
      <span className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-500/10 shrink-0">
        <MessageCircle size={18} className="text-blue-400" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-100 truncate">{notification.title}</p>
        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{notification.body}</p>
        <button
          onClick={() => {
            onDismiss(notification.id);
            onOpen(notification);
          }}
          className="text-xs text-brand-primary hover:underline mt-2 transition-colors"
        >
          Chat öffnen
        </button>
      </div>
      <button
        onClick={() => onDismiss(notification.id)}
        className="p-1 -m-1 rounded-md text-gray-500 hover:text-gray-300 hover:bg-slate-700/50 transition-colors shrink-0"
        aria-label="Schließen"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function NotificationToastContainer({
  toasts,
  onDismiss,
  onOpen,
}: {
  toasts: Notification[];
  onDismiss: (id: string) => void;
  onOpen: (n: Notification) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((n) => (
        <Toast key={n.id} notification={n} onDismiss={onDismiss} onOpen={onOpen} />
      ))}
    </div>
  );
}
