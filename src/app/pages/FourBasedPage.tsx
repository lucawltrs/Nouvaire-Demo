import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { fetchUsers, fetchUserDashboard, FourBasedAccount, FourBasedDashboardResult } from "../../modules/4based/services/4based.api";

interface AccountDashboard {
  account: FourBasedAccount;
  dashboardData: FourBasedDashboardResult | null;
}

const FourBasedPage: React.FC = () => {
  const [accounts, setAccounts] = useState<FourBasedAccount[]>([]);
  const [dashboards, setDashboards] = useState<AccountDashboard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboards = async () => {
    setLoading(true);
    setError(null);

    try {
      const accountsData = await fetchUsers();
      setAccounts(accountsData);

      const dashboardPromises = accountsData.map(async (account) => {
        try {
          const dashboard = await fetchUserDashboard(account.fourbased_id);
          return {
            account,
            dashboardData: dashboard,
          };
        } catch {
          return {
            account,
            dashboardData: null,
          };
        }
      });

      const dashboardResults = await Promise.all(dashboardPromises);
      setDashboards(dashboardResults);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fehler beim Laden der Dashboards";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboards();
  }, []);

  const getTotalNettoAmount = () => {
    return dashboards.reduce((sum, item) => {
      const value = item.dashboardData?.statistics?.total_netto_amount || 0;
      return sum + value;
    }, 0);
  };

  const getTotalUnreadMessages = () => {
    return dashboards.reduce((sum, item) => {
      const value = item.dashboardData?.unread_messages?.total_unread_messages || 0;
      return sum + value;
    }, 0);
  };

  const getTotalUnreadChats = () => {
    return dashboards.reduce((sum, item) => {
      const value = item.dashboardData?.unread_messages?.total_unread_chats || 0;
      return sum + value;
    }, 0);
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-400">Lade Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#06b6d4] via-[#22d3ee] to-[#3b82f6]">
            4Based Dashboard
          </h1>
          <p className="mt-2 text-gray-400">Übersicht aller Accounts</p>
        </div>
        <Link to="/4based/models">
          <Button>Alle Accounts</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6" glow>
          <p className="text-gray-400 text-sm font-medium">Accounts</p>
          <p className="text-3xl font-bold text-cyan-400 mt-2">{accounts.length}</p>
        </Card>

        <Card className="p-6" glow>
          <p className="text-gray-400 text-sm font-medium">Gesamtumsatz (Netto)</p>
          <p className="text-3xl font-bold text-cyan-400 mt-2">
            ${(getTotalNettoAmount() / 100).toFixed(2)}
          </p>
        </Card>

        <Card className="p-6" glow>
          <p className="text-gray-400 text-sm font-medium">Ungelesene Nachrichten</p>
          <p className="text-3xl font-bold text-cyan-400 mt-2">{getTotalUnreadMessages()}</p>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-100 mb-4">Account Übersicht</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dashboards.map(({ account, dashboardData }) => (
            <Link key={account.fourbased_id} to={`/4based/models/${account.fourbased_id}`}>
              <Card className="p-4" hover>
                <div className="flex items-center gap-4">
                  <img
                    src={account.img_url}
                    alt={account.name}
                    className="w-12 h-12 rounded-full object-cover border border-gray-700"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white truncate">{account.name}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge size="sm">
                        Umsatz: ${((dashboardData?.statistics?.total_netto_amount || 0) / 100).toFixed(2)}
                      </Badge>
                      {(dashboardData?.unread_messages?.total_unread_messages || 0) > 0 && (
                        <Badge size="sm" variant="warning">
                          {dashboardData?.unread_messages?.total_unread_messages} ungelesen
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FourBasedPage;
