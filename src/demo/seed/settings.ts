import type { TeamSettings } from '../../modules/shared/services/settingsApi';
import { DEMO_TEAM } from './auth';

export const DEMO_SETTINGS: TeamSettings = {
  id: 1,
  team_id: DEMO_TEAM.team_id,
  discord_webhook_url: null,
  work_sessions_enabled: true,
  unread_messages_enabled: true,
  unread_messages_threshold_minutes: 15,
  chatter_percentage: 10,
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
};
