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

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
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


export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: isTokenValid() ? localStorage.getItem('auth_token') : null,
  isAuthenticated: isTokenValid(),

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
        const { token, user } = data.data;
        
        saveToken(token);
        
        set({ user, token, isAuthenticated: true });
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
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
