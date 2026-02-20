import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBlogStore } from '../../modules/blog/store/useBlogStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FileText, FilePlus, CheckCircle, Clock, TrendingUp } from 'lucide-react';

export function DashboardPage() {
  const { posts, loadPosts } = useBlogStore();

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const totalPosts = posts.length;
  const publishedPosts = posts.filter((p) => p.status === 'published').length;
  const draftPosts = posts.filter((p) => p.status === 'draft').length;

  const recentPosts = [...posts].sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  ).slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#06b6d4] via-[#22d3ee] to-[#3b82f6]">
            Dashboard
          </h1>
          <p className="mt-2 text-gray-400">Welcome to Wolters Solutions Admin Panel</p>
        </div>
        <Link to="/blog/new">
          <Button>
            <FilePlus size={18} className="mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card glow className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Posts</p>
              <p className="text-3xl font-bold text-gray-100 mt-2">{totalPosts}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-cyan-400">
            <TrendingUp size={16} className="mr-1" />
            <span>All content</span>
          </div>
        </Card>

        <Card glow className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Published</p>
              <p className="text-3xl font-bold text-gray-100 mt-2">{publishedPosts}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 text-sm text-green-400">Live content</div>
        </Card>

        <Card glow className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Drafts</p>
              <p className="text-3xl font-bold text-gray-100 mt-2">{draftPosts}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 text-sm text-yellow-400">In progress</div>
        </Card>

        <Card glow className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">All Tags</p>
              <p className="text-3xl font-bold text-gray-100 mt-2">
                {new Set(posts.flatMap(p => p.tags)).size}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 text-sm text-purple-400">Categories</div>
        </Card>
      </div>

      <Card glow className="p-6">
        <h2 className="text-xl font-semibold text-gray-100 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {recentPosts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No posts yet</p>
          ) : (
            recentPosts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.id}`}
                className="block p-4 rounded-lg bg-gray-900 hover:bg-gray-850 transition-colors border border-gray-700 hover:border-cyan-500/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-gray-100 font-medium">{post.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Updated {new Date(post.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      post.status === 'published'
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-yellow-900/30 text-yellow-400'
                    }`}
                  >
                    {post.status}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
        <div className="mt-4 text-center">
          <Link to="/blog">
            <Button variant="ghost">View All Posts</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
