import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBlogStore } from '../store/useBlogStore';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { FilePlus, Search, Trash2, Edit, Eye, RefreshCw } from 'lucide-react';
import { BlogPost, BlogStatus } from '../types';

export function BlogListPage() {
  const { posts, loading, filters, sort, loadPosts, deletePost, resetPosts, setFilters, setSort } = useBlogStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BlogStatus | 'all'>('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFilters({ ...filters, search: value || undefined });
  };

  const handleStatusFilter = (value: string) => {
    const status = value as BlogStatus | 'all';
    setStatusFilter(status);
    setFilters({ ...filters, status: status === 'all' ? undefined : status });
  };

  const handleSort = (field: 'createdAt' | 'updatedAt' | 'title', direction: 'asc' | 'desc') => {
    setSort({ field, direction });
  };

  const confirmDelete = (post: BlogPost) => {
    setPostToDelete(post);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (postToDelete) {
      await deletePost(postToDelete.id);
      setDeleteModalOpen(false);
      setPostToDelete(null);
    }
  };

  const handleReset = async () => {
    await resetPosts();
    setSearchTerm('');
    setStatusFilter('all');
  };

  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#06b6d4] via-[#22d3ee] to-[#3b82f6]">
            Blog Posts
          </h1>
          <p className="mt-2 text-gray-400">Manage your blog content</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleReset}>
            <RefreshCw size={18} className="mr-2" />
            Reset to Mock
          </Button>
          <Link to="/blog/new">
            <Button>
              <FilePlus size={18} className="mr-2" />
              New Post
            </Button>
          </Link>
        </div>
      </div>

      <Card glow className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <Input
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'published', label: 'Published' },
              { value: 'draft', label: 'Draft' },
            ]}
            value={statusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
          />

          <Select
            options={[
              { value: 'createdAt-desc', label: 'Newest First' },
              { value: 'createdAt-asc', label: 'Oldest First' },
              { value: 'updatedAt-desc', label: 'Recently Updated' },
              { value: 'title-asc', label: 'Title A-Z' },
              { value: 'title-desc', label: 'Title Z-A' },
            ]}
            value={`${sort.field}-${sort.direction}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-') as [
                'createdAt' | 'updatedAt' | 'title',
                'asc' | 'desc'
              ];
              handleSort(field, direction);
            }}
          />
        </div>

        {allTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-400">Tags:</span>
            {allTags.map((tag) => (
              <Badge key={tag} size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      {loading ? (
        <Card glow className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          <p className="mt-4 text-gray-400">Loading posts...</p>
        </Card>
      ) : posts.length === 0 ? (
        <Card glow className="p-12 text-center">
          <p className="text-gray-400">No posts found</p>
          <Link to="/blog/new">
            <Button className="mt-4">Create Your First Post</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {posts.map((post) => (
            <Card key={post.id} hover glow className="p-6">
              {post.featuredImage && (
                <img
                  src={post.featuredImage}
                  alt={post.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}

              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-semibold text-gray-100">{post.title}</h3>
                <Badge variant={post.status === 'published' ? 'success' : 'warning'}>
                  {post.status}
                </Badge>
              </div>

              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{post.excerpt}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                  <Badge key={tag} size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>Created {new Date(post.createdAt).toLocaleDateString()}</span>
                <span>Updated {new Date(post.updatedAt).toLocaleDateString()}</span>
              </div>

              <div className="flex gap-2">
                <Link to={`/blog/${post.id}`} className="flex-1">
                  <Button variant="secondary" className="w-full">
                    <Edit size={16} className="mr-2" />
                    Edit
                  </Button>
                </Link>
                <Link to={`/blog/${post.id}/preview`}>
                  <Button variant="ghost">
                    <Eye size={16} />
                  </Button>
                </Link>
                <Button variant="danger" onClick={() => confirmDelete(post)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Post"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Are you sure you want to delete "{postToDelete?.title}"? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
