import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { Input } from '../../components/ui/Input';
import { Loader2, User, ArrowLeft, Search } from 'lucide-react';
import { inboxApi } from '../../modules/inbox/services/inbox.api';
import type { ChatListItem } from '../../modules/inbox/types';
import { ToastContainer } from '../../lib/toast';
import { useChatMessages } from '../../modules/4based/hooks/useChatMessages';
import { ChatMessageList } from '../../modules/4based/components/ChatMessageList';
import type { FourBasedChatMessage } from '../../modules/4based/services/4based.api';

const formatChatTimestamp = (value?: string) => {
  if (!value) return '-';
  const parsedDate = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(parsedDate.getTime())) return value;
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(parsedDate);
};

export function InboxChatPage() {
  const { fourbased_id, chat_id } = useParams();
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [chatsError, setChatsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');

  const {
    messages,
    isInitialLoading,
    loadingOlder,
    error: messagesError,
    loadOlderError,
    hasMore,
    loadOlder,
    appendLocalMessage,
  } = useChatMessages(fourbased_id, chat_id);

  // activeChat is derived — no need to re-fetch when only chat_id changes
  const activeChat = useMemo(
    () => chats.find(c => c.chat_id === chat_id) ?? null,
    [chats, chat_id],
  );

  const filteredChats = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(
      c =>
        c.customer_name.toLowerCase().includes(q) ||
        (c.last_message_preview ?? '').toLowerCase().includes(q),
    );
  }, [chats, searchQuery]);

  const fetchChats = useCallback(async () => {
    if (!fourbased_id) return;
    try {
      setIsLoadingChats(true);
      setChatsError(null);
      const data = await inboxApi.getChats({ days: 30, filter: 'all', limit: 100, scope: 'single', fourbased_id });
      setChats(data.data);
    } catch {
      setChatsError('Chats konnten nicht geladen werden.');
    } finally {
      setIsLoadingChats(false);
    }
  }, [fourbased_id]); // only re-fetch when account changes, not on every chat switch

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const isOwnMessage = (message: FourBasedChatMessage) => message.user_id === fourbased_id;

  const handleSendMessage = () => {
    if (!fourbased_id || !chat_id || !messageInput.trim()) return;

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const createdAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const tempMessage: FourBasedChatMessage = {
      _id: `local-${now.getTime()}`,
      chat_id,
      user_id: fourbased_id,
      message: messageInput.trim(),
      created_at: createdAt,
      updated_at: createdAt,
    };

    appendLocalMessage(tempMessage);
    setMessageInput('');
  };

  const accountName = activeChat?.account_name ?? chats[0]?.account_name ?? fourbased_id;
  const accountImgUrl = activeChat?.account_img_url ?? chats[0]?.account_img_url;

  return (
    <div className="h-[calc(100vh-10rem)] flex gap-6 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 shrink-0 flex flex-col gap-3 min-h-0">
        {/* Back button + Account indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/inbox')}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-600 bg-card shadow-sm text-gray-400 hover:text-gray-100 hover:bg-slate-700 transition-colors shrink-0"
            aria-label="Zurück zur Übersicht"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-card border border-slate-600 shadow-sm flex-1 min-w-0">
            <AccountAvatar src={accountImgUrl} name={accountName ?? ''} size="md" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide leading-none mb-0.5">
                Ausgewählter Account
              </p>
              <p className="font-bold text-sm text-gray-100 truncate">{accountName}</p>
            </div>
          </div>
        </div>

        {/* Chat search */}
        <div className="relative shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Chats durchsuchen…"
            className="pl-8 text-sm"
          />
        </div>

        {/* Chat list */}
        <Card className="flex-1 overflow-y-auto divide-y divide-slate-700 min-h-0">
          {isLoadingChats ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
          ) : chatsError ? (
            <p className="text-red-500 text-sm p-4">{chatsError}</p>
          ) : filteredChats.length === 0 ? (
            <p className="text-gray-400 text-sm p-4">
              {searchQuery.trim() ? 'Keine Treffer.' : 'Keine Chats gefunden.'}
            </p>
          ) : (
            filteredChats.map((chat) => {
              const isActive = chat.chat_id === chat_id;
              return (
                <Link
                  key={chat.chat_id}
                  to={`/inbox/${chat.fourbased_id}/chat/${chat.chat_id}`}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-700 ${isActive ? 'border-l-4 border-[#ED4C27] bg-orange-900/20' : ''}`}
                >
                  <AccountAvatar src={chat.customer_avatar_url} name={chat.customer_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm text-gray-100 truncate block">{chat.customer_name}</span>
                    <p className="text-xs text-gray-500 truncate">{chat.last_message_preview}</p>
                  </div>
                  {chat.is_unread && (
                    <span className="w-2 h-2 rounded-full bg-[#ED4C27] shrink-0" />
                  )}
                </Link>
              );
            })
          )}
        </Card>
      </aside>

      {/* Main chat area */}
      <main className="flex-1 min-h-0 flex flex-col">
        <ToastContainer />
        {isInitialLoading ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 size={32} className="animate-spin text-gray-400" />
          </div>
        ) : messagesError ? (
          <div className="flex items-center justify-center flex-1 text-red-500">{messagesError}</div>
        ) : !activeChat && !isLoadingChats ? (
          <div className="flex items-center justify-center flex-1 text-gray-400">Chat nicht gefunden.</div>
        ) : (
          <Card className="rounded-2xl flex flex-col flex-1 min-h-0">
            {/* Chat header */}
            {activeChat && (
              <div className="p-4 border-b border-slate-700 flex items-center gap-3 shrink-0">
                <AccountAvatar src={activeChat.customer_avatar_url} name={activeChat.customer_name} size="md" />
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg font-bold text-gray-100 truncate">{activeChat.customer_name}</h1>
                  <div className="mt-1">
                    <Badge>Zuletzt aktiv: {formatChatTimestamp(activeChat.last_message_at)}</Badge>
                  </div>
                </div>
                {/* Profile link */}
                <a
                  href={`https://4based.com/profile/${encodeURIComponent(activeChat.customer_name.replace(/\s+/g, '-'))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-700 text-[#ED4C27]"
                  title={`Profil von ${activeChat.customer_name}`}
                >
                  <User size={18} />
                </a>
                {typeof activeChat.sales_volume === 'number' && (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold shrink-0"
                    style={{ background: 'rgba(237,76,39,0.12)', color: '#ED4C27' }}
                  >
                    ${(activeChat.sales_volume / 100).toFixed(2)}
                  </span>
                )}
              </div>
            )}

            <ChatMessageList
              messages={messages}
              isOwnMessage={isOwnMessage}
              loadingOlder={loadingOlder}
              loadOlderError={loadOlderError}
              hasMore={hasMore}
              onLoadOlder={loadOlder}
              formatChatTimestamp={formatChatTimestamp}
            />

            {/* Message input */}
            <div className="p-4 border-t border-slate-700 shrink-0">
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
        )}
      </main>
    </div>
  );
}

// Avatar helper
function AccountAvatar({ src, name, size = 'md' }: { src?: string; name: string; size?: 'sm' | 'md' }) {
  const sizeClass = { sm: 'w-8 h-8', md: 'w-10 h-10' }[size];
  const iconSize = { sm: 14, md: 20 }[size];
  if (!src) {
    const initials = name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
    return (
      <div className={`${sizeClass} rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0 text-gray-400 font-semibold text-xs`}>
        {initials || <User size={iconSize} />}
      </div>
    );
  }
  return <img src={src} alt={name} className={`${sizeClass} rounded-full object-cover shrink-0`} onError={e => { e.currentTarget.style.display = 'none'; }} />;
}
