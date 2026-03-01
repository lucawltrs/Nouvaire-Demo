import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Textarea } from '../../../components/ui/Textarea';
import {
  fetchUserByFourBasedId,
  fetchUserChats,
  FourBasedAccount,
  FourBasedChatItem,
  FourBasedChatMessage,
} from '../services/4based.api';
import { useChatMessages } from '../hooks/useChatMessages';
import { ChatMessageList } from '../components/ChatMessageList';

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

export function FourBasedModelSingleChatPage() {
  const { fourbasedId, chatId } = useParams<{ fourbasedId: string; chatId: string }>();
  const [account, setAccount] = useState<FourBasedAccount | null>(null);
  const [chat, setChat] = useState<FourBasedChatItem | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const {
    messages,
    isInitialLoading,
    loadingOlder,
    error: messagesError,
    loadOlderError,
    hasMore,
    loadOlder,
    appendLocalMessage,
  } = useChatMessages(fourbasedId, chatId);

  const getChatPartnerName = (chatItem: FourBasedChatItem) => {
    if (!account) {
      return 'Unbekannt';
    }

    const users = chatItem.users ?? [];
    const partner = users.find((user) => user._id !== account.fourbased_id) ?? users[0];
    return partner?.name ?? 'Unbekannt';
  };

  useEffect(() => {
    const loadPage = async () => {
      if (!fourbasedId || !chatId) {
        return;
      }

      setError(null);

      try {
        const [accountData, chatsData] = await Promise.all([
          fetchUserByFourBasedId(fourbasedId),
          fetchUserChats(fourbasedId),
        ]);

        setAccount(accountData);

        const selectedChat = (chatsData.response ?? []).find((entry) => entry._id === chatId) ?? null;
        setChat(selectedChat);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Fehler beim Laden des Chats';
        setError(message);
      }
    };

    loadPage();
  }, [fourbasedId, chatId]);

  const isOwnMessage = (message: FourBasedChatMessage) => message.user_id === account?.fourbased_id;

  const handleSendMessage = () => {
    if (!account || !chat || !messageInput.trim()) {
      return;
    }

    const now = new Date();
    const pad = (num: number) => String(num).padStart(2, '0');
    const createdAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const tempMessage: FourBasedChatMessage = {
      _id: `local-${now.getTime()}`,
      chat_id: chat._id,
      user_id: account.fourbased_id,
      message: messageInput.trim(),
      created_at: createdAt,
      updated_at: createdAt,
    };

    appendLocalMessage(tempMessage);
    setMessageInput('');
  };

  if (isInitialLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Lade Chat...</p>
      </div>
    );
  }

  if (error || messagesError) {
    return (
      <div className="space-y-6">
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg">
          {error ?? messagesError}
        </div>
        <Link to={fourbasedId ? `/4based/models/${fourbasedId}/chats` : '/4based/models'}>
          <Button variant="secondary">Zurück zur Chat-Übersicht</Button>
        </Link>
      </div>
    );
  }

  if (!account || !chat) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <p className="text-gray-400">Chat nicht gefunden.</p>
        </Card>
        <Link to={fourbasedId ? `/4based/models/${fourbasedId}/chats` : '/4based/models'}>
          <Button variant="secondary">Zurück zur Chat-Übersicht</Button>
        </Link>
      </div>
    );
  }

  const partnerName = getChatPartnerName(chat);
  const lastActivity = formatChatTimestamp(chat.last_message?.updated_at ?? chat.updated_at);

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col gap-4 overflow-hidden">
      <div className="flex items-center gap-2 shrink-0">
        <Link to={`/4based/models/${account.fourbased_id}/chats`}>
          <Button variant="ghost" size="sm">← Zurück zur Chat-Übersicht</Button>
        </Link>
        <Link to={`/4based/models/${account.fourbased_id}`}>
          <Button variant="ghost" size="sm">Zum Model</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4 flex-1 min-h-0">
        <Card className="rounded-2xl flex flex-col min-h-0">
          <div className="p-4 border-b border-gray-700 flex items-center gap-3 shrink-0">
            {chat.img_url ? (
              <img
                src={chat.img_url}
                alt={partnerName}
                className="w-12 h-12 rounded-full object-cover border border-gray-700"
              />
            ) : (
              <div className="w-12 h-12 rounded-full border border-gray-700 bg-gray-800" />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-gray-100 truncate">{partnerName}</h1>
              <div className="mt-1">
                <Badge>Zuletzt aktiv: {lastActivity}</Badge>
              </div>
            </div>
          </div>

          <ChatMessageList
            messages={messages}
            isOwnMessage={isOwnMessage}
            loadingOlder={loadingOlder}
            loadOlderError={loadOlderError}
            hasMore={hasMore}
            onLoadOlder={loadOlder}
            formatChatTimestamp={formatChatTimestamp}
          />

          <div className="p-4 border-t border-gray-700 shrink-0">
            <div className="flex items-end gap-3">
              <Textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Nachricht eingeben..."
                rows={3}
              />
              <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                Senden
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4 rounded-2xl h-fit hidden xl:block">
          <h2 className="text-sm font-semibold text-gray-100 mb-3">Chat Info</h2>
          <div className="space-y-2 text-sm">
            <p className="text-gray-300 break-all">Chat ID: <span className="text-gray-100">{chat._id}</span></p>
            <Badge>Letzte Aktivität: {lastActivity}</Badge>
          </div>
        </Card>
      </div>
    </div>
  );
}
