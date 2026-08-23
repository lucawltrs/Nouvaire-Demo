import type { AccountEmoji } from '../../modules/accounts/types';
import { DEMO_ACCOUNTS } from './accounts';
import { DEMO_CHATS } from './chats';
import { DEMO_ACCOUNT_EXTRAS } from './accountExtras';
import { DEMO_CLOUD_ASSETS } from './cloud';
import { DEMO_MASS_MESSAGES, DEMO_USER_LISTS } from './massMessages';
import { DEMO_NOTIFICATIONS } from './notifications';
import { DEMO_SETTINGS } from './settings';
import { DEMO_TEAM_MEMBERS, DEMO_GROUPS } from './team';
import { DEMO_SESSION_OVERVIEWS, DEMO_WORK_SESSIONS } from './workSessions';

let emojiId = 1;
const DEMO_ACCOUNT_EMOJIS: Record<string, AccountEmoji[]> = Object.fromEntries(
  DEMO_ACCOUNTS.map((account, idx) => [
    account.fourbased_id,
    ['😍', '🔥'].slice(0, 1 + (idx % 2)).map((emoji) => ({
      id: emojiId++,
      emoji,
      fourbased_user_id: idx + 1,
      team_id: 1,
    })),
  ]),
);

/**
 * Builds one full, independent snapshot of every demo domain. Called once to
 * create the frozen "factory" snapshot, and again (via structuredClone) on
 * every demo reset — see `src/demo/store.ts`.
 */
export function buildDemoSnapshot() {
  return {
    accounts: DEMO_ACCOUNTS,
    accountEmojis: DEMO_ACCOUNT_EMOJIS,
    chats: DEMO_CHATS,
    accountExtras: DEMO_ACCOUNT_EXTRAS,
    cloudAssets: DEMO_CLOUD_ASSETS,
    massMessages: DEMO_MASS_MESSAGES,
    userLists: DEMO_USER_LISTS,
    notifications: DEMO_NOTIFICATIONS,
    settings: DEMO_SETTINGS,
    teamMembers: DEMO_TEAM_MEMBERS,
    groups: DEMO_GROUPS,
    sessionOverviews: DEMO_SESSION_OVERVIEWS,
    workSessions: DEMO_WORK_SESSIONS,
    activeWorkSession: null as import('../../modules/work-sessions/services/workSession.api').ActiveWorkSession | null,
  };
}

export type DemoSnapshot = ReturnType<typeof buildDemoSnapshot>;
