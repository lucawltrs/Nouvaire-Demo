import { BlogPost, CreateBlogPostInput, UpdateBlogPostInput, BlogFilters, BlogSortOptions } from '../types';
import { BlogService } from './blog.service';

class ApiBlogService implements BlogService {
  async list(_filters?: BlogFilters, _sort?: BlogSortOptions): Promise<BlogPost[]> {
    throw new Error('API not implemented yet');
  }

  async get(_id: string): Promise<BlogPost | null> {
    throw new Error('API not implemented yet');
  }

  async create(_input: CreateBlogPostInput): Promise<BlogPost> {
    throw new Error('API not implemented yet');
  }

  async update(_input: UpdateBlogPostInput): Promise<BlogPost> {
    throw new Error('API not implemented yet');
  }

  async remove(_id: string): Promise<void> {
    throw new Error('API not implemented yet');
  }

  async reset(): Promise<void> {
    throw new Error('API not implemented yet');
  }
}

export const apiBlogService = new ApiBlogService();
