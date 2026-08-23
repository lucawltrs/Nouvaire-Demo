/** Demo user/team used to auto-authenticate in DEMO_MODE — see `useAuthStore`. */

export const DEMO_USER = {
  id: 1,
  name: 'Demo Admin',
  email: 'demo@nouvaire.io',
  email_verified_at: '2025-01-01T00:00:00.000Z',
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
};

export const DEMO_TEAM = {
  team_id: 1,
  team_name: 'Nouvaire Demo Team',
  team_slug: 'nouvaire-demo',
  role: 'admin' as const,
};
