import type { PushSubscribePayload } from '../../modules/shared/services/pushApi.real';
import { fakeLatency } from '../utils';

/**
 * Push notifications never actually register in DEMO_MODE (see `main.tsx`,
 * which skips the /sw.js service-worker registration entirely). These mocks
 * exist purely so the contract stays satisfied if some code path still calls
 * them — they always resolve successfully without any network activity.
 */
export const pushApi = {
  async getVapidPublicKey(): Promise<string> {
    await fakeLatency();
    return 'demo-vapid-public-key';
  },

  async subscribe(payload: PushSubscribePayload): Promise<void> {
    await fakeLatency();
    void payload;
  },

  async unsubscribe(endpoint: string): Promise<void> {
    await fakeLatency();
    void endpoint;
  },
};
