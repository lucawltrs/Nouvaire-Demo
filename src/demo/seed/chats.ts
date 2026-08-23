import type { FourBasedChatMessage } from '../../modules/4based/services/4based.api';
import type { DemoChat } from '../types';
import { DEMO_ACCOUNTS } from './accounts';

const CUSTOMER_NAMES = [
  'Jake Turner', 'Marcus Webb', 'Ryan Holloway', 'Ethan Brooks', 'Daniel Cross',
  'Tyler Sinclair', 'Noah Fischer', 'Owen Bennett', 'Liam Foster', 'Caleb Reed',
  'Mason Clarke', 'Lucas Grant', 'Aiden Marsh', 'Dominic Vale', 'Julian Reyes',
];

const FAN_LINES = [
  'Hey! Loved your last post 😍',
  "You're stunning, when's the next drop?",
  'Can I get a custom video?',
  "Just tipped, hope you're having a great day!",
  'How much for a personal photo set?',
  'Been a subscriber for months, worth every penny',
  'Are you free for a video call sometime?',
  'That last set was incredible 🔥',
  'What time do you usually post?',
  'Thanks for replying so fast!',
];

const CREATOR_LINES = [
  'Hey babe! Thank you so much 💕',
  'Aww you\'re so sweet, thank you!',
  'Sure! Send me the details and I\'ll put something together 😘',
  'Thank you for the tip, means a lot!',
  'I have a bundle for that, let me send it over',
  'That means the world to me, thank you for sticking around!',
  'I\'ll check my calendar and let you know 🥰',
  'Glad you liked it! More coming this week',
  'Usually around 8pm, stay tuned 😉',
  'Of course! Always here for you',
];

const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000);

const fmt = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

let seq = 0;
const nextId = (prefix: string) => {
  seq += 1;
  return `${prefix}_${seq.toString(36)}`;
}

/**
 * Builds the back-and-forth history, then explicitly appends a tail that
 * determines the chat's unread state:
 *   - `trailingInboundCount > 0`: the conversation ends with that many
 *     consecutive customer messages — nobody has replied yet, chat is
 *     unread/"needs a reply".
 *   - `trailingInboundCount === 0`: one final creator message is appended —
 *     the chat has been answered, last message is outbound.
 * This makes the seed's message direction and its unread state consistent
 * by construction, instead of two independently-rolled random values.
 */
function buildMessages(
  fourbasedId: string,
  chatId: string,
  customerId: string,
  historyCount: number,
  startHoursAgo: number,
  trailingInboundCount: number,
): FourBasedChatMessage[] {
  const messages: FourBasedChatMessage[] = [];
  let t = startHoursAgo;

  const push = (isFan: boolean, lineIndex: number) => {
    t -= Math.random() * 3 + 0.2;
    const created = fmt(hoursAgo(Math.max(t, 0.05)));
    messages.push({
      type: 'text',
      _id: nextId('msg'),
      chat_id: chatId,
      user_id: isFan ? customerId : fourbasedId,
      receiver_user_id: isFan ? fourbasedId : customerId,
      message: isFan ? FAN_LINES[lineIndex % FAN_LINES.length] : CREATOR_LINES[lineIndex % CREATOR_LINES.length],
      sender_status: 'sent',
      created_at: created,
      updated_at: created,
    });
  };

  for (let i = 0; i < historyCount; i++) {
    push(i % 2 === 0, i);
  }

  if (trailingInboundCount > 0) {
    for (let k = 0; k < trailingInboundCount; k++) {
      push(true, historyCount + k);
    }
  } else {
    push(false, historyCount);
  }

  return messages;
}

function buildChatsForAccount(fourbasedId: string, chatCount: number): DemoChat[] {
  const chats: DemoChat[] = [];
  for (let i = 0; i < chatCount; i++) {
    const customerId = `cust_${fourbasedId}_${i}`;
    const chatId = `chat_${fourbasedId}_${i}`;
    const customerName = CUSTOMER_NAMES[(i + fourbasedId.length * 3) % CUSTOMER_NAMES.length];
    const historyCount = 4 + ((i * 3) % 8);
    const startHoursAgo = 2 + i * 7 + Math.random() * 5;
    // Roughly a third of chats are still waiting on a reply from the creator.
    const isWaitingOnReply = i % 3 === 0;
    const trailingInboundCount = isWaitingOnReply ? 1 + (i % 2) : 0;
    const messages = buildMessages(fourbasedId, chatId, customerId, historyCount, startHoursAgo, trailingInboundCount);

    chats.push({
      chat_id: chatId,
      fourbased_id: fourbasedId,
      customer_id: customerId,
      customer_name: customerName,
      customer_avatar_url: null,
      customer_is_online: i % 4 === 0,
      messages,
      unread_count: trailingInboundCount,
      sales_volume: Math.round((5 + i * 12.5) * 100) / 100,
      pivot: {
        _id: `pivot_${fourbasedId}_${i}`,
        alias: undefined,
        note: i % 5 === 0 ? 'VIP – reagiert schnell auf PPV.' : undefined,
        interaction: true,
        last_interaction_at: messages[messages.length - 1]?.created_at,
        auto_follow_message_sent: true,
        has_payed_chat_unlock_price: i % 4 === 0,
        created_at: fmt(hoursAgo(startHoursAgo + 5)),
        price_override: i % 6 === 0
          ? {
              data: {
                effective_message_price: 999,
                is_override: true,
                global_message_price: 500,
                cooldown_active: false,
                cooldown_expires_at: null,
              },
            }
          : null,
      },
    });
  }
  return chats;
}

/** fourbased_id -> chats for that creator account. */
export const DEMO_CHATS: Record<string, DemoChat[]> = Object.fromEntries(
  DEMO_ACCOUNTS.map((account, idx) => [account.fourbased_id, buildChatsForAccount(account.fourbased_id, 5 + (idx % 3))]),
);
