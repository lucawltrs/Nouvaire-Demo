import { useEffect, useState, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBlogStore } from '../store/useBlogStore';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { Save, ArrowLeft, Eye, X } from 'lucide-react';
import { BlogStatus } from '../types';
import ReactMarkdown from 'react-markdown';

export function BlogEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPost, createPost, updatePost, loading } = useBlogStore();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState<BlogStatus>('draft');
  const [featuredImage, setFeaturedImage] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (id) {
      loadPost();
    }
  }, [id]);

  const loadPost = async () => {
    if (!id) return;
    const post = await getPost(id);
    if (post) {
      setTitle(post.title);
      setSlug(post.slug);
      setExcerpt(post.excerpt);
      setContent(post.content);
      setTags(post.tags);
      setStatus(post.status);
      setFeaturedImage(post.featuredImage || '');
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!id && !slug) {
      setSlug(generateSlug(value));
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const data = {
      title,
      slug,
      excerpt,
      content,
      tags,
      status,
      featuredImage: featuredImage || undefined,
    };

    try {
      if (id) {
        await updatePost({ ...data, id });
      } else {
        await createPost(data);
      }
      navigate('/blog');
    } catch (error) {
      console.error('Failed to save post:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/blog')}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#06b6d4] via-[#22d3ee] to-[#3b82f6]">
              {id ? 'Edit Post' : 'New Post'}
            </h1>
            <p className="mt-2 text-gray-400">
              {id ? 'Update your blog post' : 'Create a new blog post'}
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={() => setShowPreview(!showPreview)}
        >
          <Eye size={18} className="mr-2" />
          {showPreview ? 'Hide' : 'Show'} Preview
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card glow className="p-6">
              <div className="space-y-4">
                <Input
                  label="Title"
                  placeholder="Enter post title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                />

                <Input
                  label="Slug"
                  placeholder="post-url-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />

                <Textarea
                  label="Excerpt"
                  placeholder="Short description of the post"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={3}
                  required
                />

                <Textarea
                  label="Content (Markdown)"
                  placeholder="Write your post content in Markdown..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={16}
                  required
                />
              </div>
            </Card>

            {showPreview && (
              <Card glow className="p-6">
                <h3 className="text-xl font-semibold text-gray-100 mb-4">
                  Markdown Preview
                </h3>
                <div className="prose prose-invert prose-cyan max-w-none">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card glow className="p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Settings</h3>
              <div className="space-y-4">
                <Select
                  label="Status"
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'published', label: 'Published' },
                  ]}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BlogStatus)}
                />

                <Input
                  label="Featured Image URL"
                  placeholder="https://example.com/image.jpg"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                />

                {featuredImage && (
                  <div className="rounded-lg overflow-hidden border border-gray-700">
                    <img
                      src={featuredImage}
                      alt="Featured"
                      className="w-full h-32 object-cover"
                    />
                  </div>
                )}
              </div>
            </Card>

            <Card glow className="p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Tags</h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddTag}
                  >
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag}>
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 hover:text-red-400"
                      >
                        <X size={14} />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>

            <Button type="submit" className="w-full" isLoading={loading}>
              <Save size={18} className="mr-2" />
              {id ? 'Update Post' : 'Create Post'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
