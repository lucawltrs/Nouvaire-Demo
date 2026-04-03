import { create } from 'zustand';
import { getConfig } from '../config';

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
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const TOKEN_EXPIRY_DAYS = 3;

const isTokenValid = (): boolean => {
  const token = localStorage.getItem('auth_token');
  const expiryStr = localStorage.getItem('auth_token_expiry');
  
  if (!token || !expiryStr) return false;
  
  const expiry = new Date(expiryStr);
  return new Date() < expiry;
};

const saveToken = (token: string): void => {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + TOKEN_EXPIRY_DAYS);
  
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_token_expiry', expiry.toISOString());
};

const clearToken = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_token_expiry');
};

const saveTeamCookie = (team: Team): void => {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + TOKEN_EXPIRY_DAYS);
  document.cookie = `auth_team=${encodeURIComponent(JSON.stringify(team))}; expires=${expiry.toUTCString()}; path=/; SameSite=Strict`;
};

const getTeamCookie = (): Team | null => {
  const match = document.cookie.match(/(?:^|; )auth_team=([^;]*)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
};

const clearTeamCookie = (): void => {
  document.cookie = 'auth_team=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict';
};


export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  team: isTokenValid() ? getTeamCookie() : null,
  token: isTokenValid() ? localStorage.getItem('auth_token') : null,
  isAuthenticated: isTokenValid(),
  isCheckingAuth: false,

  checkAuth: async () => {
    const token = localStorage.getItem('auth_token');
    
    if (!token || !isTokenValid()) {
      clearToken();
      set({ user: null, token: null, isAuthenticated: false, isCheckingAuth: false });
      return;
    }

    set({ isCheckingAuth: true });

    try {
      const response = await fetch(`${getConfig().API_URL}/auth/check`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Auth check failed');
      }

      const data = await response.json();

      if (data.status === 'success' && data.data?.user) {
        const team = data.data.team ?? null;
        if (team) saveTeamCookie(team);
        set({ 
          user: data.data.user,
          team,
          token, 
          isAuthenticated: true,
          isCheckingAuth: false 
        });
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      clearToken();
      set({ user: null, token: null, isAuthenticated: false, isCheckingAuth: false });
    }
  },

  login: async (email: string, password: string) => {
    try {
      const response = await fetch(`${getConfig().API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();

      if (data.status === 'success' && data.data) {
        const { token, user, team } = data.data;
        
        saveToken(token);
        if (team) saveTeamCookie(team);
        
        set({ user, team: team ?? null, token, isAuthenticated: true });

        // Rolle des Nutzers nach dem Login ermitteln
        try {
          const checkResponse = await fetch(`${getConfig().API_URL}/auth/check`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (checkResponse.ok) {
            const checkData = await checkResponse.json();
            if (checkData.status === 'success' && checkData.data?.user) {
              const resolvedTeam = checkData.data.team ?? null;
              if (resolvedTeam) saveTeamCookie(resolvedTeam);
              set({
                user: checkData.data.user,
                team: resolvedTeam,
              });
            }
          }
        } catch (checkError) {
          console.warn('Role check after login failed:', checkError);
        }
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout: () => {
    clearToken();
    clearTeamCookie();
    set({ user: null, team: null, token: null, isAuthenticated: false });
  },
}));
