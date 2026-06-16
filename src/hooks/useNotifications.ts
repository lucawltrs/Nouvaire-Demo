import { useCallback, useEffect, useRef, useState } from 'react';
import { getConfig } from '../lib/config';
import type { Notification, NotificationsResponse, NotificationType, UnreadCountResponse } from '../modules/notifications/types';

const POLL_INTERVAL_MS = 5_000;

// Browsers block audio playback until the user has interacted with the page
// at least once. We keep one shared <audio> element and "unlock" it on the
// first click/keydown — afterwards .play() works without further interaction.
const notificationAudio = new Audio('/sounds/notification.mp3');
notificationAudio.volume = 0.6;
const coinAudio = new Audio('/sounds/coin.mp3');
coinAudio.volume = 0.6;
const saleAudio = new Audio('/sounds/sale-notification.mp3');
saleAudio.volume = 0.6;
let audioUnlocked = false;

const unlockAudio = () => {
  if (audioUnlocked) return;
  Promise.all(
    [notificationAudio, coinAudio, saleAudio].map((audio) =>
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
        })
        .catch(() => {}),
    ),
  ).then(() => {
    audioUnlocked = true;
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
  });
};
document.addEventListener('click', unlockAudio);
document.addEventListener('keydown', unlockAudio);

const playSound = (audio: HTMLAudioElement) => {
  try {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {
    // ignore — file missing or autoplay blocked
  }
};

const playNotificationSound = () => playSound(notificationAudio);
const playCoinSound = () => playSound(coinAudio);
const playSaleSound = () => playSound(saleAudio);

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

export function useNotifications(teamSlug: string, type?: NotificationType) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Notification[]>([]);
  const initializedRef = useRef(false);
  const seenIdsRef = useRef<Set<string> | null>(null);

  const apiBase = `${getConfig().API_URL}/teams/${teamSlug}/notifications`;
  const listUrl = `${apiBase}?limit=20${type ? `&type=${type}` : ''}`;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const [notifRes, countRes] = await Promise.all([
        notifFetch(listUrl).then((res) => {
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
          if (newArrivals.some((n) => n.type === 'sale')) {
            playSaleSound();
          } else if (newArrivals.some((n) => n.type === 'tip')) {
            playCoinSound();
          } else {
            playNotificationSound();
          }
          const newToasts = newArrivals.filter((n) => n.type === 'message' || n.type === 'sale' || n.type === 'tip');
          if (newToasts.length > 0) {
            setToasts((prev) => [...newToasts, ...prev]);
          }
        }
        // Accumulate seen ids rather than replacing the set, so notifications
        // that temporarily fall out of the latest-20 window don't get treated
        // as "new" again (and re-trigger sounds/toasts) when they reappear.
        for (const n of notifRes.data) {
          seenIds.add(n.id);
        }
        if (seenIds.size > 200) {
          const excess = seenIds.size - 200;
          const it = seenIds.values();
          for (let i = 0; i < excess; i++) {
            seenIds.delete(it.next().value as string);
          }
        }
      }
    } catch {
      // ignore — keep previous state, retry on next poll
    } finally {
      setLoading(false);
    }
  }, [apiBase, listUrl]);

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
    }
    fetchNotifications();

    const intervalId = setInterval(fetchNotifications, POLL_INTERVAL_MS);

    // Refetch immediately when the tab regains focus, so the view is up to
    // date right away instead of waiting for the next interval tick. Polling
    // itself keeps running in the background (browsers may throttle it, but
    // we don't pause it — that would silence background notifications/sounds).
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchNotifications();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [teamSlug, fetchNotifications]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    toasts,
    dismissToast,
  };
}
