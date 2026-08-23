import { DEMO_MODE } from '../../demo/config';
import { cloudApi as realCloudApi } from './cloudApi.real';
import { cloudApi as demoCloudApi } from '../../demo/api/cloudApi.mock';

export const cloudApi: typeof realCloudApi = DEMO_MODE ? demoCloudApi : realCloudApi;

// Pure, network-free helpers — identical in both modes, always the real ones.
export { formatBytes, relativeTime, formatDuration, unblurUrl } from './cloudApi.real';
