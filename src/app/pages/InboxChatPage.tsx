import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { Input } from '../../components/ui/Input';
import { Loader2, User, ArrowLeft, Search, Camera, Film, CheckCircle } from 'lucide-react';
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
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [chatsError, setChatsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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

  useEffect(() => {
    if (!fourbased_id) return;
    inboxApi.getPredefinedTexts(fourbased_id).then(setPredefinedTexts).catch(() => {});
  }, [fourbased_id]);

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

    try {
      await sendChatMessage(fourbased_id, chat_id, trimmed);
      await refresh();
    } catch (err) {
      removeLocalMessage(tempId);
      setMessageInput(trimmed);
      const message = err instanceof Error ? err.message : 'Nachricht konnte nicht gesendet werden';
      toast.error(message);
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

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
                  <AccountAvatar src={chat.customer_avatar_url ?? undefined} name={chat.customer_name} size="sm" />
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
      <main className="flex-1 min-h-0 flex flex-col" style={{ minWidth: 0 }}>
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
                  <button
                    type="button"
                    onClick={handleOpenVault}
                    className="flex items-center justify-center w-10 h-10 rounded-lg border border-slate-600 bg-slate-700 text-gray-400 hover:text-[#ED4C27] hover:border-[#ED4C27] transition-colors"
                    title="Vault öffnen"
                  >
                    <Camera size={18} />
                  </button>
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

      {/* Right panel: predefined texts + pivot info */}
      {(predefinedTexts.length > 0 || isPivotLoading || pivotData || !!customerId) && (
        <aside className="w-56 shrink-0 flex flex-col gap-2 min-h-0">
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
  const handleSend = () => {
    const priceInCents = Math.round(parseFloat(priceInput || '0') * 100);
    onSend(description, Number.isNaN(priceInCents) ? 0 : priceInCents);
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
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Beschreibung</p>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreibung eingeben…"
              rows={4}
            />
          </div>

          {/* Price */}
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Preis ($)</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">$</span>
              <Input
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0.00"
                className="pl-6"
              />
            </div>
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
        <Button onClick={handleSend} disabled={isSending}>
          {isSending ? <Loader2 size={15} className="animate-spin" /> : 'Senden'}
        </Button>
      </div>
    </div>
  );
}
