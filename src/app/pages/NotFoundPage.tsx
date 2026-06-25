import { Link } from 'react-router-dom';
import { IconSearchOff } from '@tabler/icons-react';
import { Button } from '../../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-6 text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-muted">
        <IconSearchOff className="w-7 h-7 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-lg font-semibold text-foreground">Seite nicht gefunden</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Die angeforderte Seite existiert nicht oder wurde verschoben.
        </p>
      </div>
      <Link to="/">
        <Button>Zurück zum Dashboard</Button>
      </Link>
    </div>
  );
}
