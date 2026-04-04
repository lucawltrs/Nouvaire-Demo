import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { Input } from '../../components/ui/Input';
import { Loader2, User, ArrowLeft, Search, Camera, Film, CheckCircle, Smile, X, ChevronDown, SlidersHorizontal } from 'lucide-react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { Modal } from '../../components/ui/Modal';
import { cloudApi, unblurUrl } from '../../modules/cloud/cloudApi';
import type { CloudAsset } from '../../modules/cloud/types';
import { inboxApi } from '../../modules/inbox/services/inbox.api';
import type { ChatListItem, PredefinedText, PivotData } from '../../modules/inbox/types';
import { ToastContainer } from '../../lib/toast';
import { useChatMessages } from '../../modules/4based/hooks/useChatMessages';
import { ChatMessageList } from '../../modules/4based/components/ChatMessageList';
import { sendChatMessage, createFileStack } from '../../modules/4based/services/4based.api';
import type { FourBasedChatMessage } from '../../modules/4based/services/4based.api';
import { toast } from '../../lib/toast';

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
  const [mobileView, setMobileView] = useState<'sidebar' | 'chat'>('chat');
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false);
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [chatsError, setChatsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatListItem[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [predefinedTexts, setPredefinedTexts] = useState<PredefinedText[]>([]);
  const [pivotData, setPivotData] = useState<PivotData | null>(null);
  const [isPivotLoading, setIsPivotLoading] = useState(false);
  const [isEditingPivot, setIsEditingPivot] = useState(false);
  const [pivotEditAlias, setPivotEditAlias] = useState('');
  const [pivotEditNote, setPivotEditNote] = useState('');
  const [isSavingPivot, setIsSavingPivot] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [vaultItems, setVaultItems] = useState<CloudAsset[]>([]);
  const [isLoadingVault, setIsLoadingVault] = useState(false);
  const [vaultError, setVaultError] = useState<string | null>(null);
  const [vaultOffset, setVaultOffset] = useState(0);
  const [vaultHasMore, setVaultHasMore] = useState(false);
  const [vaultFolders, setVaultFolders] = useState<string[]>([]);
  const [activeVaultFolder, setActiveVaultFolder] = useState<string | null>(null);
  const [vaultFileType, setVaultFileType] = useState<string | null>(null);
  const [vaultSold, setVaultSold] = useState<boolean | null>(null);
  const [vaultSent, setVaultSent] = useState<boolean | null>(null);
  const [selectedVaultItem, setSelectedVaultItem] = useState<CloudAsset | null>(null);
  const [vaultStep, setVaultStep] = useState<1 | 2>(1);
  const [isSendingVault, setIsSendingVault] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const currentChatIdRef = useRef(chat_id);
  useEffect(() => { currentChatIdRef.current = chat_id; }, [chat_id]);

  const {
    messages,
    isInitialLoading,
    loadingOlder,
    error: messagesError,
    loadOlderError,
    hasMore,
    loadOlder,
    appendLocalMessage,
    removeLocalMessage,
    refresh,
    refreshSilent,
  } = useChatMessages(fourbased_id, chat_id);

  // activeChat is derived — no need to re-fetch when only chat_id changes
  // Use String() coercion to handle cases where API returns chat_id as number
  const activeChat = useMemo(
    () => chats.find(c => String(c.chat_id) === String(chat_id)) ?? null,
    [chats, chat_id],
  );

  const filteredChats = searchQuery.trim().length >= 3 ? (searchResults ?? []) : chats;

  const fetchChats = useCallback(async () => {
    if (!fourbased_id) return;
    try {
      setIsLoadingChats(true);
      setChatsError(null);
      const data = await inboxApi.getChats({ days: 30, filter: 'all', limit: 100, scope: 'single', fourbased_id });
      const flatChats = data.data.flatMap((entry) =>
        entry.members.flatMap((m) =>
          m.accounts
            .filter((a) => a.fourbased_id === fourbased_id)
            .flatMap((a) => a.chats)
        )
      );
      setChats(flatChats);
    } catch {
      setChatsError('Chats konnten nicht geladen werden.');
    } finally {
      setIsLoadingChats(false);
    }
  }, [fourbased_id]); // only re-fetch when account changes, not on every chat switch

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // If the active chat is not in the loaded list (e.g. older than 30 days or beyond limit),
  // fetch it individually via search by chat_id and inject it into the list.
  useEffect(() => {
    if (!chat_id || !fourbased_id || isLoadingChats) return;
    const alreadyPresent = chats.some(c => String(c.chat_id) === String(chat_id));
    if (alreadyPresent) return;
    inboxApi.searchChats({ query: chat_id, limit: 5, fourbased_id })
      .then((results) => {
        const found = results.find(r => String(r.chat_id) === String(chat_id));
        if (found) setChats(prev => [...prev, found]);
      })
      .catch(() => {});
  }, [chat_id, fourbased_id, isLoadingChats, chats]);

  // Debounced API search for chat sidebar
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 3) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const results = await inboxApi.searchChats({
          query: q,
          limit: 60,
          fourbased_id,
        });
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => {
      clearTimeout(timeoutId);
      setSearchLoading(false);
    };
  }, [searchQuery, fourbased_id]);

  // Silent background refresh for the chat list (every 2 minutes)
  const fetchChatsSilent = useCallback(async () => {
    if (!fourbased_id) return;
    try {
      const data = await inboxApi.getChats({ days: 30, filter: 'all', limit: 100, scope: 'single', fourbased_id });
      const flatChats = data.data.flatMap((entry) =>
        entry.members.flatMap((m) =>
          m.accounts
            .filter((a) => a.fourbased_id === fourbased_id)
            .flatMap((a) => a.chats)
        )
      );
      setChats(flatChats);
    } catch {
      // Silently ignore errors during background refresh
    }
  }, [fourbased_id]);

  useEffect(() => {
    const interval = setInterval(fetchChatsSilent, 30 * 1000);
    return () => clearInterval(interval);
  }, [fetchChatsSilent]);

  // Silent background refresh for messages in the active chat (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(refreshSilent, 30 * 1000);
    return () => clearInterval(interval);
  }, [refreshSilent]);

  useEffect(() => {
    if (!fourbased_id) return;
    inboxApi.getPredefinedTexts(fourbased_id).then(setPredefinedTexts).catch(() => {});
  }, [fourbased_id]);

  // Reset sending state when switching chats
  useEffect(() => {
    setIsSending(false);
    setMobileView('chat');
    setMobileInfoOpen(false);
  }, [chat_id]);

  // Mark chat as read when opening a chat
  useEffect(() => {
    if (!fourbased_id || !chat_id) return;
    inboxApi.markChatAsRead(fourbased_id, chat_id).catch(() => {});
  }, [fourbased_id, chat_id]);

  const isOwnMessage = (message: FourBasedChatMessage) => message.user_id === fourbased_id;

  // Derive customer_id from messages (first message not sent by us)
  const customerId = useMemo(
    () => messages.find(m => m.user_id !== fourbased_id)?.user_id ?? null,
    [messages, fourbased_id],
  );

  const fetchVault = useCallback(async (
    offset = 0,
    folder: string | null = null,
    fileType: string | null = null,
    sold: boolean | null = null,
    sent: boolean | null = null,
  ) => {
    if (!fourbased_id) return;
    setIsLoadingVault(true);
    setVaultError(null);
    try {
      const data = await cloudApi.getAssets(fourbased_id, {
        offset,
        belongs_to_folders: folder ?? undefined,
        file_type: fileType ?? undefined,
        sold: sold ?? undefined,
        sent: sent ?? undefined,
        buyer_user_id: customerId ?? undefined,
      });
      const items = data.response;
      setVaultItems(prev => offset === 0 ? items : [...prev, ...items]);
      setVaultHasMore(data.pagination?.has_more ?? items.length === 60);
      setVaultOffset(data.pagination?.next_offset ?? offset + items.length);
    } catch (err) {
      setVaultError(err instanceof Error ? err.message : 'Vault konnte nicht geladen werden.');
    } finally {
      setIsLoadingVault(false);
    }
  }, [fourbased_id, customerId]);

  const handleOpenVault = () => {
    setIsVaultModalOpen(true);
    setVaultItems([]);
    setVaultOffset(0);
    setVaultHasMore(false);
    setActiveVaultFolder(null);
    setVaultFolders([]);
    setVaultFileType(null);
    setVaultSold(null);
    setVaultSent(null);
    setSelectedVaultItem(null);
    setVaultStep(1);
    cloudApi.getUser(fourbased_id!)
      .then(u => {
        const folders = u.folders ?? [];
        if (folders.length > 0) setVaultFolders(folders);
      })
      .catch(() => {});
    fetchVault(0, null, null, null, null);
  };

  useEffect(() => {
    if (!fourbased_id || !customerId) { setPivotData(null); return; }
    setIsPivotLoading(true);
    inboxApi.getPivot(fourbased_id, customerId)
      .then(setPivotData)
      .catch(() => setPivotData(null))
      .finally(() => setIsPivotLoading(false));
  }, [fourbased_id, customerId]);

  useEffect(() => {
    setPivotEditAlias(pivotData?.alias ?? '');
    setPivotEditNote(pivotData?.note ?? '');
    setIsEditingPivot(false);
  }, [pivotData]);

  const handleSendVaultItem = async (description: string, priceInCents: number) => {
    if (!fourbased_id || !chat_id || !selectedVaultItem || isSendingVault) return;
    setIsSendingVault(true);
    try {
      const fileStackResponse = await createFileStack(fourbased_id, {
        id: selectedVaultItem._id,
        description,
        price: priceInCents,
      });
      const fileStackId = fileStackResponse.response._id ?? null;
      await sendChatMessage(fourbased_id, chat_id, description, 0, fileStackId as string | null);
      setIsVaultModalOpen(false);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fehler beim Senden.';
      toast.error(message);
    } finally {
      setIsSendingVault(false);
    }
  };

  const handleSendMessage = async () => {
    if (!fourbased_id || !chat_id || !messageInput.trim() || isSending) return;

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const createdAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const tempId = `local-${now.getTime()}`;
    const trimmed = messageInput.trim();

    const tempMessage: FourBasedChatMessage = {
      _id: tempId,
      chat_id,
      user_id: fourbased_id,
      message: trimmed,
      created_at: createdAt,
      updated_at: createdAt,
    };

    appendLocalMessage(tempMessage);
    setMessageInput('');
    setIsSending(true);

    const sentForChatId = chat_id;

    try {
      await sendChatMessage(fourbased_id, sentForChatId, trimmed);
      if (currentChatIdRef.current === sentForChatId) {
        await refresh();
      }
    } catch (err) {
      if (currentChatIdRef.current === sentForChatId) {
        removeLocalMessage(tempId);
        setMessageInput(trimmed);
      }
      const message = err instanceof Error ? err.message : 'Nachricht konnte nicht gesendet werden';
      toast.error(message);
    } finally {
      if (currentChatIdRef.current === sentForChatId) {
        setIsSending(false);
        textareaRef.current?.focus();
      }
    }
  };

  const handleEmojiSelect = (emoji: { native: string }) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart ?? messageInput.length;
      const end = textarea.selectionEnd ?? messageInput.length;
      const newValue = messageInput.slice(0, start) + emoji.native + messageInput.slice(end);
      setMessageInput(newValue);
      requestAnimationFrame(() => {
        textarea.focus();
        const pos = start + emoji.native.length;
        textarea.setSelectionRange(pos, pos);
      });
    } else {
      setMessageInput(prev => prev + emoji.native);
    }
    setIsEmojiPickerOpen(false);
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    if (!isEmojiPickerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setIsEmojiPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEmojiPickerOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSavePivot = async () => {
    if (!fourbased_id || !customerId) return;
    setIsSavingPivot(true);
    try {
      const updated = await inboxApi.updatePivot(fourbased_id, customerId, {
        alias: pivotEditAlias.trim() || undefined,
        note: pivotEditNote.trim() || undefined,
      });
      setPivotData(updated);
      toast.success('Kundeninfo gespeichert.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fehler beim Speichern.';
      toast.error(message);
    } finally {
      setIsSavingPivot(false);
    }
  };

  const accountName = activeChat?.account_name ?? chats[0]?.account_name ?? fourbased_id;
  const accountImgUrl = activeChat?.account_img_url ?? chats[0]?.account_img_url;

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col md:flex-row gap-0 md:gap-6 overflow-hidden">
      {/* Sidebar */}
      <aside className={`md:w-80 w-full shrink-0 flex-col gap-3 min-h-0 ${mobileView === 'sidebar' ? 'flex' : 'hidden'} md:flex`}>
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
            className="pl-8 pr-8 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-100 transition-colors"
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Chat list */}
        <Card className="flex-1 overflow-y-auto divide-y divide-slate-700 min-h-0">
          {isLoadingChats ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
          ) : chatsError ? (
            <p className="text-red-500 text-sm p-4">{chatsError}</p>
          ) : searchLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
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
                  onClick={() => setMobileView('chat')}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-700 ${isActive ? 'border-l-4 border-[#ED4C27] bg-orange-900/20' : ''}`}
                >
                  <AccountAvatar src={chat.customer_avatar_url ?? undefined} name={chat.customer_name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm text-gray-100 truncate block">{chat.customer_name}</span>
                    <p className="text-xs text-gray-500 truncate">{chat.last_message_preview}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {typeof chat.sales_volume === 'number' && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: 'rgba(237,76,39,0.12)', color: '#ED4C27' }}
                      >
                        ${(chat.sales_volume / 100).toFixed(2)}
                      </span>
                    )}
                    {chat.is_unread && (
                      <span className="w-2 h-2 rounded-full bg-[#ED4C27]" />
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </Card>
      </aside>

      {/* Main chat area */}
      <main className={`flex-1 min-h-0 flex-col ${mobileView === 'chat' ? 'flex' : 'hidden'} md:flex`} style={{ minWidth: 0 }}>
        <ToastContainer />
        {isInitialLoading ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 size={32} className="animate-spin text-gray-400" />
          </div>
        ) : messagesError ? (
          <div className="flex items-center justify-center flex-1 text-red-500">{messagesError}</div>
        ) : !activeChat && !isLoadingChats && messages.length === 0 ? (
          <div className="flex items-center justify-center flex-1 text-gray-400">Chat nicht gefunden.</div>
        ) : (
          <Card className="rounded-2xl flex flex-col flex-1 min-h-0">
            {/* Chat header */}
            {activeChat && (
              <div className="p-4 border-b border-slate-700 flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileView('sidebar')}
                  className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg border border-slate-600 bg-slate-700 text-gray-400 hover:text-gray-100 transition-colors shrink-0"
                  aria-label="Zurück zur Chat-Liste"
                >
                  <ArrowLeft size={16} />
                </button>
                {(predefinedTexts.length > 0 || pivotData || !!customerId) && (
                  <button
                    type="button"
                    onClick={() => setMobileInfoOpen(true)}
                    className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg border border-slate-600 bg-slate-700 text-gray-400 hover:text-[#ED4C27] hover:border-[#ED4C27] transition-colors shrink-0"
                    aria-label="Infos & Texte öffnen"
                  >
                    <SlidersHorizontal size={16} />
                  </button>
                )}
                <AccountAvatar src={activeChat.customer_avatar_url ?? undefined} name={activeChat.customer_name} size="md" />
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
                  ref={textareaRef}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nachricht eingeben... (Strg+Enter zum Senden)"
                  rows={3}
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="relative" ref={emojiPickerRef}>
                      <button
                        type="button"
                        onClick={() => setIsEmojiPickerOpen(prev => !prev)}
                        className="flex items-center justify-center w-10 h-10 rounded-lg border border-slate-600 bg-slate-700 text-gray-400 hover:text-[#ED4C27] hover:border-[#ED4C27] transition-colors"
                        title="Emoji einfügen"
                      >
                        <Smile size={18} />
                      </button>
                      {isEmojiPickerOpen && (
                        <div className="absolute bottom-12 right-0 z-50">
                          <Picker
                            data={data}
                            onEmojiSelect={handleEmojiSelect}
                            theme="dark"
                            locale="de"
                            previewPosition="none"
                            skinTonePosition="search"
                          />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenVault}
                      className="flex items-center justify-center w-10 h-10 rounded-lg border border-slate-600 bg-slate-700 text-gray-400 hover:text-[#ED4C27] hover:border-[#ED4C27] transition-colors"
                      title="Vault öffnen"
                    >
                      <Camera size={18} />
                    </button>
                  </div>
                  <Button onClick={handleSendMessage} disabled={!messageInput.trim() || isSending}>
                    {isSending ? 'Sendet...' : 'Senden'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </main>
      {/* Vault Modal */}
      <Modal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        title={vaultStep === 1 ? 'Vault' : 'Bild/Video senden'}
        size="xl"
      >
        {vaultStep === 2 && selectedVaultItem ? (
          <VaultSendStep
            item={selectedVaultItem}
            onBack={() => setVaultStep(1)}
            onSend={handleSendVaultItem}
            isSending={isSendingVault}
          />
        ) : (
          <>
        {/* Row 1: file_type */}
        <div className="flex flex-wrap gap-2 mb-2">
          {([null, 'video', 'image'] as const).map((ft) => (
            <VaultFolderChip
              key={ft ?? 'all'}
              label={ft === null ? 'Alle' : ft === 'video' ? 'Video' : 'Bild'}
              active={vaultFileType === ft}
              onClick={() => {
                setVaultFileType(ft);
                setVaultItems([]);
                setVaultOffset(0);
                fetchVault(0, activeVaultFolder, ft, vaultSold, vaultSent);
              }}
            />
          ))}
        </div>

        {/* Row 2: sold */}
        <div className="flex flex-wrap gap-2 mb-2">
          {([null, false, true] as const).map((s) => (
            <VaultFolderChip
              key={s === null ? 'all' : String(s)}
              label={s === null ? 'Alle' : s ? 'Verkauft' : 'Nicht verkauft'}
              active={vaultSold === s}
              onClick={() => {
                setVaultSold(s);
                setVaultItems([]);
                setVaultOffset(0);
                fetchVault(0, activeVaultFolder, vaultFileType, s, vaultSent);
              }}
            />
          ))}
        </div>

        {/* Row 3: sent */}
        <div className="flex flex-wrap gap-2 mb-4">
          {([null, true, false] as const).map((s) => (
            <VaultFolderChip
              key={s === null ? 'all' : String(s)}
              label={s === null ? 'Alle' : s ? 'Gesendet' : 'Nicht gesendet'}
              active={vaultSent === s}
              onClick={() => {
                setVaultSent(s);
                setVaultItems([]);
                setVaultOffset(0);
                fetchVault(0, activeVaultFolder, vaultFileType, vaultSold, s);
              }}
            />
          ))}
        </div>

        {/* Row 4: Folders */}
        {vaultFolders.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <VaultFolderChip label="Alle" active={activeVaultFolder === null} onClick={() => { setActiveVaultFolder(null); setVaultItems([]); setVaultOffset(0); fetchVault(0, null, vaultFileType, vaultSold, vaultSent); }} />
            {vaultFolders.map(folder => (
              <VaultFolderChip
                key={folder}
                label={folder}
                active={activeVaultFolder === folder}
                onClick={() => { setActiveVaultFolder(folder); setVaultItems([]); setVaultOffset(0); fetchVault(0, folder, vaultFileType, vaultSold, vaultSent); }}
              />
            ))}
          </div>
        )}

        {isLoadingVault && vaultItems.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin text-gray-400" />
          </div>
        ) : vaultError ? (
          <p className="text-red-500 text-sm">{vaultError}</p>
        ) : vaultItems.length === 0 ? (
          <p className="text-gray-400 text-sm">Keine Inhalte gefunden.</p>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2">
              {vaultItems.map((item) => (
                <VaultThumbnail
                  key={item._id}
                  item={item}
                  isSelected={selectedVaultItem?._id === item._id}
                  onSelect={(i) => setSelectedVaultItem(prev => prev?._id === i._id ? null : i)}
                />
              ))}
            </div>
            {vaultHasMore && (
              <div className="mt-4 flex justify-center">
                <Button
                  onClick={() => fetchVault(vaultOffset, activeVaultFolder, vaultFileType, vaultSold, vaultSent)}
                  disabled={isLoadingVault}
                >
                  {isLoadingVault ? <Loader2 size={16} className="animate-spin" /> : 'Mehr laden'}
                </Button>
              </div>
            )}
          </>
        )}
          </>
        )}

        {/* Sticky footer for step 1 when item is selected */}
        {vaultStep === 1 && selectedVaultItem && (
          <div className="sticky bottom-0 left-0 right-0 mt-4 pt-3 border-t border-slate-700 bg-card flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={unblurUrl(selectedVaultItem.img_url)}
                alt=""
                className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-600"
              />
              <span className="text-sm text-gray-200 truncate">
                {selectedVaultItem.description || (selectedVaultItem.fileStackType === 'video' ? 'Video' : 'Bild')}
              </span>
              {typeof selectedVaultItem.price === 'number' && selectedVaultItem.price > 0 && (
                <span className="text-xs font-semibold text-[#ED4C27] shrink-0">
                  ${(selectedVaultItem.price / 100).toFixed(2)}
                </span>
              )}
            </div>
            <Button onClick={() => setVaultStep(2)}>Weiter →</Button>
          </div>
        )}
      </Modal>

      {/* Mobile bottom sheet: predefined texts + pivot info */}
      {mobileInfoOpen && (predefinedTexts.length > 0 || isPivotLoading || pivotData || !!customerId) && createPortal(
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileInfoOpen(false)}
          />
          {/* Sheet */}
          <div className="relative bg-[#0F172A] border-t border-slate-700 rounded-t-2xl max-h-[75vh] flex flex-col overflow-hidden">
            {/* Handle + close */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
              <h2 className="text-sm font-semibold text-gray-100">Infos &amp; Texte</h2>
              <button
                type="button"
                onClick={() => setMobileInfoOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-100 transition-colors"
                aria-label="Schließen"
              >
                <ChevronDown size={18} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-4">
              {predefinedTexts.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Vordefinierte Texte</p>
                  <div className="flex flex-col gap-2">
                    {predefinedTexts.map((pt) => (
                      <button
                        key={pt.id}
                        type="button"
                        onClick={() => {
                          setMessageInput(pt.message);
                          setMobileInfoOpen(false);
                          textareaRef.current?.focus();
                        }}
                        className="w-full text-left rounded-lg px-3 py-2 text-xs text-gray-200 bg-slate-700/60 hover:bg-slate-600 border border-slate-600 hover:border-[#ED4C27] transition-colors"
                      >
                        <span className="block text-gray-400 line-clamp-3">{pt.message}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {isPivotLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={16} className="animate-spin text-gray-400" />
                </div>
              ) : customerId && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Kundeninfo</p>
                    {!isEditingPivot ? (
                      <button type="button" onClick={() => setIsEditingPivot(true)} className="text-[10px] text-[#ED4C27] hover:underline">Bearbeiten</button>
                    ) : (
                      <button type="button" onClick={() => { setPivotEditAlias(pivotData?.alias ?? ''); setPivotEditNote(pivotData?.note ?? ''); setIsEditingPivot(false); }} className="text-[10px] text-gray-400 hover:underline">Abbrechen</button>
                    )}
                  </div>
                  {isEditingPivot ? (
                    <div className="flex flex-col gap-2">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Alias</p>
                        <Input value={pivotEditAlias} onChange={(e) => setPivotEditAlias(e.target.value)} placeholder="Alias eingeben…" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Notiz</p>
                        <Textarea value={pivotEditNote} onChange={(e) => setPivotEditNote(e.target.value)} placeholder="Notiz eingeben…" rows={3} />
                      </div>
                      <Button size="sm" onClick={handleSavePivot} disabled={isSavingPivot}>
                        {isSavingPivot ? 'Speichert…' : 'Speichern'}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {pivotData?.alias && (
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Alias</p>
                          <p className="text-xs text-gray-100 leading-snug">{pivotData.alias}</p>
                        </div>
                      )}
                      {pivotData?.note && (
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Notiz</p>
                          <p className="text-xs text-gray-300 leading-snug whitespace-pre-wrap">{pivotData.note}</p>
                        </div>
                      )}
                      {!pivotData?.alias && !pivotData?.note && (
                        <p className="text-xs text-gray-500">Keine Infos verfügbar.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Right panel: predefined texts + pivot info */}
      {(predefinedTexts.length > 0 || isPivotLoading || pivotData || !!customerId) && (
        <aside className="hidden md:flex w-56 shrink-0 flex-col gap-2 min-h-0">
          {predefinedTexts.length > 0 && (
            <Card className="max-h-[50vh] overflow-y-auto p-3 flex flex-col gap-2 shrink-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 shrink-0">
                Vordefinierte Texte
              </p>
              {predefinedTexts.map((pt) => (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => {
                    setMessageInput(pt.message);
                    textareaRef.current?.focus();
                  }}
                  className="w-full text-left rounded-lg px-3 py-2 text-xs text-gray-200 bg-slate-700/60 hover:bg-slate-600 border border-slate-600 hover:border-[#ED4C27] transition-colors"
                >
                  <span className="block text-gray-400 line-clamp-3">{pt.message}</span>
                </button>
              ))}
            </Card>
          )}

          {/* Pivot info card */}
          {isPivotLoading ? (
            <Card className="p-3 flex items-center justify-center">
              <Loader2 size={16} className="animate-spin text-gray-400" />
            </Card>
          ) : customerId && (
            <Card className="p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Kundeninfo
                </p>
                {!isEditingPivot ? (
                  <button
                    type="button"
                    onClick={() => setIsEditingPivot(true)}
                    className="text-[10px] text-[#ED4C27] hover:underline"
                  >
                    Bearbeiten
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setPivotEditAlias(pivotData?.alias ?? '');
                      setPivotEditNote(pivotData?.note ?? '');
                      setIsEditingPivot(false);
                    }}
                    className="text-[10px] text-gray-400 hover:underline"
                  >
                    Abbrechen
                  </button>
                )}
              </div>
              {isEditingPivot ? (
                <>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Alias</p>
                    <Input
                      value={pivotEditAlias}
                      onChange={(e) => setPivotEditAlias(e.target.value)}
                      placeholder="Alias eingeben…"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Notiz</p>
                    <Textarea
                      value={pivotEditNote}
                      onChange={(e) => setPivotEditNote(e.target.value)}
                      placeholder="Notiz eingeben…"
                      rows={3}
                    />
                  </div>
                  <Button size="sm" onClick={handleSavePivot} disabled={isSavingPivot}>
                    {isSavingPivot ? 'Speichert…' : 'Speichern'}
                  </Button>
                </>
              ) : (
                <>
                  {pivotData?.alias && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Alias</p>
                      <p className="text-xs text-gray-100 leading-snug">{pivotData.alias}</p>
                    </div>
                  )}
                  {pivotData?.note && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Notiz</p>
                      <p className="text-xs text-gray-300 leading-snug whitespace-pre-wrap">{pivotData.note}</p>
                    </div>
                  )}
                  {!pivotData?.alias && !pivotData?.note && (
                    <p className="text-xs text-gray-500">Keine Infos verfügbar.</p>
                  )}
                </>
              )}
            </Card>
          )}
        </aside>
      )}
    </div>
  );
}

// Avatar helper
function AccountAvatar({ src, name, size = 'md' }: { src?: string; name: string; size?: 'sm' | 'md' }) {
  const sizeClass = { sm: 'w-8 h-8', md: 'w-10 h-10' }[size];
  const iconSize = { sm: 14, md: 20 }[size];
  if (!src) {
    const initials = (name ?? '').split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
    return (
      <div className={`${sizeClass} rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0 text-gray-400 font-semibold text-xs`}>
        {initials || <User size={iconSize} />}
      </div>
    );
  }
  return <img src={src} alt={name} className={`${sizeClass} rounded-full object-cover shrink-0`} onError={e => { e.currentTarget.style.display = 'none'; }} />;
}

// Vault folder chip
function VaultFolderChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1 rounded-full text-xs font-medium transition-colors border"
      style={
        active
          ? { background: 'rgba(237,76,39,0.12)', color: '#ED4C27', borderColor: 'rgba(237,76,39,0.3)' }
          : { background: '#1E293B', color: '#9CA3AF', borderColor: '#334155' }
      }
    >
      {label}
    </button>
  );
}

// Vault thumbnail component
function VaultThumbnail({
  item,
  isSelected = false,
  onSelect,
}: {
  item: CloudAsset;
  isSelected?: boolean;
  onSelect?: (item: CloudAsset) => void;
}) {
  const isVideo = item.fileStackType === 'video';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(item)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect?.(item); }}
      className={`relative aspect-square rounded-lg overflow-hidden bg-slate-800 border-2 transition-all cursor-pointer group ${
        isSelected ? 'border-[#ED4C27] ring-2 ring-[#ED4C27]/40' : 'border-slate-700 hover:border-slate-500'
      }`}
    >
      <img
        src={unblurUrl(item.img_url)}
        alt={item.description ?? item._id}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-9 h-9 rounded-full bg-black/60 flex items-center justify-center">
            <Film size={16} className="text-white" />
          </div>
        </div>
      )}
      {isSelected && (
        <div className="absolute top-1.5 right-1.5 pointer-events-none">
          <CheckCircle size={18} className="text-[#ED4C27] drop-shadow" fill="white" />
        </div>
      )}
      {typeof item.price === 'number' && item.price > 0 && (
        <span className="absolute bottom-1 right-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-black/70 text-[#ED4C27]">
          ${(item.price / 100).toFixed(2)}
        </span>
      )}
    </div>
  );
}

// Vault step 2 — send confirmation
function VaultSendStep({
  item,
  onBack,
  onSend,
  isSending = false,
}: {
  item: CloudAsset;
  onBack: () => void;
  onSend: (description: string, priceInCents: number) => void;
  isSending?: boolean;
}) {
  const isVideo = item.fileStackType === 'video';
  const [description, setDescription] = useState('');
  const [priceInput, setPriceInput] = useState(
    typeof item.price === 'number' && item.price > 0 ? (item.price / 100).toFixed(2) : '',
  );
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isEmojiPickerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (emojiBtnRef.current && emojiBtnRef.current.contains(target)) return;
      const pickerEl = document.getElementById('vault-emoji-picker-portal');
      if (pickerEl && pickerEl.contains(target)) return;
      setIsEmojiPickerOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEmojiPickerOpen]);

  const handleEmojiBtnClick = () => {
    if (!isEmojiPickerOpen && emojiBtnRef.current) {
      const rect = emojiBtnRef.current.getBoundingClientRect();
      setPickerPos({ top: rect.top - 440, left: rect.right - 352 });
    }
    setIsEmojiPickerOpen(prev => !prev);
  };

  const handleEmojiSelect = (emoji: { native: string }) => {
    const textarea = descTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart ?? description.length;
      const end = textarea.selectionEnd ?? description.length;
      const newValue = description.slice(0, start) + emoji.native + description.slice(end);
      setDescription(newValue);
      requestAnimationFrame(() => {
        textarea.focus();
        const pos = start + emoji.native.length;
        textarea.setSelectionRange(pos, pos);
      });
    } else {
      setDescription(prev => prev + emoji.native);
    }
    setIsEmojiPickerOpen(false);
  };

  const VAT_RATE = 0.21;
  const CREATOR_SHARE = 0.70;
  const MIN_PRICE = 3.00;

  const basePrice = parseFloat(priceInput || '0') || 0;
  const vatAmount = basePrice * VAT_RATE;
  const userPrice = basePrice + vatAmount;
  const creatorAmount = basePrice * CREATOR_SHARE;
  const isPriceInvalid = basePrice > 0 && basePrice < MIN_PRICE;

  const handleSend = () => {
    if (isPriceInvalid) return;
    const priceWithVat = Math.round(basePrice * (1 + VAT_RATE) * 100);
    const priceInCents = Number.isNaN(priceWithVat) ? 0 : priceWithVat;
    onSend(description, priceInCents);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-5 items-start">
        {/* Preview */}
        <div className="relative w-48 shrink-0 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 aspect-square">
          <img
            src={unblurUrl(item.img_url)}
            alt={item.description ?? item._id}
            className="w-full h-full object-cover"
          />
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                <Film size={22} className="text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          {/* Description */}
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
              Beschreibung <span className="text-red-400">*</span>
            </p>
            <Textarea
              ref={descTextareaRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreibung eingeben…"
              rows={4}
            />
            <div className="flex justify-end mt-1">
              <button
                ref={emojiBtnRef}
                type="button"
                onClick={handleEmojiBtnClick}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-600 bg-slate-700 text-gray-400 hover:text-[#ED4C27] hover:border-[#ED4C27] transition-colors"
                title="Emoji einfügen"
              >
                <Smile size={15} />
              </button>
              {isEmojiPickerOpen && createPortal(
                <div
                  id="vault-emoji-picker-portal"
                  style={{ position: 'fixed', top: pickerPos.top, left: pickerPos.left, zIndex: 9999 }}
                >
                  <Picker
                    data={data}
                    onEmojiSelect={handleEmojiSelect}
                    theme="dark"
                    locale="de"
                    previewPosition="none"
                    skinTonePosition="search"
                  />
                </div>,
                document.body,
              )}
            </div>
          </div>

          {/* Price */}
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Preis ($)</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">$</span>
              <Input
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="Preis in $"
                className={`pl-6 ${isPriceInvalid ? 'border-red-500 focus:border-red-500' : ''}`}
              />
            </div>
            {isPriceInvalid && (
              <p className="text-[10px] text-red-400 mt-1">Mindestpreis: $3.00</p>
            )}
            {basePrice >= MIN_PRICE && (
              <div className="mt-2 rounded-lg bg-slate-800/60 border border-slate-700 p-2.5 flex flex-col gap-1.5 text-[11px]">
                <div>
                  <span className="text-gray-500">Deine Provision:</span>
                  <span className="text-gray-300 ml-1">
                    ${basePrice.toFixed(2)} × 70% = <span className="text-green-400 font-semibold">${creatorAmount.toFixed(2)}</span>
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Preis für User:</span>
                  <span className="text-gray-300 ml-1">
                    ${basePrice.toFixed(2)} + ${vatAmount.toFixed(2)} <span className="text-gray-500">(MwSt.)</span> = <span className="text-[#ED4C27] font-semibold">${userPrice.toFixed(2)}</span>
                  </span>
                </div>
                <p className="text-gray-600 leading-tight">
                  Die MwSt. wird direkt abgeführt.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-700">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-100 transition-colors"
          disabled={isSending}
        >
          <ArrowLeft size={15} /> Zurück
        </button>
        <Button onClick={handleSend} disabled={isSending || isPriceInvalid || !description.trim()}>
          {isSending ? <Loader2 size={15} className="animate-spin" /> : 'Senden'}
        </Button>
      </div>
    </div>
  );
}
