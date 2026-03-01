import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import {
  fetchUserByFourBasedId,
  fetchUserStatistics,
  FourBasedAccount,
  FourBasedStatisticsQuery,
  FourBasedStatisticsResult,
} from '../services/4based.api';

const toApiDateTime = (value: string) => {
  if (!value) {
    return '';
  }

  return `${value.replace('T', ' ')}:00`;
};

const toDateTimeLocal = (date: Date) => {
  const pad = (num: number) => String(num).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const FIXED_STATISTICS_QUERY: Omit<
  FourBasedStatisticsQuery,
  'bookingdate_from' | 'bookingdate_to'
> = {
  type: 'share',
  with_invoice: true,
  with_buyer: true,
  with_file_stack: true,
  statistic_type: 'summary',
  limit: 40,
  sort: '{"created_at":"desc"}',
  offset: 0,
};

export function FourBasedModelStatisticsPage() {
  const { fourbasedId } = useParams<{ fourbasedId: string }>();
  const [account, setAccount] = useState<FourBasedAccount | null>(null);
  const [statistics, setStatistics] = useState<FourBasedStatisticsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metricSearch, setMetricSearch] = useState('');
  const [isMetricsOpen, setIsMetricsOpen] = useState(false);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 0);

  const [filters, setFilters] = useState({
    bookingdate_from: toDateTimeLocal(monthStart),
    bookingdate_to: toDateTimeLocal(monthEnd),
  });

  const loadStatistics = async (currentFilters: typeof filters) => {
    if (!fourbasedId) {
      return;
    }

    const query: FourBasedStatisticsQuery = {
      ...FIXED_STATISTICS_QUERY,
      bookingdate_from: toApiDateTime(currentFilters.bookingdate_from),
      bookingdate_to: toApiDateTime(currentFilters.bookingdate_to),
    };

    const data = await fetchUserStatistics(fourbasedId, query);
    setStatistics(data);
  };

  useEffect(() => {
    const loadPage = async () => {
      if (!fourbasedId) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [accountData] = await Promise.all([
          fetchUserByFourBasedId(fourbasedId),
          loadStatistics(filters),
        ]);

        setAccount(accountData);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Fehler beim Laden der Statistikdaten';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fourbasedId]);

  const metricEntries = useMemo(() => {
    const query = metricSearch.trim().toLowerCase();
    const entries = Object.entries(statistics?.response ?? {}).map(([key, value]) => ({
      key,
      value,
    }));

    return entries
      .filter((entry) => !query || entry.key.toLowerCase().includes(query))
      .sort((a, b) => b.value - a.value);
  }, [metricSearch, statistics]);

  const getMetricValue = (key: string) => {
    return statistics?.response?.[key] ?? 0;
  };

  const formatAmount = (value: number) => {
    return value.toLocaleString('de-DE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleApplyFilters = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await loadStatistics(filters);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fehler beim Laden der Statistikdaten';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetFilters = async () => {
    const reset = {
      bookingdate_from: toDateTimeLocal(monthStart),
      bookingdate_to: toDateTimeLocal(monthEnd),
    };

    setFilters(reset);
    setIsLoading(true);
    setError(null);

    try {
      await loadStatistics(reset);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fehler beim Laden der Statistikdaten';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !statistics && !account) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Lade Statistik...</p>
      </div>
    );
  }

  if (error && !statistics) {
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
        <p className="text-gray-400">Account nicht gefunden</p>
        <Link to="/4based/models" className="inline-block mt-4">
          <Button variant="secondary">Zurück zur Liste</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to={`/4based/models/${account.fourbased_id}`}>
            <Button variant="ghost" size="sm">← Zurück zum Model</Button>
          </Link>
          <Link to="/4based/models">
            <Button variant="ghost" size="sm">Alle Models</Button>
          </Link>
        </div>
        <Badge variant="success">Statistics</Badge>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <img
              src={account.img_url}
              alt={account.name}
              className="w-14 h-14 rounded-full object-cover border border-gray-700"
            />
            <div className="min-w-0">
                <h1 className="text-3xl font-bold text-gray-100">{account.name} Statistics</h1>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Total Amount</p>
            <p className="text-3xl font-bold text-cyan-400">{formatAmount(getMetricValue('total_netto_amount'))}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Von"
            type="datetime-local"
            value={filters.bookingdate_from}
            onChange={(e) => setFilters((prev) => ({ ...prev, bookingdate_from: e.target.value }))}
          />
          <Input
            label="Bis"
            type="datetime-local"
            value={filters.bookingdate_to}
            onChange={(e) => setFilters((prev) => ({ ...prev, bookingdate_to: e.target.value }))}
          />
        </div>

        <div className="flex flex-wrap gap-2 mt-4 justify-end">
          <Button variant="secondary" onClick={handleResetFilters} disabled={isLoading}>
            Zurücksetzen
          </Button>
          <Button onClick={handleApplyFilters} disabled={isLoading}>
            Filter anwenden
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-sm text-gray-400">Abonnements</p>
          <p className="text-2xl font-bold text-cyan-400">{formatAmount(getMetricValue('subscription_netto_amount'))}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-gray-400">Trinkgeld</p>
          <p className="text-2xl font-bold text-cyan-400">{formatAmount(getMetricValue('chat_tip_netto_amount'))}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-gray-400">Einzelnachrichten</p>
          <p className="text-2xl font-bold text-cyan-400">{formatAmount(getMetricValue('message_netto_amount'))}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-gray-400">Medienverkäufe</p>
          <p className="text-2xl font-bold text-cyan-400">{formatAmount(getMetricValue('message_file_stack_netto_amount'))}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-100">Metrik-Suche</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsMetricsOpen((prev) => !prev)}
            >
              {isMetricsOpen ? 'Schließen' : 'Öffnen'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {isMetricsOpen && (
          <>
            <Input
              label="Metrik-Suche"
              value={metricSearch}
              onChange={(e) => setMetricSearch(e.target.value)}
              placeholder="z. B. total_, message_, referral"
            />

            <div className="mt-4">
              {metricEntries.length === 0 ? (
                <p className="text-gray-300">Keine Metriken gefunden.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {metricEntries.map((entry) => (
                    <div key={entry.key} className="bg-gray-800/60 border border-gray-700 rounded-lg p-3">
                      <p className="text-sm text-gray-400 mb-1">{entry.key}</p>
                      <p className="text-lg font-semibold text-gray-100">{formatAmount(entry.value)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
