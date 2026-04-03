import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchUserChatMessages,
  FourBasedChatMessage,
} from '../services/4based.api';

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Module-level cache so messages survive chat switches within the same session.
// Key format: `${fourbasedId}:${chatId}`
// ---------------------------------------------------------------------------
interface CacheEntry {
  messages: FourBasedChatMessage[];
  nextOffset: number;
  hasMore: boolean;
}

const _cache = new Map<string, CacheEntry>();

const cacheKey = (fourbasedId: string, chatId: string) => `${fourbasedId}:${chatId}`;

const readCache = (fourbasedId?: string, chatId?: string): CacheEntry | undefined => {
  if (!fourbasedId || !chatId) return undefined;
  return _cache.get(cacheKey(fourbasedId, chatId));
};

const writeCache = (fourbasedId: string, chatId: string, entry: CacheEntry) => {
  _cache.set(cacheKey(fourbasedId, chatId), entry);
};

const toTime = (message: FourBasedChatMessage) => {
  const raw = message.created_at ?? message.updated_at;

  if (!raw) {
    return 0;
  }

  const parsed = new Date(raw.replace(' ', 'T')).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const mergeChronological = (
  existing: FourBasedChatMessage[],
  incoming: FourBasedChatMessage[]
) => {
  const byId = new Map<string, FourBasedChatMessage>();

  [...existing, ...incoming].forEach((message) => {
    byId.set(message._id, message);
  });

  return Array.from(byId.values()).sort((a, b) => {
    const timeDiff = toTime(a) - toTime(b);

    if (timeDiff !== 0) {
      return timeDiff;
    }

    return a._id.localeCompare(b._id);
  });
};

export function useChatMessages(fourbasedId?: string, chatId?: string) {
  const [messages, setMessages] = useState<FourBasedChatMessage[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadOlderError, setLoadOlderError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const nextOffsetRef = useRef(0);
  const loadingOlderRef = useRef(false);

  const loadInitial = useCallback(async () => {
    if (!fourbasedId || !chatId) {
      return;
    }

    // ---------- cache hit: restore instantly without a network request ----------
    const cached = readCache(fourbasedId, chatId);
    if (cached) {
      setMessages(cached.messages);
      nextOffsetRef.current = cached.nextOffset;
      setHasMore(cached.hasMore);
      setError(null);
      setLoadOlderError(null);
      return;
    }
    // --------------------------------------------------------------------------

    setIsInitialLoading(true);
    setError(null);
    setLoadOlderError(null);

    try {
      const result = await fetchUserChatMessages(fourbasedId, chatId, {
        limit: PAGE_SIZE,
        offset: 0,
        sort: '{"created_at":"desc"}',
        with_file_stack: true,
        with_tip: true,
      });

      const ascending = [...(result.response ?? [])].reverse();
      const merged = mergeChronological([], ascending);
      const nextOffset = result.pagination?.next_offset ?? PAGE_SIZE;
      const hasMorePages = Boolean(result.pagination?.has_more);

      setMessages(merged);
      nextOffsetRef.current = nextOffset;
      setHasMore(hasMorePages);

      writeCache(fourbasedId, chatId, { messages: merged, nextOffset, hasMore: hasMorePages });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fehler beim Laden der Nachrichten';
      setError(message);
    } finally {
      setIsInitialLoading(false);
    }
  }, [chatId, fourbasedId]);

  useEffect(() => {
    setMessages([]);
    nextOffsetRef.current = 0;
    setHasMore(false);
    loadInitial();
  }, [loadInitial]);

  const loadOlder = useCallback(async () => {
    if (!fourbasedId || !chatId || !hasMore || loadingOlderRef.current) {
      return 0;
    }

    loadingOlderRef.current = true;
    setLoadingOlder(true);
    setLoadOlderError(null);

    try {
      const result = await fetchUserChatMessages(fourbasedId, chatId, {
        limit: PAGE_SIZE,
        offset: nextOffsetRef.current,
        sort: '{"created_at":"desc"}',
        with_file_stack: true,
        with_tip: true,
      });

      const ascendingOlder = [...(result.response ?? [])].reverse();
      let prependedCount = 0;
      const newNextOffset = result.pagination?.next_offset ?? nextOffsetRef.current + PAGE_SIZE;
      const newHasMore = Boolean(result.pagination?.has_more);

      setMessages((prev) => {
        const merged = mergeChronological(prev, ascendingOlder);
        prependedCount = Math.max(0, merged.length - prev.length);
        if (fourbasedId && chatId) {
          writeCache(fourbasedId, chatId, { messages: merged, nextOffset: newNextOffset, hasMore: newHasMore });
        }
        return merged;
      });

      nextOffsetRef.current = newNextOffset;
      setHasMore(newHasMore);

      // Used by caller to keep scroll position stable after prepend.
      return prependedCount;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fehler beim Nachladen älterer Nachrichten';
      setLoadOlderError(message);
      return 0;
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [chatId, fourbasedId, hasMore]);

  const appendLocalMessage = useCallback((message: FourBasedChatMessage) => {
    setMessages((prev) => {
      const merged = mergeChronological(prev, [message]);
      if (fourbasedId && chatId) {
        const cached = readCache(fourbasedId, chatId);
        writeCache(fourbasedId, chatId, {
          messages: merged,
          nextOffset: cached?.nextOffset ?? nextOffsetRef.current,
          hasMore: cached?.hasMore ?? false,
        });
      }
      return merged;
    });
  }, [fourbasedId, chatId]);

  const removeLocalMessage = useCallback((messageId: string) => {
    setMessages((prev) => {
      const filtered = prev.filter((m) => m._id !== messageId);
      if (fourbasedId && chatId) {
        const cached = readCache(fourbasedId, chatId);
        writeCache(fourbasedId, chatId, {
          messages: filtered,
          nextOffset: cached?.nextOffset ?? nextOffsetRef.current,
          hasMore: cached?.hasMore ?? false,
        });
      }
      return filtered;
    });
  }, [fourbasedId, chatId]);

  const refresh = useCallback(async () => {
    if (!fourbasedId || !chatId) return;
    if (fourbasedId && chatId) {
      _cache.delete(cacheKey(fourbasedId, chatId));
    }
    await loadInitial();
  }, [fourbasedId, chatId, loadInitial]);

  // Silent background refresh – merges latest messages without any loading indicator.
  const refreshSilent = useCallback(async () => {
    if (!fourbasedId || !chatId) return;
    try {
      const result = await fetchUserChatMessages(fourbasedId, chatId, {
        limit: PAGE_SIZE,
        offset: 0,
        sort: '{"created_at":"desc"}',
        with_file_stack: true,
        with_tip: true,
      });
      const ascending = [...(result.response ?? [])].reverse();
      setMessages((prev) => {
        const merged = mergeChronological(prev, ascending);
        const cached = readCache(fourbasedId, chatId);
        writeCache(fourbasedId, chatId, {
          messages: merged,
          nextOffset: cached?.nextOffset ?? nextOffsetRef.current,
          hasMore: cached?.hasMore ?? false,
        });
        return merged;
      });
    } catch {
      // Silently ignore errors during background refresh
    }
  }, [fourbasedId, chatId]);

  return {
    messages,
    isInitialLoading,
    loadingOlder,
    error,
    loadOlderError,
    hasMore,
    loadOlder,
    appendLocalMessage,
    removeLocalMessage,
    refresh,
    refreshSilent,
  };
}
