import { createContext, useContext, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationToastContainer } from '../components/NotificationToastContainer';
import type { Notification, NotificationType } from '../modules/notifications/types';

export type NotificationFilter = 'all' | NotificationType;

const getTeamSlug = (): string | null => {
  try {
    const match = document.cookie.match(/(?:^|; )auth_team=([^;]*)/);
    if (!match) return null;
    return String(JSON.parse(decodeURIComponent(match[1])).team_id);
  } catch {
    return null;
  }
};

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  filter: NotificationFilter;
  setFilter: (filter: NotificationFilter) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const navigate = useNavigate();
  const teamSlug = getTeamSlug();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, toasts, dismissToast } =
    useNotifications(teamSlug ?? '', filter === 'all' ? undefined : filter);

  const handleToastOpen = (n: Notification) => {
    if (!n.read_at) markAsRead(n.id);
    if (n.type === 'message' || n.type === 'sale') {
      const fourbasedId = n.fourbased_user?.fourbased_id;
      const chatId = n.data?.chat_id;
      if (fourbasedId && chatId) {
        navigate(`/inbox/${fourbasedId}/chat/${chatId}`);
      }
    }
  };

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, loading, markAsRead, markAllAsRead, filter, setFilter }}
    >
      <NotificationToastContainer toasts={toasts} onDismiss={dismissToast} onOpen={handleToastOpen} />
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotificationsContext must be used within a NotificationsProvider');
  return ctx;
}
