import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, BookOpen, Sparkles, Image as ImageIcon, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function CreateBlog() {
  const { user, showToast } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [loading, setLoading] = useState(false);

  // Computed slug preview
  const slugPreview = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast('Title and Content body are required fields.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/posts', {
        title,
        content,
        featuredImage: featuredImage.trim() || undefined,
        status,
      });
      showToast(status === 'published' ? 'Story published live!' : 'Draft preserved successfully.', 'success');
      navigate(`/posts/${res.data.slug}`);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create blog post.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6 bg-light-bg dark:bg-black text-[#444D60] dark:text-[#BFBFBF] transition-colors duration-300">
      <Link to="/blogs" className="inline-flex items-center gap-1.5 text-xs text-charcha-purple dark:text-charcha-lavender hover:underline font-bold uppercase font-mono tracking-wider">
        <ArrowLeft className="h-4 w-4" />
        Back to Blogs
      </Link>

      <div className="border-b border-black/5 dark:border-[#4B4B4B] pb-4">
        <h1 className="font-serif text-3xl font-black text-[#444D60] dark:text-white tracking-tight flex items-center gap-2">
          Create Charcha Blog
          <span className="hidden sm:inline p-1 rounded-lg bg-[#9D6DD6]/10 text-xs font-mono font-bold text-[#9D6DD6] uppercase">
            Story Draft
          </span>
        </h1>
        <p className="text-xs text-[#444D60]/80 dark:text-[#7D7D7D] font-mono mt-1">
          Draft a technical or design article. Ensure slugs match standard keywords.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* Inputs section */}
          <div className="md:col-span-2 space-y-5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#444D60]/80 dark:text-dark-text-muted mb-1 font-semibold">
                Blog Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="The Future of Digital Communities..."
                className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-[#4B4B4B] bg-white/60 dark:bg-black/40 text-[#444D60] dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#9D6DD6] text-lg font-serif font-semibold"
              />
              {title && (
                <div className="mt-1 flex items-center gap-1 text-[11px] text-zinc-400 font-mono italic">
                  <span>SEO Slug preview:</span>
                  <span className="text-[#9D6DD6] font-semibold">/posts/{slugPreview}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#444D60]/80 dark:text-dark-text-muted mb-1 font-semibold">
                Core Story Content (supports plain markdown spacings)
              </label>
              <textarea
                required
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your story here... Detail your ideas, reference standard structures, and raise interesting conversations."
                className="w-full p-4 rounded-xl border border-black/10 dark:border-[#4B4B4B] bg-white/60 dark:bg-black/40 text-[#444D60] dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#9D6DD6] leading-relaxed text-sm whitespace-pre-wrap"
              />
            </div>
          </div>

          {/* Sidebar configuration metadata controls */}
          <div className="p-6 rounded-3xl border border-black/5 dark:border-[#4B4B4B] bg-[#A0D2EB]/30 dark:bg-zinc-900/40 space-y-6">
            <h3 className="font-serif text-base font-bold text-[#444D60] dark:text-white flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-charcha-purple" />
              Settings
            </h3>

            {/* Status Select */}
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#444D60]/80 dark:text-dark-text-muted font-semibold">
                Publication Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('published')}
                  className={`py-2 rounded-xl text-xs font-bold transition border ${
                    status === 'published'
                      ? 'bg-[#9D6DD6] text-white border-[#9D6DD6]'
                      : 'border-black/10 dark:border-[#4B4B4B] bg-white/40 hover:bg-white/60 text-[#444D60] dark:text-white'
                  }`}
                >
                  Published
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('draft')}
                  className={`py-2 rounded-xl text-xs font-bold transition border ${
                    status === 'draft'
                      ? 'bg-zinc-600 border-zinc-600 text-white'
                      : 'border-black/10 dark:border-[#4B4B4B] bg-white/40 hover:bg-white/60 text-[#444D60] dark:text-white'
                  }`}
                >
                  Draft
                </button>
              </div>
              <p className="text-[10px] text-zinc-500 leading-tight">
                {status === 'published' ? 'This post will be immediately visible on public listings.' : 'Preserve draft. Only you can access or update.'}
              </p>
            </div>

            {/* Image Upload Input */}
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#444D60]/80 dark:text-dark-text-muted font-semibold">
                Featured Cover Image (URL)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                  <ImageIcon className="h-4 w-4" />
                </span>
                <input
                  type="url"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  placeholder="https://unsplash.com/photo-..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-black/10 dark:border-[#4B4B4B] bg-white/60 dark:bg-black/40 text-sm"
                />
              </div>
              <p className="text-[10px] text-zinc-500">
                Provide a high-quality link or leave empty to trigger dynamic stock fallbacks.
              </p>
              {featuredImage && (
                <div className="h-28 w-full rounded-xl overflow-hidden border border-black/10 dark:border-[#4B4B4B] mt-2">
                  <img
                    src={featuredImage}
                    alt="Cover preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=800&auto=format&fit=crop';
                    }}
                  />
                </div>
              )}
            </div>

            <hr className="border-black/5 dark:border-[#4B4B4B]" />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-white bg-charcha-purple hover:bg-[#865bc1] font-bold text-xs transition flex justify-center items-center gap-1.5 shadow-md shadow-charcha-purple/10 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>{status === 'published' ? 'Publish Story' : 'Preserve Draft'}</span>
                </>
              )}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}
