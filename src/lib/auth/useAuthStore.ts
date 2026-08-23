import { DEMO_MODE } from '../../demo/config';
import { useAuthStore as realUseAuthStore } from './useAuthStore.real';
import { useDemoAuthStore } from '../../demo/authStore.demo';

/**
 * DEMO_MODE switch: the demo store starts already authenticated as the demo
 * admin and never issues a single /auth/* call. Same public interface as the
 * real store, so every consumer (`ProtectedRoute`, `MainLayout`, pages, …)
 * works unmodified.
 */
export const useAuthStore: typeof realUseAuthStore = DEMO_MODE ? useDemoAuthStore : realUseAuthStore;
