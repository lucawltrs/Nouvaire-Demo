import { BlogPost, CreateBlogPostInput, UpdateBlogPostInput, BlogFilters, BlogSortOptions } from '../types';

export interface BlogService {
  list(filters?: BlogFilters, sort?: BlogSortOptions): Promise<BlogPost[]>;
  get(id: string): Promise<BlogPost | null>;
  create(input: CreateBlogPostInput): Promise<BlogPost>;
  update(input: UpdateBlogPostInput): Promise<BlogPost>;
  remove(id: string): Promise<void>;
  reset(): Promise<void>;
}
