import { useState } from "react";
import {
  FourBasedAccount,
  fetchUserUnreadMessages,
  fetchUsers,
  getTotalUnreadMessages,
  storeCredentials,
  syncBulkLogin,
} from "../services/4based.api";

export interface FourBasedUnreadSummary {
  totalUnreadMessages: number;
  unreadChatsCount: number;
  unreadByChat: Record<string, number>;
}

const EMPTY_UNREAD_SUMMARY: FourBasedUnreadSummary = {
  totalUnreadMessages: 0,
  unreadChatsCount: 0,
  unreadByChat: {},
};

export function useFourBasedModels() {
  const [users, setUsers] = useState<FourBasedAccount[]>([]);
  const [unreadByUser, setUnreadByUser] = useState<Record<string, FourBasedUnreadSummary>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUnreadForUsers = async (accounts: FourBasedAccount[]) => {
    const unreadResults = await Promise.allSettled(
      accounts.map(async (account) => {
        const unreadResponse = await fetchUserUnreadMessages(account.fourbased_id);
        const unreadByChat = unreadResponse.response ?? {};

        return {
          fourbasedId: account.fourbased_id,
          summary: {
            totalUnreadMessages: getTotalUnreadMessages(unreadByChat),
            unreadChatsCount: Object.keys(unreadByChat).length,
            unreadByChat,
          } satisfies FourBasedUnreadSummary,
        };
      })
    );

    const nextUnreadByUser: Record<string, FourBasedUnreadSummary> = {};

    accounts.forEach((account) => {
      nextUnreadByUser[account.fourbased_id] = EMPTY_UNREAD_SUMMARY;
    });

    unreadResults.forEach((result) => {
      if (result.status === "fulfilled") {
        nextUnreadByUser[result.value.fourbasedId] = result.value.summary;
      }
    });

    setUnreadByUser(nextUnreadByUser);
  };

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUsers();
      setUsers(data);
      await loadUnreadForUsers(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Fehler beim Laden der Nutzer";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const addCredentials = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await storeCredentials(email, password);
      await loadUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Fehler beim Hinzufügen der Zugangsdaten";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const syncUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      await syncBulkLogin();
      await loadUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Fehler beim Synchronisieren";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return { users, unreadByUser, loading, error, loadUsers, addCredentials, syncUsers };
}
