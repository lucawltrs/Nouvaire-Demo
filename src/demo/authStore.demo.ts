import { create } from 'zustand';
import { DEMO_USER, DEMO_TEAM } from './seed/auth';
import { fakeLatency } from './utils';

interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Team {
  team_id: number;
  team_name: string;
  team_slug: string;
  role?: string;
}

interface AuthStore {
  user: User | null;
  team: Team | null;
  token: string | null;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

/**
 * DEMO_MODE replacement for the real `useAuthStore`. Starts already
 * authenticated as the demo admin — no /auth/login or /auth/check call ever
 * happens. `logout()` still works (drops back to the login screen) and
 * `login()` always succeeds instantly, regardless of what was typed, so the
 * login screen stays demonstrable without a real backend.
 */
export const useDemoAuthStore = create<AuthStore>((set) => ({
  user: DEMO_USER,
  team: DEMO_TEAM,
  token: 'demo-token',
  isAuthenticated: true,
  isCheckingAuth: false,

  checkAuth: async () => {
    // Already authenticated synchronously at store creation — nothing to do.
  },

  login: async () => {
    await fakeLatency();
    set({ user: DEMO_USER, team: DEMO_TEAM, token: 'demo-token', isAuthenticated: true });
  },

  loginWithToken: async () => {
    await fakeLatency();
    set({ user: DEMO_USER, team: DEMO_TEAM, token: 'demo-token', isAuthenticated: true });
  },

  logout: () => {
    set({ user: null, team: null, token: null, isAuthenticated: false });
  },
}));
