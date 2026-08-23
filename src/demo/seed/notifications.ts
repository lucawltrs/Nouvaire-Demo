import type { Notification, NotificationType } from '../../modules/notifications/types';
import { DEMO_ACCOUNTS } from './accounts';
import { DEMO_CHATS } from './chats';

const minutesAgo = (m: number) => new Date(Date.now() - m * 60 * 1000).toISOString();

const TEMPLATES: { type: NotificationType; title: string; body: string }[] = [
  { type: 'sale', title: 'Neuer Verkauf', body: 'hat ein PPV für $24.99 gekauft' },
  { type: 'tip', title: 'Neuer Tip', body: 'hat dir $10 getippt' },
  { type: 'message', title: 'Neue Nachricht', body: 'hat dir geschrieben' },
  { type: 'follow', title: 'Neuer Follower', body: 'folgt dir jetzt' },
  { type: 'like', title: 'Neuer Like', body: 'hat einen Beitrag geliked' },
];

function buildNotifications(): Notification[] {
  const notifications: Notification[] = [];
  let i = 0;
  for (const account of DEMO_ACCOUNTS) {
    const chats = DEMO_CHATS[account.fourbased_id] ?? [];
    for (const chat of chats.slice(0, 2)) {
      const template = TEMPLATES[i % TEMPLATES.length];
      notifications.push({
        id: `notif_${i}`,
        type: template.type,
        title: template.title,
        body: `${chat.customer_name} ${template.body}`,
        data: { chat_id: chat.chat_id },
        fourbased_user: { id: i + 1, name: account.name, fourbased_id: account.fourbased_id, media_url: undefined },
        read_at: i % 3 === 0 ? null : minutesAgo(60 + i * 20),
        created_at: minutesAgo(i * 7 + 3),
      });
      i += 1;
    }
  }
  return notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export const DEMO_NOTIFICATIONS: Notification[] = buildNotifications();
