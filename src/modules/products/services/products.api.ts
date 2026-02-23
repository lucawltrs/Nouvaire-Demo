import type { Product, CreateProductInput, ProductsApiResponse, ProductApiResponse } from '../types';
import { getConfig } from '../../../lib/config';

const getApiUrl = () => getConfig().API_URL;

// Helper Funktion um Token zu bekommen
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Helper Funktion für authentifizierte Requests
const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  return fetch(url, { ...options, headers });
};

export const productsApi = {
  // GET /products - Liste aller Produkte
  async getAll(): Promise<Product[]> {
    try {
      const response = await authFetch(`${getApiUrl()}/products`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data: ProductsApiResponse = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // GET /products/:id - Einzelnes Produkt
  async getById(id: number): Promise<Product> {
    try {
      const response = await authFetch(`${getApiUrl()}/products/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }

      const data: ProductApiResponse = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  // POST /products - Neues Produkt erstellen
  async create(product: CreateProductInput): Promise<Product> {
    try {
      const response = await authFetch(`${getApiUrl()}/products`, {
        method: 'POST',
        body: JSON.stringify(product),
      });

      if (!response.ok) {
        throw new Error('Failed to create product');
      }

      const data: ProductApiResponse = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  // PUT /products/:id - Produkt aktualisieren
  async update(id: number, product: Partial<CreateProductInput>): Promise<Product> {
    try {
      const response = await authFetch(`${getApiUrl()}/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(product),
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      const data: ProductApiResponse = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  // DELETE /products/:id - Produkt löschen
  async delete(id: number): Promise<void> {
    try {
      const response = await authFetch(`${getApiUrl()}/products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },
};
