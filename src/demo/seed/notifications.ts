import type { Notification } from '../../modules/notifications/types';

/**
 * Exact fixture handed over for the demo: one of each notification type
 * (message, voice_message, tip, sale) so every icon/style variant is visible
 * at a glance. 3 unread (read_at: null), 1 already read (id 500).
 *
 * The source payload's `fourbased_user.avatar` was a literal placeholder
 * ("https://.../avatar.jpg") that would render as a broken image — omitted
 * here so NotificationBell falls back to its existing type-icon avatar
 * instead of a broken <img>.
 */
export const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: '501',
    team_id: 3,
    fourbased_user_id: 12,
    external_id: 'chat_msg_66f1a2',
    type: 'message',
    title: 'Neue Nachricht 💬',
    body: 'Nina P.: Hey, wie geht\'s? 😊',
    data: { chat_id: 'abc123', message: 'Hey, wie geht\'s? 😊', user: { name: 'Nina P.' } },
    read_at: null,
    created_at: '2026-08-23T09:12:04.000000Z',
    updated_at: '2026-08-23T09:12:04.000000Z',
    fourbased_user: { id: 12, name: 'OnlyModel_Lisa', fourbased_id: 'fb_9982' },
  },
  {
    id: '496',
    team_id: 3,
    fourbased_user_id: 12,
    external_id: 'chat_msg_66f1a1',
    type: 'voice_message',
    title: 'Neue Sprachnachricht 🎤',
    body: 'Nina P.: 🎤 Sprachnachricht',
    data: { categories: ['audio'], file_stack: { fileStackType: 'audio' }, user: { name: 'Nina P.' } },
    read_at: null,
    created_at: '2026-08-23T08:55:00.000000Z',
    updated_at: '2026-08-23T08:55:00.000000Z',
    fourbased_user: { id: 12, name: 'OnlyModel_Lisa', fourbased_id: 'fb_9982' },
  },
  {
    id: '500',
    team_id: 3,
    fourbased_user_id: 12,
    external_id: 'chat_tip_77c2b1',
    type: 'tip',
    title: 'Neues Trinkgeld 🎁',
    body: 'Tom B. – 5,00 €',
    data: { netto_amount: 500, user: { name: 'Tom B.' } },
    read_at: '2026-08-23T08:00:00.000000Z',
    created_at: '2026-08-23T07:59:10.000000Z',
    updated_at: '2026-08-23T08:00:00.000000Z',
    fourbased_user: { id: 12, name: 'OnlyModel_Lisa', fourbased_id: 'fb_9982' },
  },
  {
    id: '499',
    team_id: 3,
    fourbased_user_id: 12,
    external_id: 'sale_66f0e9',
    type: 'sale',
    title: 'Neuer Sale 💰',
    body: 'Lena M. – 24,99 €',
    data: { netto_amount: 2499, buyer_process_type: 'content_unlock', buyer: 'Lena M.' },
    read_at: null,
    created_at: '2026-08-23T07:30:00.000000Z',
    updated_at: '2026-08-23T07:30:00.000000Z',
    fourbased_user: { id: 12, name: 'OnlyModel_Lisa', fourbased_id: 'fb_9982' },
  },
];
