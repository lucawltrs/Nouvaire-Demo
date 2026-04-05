import { UIEvent, useEffect, useRef } from 'react';
import { FourBasedChatMessage, FourBasedFileStackItem } from '../services/4based.api';

interface ChatMessageListProps {
  messages: FourBasedChatMessage[];
  isOwnMessage: (message: FourBasedChatMessage) => boolean;
  loadingOlder: boolean;
  loadOlderError: string | null;
  hasMore: boolean;
  onLoadOlder: () => Promise<number>;
  formatChatTimestamp: (value?: string) => string;
}

const TOP_THRESHOLD = 80;

function isVideoItem(item: FourBasedFileStackItem): boolean {
  return item.fileStackType === 'video' || (item.type?.startsWith('video/') ?? false);
}


const getOwnMessageStatus = (message: FourBasedChatMessage) => {
  const receiverStates = Object.values(message.receiver_status ?? {});

  if (receiverStates.includes('read') || receiverStates.includes('seen')) {
    return 'read';
  }

  if (receiverStates.includes('received')) {
    return 'received';
  }

  if (message.sender_status === 'sent') {
    return 'sent';
  }

  return null;
};

export function ChatMessageList({
  messages,
  isOwnMessage,
  loadingOlder,
  loadOlderError,
  hasMore,
  onLoadOlder,
  formatChatTimestamp,
}: ChatMessageListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const autoScrolledRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || autoScrolledRef.current || messages.length === 0) {
      return;
    }

    // Initial jump to the newest message at the bottom.
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
    autoScrolledRef.current = true;
  }, [messages.length]);

  const handleScroll = async (event: UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget;

    if (container.scrollTop > TOP_THRESHOLD || !hasMore || loadingOlder) {
      return;
    }

    // Preserve visual position while older messages are prepended.
    const oldScrollTop = container.scrollTop;
    const oldHeight = container.scrollHeight;
    await onLoadOlder();

    if (containerRef.current) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!containerRef.current) {
            return;
          }

          const delta = containerRef.current.scrollHeight - oldHeight;
          containerRef.current.scrollTop = oldScrollTop + delta;
        });
      });
    }
  };

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-3" onScroll={handleScroll}>
      {loadingOlder && <p className="text-xs text-gray-400 text-center">Lade ältere Nachrichten...</p>}
      {loadOlderError && <p className="text-xs text-red-400 text-center">{loadOlderError}</p>}

      {messages.length === 0 ? (
        <p className="text-gray-400">Keine Nachrichten vorhanden.</p>
      ) : (
        messages.map((message) => {
          const ownMessage = isOwnMessage(message);
          const status = ownMessage ? getOwnMessageStatus(message) : null;

          return (
            <div
              key={message._id}
              className={`flex ${ownMessage ? 'justify-end' : 'justify-start'}`}
            >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 border ${
                ownMessage
                  ? 'bg-[#ED4C27] border-[#ED4C27]/70 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-100'
              } ${message.img_preview_link ? 'w-64' : ''}`}
            >
              {message.img_preview_link && (() => {
                const fs = message.file_stack;
                const collection = fs?.collection ?? [];
                const allItems: FourBasedFileStackItem[] = fs
                  ? [fs as FourBasedFileStackItem, ...collection]
                  : [];
                const totalCount = allItems.length;
                const imageCount = allItems.filter(i => !isVideoItem(i)).length;
                const videoCount = allItems.filter(i => isVideoItem(i)).length;
                const isPurchased = !!(message.receiver_user_id && fs?.user_paid?.includes(message.receiver_user_id));
                const price = fs?.price ?? 0;

                return (
                  <a href={message.img_preview_link} target="_blank" rel="noopener noreferrer" className="relative block mb-2">
                    <img
                      src={message.img_preview_link}
                      alt="Nachrichten-Vorschau"
                      className="w-full max-h-56 rounded-lg border border-gray-700 object-cover"
                    />
                    <div className="absolute inset-0 flex items-end justify-between p-2 pointer-events-none rounded-lg">
                      {typeof price === 'number' && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isPurchased ? 'bg-green-600/80 text-white' : 'bg-black/60 text-white'
                        }`}>
                          {isPurchased && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          ${(price * (1 - 0.21) / 100).toFixed(2)}
                        </span>
                      )}
                      {totalCount > 1 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 text-white flex items-center gap-1 ml-auto">
                          {imageCount > 0 && <span>🖼 {imageCount}</span>}
                          {videoCount > 0 && <span>🎬 {videoCount}</span>}
                        </span>
                      )}
                    </div>
                  </a>
                );
              })()}
              <p className="whitespace-pre-wrap break-words">{message.message || '-'}</p>
              <div className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${ownMessage ? 'text-white/70' : 'text-gray-400'}`}>
                <span>{formatChatTimestamp(message.created_at ?? message.updated_at)}</span>
                {status === 'sent' && <span aria-label="Gesendet">✓</span>}
                {status === 'received' && <span className="text-blue-400" aria-label="Empfangen">✓✓</span>}
                {status === 'read' && <span className="text-blue-400" aria-label="Gelesen">✓✓</span>}
              </div>
            </div>
            </div>
          );
        })
      )}
    </div>
  );
}
