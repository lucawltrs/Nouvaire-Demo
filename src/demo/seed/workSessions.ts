import type { SessionOverviewSession, WorkSession } from '../../modules/work-sessions/services/workSession.api';
import { DEMO_TEAM_MEMBERS } from './team';

const daysAgo = (d: number, hour: number) => {
  const date = new Date();
  date.setDate(date.getDate() - d);
  date.setHours(hour, 0, 0, 0);
  return date;
};

const usd = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

function buildSessionsForUser(userId: number): SessionOverviewSession[] {
  const sessions: SessionOverviewSession[] = [];
  for (let d = 1; d <= 6; d++) {
    const started = daysAgo(d, 9 + (userId % 3));
    const durationMinutes = 240 + ((userId + d) % 4) * 30;
    const ended = new Date(started.getTime() + durationMinutes * 60 * 1000);
    sessions.push({
      id: userId * 100 + d,
      started_at: started.toISOString(),
      ended_at: ended.toISOString(),
      duration: durationMinutes,
      is_active: false,
      revenue: usd(80 + ((userId * 7 + d * 13) % 300)),
    });
  }
  return sessions.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
}

/** team_user_id (== user_id) -> historical session overview rows. */
export const DEMO_SESSION_OVERVIEWS: Record<number, SessionOverviewSession[]> = Object.fromEntries(
  DEMO_TEAM_MEMBERS.map((m) => {
    const sessions = buildSessionsForUser(m.user_id);
    // Mara Keller (user_id 2) is currently mid-shift — lets the "Schicht beenden"
    // admin flow on her TeamMemberDetailPage be demoed right away.
    if (m.user_id === 2) {
      sessions.unshift({
        id: 299,
        started_at: daysAgo(0, 8).toISOString(),
        ended_at: null,
        duration: null,
        is_active: true,
        revenue: usd(64.5),
      });
    }
    return [m.user_id, sessions];
  }),
);

/** team_user_id -> plain work-session rows (legacy shape, `getWorkSessionsForUser`). */
export const DEMO_WORK_SESSIONS: Record<number, WorkSession[]> = Object.fromEntries(
  DEMO_TEAM_MEMBERS.map((m) => [
    m.user_id,
    buildSessionsForUser(m.user_id).map((s) => ({
      id: s.id,
      team_user_id: m.user_id,
      started_at: s.started_at,
      ended_at: s.ended_at,
      duration: s.duration,
      created_at: s.started_at,
      updated_at: s.ended_at ?? s.started_at,
    })),
  ]),
);
