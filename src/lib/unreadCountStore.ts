/**
 * Module-level store for global unread chat count.
 * Pages that poll unread data write here; MainLayout reads and updates the
 * browser tab title + plays a notification sound on increases.
 */

type Listener = () => void;

let _count = 0;
const _listeners = new Set<Listener>();

export const unreadCountStore = {
  get(): number {
    return _count;
  },

  set(next: number): void {
    if (next !== _count) {
      _count = next;
      _listeners.forEach((fn) => fn());
    }
  },

  subscribe(fn: Listener): () => void {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  },
};
