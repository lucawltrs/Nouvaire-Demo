import { useCallback, useEffect, useRef, useState } from 'react';
import { getConfig } from '../lib/config';
import type { Notification, NotificationsResponse, UnreadCountResponse } from '../modules/notifications/types';

const POLL_INTERVAL_MS = 5_000;

// Browsers block audio playback until the user has interacted with the page
// at least once. We keep one shared <audio> element and "unlock" it on the
// first click/keydown — afterwards .play() works without further interaction.
const notificationAudio = new Audio('/sounds/notification.mp3');
notificationAudio.volume = 0.6;
let audioUnlocked = false;

const unlockAudio = () => {
  if (audioUnlocked) return;
  notificationAudio
    .play()
    .then(() => {
      notificationAudio.pause();
      notificationAudio.currentTime = 0;
      audioUnlocked = true;
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    })
    .catch(() => {});
};
document.addEventListener('click', unlockAudio);
document.addEventListener('keydown', unlockAudio);

const playNotificationSound = () => {
  try {
    notificationAudio.currentTime = 0;
    notificationAudio.play().catch(() => {});
  } catch {
    // ignore — file missing or autoplay blocked
  }
};

const notifFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('auth_token');
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
};

export function useNotifications(teamSlug: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [messageToasts, setMessageToasts] = useState<Notification[]>([]);
  const initializedRef = useRef(false);
  const pausedRef = useRef(false);
  const seenIdsRef = useRef<Set<string> | null>(null);

  const apiBase = `${getConfig().API_URL}/teams/${teamSlug}/notifications`;

  const fetchNotifications = useCallback(async () => {
    if (pausedRef.current) return;
    setLoading(true);
    try {
      const [notifRes, countRes] = await Promise.all([
        notifFetch(`${apiBase}?limit=20`).then((res) => {
          if (!res.ok) throw new Error('Failed to fetch notifications');
          return res.json() as Promise<NotificationsResponse>;
        }),
        notifFetch(`${apiBase}/unread-count`).then((res) => {
          if (!res.ok) throw new Error('Failed to fetch unread count');
          return res.json() as Promise<UnreadCountResponse>;
        }),
      ]);
      setNotifications(notifRes.data);
      setUnreadCount(countRes.unread_count);

      const seenIds = seenIdsRef.current;
      if (seenIds === null) {
        seenIdsRef.current = new Set(notifRes.data.map((n) => n.id));
      } else {
        const newArrivals = notifRes.data.filter((n) => !n.read_at && !seenIds.has(n.id));
        if (newArrivals.length > 0) {
          playNotificationSound();
          const newMessages = newArrivals.filter((n) => n.type === 'message');
          if (newMessages.length > 0) {
            setMessageToasts((prev) => [...newMessages, ...prev]);
          }
        }
        seenIdsRef.current = new Set(notifRes.data.map((n) => n.id));
      }
    } catch {
      // ignore — keep previous state, retry on next poll
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      const res = await notifFetch(`${apiBase}/${id}/read`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to mark notification as read');
    } catch {
      fetchNotifications();
    }
  }, [apiBase, fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    setUnreadCount(0);
    try {
      const res = await notifFetch(`${apiBase}/read-all`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to mark all notifications as read');
    } catch {
      fetchNotifications();
    }
  }, [apiBase, fetchNotifications]);

  useEffect(() => {
    if (!teamSlug) return;

    if (!initializedRef.current) {
      initializedRef.current = true;
      fetchNotifications();
    }

    const intervalId = setInterval(fetchNotifications, POLL_INTERVAL_MS);

    const handleVisibilityChange = () => {
      pausedRef.current = document.hidden;
      if (!document.hidden) fetchNotifications();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [teamSlug, fetchNotifications]);

  const dismissToast = useCallback((id: string) => {
    setMessageToasts((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    messageToasts,
    dismissToast,
  };
}
