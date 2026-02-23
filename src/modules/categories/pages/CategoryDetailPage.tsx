import { useParams, Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

export function CategoryDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/categories">
            <Button variant="ghost" size="sm">
              ← Zurück zur Liste
            </Button>
          </Link>
        </div>
      </div>

      <div>
        <h1 className="text-4xl font-bold text-gray-100 mb-2">Kategorie #{id}</h1>
        <p className="text-gray-400">Kategoriedetails</p>
      </div>

      <Card>
        <div className="p-8 text-center">
          <p className="text-gray-400">Category detail page coming soon...</p>
        </div>
      </Card>
    </div>
  );
}
