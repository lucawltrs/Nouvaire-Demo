import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { PageLoader } from '../../../components/ui/PageLoader';
import {
  fetchUserByFourBasedId,
  fetchUserUnreadMessages,
  FourBasedAccount,
  getTotalUnreadMessages,
} from '../services/4based.api';

export function FourBasedModelDetailPage() {
  const { fourbasedId } = useParams<{ fourbasedId: string }>();
  const [account, setAccount] = useState<FourBasedAccount | null>(null);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProfileUrl = (name: string) => `https://4based.com/profile/${encodeURIComponent(name)}`;
  const formattedTotalNettoAmount = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.round(account?.total_netto_amount ?? 0));

  useEffect(() => {
    const loadAccount = async () => {
      if (!fourbasedId) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [accountData, unreadData] = await Promise.all([
          fetchUserByFourBasedId(fourbasedId),
          fetchUserUnreadMessages(fourbasedId),
        ]);

        setAccount(accountData);
        setTotalUnreadMessages(getTotalUnreadMessages(unreadData.response ?? {}));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Fehler beim Laden des Accounts';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadAccount();
  }, [fourbasedId]);

  if (isLoading) {
    return (
      <PageLoader
        message="Lade Account..."
        subtitle="Account-Daten und ungelesene Nachrichten werden geladen"
      />
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg">
          {error}
        </div>
        <Link to="/4based/models">
          <Button variant="secondary">Zurück zur Liste</Button>
        </Link>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Account nicht gefunden</p>
        <Link to="/4based/models" className="inline-block mt-4">
          <Button variant="secondary">Zurück zur Liste</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/4based/models">
          <Button variant="ghost" size="sm">
            ← Zurück zur Liste
          </Button>
        </Link>
        <a
          href={getProfileUrl(account.name)}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded border border-gray-600 text-cyan-400 hover:border-cyan-500 hover:text-cyan-300"
          aria-label={`Profil von ${account.name} öffnen`}
          title="4Based Profil öffnen"
        >
          ↗
        </a>
      </div>

      <Card className="p-6">
        <div className="flex items-start gap-6">
          <img
            src={account.img_url}
            alt={account.name}
            className="w-20 h-20 rounded-full object-cover border border-border"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-3">{account.name}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge>{account.identifier}</Badge>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 h-full flex flex-col">
          <h2 className="text-xl font-semibold text-foreground mb-4">Statistics</h2>
          <p className="text-sm text-muted-foreground mb-4">Werte für die letzten 30 Tage.</p>
          <div className="mt-auto flex items-center justify-between gap-3">
            <Link to={`/4based/models/${account.fourbased_id}/statistics`}>
              <Button variant="secondary">Zur Statistikseite</Button>
            </Link>
            <Badge>Summe Provision: {formattedTotalNettoAmount}</Badge>
          </div>
        </Card>

        <Card className="p-6 h-full flex flex-col">
          <h2 className="text-xl font-semibold text-foreground mb-4">Chat</h2>
          <p className="text-sm text-muted-foreground mb-4">Alle Unterhaltungen auf einer eigenen Seite.</p>
          {totalUnreadMessages > 0 ? (
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-2 rounded border border-red-800 bg-red-900/30 w-fit">
              <span className="inline-flex items-center justify-center min-w-6 h-6 px-1 rounded-full bg-red-600 text-white text-xs font-bold">
                {totalUnreadMessages}
              </span>
              <span className="text-sm text-red-200 font-medium">Neue ungelesene Nachrichten</span>
            </div>
          ) : (
            <div className="mb-4">
              <Badge variant="success">Keine ungelesenen Nachrichten</Badge>
            </div>
          )}
          <div className="mt-auto">
            <Link to={`/4based/models/${account.fourbased_id}/chats`}>
              <Button variant="secondary">Zur Chat-Übersicht</Button>
            </Link>
          </div>
        </Card>

      </div>
    </div>
  );
}
