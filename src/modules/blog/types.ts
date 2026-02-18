export type BlogStatus = 'draft' | 'published';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string[];
  status: BlogStatus;
  featuredImage?: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface BlogFilters {
  search?: string;
  status?: BlogStatus;
  tag?: string;
}

export interface BlogSortOptions {
  field: 'createdAt' | 'updatedAt' | 'title';
  direction: 'asc' | 'desc';
}

export interface CreateBlogPostInput {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string[];
  status: BlogStatus;
  featuredImage?: string;
}

export interface UpdateBlogPostInput extends Partial<CreateBlogPostInput> {
  id: string;
}
