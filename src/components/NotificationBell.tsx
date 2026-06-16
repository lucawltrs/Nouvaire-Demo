import { useEffect, useRef, useState } from 'react';
import { Bell, Euro, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotificationsContext, type NotificationFilter } from '../contexts/NotificationsContext';
import type { Notification, NotificationType } from '../modules/notifications/types';

function relativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Gerade eben';
  if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min`;
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std`;
  return `vor ${Math.floor(diff / 86400)} Tagen`;
}

const TYPE_STYLES: Partial<Record<NotificationType, { icon: typeof Euro; iconClass: string; bgClass: string }>> = {
  sale: { icon: Euro, iconClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10' },
  message: { icon: MessageCircle, iconClass: 'text-blue-400', bgClass: 'bg-blue-500/10' },
};

const FILTER_OPTIONS: { value: NotificationFilter; label: string }[] = [
  { value: 'all', label: 'Alle' },
  { value: 'sale', label: 'Verkäufe' },
  { value: 'tip', label: 'Trinkgelder' },
  { value: 'message', label: 'Nachrichten' },
];

function NotificationItem({
  notification,
  onNavigate,
}: {
  notification: Notification;
  onNavigate: (n: Notification) => void;
}) {
  const style = TYPE_STYLES[notification.type];
  const Icon = style?.icon ?? Bell;
  const isUnread = !notification.read_at;
  const avatarUrl = notification.fourbased_user?.media_url;

  return (
    <button
      onClick={() => onNavigate(notification)}
      className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-700/50 ${
        isUnread ? 'bg-slate-700/30' : ''
      }`}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="w-8 h-8 rounded-full shrink-0 mt-0.5 object-cover"
        />
      ) : (
        <span className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 mt-0.5 ${style?.bgClass ?? 'bg-slate-600/20'}`}>
          <Icon size={16} className={style?.iconClass ?? 'text-gray-400'} />
        </span>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-medium truncate ${isUnread ? 'text-gray-100' : 'text-gray-300'}`}>
            {notification.title}
          </p>
          {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />}
        </div>
        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{notification.body}</p>
        <p className="text-xs text-gray-500 mt-1">{relativeTime(notification.created_at)}</p>
      </div>
    </button>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, filter, setFilter } =
    useNotificationsContext();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleNotificationClick = (n: Notification) => {
    if (!n.read_at) markAsRead(n.id);
    if (n.type === 'message' || n.type === 'sale') {
      const fourbasedId = n.fourbased_user?.fourbased_id;
      const chatId = n.data?.chat_id;
      if (fourbasedId && chatId) {
        setOpen(false);
        navigate(`/inbox/${fourbasedId}/chat/${chatId}`);
      }
    }
  };

  return (
    <div ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`relative p-2 rounded-lg transition-all text-gray-400 hover:text-gray-100 hover:bg-slate-700 ${open ? 'bg-slate-700 text-gray-100' : ''}`}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-2rem))] bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-gray-100">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-brand-primary hover:underline transition-colors"
              >
                Alle als gelesen markieren
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 px-2 py-2 border-b border-border overflow-x-auto">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  filter === opt.value
                    ? 'bg-brand-primary text-white'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <span className="w-5 h-5 border-2 border-slate-600 border-t-brand-primary rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Bell size={28} className="text-gray-600" />
                <p className="text-sm text-gray-500">Keine Notifications</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onNavigate={handleNotificationClick} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
