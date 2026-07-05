import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { IconArrowLeft, IconTrendingUp, IconTrendingDown, IconMinus, IconAlertCircle, IconLoader2 } from '@tabler/icons-react';
import { Card } from '../../../components/ui/Card';
import { PageLoader } from '../../../components/ui/PageLoader';
import {
  getRevenueForecast,
  RevenueForecastDataPoint,
  RevenueForecastResult,
} from '../../../modules/4based/services/4based.api';
import { accountsApi } from '../../../modules/accounts/accountsApi';
import type { Account } from '../../../modules/accounts/types';

const FORECAST_DAYS_OPTIONS = [7, 14, 30] as const;
type ForecastDays = (typeof FORECAST_DAYS_OPTIONS)[number];

interface ChartDataPoint {
  date: string;
  historical?: number;
  forecast?: number;
}

const formatCurrency = (value: number) =>
  value.toLocaleString('de-DE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
};

const buildChartData = (
  historical: RevenueForecastDataPoint[],
  forecast: RevenueForecastDataPoint[],
): ChartDataPoint[] => {
  const map = new Map<string, ChartDataPoint>();
  for (const p of historical) map.set(p.date, { date: p.date, historical: p.amount });
  for (const p of forecast) {
    const existing = map.get(p.date);
    if (existing) existing.forecast = p.amount;
    else map.set(p.date, { date: p.date, forecast: p.amount });
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="text-muted-foreground mb-1 text-xs">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="font-semibold">
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

export function AccountForecastPage() {
  const { fourbased_id } = useParams<{ fourbased_id: string }>();
  const navigate = useNavigate();

  const [account, setAccount] = useState<Account | null>(null);
  const [forecastData, setForecastData] = useState<RevenueForecastResult | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [forecastDays, setForecastDays] = useState<ForecastDays>(30);
  const [isLoading, setIsLoading] = useState(false);
  const [isForecastLoading, setIsForecastLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forecastError, setForecastError] = useState<string | null>(null);

  const forecastSum = forecastData?.forecast.reduce((s, p) => s + p.amount, 0) ?? 0;

  const loadForecast = async (days: ForecastDays) => {
    if (!fourbased_id) return;
    setIsForecastLoading(true);
    setForecastError(null);
    try {
      const data = await getRevenueForecast(fourbased_id, days);
      setForecastData(data);
      setChartData(buildChartData(data.historical, data.forecast));
    } catch (err) {
      setForecastError(err instanceof Error ? err.message : 'Forecast konnte nicht geladen werden');
    } finally {
      setIsForecastLoading(false);
    }
  };

  useEffect(() => {
    if (!fourbased_id) return;
    setIsLoading(true);
    setError(null);

    Promise.all([
      accountsApi.getAccount(fourbased_id),
      getRevenueForecast(fourbased_id, forecastDays),
    ])
      .then(([accountData, forecast]) => {
        setAccount(accountData);
        setForecastData(forecast);
        setChartData(buildChartData(forecast.historical, forecast.forecast));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Fehler beim Laden'))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fourbased_id]);

  const handleDaysChange = (days: ForecastDays) => {
    setForecastDays(days);
    loadForecast(days);
  };

  if (isLoading) {
    return (
      <PageLoader
        message="Lade Revenue Forecast..."
        subtitle="Historische Daten und Prognosen werden berechnet"
      />
    );
  }

  if (error || !account) {
    return (
      <Card className="p-12 border border-border max-w-lg mx-auto mt-12">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <IconAlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Fehler beim Laden</h3>
          <p className="text-muted-foreground mb-6">{error ?? 'Account nicht gefunden'}</p>
          <button
            onClick={() => navigate(`/accounts/${fourbased_id}`)}
            className="px-4 py-2 text-sm text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Zurück zum Account
          </button>
        </div>
      </Card>
    );
  }

  const trend = forecastData?.trend ?? 'stable';

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(`/accounts/${fourbased_id}`)}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <IconArrowLeft size={16} />
        Zurück zum Account
      </button>

      {/* Profile header */}
      <Card className="p-6 border border-border">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {account.img_url ? (
              <img
                src={account.img_url}
                alt={account.name}
                className="w-14 h-14 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-muted shrink-0" />
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">{account.name}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Revenue Forecast</p>
            </div>
          </div>

          {/* Days selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-1">Forecast:</span>
            {FORECAST_DAYS_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => handleDaysChange(d)}
                disabled={isForecastLoading}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 border ${
                  forecastDays === d
                    ? 'bg-brand border-brand text-white'
                    : 'bg-muted border-border text-foreground hover:bg-muted'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Ø Tagesumsatz
          </p>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(forecastData?.daily_average ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">basierend auf historischen Daten</p>
        </Card>

        <Card className="p-5 border border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Trend
          </p>
          <div className="flex items-center gap-2">
            {(trend === 'up' || trend === 'rising') && (
              <>
                <IconTrendingUp className="w-6 h-6 text-green-400 shrink-0" />
                <span className="text-2xl font-bold text-green-400">Steigend</span>
              </>
            )}
            {(trend === 'down' || trend === 'falling') && (
              <>
                <IconTrendingDown className="w-6 h-6 text-red-400 shrink-0" />
                <span className="text-2xl font-bold text-red-400">Fallend</span>
              </>
            )}
            {trend === 'stable' && (
              <>
                <IconMinus className="w-6 h-6 text-yellow-400 shrink-0" />
                <span className="text-2xl font-bold text-yellow-400">Stabil</span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">vom Backend berechnet</p>
        </Card>

        <Card className="p-5 border border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Forecast-Summe ({forecastDays}d)
          </p>
          <p className="text-2xl font-bold text-brand">{formatCurrency(forecastSum)}</p>
          <p className="text-xs text-muted-foreground mt-1">prognostizierter Umsatz</p>
        </Card>
      </div>

      {/* Chart */}
      <Card className="p-6 border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-foreground">Umsatz & Prognose</h2>
          {isForecastLoading && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <IconLoader2 size={13} className="animate-spin" />
              Aktualisiere...
            </span>
          )}
        </div>

        {forecastError && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2 mb-4">
            <IconAlertCircle size={13} />
            {forecastError}
          </div>
        )}

        {chartData.length === 0 && !isForecastLoading ? (
          <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
            Keine Daten verfügbar
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="gradHistorical" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ED4C27" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ED4C27" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateLabel}
                tick={{ fill: '#64748B', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#1E293B' }}
              />
              <YAxis
                tickFormatter={(v) => `$${(v as number).toFixed(0)}`}
                tick={{ fill: '#64748B', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px', color: '#64748B' }} />
              <Area
                type="monotone"
                dataKey="historical"
                name="Historisch"
                stroke="#38bdf8"
                strokeWidth={2}
                fill="url(#gradHistorical)"
                dot={false}
                connectNulls={false}
              />
              <Area
                type="monotone"
                dataKey="forecast"
                name="Prognose"
                stroke="#ED4C27"
                strokeWidth={2}
                strokeDasharray="5 4"
                fill="url(#gradForecast)"
                dot={false}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
