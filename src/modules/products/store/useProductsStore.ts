import { create } from 'zustand';
import { productsApi } from '../services/products.api';
import type { Product, CreateProductInput } from '../types';

interface ProductsStore {
  products: Product[];
  selectedProduct: Product | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchProducts: () => Promise<void>;
  fetchProductById: (id: number) => Promise<void>;
  createProduct: (product: CreateProductInput) => Promise<void>;
  updateProduct: (id: number, product: Partial<CreateProductInput>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  setSelectedProduct: (product: Product | null) => void;
  clearError: () => void;
}

export const useProductsStore = create<ProductsStore>((set) => ({
  products: [],
  selectedProduct: null,
  isLoading: false,
  error: null,

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const products = await productsApi.getAll();
      set({ products, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch products',
        isLoading: false 
      });
    }
  },

  fetchProductById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const product = await productsApi.getById(id);
      set({ selectedProduct: product, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch product',
        isLoading: false 
      });
    }
  },

  createProduct: async (product: CreateProductInput) => {
    set({ isLoading: true, error: null });
    try {
      const newProduct = await productsApi.create(product);
      set((state) => ({ 
        products: [...state.products, newProduct],
        isLoading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create product',
        isLoading: false 
      });
      throw error;
    }
  },

  updateProduct: async (id: number, product: Partial<CreateProductInput>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProduct = await productsApi.update(id, product);
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? updatedProduct : p)),
        selectedProduct: state.selectedProduct?.id === id ? updatedProduct : state.selectedProduct,
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update product',
        isLoading: false 
      });
      throw error;
    }
  },

  deleteProduct: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await productsApi.delete(id);
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
        selectedProduct: state.selectedProduct?.id === id ? null : state.selectedProduct,
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete product',
        isLoading: false 
      });
      throw error;
    }
  },

  setSelectedProduct: (product: Product | null) => {
    set({ selectedProduct: product });
  },

  clearError: () => {
    set({ error: null });
  },
}));
