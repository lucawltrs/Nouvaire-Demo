import { useEffect, useState } from 'react';
import { IconX } from '@tabler/icons-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useAuthStore } from '../lib/auth/useAuthStore';
import { usePushNotifications } from '../hooks/usePushNotifications';

const DISMISSED_KEY = 'push_banner_dismissed';

const isIOS = () => /iPhone|iPad/.test(navigator.userAgent);
const isStandalonePwa = () => (navigator as Navigator & { standalone?: boolean }).standalone === true;

export function PushNotificationBanner() {
  const { team } = useAuthStore();
  const { permission, isSubscribed, isLoading, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISSED_KEY) === '1');

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISSED_KEY) === '1');
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  };

  const handleActivate = async () => {
    if (!team?.team_id) return;
    await subscribe(team.team_id);
  };

  if (dismissed) return null;

  const showIOSInstallHint = isIOS() && !isStandalonePwa();

  if (!showIOSInstallHint && (isSubscribed || permission !== 'default')) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:left-auto sm:max-w-sm z-50">
      <Card className="p-4 border border-border shadow-lg">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-foreground">
            {showIOSInstallHint ? (
              <>
                📱 Für Push-Benachrichtigungen auf iPhone: Tippe auf das Teilen-Symbol in Safari und wähle
                „Zum Home-Bildschirm hinzufügen". Öffne dann die App vom Homescreen.
              </>
            ) : (
              '🔔 Aktiviere Push-Benachrichtigungen — werde auch außerhalb des Dashboards über neue Nachrichten und Sales informiert.'
            )}
          </p>
          <button
            onClick={handleDismiss}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Schließen"
          >
            <IconX size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3">
          {showIOSInstallHint ? (
            <Button variant="ghost" onClick={handleDismiss}>
              Verstanden
            </Button>
          ) : (
            <>
              <Button
                onClick={handleActivate}
                isLoading={isLoading}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Jetzt aktivieren
              </Button>
              <Button variant="ghost" onClick={handleDismiss}>
                Später
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
