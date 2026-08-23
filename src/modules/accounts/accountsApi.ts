import { DEMO_MODE } from '../../demo/config';
import { accountsApi as realAccountsApi, invalidateAccountsCache as realInvalidateAccountsCache } from './accountsApi.real';
import { accountsApi as demoAccountsApi, invalidateAccountsCache as demoInvalidateAccountsCache } from '../../demo/api/accountsApi.mock';

/**
 * DEMO_MODE switch: in the demo build this is the in-memory mock, with the
 * exact same method contract as the real backend-backed implementation.
 * Callers never need to know which one is active.
 */
export const accountsApi: typeof realAccountsApi = DEMO_MODE ? demoAccountsApi : realAccountsApi;

export const invalidateAccountsCache: typeof realInvalidateAccountsCache = DEMO_MODE
  ? demoInvalidateAccountsCache
  : realInvalidateAccountsCache;
