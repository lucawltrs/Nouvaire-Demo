import { create } from 'zustand';
import { BlogPost, BlogFilters, BlogSortOptions } from '../types';
import { blogService } from '../services';

interface BlogStore {
  posts: BlogPost[];
  loading: boolean;
  error: string | null;
  filters: BlogFilters;
  sort: BlogSortOptions;

  loadPosts: () => Promise<void>;
  getPost: (id: string) => Promise<BlogPost | null>;
  createPost: (input: any) => Promise<BlogPost>;
  updatePost: (input: any) => Promise<BlogPost>;
  deletePost: (id: string) => Promise<void>;
  resetPosts: () => Promise<void>;

  setFilters: (filters: BlogFilters) => void;
  setSort: (sort: BlogSortOptions) => void;
  clearError: () => void;
}

export const useBlogStore = create<BlogStore>((set, get) => ({
  posts: [],
  loading: false,
  error: null,
  filters: {},
  sort: { field: 'createdAt', direction: 'desc' },

  loadPosts: async () => {
    set({ loading: true, error: null });
    try {
      const { filters, sort } = get();
      const posts = await blogService.list(filters, sort);
      set({ posts, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  getPost: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const post = await blogService.get(id);
      set({ loading: false });
      return post;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      return null;
    }
  },

  createPost: async (input) => {
    set({ loading: true, error: null });
    try {
      const post = await blogService.create(input);
      set({ loading: false });
      await get().loadPosts();
      return post;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updatePost: async (input) => {
    set({ loading: true, error: null });
    try {
      const post = await blogService.update(input);
      set({ loading: false });
      await get().loadPosts();
      return post;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  deletePost: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await blogService.remove(id);
      set({ loading: false });
      await get().loadPosts();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  resetPosts: async () => {
    set({ loading: true, error: null });
    try {
      await blogService.reset();
      await get().loadPosts();
      set({ loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  setFilters: (filters) => {
    set({ filters });
    get().loadPosts();
  },

  setSort: (sort) => {
    set({ sort });
    get().loadPosts();
  },

  clearError: () => set({ error: null }),
}));
