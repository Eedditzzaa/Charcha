import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Sparkles, Image as ImageIcon, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function EditBlog() {
  const { id } = useParams<{ id: string }>();
  const { user, showToast } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadPost = async () => {
      try {
        const res = await axios.get(`/api/posts`);
        const item = res.data.find((p: any) => p._id === id);
        if (!item) {
          showToast('Blog post not found.', 'error');
          navigate('/');
          return;
        }

        // Owner/Admin Validation
        if (item.authorId !== user?._id && user?.role !== 'admin') {
          showToast('Access denied. You do not own this blog.', 'error');
          navigate('/');
          return;
        }

        setTitle(item.title);
        setContent(item.content);
        setFeaturedImage(item.featuredImage);
        setStatus(item.status);
      } catch (e) {
        showToast('Error occurred while fetching item context.', 'error');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadPost();
    } else {
      showToast('Authentication required.', 'info');
      navigate('/login');
    }
  }, [id, user]);

  const onUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast('Title and content are required.', 'error');
      return;
    }

    setSaving(true);
    try {
      await axios.put(`/api/posts/${id}`, {
        title,
        content,
        featuredImage,
        status,
      });
      showToast('Story updated successfully!', 'success');
      navigate('/my-posts');
    } catch (err: any) {
      showToast('Failed to save story changes.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-charcha-purple" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6 bg-light-bg dark:bg-black text-[#444D60] dark:text-[#BFBFBF] transition-colors duration-300">
      <Link to="/my-posts" className="inline-flex items-center gap-1.5 text-xs text-charcha-purple dark:text-charcha-lavender hover:underline font-bold uppercase font-mono tracking-wider">
        <ArrowLeft className="h-4 w-4" />
        Back to Written Posts
      </Link>

      <div className="border-b border-black/5 dark:border-[#4B4B4B] pb-4">
        <h1 className="font-serif text-3xl font-black text-[#444D60] dark:text-white tracking-tight">
          Modify Charcha Blog
        </h1>
        <p className="text-xs text-[#444D60]/80 dark:text-[#7D7D7D] font-mono mt-1">
          Edit draft layouts, change featured covers, or update public status indicators.
        </p>
      </div>

      <form onSubmit={onUpdateSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* Form field inputs column */}
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
                placeholder="Story Title"
                className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-[#4B4B4B] bg-white/60 dark:bg-black/40 text-[#444D60] dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#9D6DD6] text-lg font-serif font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#444D60]/80 dark:text-dark-text-muted mb-1 font-semibold">
                Core Content Story
              </label>
              <textarea
                required
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write story content here..."
                className="w-full p-4 rounded-xl border border-black/10 dark:border-[#4B4B4B] bg-white/60 dark:bg-black/40 text-[#444D60] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9D6DD6] leading-relaxed text-sm whitespace-pre-wrap"
              />
            </div>
          </div>

          {/* Settings Sidebar column */}
          <div className="p-6 rounded-3xl border border-black/5 dark:border-[#4B4B4B] bg-[#A0D2EB]/30 dark:bg-zinc-900/40 space-y-6">
            <h3 className="font-serif text-base font-bold text-[#444D60] dark:text-white flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-charcha-purple" />
              Settings
            </h3>

            {/* Status Selector */}
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
                {status === 'published' ? 'Story will be immediately viewable on lists.' : 'Only the author can see or edit.'}
              </p>
            </div>

            {/* Image Link Input */}
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#444D60]/80 dark:text-dark-text-muted font-semibold">
                Featured Cover (URL)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                  <ImageIcon className="h-4 w-4" />
                </span>
                <input
                  type="url"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  placeholder="Cover image url..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-black/10 dark:border-[#4B4B4B] bg-white/60 dark:bg-black/40 text-sm"
                />
              </div>
              {featuredImage && (
                <div className="h-28 w-full rounded-xl overflow-hidden border border-black/10 dark:border-[#4B4B4B] mt-2">
                  <img src={featuredImage} alt="Preview" className="h-full w-full object-cover" />
                </div>
              )}
            </div>

            <hr className="border-black/5 dark:border-[#4B4B4B]" />

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 px-4 rounded-xl text-white bg-charcha-purple hover:bg-[#865bc1] font-bold text-xs transition flex justify-center items-center gap-1.5 shadow-md disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Update Changes</span>
                </>
              )}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}
