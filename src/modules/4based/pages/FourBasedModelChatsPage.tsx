import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { PageLoader } from '../../../components/ui/PageLoader';
import {
  fetchUserByFourBasedId,
  fetchUserChats,
  fetchUserUnreadMessages,
  FourBasedAccount,
  FourBasedChatItem,
  markAllUserMessagesAsReceived,
} from '../services/4based.api';

const formatChatTimestamp = (value?: string) => {
  if (!value) {
    return '-';
  }

  const parsedDate = new Date(value.replace(' ', 'T'));

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(parsedDate);
};

const getLastMessageStatus = (chat: FourBasedChatItem) => {
  const receiverStates = Object.values(chat.last_message?.receiver_status ?? {});

  if (receiverStates.includes('read') || receiverStates.includes('seen')) {
    return 'read';
  }

  if (receiverStates.includes('received')) {
    return 'received';
  }

  if (chat.last_message?.sender_status === 'sent') {
    return 'sent';
  }

  return null;
};

export function FourBasedModelChatsPage() {
  const { fourbasedId } = useParams<{ fourbasedId: string }>();
  const [account, setAccount] = useState<FourBasedAccount | null>(null);
  const [chats, setChats] = useState<FourBasedChatItem[]>([]);
  const [unreadByChat, setUnreadByChat] = useState<Record<string, number>>({});
  const [chatSearch, setChatSearch] = useState('');
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const loadUnreadMessages = async (id: string) => {
    const unreadData = await fetchUserUnreadMessages(id);
    setUnreadByChat(unreadData.response ?? {});
  };

  const getChatPartnerName = (chat: FourBasedChatItem) => {
    if (!account) {
      return 'Unbekannt';
    }

    const users = chat.users ?? [];
    const partner = users.find((user) => user._id !== account.fourbased_id) ?? users[0];
    return partner?.name ?? 'Unbekannt';
  };

  useEffect(() => {
    const loadPage = async () => {
      if (!fourbasedId) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [accountData, chatsData, unreadData] = await Promise.all([
          fetchUserByFourBasedId(fourbasedId),
          fetchUserChats(fourbasedId),
          fetchUserUnreadMessages(fourbasedId),
        ]);

        setAccount(accountData);
        setChats(chatsData.response ?? []);
        setUnreadByChat(unreadData.response ?? {});
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Fehler beim Laden der Chats';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadPage();
  }, [fourbasedId]);

  const handleMarkAllAsRead = async () => {
    if (!fourbasedId || isMarkingAsRead || unreadSummary.totalUnreadMessages === 0) {
      return;
    }

    setIsMarkingAsRead(true);
    setError(null);

    try {
      await markAllUserMessagesAsReceived(fourbasedId);
      await loadUnreadMessages(fourbasedId);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fehler beim Markieren als gelesen';
      setError(message);
    } finally {
      setIsMarkingAsRead(false);
    }
  };

  const unreadSummary = useMemo(() => {
    const totalUnreadMessages = Object.values(unreadByChat).reduce((sum, count) => sum + count, 0);

    return { totalUnreadMessages };
  }, [unreadByChat]);

  const normalizedQuery = chatSearch.trim().toLowerCase();
  const filteredChats = useMemo(() => {
    return chats
      .filter((chat) => {
        if (!normalizedQuery) {
          return true;
        }

        const partnerName = getChatPartnerName(chat).toLowerCase();
        const message = (chat.last_message?.message ?? '').toLowerCase();

        return partnerName.includes(normalizedQuery) || message.includes(normalizedQuery);
      })
      .sort((a, b) => {
        const unreadDiff = (unreadByChat[b._id] ?? 0) - (unreadByChat[a._id] ?? 0);
        if (unreadDiff !== 0) {
          return unreadDiff;
        }

        const left = new Date((a.last_message?.updated_at ?? a.updated_at ?? '').replace(' ', 'T')).getTime();
        const right = new Date((b.last_message?.updated_at ?? b.updated_at ?? '').replace(' ', 'T')).getTime();

        return right - left;
      });
  }, [chats, unreadByChat, normalizedQuery, account]);

  if (isLoading) {
    return (
      <PageLoader
        message="Lade Chats..."
        subtitle="Nachrichten und ungelesene Chats werden abgerufen"
      />
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg">
          {error}
        </div>
        <Link to={fourbasedId ? `/4based/models/${fourbasedId}` : '/4based/models'}>
          <Button variant="secondary">Zurück</Button>
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
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 transition-opacity duration-300">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">Alle Nachrichten als gelesen markiert</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Link to={`/4based/models/${account.fourbased_id}`}>
          <Button variant="ghost" size="sm">← Zurück zum Model</Button>
        </Link>
        <Link to="/4based/models">
          <Button variant="ghost" size="sm">Alle Models</Button>
        </Link>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 min-w-0">
          <img
            src={account.img_url}
            alt={account.name}
            className="w-14 h-14 rounded-full object-cover border border-border"
          />
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-foreground">{account.name} Chats</h1>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">Ungelesene Nachrichten</p>
          <span className="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full bg-red-600 text-white text-sm font-bold">
            {unreadSummary.totalUnreadMessages}
          </span>
        </div>
        {unreadSummary.totalUnreadMessages > 0 && (
          <Button
            variant="primary"
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAsRead}
            isLoading={isMarkingAsRead}
          >
            Alle als gelesen markieren
          </Button>
        )}
      </div>

      <Card className="p-6">
        <Input
          label="Suche"
          value={chatSearch}
          onChange={(e) => setChatSearch(e.target.value)}
          placeholder="Nach Name oder Nachricht suchen"
        />
      </Card>

      {chats.length === 0 ? (
        <Card className="p-6">
          <p className="text-muted-foreground">Keine Chats vorhanden.</p>
        </Card>
      ) : filteredChats.length === 0 ? (
        <Card className="p-6">
          <p className="text-muted-foreground">Keine Chats zur Suche gefunden.</p>
        </Card>
      ) : (
        <div className="space-y-5">
          {filteredChats.map((chat) => {
            const lastMessageStatus = getLastMessageStatus(chat);
            const unreadCount = unreadByChat[chat._id] ?? 0;
            const salesVolume = (chat.sales_volume ?? 0) / 100;
            const formattedSalesVolume = salesVolume.toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });

            return (
            <Link key={chat._id} to={`/4based/models/${account.fourbased_id}/chats/${chat._id}`} className="block">
              <Card className={`p-4 rounded-2xl hover:border-cyan-500/50 transition-colors ${unreadCount > 0 ? 'ring-1 ring-yellow-700/50' : ''}`}>
                <div className="flex items-center gap-3">
                  {chat.img_url ? (
                    <img
                      src={chat.img_url}
                      alt={getChatPartnerName(chat)}
                      className="w-11 h-11 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full border border-border bg-muted" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {unreadCount > 0 && <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" aria-hidden="true" />}
                      <p className="text-sm font-semibold text-foreground truncate">{getChatPartnerName(chat)}</p>
                      <Badge size="sm" variant="default">{formattedSalesVolume}</Badge>
                    </div>
                    <p className={`text-sm truncate ${unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {chat.last_message?.message ?? 'Keine letzte Nachricht'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-6 h-6 px-1 rounded-full bg-red-600 text-white text-xs font-bold">
                        {unreadCount}
                      </span>
                    )}
                    <span>{formatChatTimestamp(chat.last_message?.updated_at ?? chat.updated_at)}</span>
                    {lastMessageStatus === 'sent' && <span aria-label="Gesendet">✓</span>}
                    {lastMessageStatus === 'received' && (
                      <span className="text-blue-400" aria-label="Empfangen">✓✓</span>
                    )}
                    {lastMessageStatus === 'read' && (
                      <span className="text-blue-400" aria-label="Gelesen">✓✓</span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          );})}
        </div>
      )}
    </div>
  );
}
