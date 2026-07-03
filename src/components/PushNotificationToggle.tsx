import { IconLoader2 } from '@tabler/icons-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { useAuthStore } from '../lib/auth/useAuthStore';
import { usePushNotifications } from '../hooks/usePushNotifications';

export function PushNotificationToggle() {
  const { team } = useAuthStore();
  const { permission, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else if (team?.team_id) {
      await subscribe(team.team_id);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">Push-Benachrichtigungen</p>
          <Badge variant={isSubscribed ? 'default' : 'secondary'} className={isSubscribed ? 'bg-brand text-white border-transparent' : ''}>
            {isSubscribed ? 'Aktiv' : 'Inaktiv'}
          </Badge>
        </div>
        {isLoading ? (
          <IconLoader2 size={18} className="animate-spin text-muted-foreground" />
        ) : (
          <Button
            size="sm"
            variant={isSubscribed ? 'outline' : 'default'}
            onClick={handleToggle}
            disabled={permission === 'denied'}
          >
            {isSubscribed ? 'Deaktivieren' : 'Aktivieren'}
          </Button>
        )}
      </div>
      {permission === 'denied' && (
        <p className="text-xs text-muted-foreground">
          Bitte erlaube Benachrichtigungen in deinen Browser-Einstellungen
        </p>
      )}
    </div>
  );
}
