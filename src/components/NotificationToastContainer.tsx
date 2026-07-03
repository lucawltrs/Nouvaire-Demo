import { useEffect } from 'react';
import { IconCurrencyEuro, IconGift, IconMessageCircle, IconMicrophone, IconX } from '@tabler/icons-react';
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

  const isMessage = notification.type === 'message';
  const isVoiceMessage = notification.type === 'voice_message';
  const isSale = notification.type === 'sale';
  const avatarUrl = notification.fourbased_user?.media_url;

  return (
    <div className="flex items-start gap-3 w-80 bg-card border border-border rounded-xl shadow-2xl p-4 pointer-events-auto animate-in slide-in-from-right">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="w-9 h-9 rounded-full shrink-0 object-cover"
        />
      ) : isMessage ? (
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-500/10 shrink-0">
          <IconMessageCircle size={18} className="text-blue-400" />
        </span>
      ) : isVoiceMessage ? (
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-500/10 shrink-0">
          <IconMicrophone size={18} className="text-blue-400" />
        </span>
      ) : isSale ? (
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-500/10 shrink-0">
          <IconCurrencyEuro size={18} className="text-emerald-400" />
        </span>
      ) : (
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-amber-500/10 shrink-0">
          <IconGift size={18} className="text-amber-400" />
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{notification.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.body}</p>
        {(isMessage || isVoiceMessage || isSale) && (
          <button
            onClick={() => {
              onDismiss(notification.id);
              onOpen(notification);
            }}
            className="text-xs text-brand hover:underline mt-2 transition-colors"
          >
            Chat öffnen
          </button>
        )}
      </div>
      <button
        onClick={() => onDismiss(notification.id)}
        className="p-1 -m-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors shrink-0"
        aria-label="Schließen"
      >
        <IconX size={14} />
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
