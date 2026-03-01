import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchUserChatMessages,
  FourBasedChatMessage,
} from '../services/4based.api';

const PAGE_SIZE = 20;

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
      // UI remains chronological ascending (oldest -> newest).
      setMessages(mergeChronological([], ascending));

      nextOffsetRef.current = result.pagination?.next_offset ?? PAGE_SIZE;
      setHasMore(Boolean(result.pagination?.has_more));
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

      setMessages((prev) => {
        const merged = mergeChronological(prev, ascendingOlder);
        prependedCount = Math.max(0, merged.length - prev.length);
        return merged;
      });

      nextOffsetRef.current = result.pagination?.next_offset ?? nextOffsetRef.current + PAGE_SIZE;
      setHasMore(Boolean(result.pagination?.has_more));

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
    setMessages((prev) => mergeChronological(prev, [message]));
  }, []);

  return {
    messages,
    isInitialLoading,
    loadingOlder,
    error,
    loadOlderError,
    hasMore,
    loadOlder,
    appendLocalMessage,
  };
}
