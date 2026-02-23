import type { Category, CreateCategoryInput, CategoriesApiResponse, CategoryApiResponse } from '../types';
import { getConfig } from '../../../lib/config';

const getApiUrl = () => getConfig().API_URL;

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

export const categoriesApi = {
  async getAll(): Promise<Category[]> {
    try {
      const response = await authFetch(`${getApiUrl()}/categories`);
      
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

  async getById(id: number): Promise<Category> {
    try {
      const response = await authFetch(`${getApiUrl()}/categories/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch category');
      }

      const data: CategoryApiResponse = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  },

  async create(categoryData: CreateCategoryInput): Promise<Category> {
    try {
      const response = await authFetch(`${getApiUrl()}/categories`, {
        method: 'POST',
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        throw new Error('Failed to create category');
      }

      const data: CategoryApiResponse = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  async update(id: number, categoryData: CreateCategoryInput): Promise<Category> {
    try {
      const response = await authFetch(`${getApiUrl()}/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        throw new Error('Failed to update category');
      }

      const data: CategoryApiResponse = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      const response = await authFetch(`${getApiUrl()}/categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },
};
