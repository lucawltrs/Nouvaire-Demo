import { useCallback, useEffect, useState } from 'react';
import { urlBase64ToUint8Array } from '../lib/push';
import { pushApi } from '../modules/shared/services/pushApi';

interface UsePushNotificationsReturn {
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: (teamId: number) => Promise<void>;
  unsubscribe: () => Promise<void>;
}

const isPushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;

export function usePushNotifications(): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>(
    isPushSupported() ? Notification.permission : 'denied'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    setPermission(Notification.permission);

    (async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration('/sw.js');
        const subscription = await registration?.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch {
        setIsSubscribed(false);
      }
    })();
  }, []);

  const subscribe = useCallback(async (teamId: number) => {
    if (!isPushSupported()) return;
    setIsLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') return;

      const registration = await navigator.serviceWorker.register('/sw.js');
      const vapidPublicKey = await pushApi.getVapidPublicKey();

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const p256dhKey = subscription.getKey('p256dh');
      const authKey = subscription.getKey('auth');
      if (!p256dhKey || !authKey) throw new Error('Push subscription is missing keys');

      await pushApi.subscribe({
        endpoint: subscription.endpoint,
        public_key: btoa(String.fromCharCode(...new Uint8Array(p256dhKey))),
        auth_token: btoa(String.fromCharCode(...new Uint8Array(authKey))),
        team_id: teamId,
        user_agent: navigator.userAgent,
      });

      setIsSubscribed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    if (!isPushSupported()) return;
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      const subscription = await registration?.pushManager.getSubscription();
      if (!subscription) {
        setIsSubscribed(false);
        return;
      }

      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await pushApi.unsubscribe(endpoint);

      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { permission, isSubscribed, isLoading, subscribe, unsubscribe };
}
