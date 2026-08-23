import type { ActiveWorkSession, WorkSession, SessionOverview } from '../../modules/work-sessions/services/workSession.api.real';
import { store } from '../store';
import { fakeLatency } from '../utils';

export async function getActiveWorkSession(): Promise<ActiveWorkSession | null> {
  await fakeLatency();
  return store.getActiveWorkSession();
}

export async function getWorkSessionsForUser(userId: number, from?: string, till?: string): Promise<WorkSession[]> {
  await fakeLatency();
  return store.getWorkSessionsForUser(userId, from, till);
}

export async function postStartWorkSession(startedAt: string): Promise<{ started_at: string; id: number }> {
  await fakeLatency();
  return store.startWorkSession(startedAt);
}

export async function putEndWorkSession(id: number, endedAt: string): Promise<void> {
  await fakeLatency();
  store.endWorkSession(id, endedAt);
}

export async function getSessionOverview(userId: number, from?: string, till?: string): Promise<SessionOverview> {
  await fakeLatency();
  return store.getSessionOverview(userId, from, till);
}

export async function postAdminEndWorkSession(id: number, adminNote: string, endedAt: string): Promise<void> {
  await fakeLatency();
  store.endWorkSession(id, endedAt, adminNote, true);
}
