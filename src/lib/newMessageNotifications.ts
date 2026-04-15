import type { ChatListItem } from '../modules/inbox/types';

export interface NewMessageNotification {
  id: string;
  chat: ChatListItem;
  newCount: number;
}

type Listener = (notifications: NewMessageNotification[]) => void;
type ChatReadListener = (fourbasedId: string, chatId: string) => void;

class NewMessageNotificationStore {
  private knownChats = new Map<string, { unread_count: number; is_unread: boolean }>();
  private initialized = false;
  private pending: NewMessageNotification[] = [];
  private listeners = new Set<Listener>();
  private chatReadListeners = new Set<ChatReadListener>();
  private dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

  private notify() {
    this.listeners.forEach((fn) => fn([...this.pending]));
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  onChatRead(fn: ChatReadListener) {
    this.chatReadListeners.add(fn);
    return () => this.chatReadListeners.delete(fn);
  }

  /**
   * Feed the latest chat list (from any poll). On first call the state is
   * initialised without triggering notifications. Subsequent calls diff
   * against the last known state.
   */
  check(chats: ChatListItem[]) {
    if (!this.initialized) {
      for (const chat of chats) {
        const key = `${chat.fourbased_id}:${chat.chat_id}`;
        this.knownChats.set(key, {
          unread_count: chat.unread_count,
          is_unread: chat.is_unread,
        });
      }
      this.initialized = true;
      return;
    }

    const newNotifications: NewMessageNotification[] = [];

    for (const chat of chats) {
      const key = `${chat.fourbased_id}:${chat.chat_id}`;
      const known = this.knownChats.get(key);

      if (!known) {
        // Brand-new chat that is already unread
        if (chat.is_unread && chat.unread_count > 0) {
          newNotifications.push({
            id: `${key}:${Date.now()}`,
            chat,
            newCount: chat.unread_count,
          });
        }
      } else if (chat.is_unread && chat.unread_count > known.unread_count) {
        // Existing chat with more unread messages than before
        newNotifications.push({
          id: `${key}:${Date.now()}`,
          chat,
          newCount: chat.unread_count - known.unread_count,
        });
      }

      this.knownChats.set(key, {
        unread_count: chat.unread_count,
        is_unread: chat.is_unread,
      });
    }

    if (newNotifications.length > 0) {
      for (const notif of newNotifications) {
        this.pending.push(notif);
        const timer = setTimeout(() => this.dismiss(notif.id), 8000);
        this.dismissTimers.set(notif.id, timer);
      }
      this.notify();
    }
  }

  dismiss(id: string) {
    const timer = this.dismissTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.dismissTimers.delete(id);
    }
    this.pending = this.pending.filter((n) => n.id !== id);
    this.notify();
  }

  /**
   * Call after successfully marking a chat as read so the notification
   * disappears immediately and the known state is updated.
   */
  markChatRead(fourbasedId: string, chatId: string) {
    const key = `${fourbasedId}:${chatId}`;
    const known = this.knownChats.get(key);
    if (known) {
      this.knownChats.set(key, { ...known, is_unread: false, unread_count: 0 });
    }
    const toRemove = this.pending.filter(
      (n) => n.chat.fourbased_id === fourbasedId && n.chat.chat_id === chatId
    );
    for (const n of toRemove) this.dismiss(n.id);
    this.chatReadListeners.forEach((fn) => fn(fourbasedId, chatId));
  }
}

export const newMessageNotifications = new NewMessageNotificationStore();
