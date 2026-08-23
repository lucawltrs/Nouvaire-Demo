import { DEMO_MODE } from '../../../demo/config';
import * as real from './workSession.api.real';
import * as demo from '../../../demo/api/workSession.api.mock';

export const getActiveWorkSession: typeof real.getActiveWorkSession = DEMO_MODE
  ? demo.getActiveWorkSession
  : real.getActiveWorkSession;
export const getWorkSessionsForUser: typeof real.getWorkSessionsForUser = DEMO_MODE
  ? demo.getWorkSessionsForUser
  : real.getWorkSessionsForUser;
export const postStartWorkSession: typeof real.postStartWorkSession = DEMO_MODE
  ? demo.postStartWorkSession
  : real.postStartWorkSession;
export const putEndWorkSession: typeof real.putEndWorkSession = DEMO_MODE ? demo.putEndWorkSession : real.putEndWorkSession;
export const getSessionOverview: typeof real.getSessionOverview = DEMO_MODE ? demo.getSessionOverview : real.getSessionOverview;
export const postAdminEndWorkSession: typeof real.postAdminEndWorkSession = DEMO_MODE
  ? demo.postAdminEndWorkSession
  : real.postAdminEndWorkSession;

export type { WorkSession, ActiveWorkSession, SessionOverviewSession, SessionOverview } from './workSession.api.real';
