import { UIEvent, useEffect, useRef, useState } from 'react';
import { FourBasedChatMessage, FourBasedFileStackItem } from '../services/4based.api';
import { formatDuration } from '../../cloud/cloudApi';

function VoiceMessagePlayer({ src, isOwn }: { src: string; isOwn: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = parseFloat(e.target.value) * audio.duration;
    setProgress(parseFloat(e.target.value));
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

  const elapsed = duration * progress;

  return (
    <div className="flex items-center gap-2 w-52 py-0.5">
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0); }}
        onTimeUpdate={() => {
          const a = audioRef.current;
          if (a?.duration) setProgress(a.currentTime / a.duration);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
      />
      <button
        type="button"
        onClick={toggle}
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isOwn ? 'bg-white/20 hover:bg-white/30' : 'bg-foreground/10 hover:bg-foreground/20'}`}
      >
        {playing ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={progress}
          onChange={handleSeek}
          className={`w-full h-1 rounded-full appearance-none cursor-pointer ${isOwn ? 'accent-white' : 'accent-foreground'}`}
        />
        <span className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-muted-foreground'}`}>
          {formatTime(elapsed)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}

interface ChatMessageListProps {
  messages: FourBasedChatMessage[];
  isOwnMessage: (message: FourBasedChatMessage) => boolean;
  loadingOlder: boolean;
  loadOlderError: string | null;
  hasMore: boolean;
  onLoadOlder: () => Promise<number>;
  formatChatTimestamp: (value?: string) => string;
  onEditFileStack?: (message: FourBasedChatMessage) => void;
}

const TOP_THRESHOLD = 80;

function isVideoItem(item: FourBasedFileStackItem): boolean {
  return item.fileStackType === 'video' || (item.type?.startsWith('video/') ?? false);
}


interface MediaCarouselProps {
  items: FourBasedFileStackItem[];
  isPurchased: boolean;
  price: number;
  previewUrl: string;
}

function MediaCarousel({ items, isPurchased, price, previewUrl }: MediaCarouselProps) {
  const [index, setIndex] = useState(0);
  const current = items[index];
  const isVideo = current ? isVideoItem(current) : false;
  const mediaUrl: string = ((current as Record<string, unknown>)?.media_url as string)
    ?? (((current as Record<string, unknown>)?.source as string[])?.[0])
    ?? previewUrl;
  const total = items.length;

  return (
    <div className="relative mb-2 w-full rounded-lg overflow-hidden border border-border bg-black">
      <div className="relative w-full" style={{ aspectRatio: '4/5', maxHeight: '280px' }}>
        {isVideo ? (
          <video
            key={mediaUrl}
            src={mediaUrl}
            controls
            playsInline
            className="w-full h-full object-contain"
          />
        ) : (
          <img
            src={mediaUrl || previewUrl}
            alt={`Media ${index + 1}`}
            className="w-full h-full object-cover"
          />
        )}

        {/* Duration badge — chat messages only carry the raw `duration` seconds, not
            `duration_formatted` (that's only present on vault assets), so format it here */}
        {isVideo && (() => {
          const label = current?.duration_formatted ?? formatDuration(current?.duration);
          return label ? (
            <span className="absolute top-2 right-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/60 text-white tabular-nums">
              {label}
            </span>
          ) : null;
        })()}

        {/* Price badge */}
        {typeof price === 'number' && (
          <span className={`absolute bottom-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
            isPurchased ? 'bg-green-600/80 text-white' : 'bg-black/60 text-white'
          }`}>
            {isPurchased && (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            ${(price / 1.21 / 100).toFixed(2)}
          </span>
        )}

        {/* Counter */}
        {total > 1 && (
          <span className="absolute bottom-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 text-white">
            {index + 1} / {total}
          </span>
        )}
      </div>

      {/* Navigation */}
      {total > 1 && (
        <>
          <button
            onClick={() => setIndex(i => Math.max(0, i - 1))}
            disabled={index === 0}
            className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 disabled:opacity-20 text-white rounded-full w-7 h-7 flex items-center justify-center transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={() => setIndex(i => Math.min(total - 1, i + 1))}
            disabled={index === total - 1}
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 disabled:opacity-20 text-white rounded-full w-7 h-7 flex items-center justify-center transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          {/* Dot indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
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
  onEditFileStack,
}: ChatMessageListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initialScrollDoneRef = useRef(false);
  const isAtBottomRef = useRef(true);

  // Scroll to bottom on initial load and whenever new messages arrive while user is at the bottom.
  useEffect(() => {
    if (!containerRef.current || messages.length === 0) {
      return;
    }

    if (!initialScrollDoneRef.current || isAtBottomRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      initialScrollDoneRef.current = true;
    }
  }, [messages.length]);

  const BOTTOM_THRESHOLD = 120;

  const handleScroll = async (event: UIEvent<HTMLDivElement>) => {
    const container = event.currentTarget;

    // Track whether the user is near the bottom.
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    isAtBottomRef.current = distanceFromBottom <= BOTTOM_THRESHOLD;

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
      {loadingOlder && <p className="text-xs text-muted-foreground text-center">Lade ältere Nachrichten...</p>}
      {loadOlderError && <p className="text-xs text-red-400 text-center">{loadOlderError}</p>}

      {messages.length === 0 ? (
        <p className="text-muted-foreground">Keine Nachrichten vorhanden.</p>
      ) : (
        messages.map((message) => {
          const ownMessage = isOwnMessage(message);
          const status = ownMessage ? getOwnMessageStatus(message) : null;
          const isTip = message.type === 'tip';

          const isVoice = message.categories?.includes('audio') && !!message.file_stack?.media_url;
          const hasMedia = !!message.img_preview_link && !isVoice;

          return (
            <div
              key={message._id}
              className={`flex items-end gap-2 ${ownMessage ? 'justify-end' : 'justify-start'}`}
            >
            {ownMessage && onEditFileStack && message.file_stack?._id && hasMedia && (
              <button
                type="button"
                onClick={() => onEditFileStack(message)}
                className="shrink-0 mb-1 p-1.5 rounded-lg text-muted-foreground hover:text-brand hover:bg-muted transition-colors"
                title="Bearbeiten"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 border ${
                isTip
                  ? 'bg-brand/10 border-brand text-brand'
                  : ownMessage
                  ? 'bg-brand border-brand/70 text-white'
                  : 'bg-muted border-border text-foreground'
              } ${hasMedia ? 'w-64' : ''}`}
            >
              {hasMedia && (() => {
                const fs = message.file_stack;
                const collection = fs?.collection ?? [];
                const allItems: FourBasedFileStackItem[] = fs
                  ? [fs as FourBasedFileStackItem, ...collection]
                  : [];
                const isPurchased = !!(message.receiver_user_id && fs?.user_paid?.includes(message.receiver_user_id));
                const price = fs?.price ?? 0;

                return (
                  <MediaCarousel
                    items={allItems}
                    isPurchased={isPurchased}
                    price={price}
                    previewUrl={message.img_preview_link!}
                  />
                );
              })()}
              {isVoice ? (
                <VoiceMessagePlayer src={message.file_stack!.media_url!} isOwn={ownMessage} />
              ) : (
                <p className="whitespace-pre-wrap break-words">{message.message || '-'}</p>
              )}
              <div className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${isTip ? 'text-brand/70' : ownMessage ? 'text-white/70' : 'text-muted-foreground'}`}>
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
