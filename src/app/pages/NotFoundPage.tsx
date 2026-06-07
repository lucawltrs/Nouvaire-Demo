import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-6 text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-slate-700">
        <SearchX className="w-7 h-7 text-gray-400" />
      </div>
      <div className="space-y-1">
        <p className="text-lg font-semibold text-gray-100">Seite nicht gefunden</p>
        <p className="text-sm text-gray-500 max-w-sm">
          Die angeforderte Seite existiert nicht oder wurde verschoben.
        </p>
      </div>
      <Link to="/">
        <Button>Zurück zum Dashboard</Button>
      </Link>
    </div>
  );
}
