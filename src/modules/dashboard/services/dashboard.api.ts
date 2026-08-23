import { DEMO_MODE } from '../../../demo/config';
import { dashboardApi as realDashboardApi } from './dashboard.api.real';
import { dashboardApi as demoDashboardApi } from '../../../demo/api/dashboard.api.mock';

export const dashboardApi: typeof realDashboardApi = DEMO_MODE ? demoDashboardApi : realDashboardApi;
