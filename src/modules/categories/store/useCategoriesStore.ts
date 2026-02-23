import { create } from 'zustand';
import { categoriesApi } from '../services/categories.api';
import type { Category, CreateCategoryInput } from '../types';

interface CategoriesState {
  categories: Category[];
  selectedCategory: Category | null;
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  fetchCategoryById: (id: number) => Promise<void>;
  createCategory: (categoryData: CreateCategoryInput) => Promise<void>;
  updateCategory: (id: number, categoryData: CreateCategoryInput) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  clearError: () => void;
}

export const useCategoriesStore = create<CategoriesState>((set) => ({
  categories: [],
  selectedCategory: null,
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const categories = await categoriesApi.getAll();
      set({ categories, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch categories', 
        isLoading: false 
      });
    }
  },

  fetchCategoryById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const category = await categoriesApi.getById(id);
      set({ selectedCategory: category, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch category', 
        isLoading: false 
      });
    }
  },

  createCategory: async (categoryData: CreateCategoryInput) => {
    set({ isLoading: true, error: null });
    try {
      await categoriesApi.create(categoryData);
      const categories = await categoriesApi.getAll();
      set({ categories, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create category', 
        isLoading: false 
      });
      throw error;
    }
  },

  updateCategory: async (id: number, categoryData: CreateCategoryInput) => {
    set({ isLoading: true, error: null });
    try {
      const updatedCategory = await categoriesApi.update(id, categoryData);
      set((state) => ({
        categories: state.categories.map((cat) => 
          cat.id === id ? updatedCategory : cat
        ),
        selectedCategory: state.selectedCategory?.id === id ? updatedCategory : state.selectedCategory,
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update category', 
        isLoading: false 
      });
      throw error;
    }
  },

  deleteCategory: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await categoriesApi.delete(id);
      set((state) => ({
        categories: state.categories.filter((cat) => cat.id !== id),
        selectedCategory: state.selectedCategory?.id === id ? null : state.selectedCategory,
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete category', 
        isLoading: false 
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
