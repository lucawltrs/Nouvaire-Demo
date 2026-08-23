import type { ConfiguredMessage, ConfiguredMessageCategory, AccountInfo } from '../../modules/inbox/types';
import type { DemoAccountExtras } from '../types';
import { DEMO_ACCOUNTS } from './accounts';

const CATEGORY_SEED: Omit<ConfiguredMessageCategory, 'id'>[] = [
  { name: 'Begrüßung', color: '#22c55e' },
  { name: 'PPV Angebote', color: '#f97316' },
  { name: 'Reaktivierung', color: '#3b82f6' },
];

const MESSAGE_SEED: { name: string; message: string; categoryIndex: number | null }[] = [
  { name: 'Willkommen', message: 'Hey! Schön dass du hier bist 💕 Lass mich wissen, wenn du was Bestimmtes sehen willst!', categoryIndex: 0 },
  { name: 'PPV Reminder', message: 'Ich hab dir gerade was Exklusives geschickt, schau mal in deine Nachrichten 🔥', categoryIndex: 1 },
  { name: 'Win-back', message: 'Hab dich vermisst! Als Willkommen zurück hab ich ein kleines Angebot für dich 🥰', categoryIndex: 2 },
];

const ORIGINS = ['Los Angeles, USA', 'Miami, USA', 'Berlin, Germany', 'London, UK'];
const HOBBIES = [['Yoga', 'Reisen', 'Fotografie'], ['Fitness', 'Kochen'], ['Tanzen', 'Musik', 'Mode']];

let categoryId = 1;
let messageId = 1;

function buildExtrasForAccount(index: number): DemoAccountExtras {
  const categories: ConfiguredMessageCategory[] = CATEGORY_SEED.map((c) => ({ ...c, id: categoryId++ }));

  const configuredMessages: ConfiguredMessage[] = MESSAGE_SEED.map((m, i) => ({
    _id: `cm_${messageId++}`,
    message: m.message,
    name: m.name,
    type: 'text',
    sort_order: i,
    internal: {
      category: m.categoryIndex != null ? categories[m.categoryIndex] : null,
      notes: null,
      sort_order: i,
    },
  }));

  const accountInfo: AccountInfo | null = {
    id: index + 1,
    fourbased_user_id: index + 1,
    age: 22 + (index % 8),
    origin: ORIGINS[index % ORIGINS.length],
    occupation: 'Content Creator',
    bra_size: ['32B', '34C', '32D', '36B'][index % 4],
    taboos: ['keine'],
    hobbies: HOBBIES[index % HOBBIES.length],
    notes: 'Demo-Profildaten für die Präsentation.',
    created_at: '2025-01-10T09:00:00.000Z',
    updated_at: '2025-01-10T09:00:00.000Z',
  };

  return { configuredMessages, configuredMessageCategories: categories, accountInfo };
}

/** fourbased_id -> account-specific extras (configured messages, categories, account info). */
export const DEMO_ACCOUNT_EXTRAS: Record<string, DemoAccountExtras> = Object.fromEntries(
  DEMO_ACCOUNTS.map((account, idx) => [account.fourbased_id, buildExtrasForAccount(idx)]),
);
