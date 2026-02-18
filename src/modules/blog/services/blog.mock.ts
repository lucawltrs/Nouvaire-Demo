import { BlogPost, CreateBlogPostInput, UpdateBlogPostInput, BlogFilters, BlogSortOptions } from '../types';
import { BlogService } from './blog.service';
import { mockBlogPosts } from '../../../data/mockBlogData';

class MockBlogService implements BlogService {
  private posts: BlogPost[] = [];

  constructor() {
    this.reset();
  }

  async list(filters?: BlogFilters, sort?: BlogSortOptions): Promise<BlogPost[]> {
    await this.simulateDelay();

    let filtered = [...this.posts];

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(search) ||
          post.excerpt.toLowerCase().includes(search) ||
          post.content.toLowerCase().includes(search)
      );
    }

    if (filters?.status) {
      filtered = filtered.filter((post) => post.status === filters.status);
    }

    if (filters?.tag) {
      filtered = filtered.filter((post) => post.tags.includes(filters.tag));
    }

    if (sort) {
      filtered.sort((a, b) => {
        const aVal = a[sort.field];
        const bVal = b[sort.field];

        if (aVal instanceof Date && bVal instanceof Date) {
          return sort.direction === 'asc'
            ? aVal.getTime() - bVal.getTime()
            : bVal.getTime() - aVal.getTime();
        }

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sort.direction === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        return 0;
      });
    }

    return filtered;
  }

  async get(id: string): Promise<BlogPost | null> {
    await this.simulateDelay();
    return this.posts.find((post) => post.id === id) || null;
  }

  async create(input: CreateBlogPostInput): Promise<BlogPost> {
    await this.simulateDelay();

    const newPost: BlogPost = {
      ...input,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: input.status === 'published' ? new Date() : undefined,
    };

    this.posts.unshift(newPost);
    return newPost;
  }

  async update(input: UpdateBlogPostInput): Promise<BlogPost> {
    await this.simulateDelay();

    const index = this.posts.findIndex((post) => post.id === input.id);
    if (index === -1) {
      throw new Error('Post not found');
    }

    const currentPost = this.posts[index];
    const wasPublished = currentPost.status === 'published';
    const isNowPublished = input.status === 'published';

    const updatedPost: BlogPost = {
      ...currentPost,
      ...input,
      updatedAt: new Date(),
      publishedAt: !wasPublished && isNowPublished
        ? new Date()
        : currentPost.publishedAt,
    };

    this.posts[index] = updatedPost;
    return updatedPost;
  }

  async remove(id: string): Promise<void> {
    await this.simulateDelay();
    this.posts = this.posts.filter((post) => post.id !== id);
  }

  async reset(): Promise<void> {
    await this.simulateDelay();
    this.posts = JSON.parse(JSON.stringify(mockBlogPosts));
  }

  private simulateDelay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 200));
  }
}

export const mockBlogService = new MockBlogService();
