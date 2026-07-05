import { useEffect, useRef, useState } from 'react';
import { IconBell, IconBellRinging, IconCurrencyEuro, IconMessageCircle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useNotificationsContext, type NotificationFilter } from '../contexts/NotificationsContext';
import type { Notification, NotificationType } from '../modules/notifications/types';
import { cn } from '../lib/utils';
import { Badge } from './ui/Badge';

function relativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Gerade eben';
  if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min`;
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std`;
  return `vor ${Math.floor(diff / 86400)} Tagen`;
}

const TYPE_STYLES: Partial<Record<NotificationType, { icon: typeof IconCurrencyEuro; iconClass: string; bgClass: string }>> = {
  sale:    { icon: IconCurrencyEuro,          iconClass: 'text-emerald-500 dark:text-emerald-400', bgClass: 'bg-emerald-50 dark:bg-emerald-500/10' },
  message: { icon: IconMessageCircle, iconClass: 'text-blue-500 dark:text-blue-400',       bgClass: 'bg-blue-50 dark:bg-blue-500/10' },
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
  const Icon = style?.icon ?? IconBell;
  const isUnread = !notification.read_at;
  const avatarUrl = notification.fourbased_user?.media_url;

  return (
    <button
      onClick={() => onNavigate(notification)}
      className={cn(
        'w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent',
        isUnread && 'bg-brand/5'
      )}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full shrink-0 mt-0.5 object-cover" />
      ) : (
        <span className={cn('flex items-center justify-center w-8 h-8 rounded-full shrink-0 mt-0.5', style?.bgClass ?? 'bg-muted')}>
          <Icon size={15} className={style?.iconClass ?? 'text-muted-foreground'} />
        </span>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn('text-sm font-medium truncate', isUnread ? 'text-foreground' : 'text-muted-foreground')}>
            {notification.title}
          </p>
          {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.body}</p>
        <p className="text-xs text-muted-foreground/60 mt-1">{relativeTime(notification.created_at)}</p>
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

  const BellIcon = unreadCount > 0 ? IconBellRinging : IconBell;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'h-8 w-8 flex items-center justify-center rounded-lg transition-colors relative',
          open ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        )}
        aria-label="Notifications"
      >
        <BellIcon size={17} className={unreadCount > 0 ? 'text-brand' : ''} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-brand text-white text-[9px] font-bold px-1 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-2 right-2 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-[min(22rem,calc(100vw-1rem))] bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-5">
                  {unreadCount}
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-brand hover:text-brand/80 font-medium transition-colors"
              >
                Alle gelesen
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 px-3 py-2 border-b border-border overflow-x-auto">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={cn(
                  'shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                  filter === opt.value
                    ? 'bg-brand text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <span className="w-5 h-5 border-2 border-border border-t-brand rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <IconBell size={26} className="text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Keine Notifications</p>
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
