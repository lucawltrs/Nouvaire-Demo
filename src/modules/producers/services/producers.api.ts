import type { Producer, CreateProducerInput, ProducersApiResponse, ProducerApiResponse } from '../types';

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

  async getById(id: number): Promise<Producer> {
    try {
      const response = await authFetch(`${API_URL}/producers/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch producer');
      }

      const data: ProducerApiResponse = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching producer:', error);
      throw error;
    }
  },

  async create(producer: CreateProducerInput): Promise<Producer> {
    try {
      const response = await authFetch(`${API_URL}/producers`, {
        method: 'POST',
        body: JSON.stringify(producer),
      });

      if (!response.ok) {
        throw new Error('Failed to create producer');
      }

      const data: ProducerApiResponse = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating producer:', error);
      throw error;
    }
  },

  async update(id: number, producer: Partial<CreateProducerInput>): Promise<Producer> {
    try {
      const response = await authFetch(`${API_URL}/producers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(producer),
      });

      if (!response.ok) {
        throw new Error('Failed to update producer');
      }

      const data: ProducerApiResponse = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating producer:', error);
      throw error;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      const response = await authFetch(`${API_URL}/producers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete producer');
      }
    } catch (error) {
      console.error('Error deleting producer:', error);
      throw error;
    }
  },
};
