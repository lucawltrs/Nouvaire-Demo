import { UIEvent, useEffect, useRef } from 'react';
import { FourBasedChatMessage } from '../services/4based.api';

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
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-gray-100'
                  : 'bg-gray-800 border-gray-700 text-gray-100'
              }`}
            >
              {message.img_preview_link && (
                <a href={message.img_preview_link} target="_blank" rel="noopener noreferrer" className="block mb-2">
                  <img
                    src={message.img_preview_link}
                    alt="Nachrichten-Vorschau"
                    className="max-h-56 rounded-lg border border-gray-700 object-cover"
                  />
                </a>
              )}
              <p className="whitespace-pre-wrap break-words">{message.message || '-'}</p>
              <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-gray-400">
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
