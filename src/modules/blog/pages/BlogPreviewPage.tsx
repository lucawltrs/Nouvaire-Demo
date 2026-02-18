import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBlogStore } from '../store/useBlogStore';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { ArrowLeft, Edit } from 'lucide-react';
import { BlogPost } from '../types';
import ReactMarkdown from 'react-markdown';

export function BlogPreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPost, loading } = useBlogStore();
  const [post, setPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    if (!id) return;
    const data = await getPost(id);
    setPost(data);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Post not found</p>
        <Button onClick={() => navigate('/blog')} className="mt-4">
          Back to Blog
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/blog')}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#06b6d4] via-[#22d3ee] to-[#3b82f6]">
            Preview
          </h1>
        </div>
        <Button onClick={() => navigate(`/blog/${id}`)}>
          <Edit size={18} className="mr-2" />
          Edit Post
        </Button>
      </div>

      <Card glow className="overflow-hidden">
        {post.featuredImage && (
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-96 object-cover"
          />
        )}

        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <Badge variant={post.status === 'published' ? 'success' : 'warning'}>
              {post.status}
            </Badge>
            {post.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>

          <h1 className="text-4xl font-bold text-gray-100 mb-4">{post.title}</h1>

          <div className="flex items-center gap-6 text-sm text-gray-400 mb-8 pb-8 border-b border-gray-700">
            <span>Created {new Date(post.createdAt).toLocaleDateString()}</span>
            <span>Updated {new Date(post.updatedAt).toLocaleDateString()}</span>
            {post.publishedAt && (
              <span>Published {new Date(post.publishedAt).toLocaleDateString()}</span>
            )}
          </div>

          <div className="text-lg text-gray-300 mb-8 leading-relaxed">
            {post.excerpt}
          </div>

          <div className="prose prose-invert prose-cyan prose-lg max-w-none">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
        </div>
      </Card>
    </div>
  );
}
