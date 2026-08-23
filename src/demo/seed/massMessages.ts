import type { MassMessage, UserList } from '../../modules/mass-messages/types';
import { DEMO_ACCOUNTS } from './accounts';

const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();

const USER_LIST_SEED: Omit<UserList, '_id'>[] = [
  { name: 'VIP Spender', position: 0 },
  { name: 'Neue Fans', position: 1 },
  { name: 'Abgelaufene Abos', position: 2 },
];

let listSeq = 0;
function buildUserListsForAccount(): UserList[] {
  return USER_LIST_SEED.map((l) => ({ ...l, _id: `list_${(listSeq++).toString(36)}` }));
}

const MASS_MESSAGE_SEED = [
  { message: 'Neues Set ist live! Schau vorbei, bevor es weg ist 🔥', filter: ['users_with_subscription'], daysAgoSent: 2, recipients: 412, viewed: 301 },
  { message: 'Flash Sale heute: 30% auf alle PPVs bis Mitternacht 💸', filter: ['users_with_purchases'], daysAgoSent: 6, recipients: 288, viewed: 210 },
  { message: 'Vermisse euch! Kommt vorbei, ich hab was Neues für euch 🥰', filter: ['users_without_purchases'], daysAgoSent: 12, recipients: 540, viewed: 190 },
];

let msgSeq = 0;
function buildMassMessagesForAccount(fourbasedId: string): MassMessage[] {
  return MASS_MESSAGE_SEED.map((m) => {
    const sentAt = daysAgo(m.daysAgoSent);
    return {
      _id: `mm_${fourbasedId}_${msgSeq++}`,
      user_id: fourbasedId,
      message: m.message,
      target_group: m.filter[0],
      filter: m.filter,
      status: 'finished' as const,
      recipient_count: m.recipients,
      viewed_count: m.viewed,
      to_be_posted_at: sentAt,
      processing_finished_at: sentAt,
      created_at: sentAt,
      updated_at: sentAt,
      file_stack: null,
      file_stack_id: null,
    };
  });
}

/** fourbased_id -> mass message history for that creator account. */
export const DEMO_MASS_MESSAGES: Record<string, MassMessage[]> = Object.fromEntries(
  DEMO_ACCOUNTS.map((account) => [account.fourbased_id, buildMassMessagesForAccount(account.fourbased_id)]),
);

/** fourbased_id -> user lists (segments) available for that creator account. */
export const DEMO_USER_LISTS: Record<string, UserList[]> = Object.fromEntries(
  DEMO_ACCOUNTS.map((account) => [account.fourbased_id, buildUserListsForAccount()]),
);
