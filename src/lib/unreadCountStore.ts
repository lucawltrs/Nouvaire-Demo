/**
 * Module-level store for global unread chat count.
 * Pages that poll unread data write here; MainLayout reads and updates the
 * browser tab title + plays a notification sound on increases.
 */

type Listener = () => void;

let _count = 0;
let _updatedAt = 0;
const _listeners = new Set<Listener>();

export const unreadCountStore = {
  get(): number {
    return _count;
  },

  set(next: number): void {
    _updatedAt = Date.now();
    if (next !== _count) {
      _count = next;
      _listeners.forEach((fn) => fn());
    }
  },

  /** Timestamp (ms) of the last write, regardless of which page triggered it. */
  getUpdatedAt(): number {
    return _updatedAt;
  },

  subscribe(fn: Listener): () => void {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  },
};
