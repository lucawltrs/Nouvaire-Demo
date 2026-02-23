import { create } from 'zustand';
import { producersApi } from '../services/producers.api';
import type { Producer, CreateProducerInput } from '../types';

interface ProducersStore {
  producers: Producer[];
  selectedProducer: Producer | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchProducers: () => Promise<void>;
  fetchProducerById: (id: number) => Promise<void>;
  createProducer: (producer: CreateProducerInput) => Promise<void>;
  updateProducer: (id: number, producer: Partial<CreateProducerInput>) => Promise<void>;
  deleteProducer: (id: number) => Promise<void>;
  setSelectedProducer: (producer: Producer | null) => void;
  clearError: () => void;
}

export const useProducersStore = create<ProducersStore>((set) => ({
  producers: [],
  selectedProducer: null,
  isLoading: false,
  error: null,

  fetchProducers: async () => {
    set({ isLoading: true, error: null });
    try {
      const producers = await producersApi.getAll();
      set({ producers, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch producers',
        isLoading: false 
      });
    }
  },

  fetchProducerById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const producer = await producersApi.getById(id);
      set({ selectedProducer: producer, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch producer',
        isLoading: false 
      });
    }
  },

  createProducer: async (producer: CreateProducerInput) => {
    set({ isLoading: true, error: null });
    try {
      const newProducer = await producersApi.create(producer);
      set((state) => ({ 
        producers: [...state.producers, newProducer],
        isLoading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create producer',
        isLoading: false 
      });
      throw error;
    }
  },

  updateProducer: async (id: number, producer: Partial<CreateProducerInput>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProducer = await producersApi.update(id, producer);
      set((state) => ({
        producers: state.producers.map((p) => (p.id === id ? updatedProducer : p)),
        selectedProducer: state.selectedProducer?.id === id ? updatedProducer : state.selectedProducer,
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update producer',
        isLoading: false 
      });
      throw error;
    }
  },

  deleteProducer: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await producersApi.delete(id);
      set((state) => ({
        producers: state.producers.filter((p) => p.id !== id),
        selectedProducer: state.selectedProducer?.id === id ? null : state.selectedProducer,
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete producer',
        isLoading: false 
      });
      throw error;
    }
  },

  setSelectedProducer: (producer: Producer | null) => {
    set({ selectedProducer: producer });
  },

  clearError: () => {
    set({ error: null });
  },
}));
