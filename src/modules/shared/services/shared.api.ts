import type { Producer, ProducersApiResponse, Category, CategoriesApiResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL;

const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  return fetch(url, { ...options, headers });
};

export const producersApi = {
  async getAll(): Promise<Producer[]> {
    try {
      const response = await authFetch(`${API_URL}/producers`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch producers');
      }

      const data: ProducersApiResponse = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching producers:', error);
      throw error;
    }
  },
};

export const categoriesApi = {
  async getAll(): Promise<Category[]> {
    try {
      const response = await authFetch(`${API_URL}/categories`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data: CategoriesApiResponse = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },
};
