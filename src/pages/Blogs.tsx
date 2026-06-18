import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PostCardSkeleton } from '../components/LoadingSkeleton';
import { Search, PenTool, Sparkles, MessageSquare, ThumbsUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  content: string;
  featuredImage: string;
  status: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  author: {
    _id: string;
    name: string;
    avatar: string;
    bio: string;
  } | null;
}

export default function Blogs() {
  const { user, showToast } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Trigger load request
  const fetchPosts = async (searchQuery: string = '') => {
    setLoading(true);
    try {
      const url = searchQuery ? `/api/posts?status=published&search=${encodeURIComponent(searchQuery)}` : '/api/posts?status=published';
      const res = await axios.get(url);
      if (Array.isArray(res.data)) {
        setPosts(res.data);
      } else {
        console.error('Expected array but got:', res.data);
        setPosts([]);
      }
    } catch (e) {
      showToast('Could not load blog posts. Try refreshing.', 'error');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts(search);
  };

  const clearSearch = () => {
    setSearch('');
    fetchPosts('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 bg-light-bg dark:bg-black text-[#444D60] dark:text-[#BFBFBF] transition-colors duration-300">
      
      {/* Search Header layout banner */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 border-b border-black/5 dark:border-[#4B4B4B] pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-charcha-purple/10 text-charcha-purple dark:text-charcha-lavender text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <Sparkles className="h-3 w-3" />
            Active Feed
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-black text-[#444D60] dark:text-white tracking-tight">
            Charcha Blog Directory
          </h1>
          <p className="text-xs text-[#444D60]/80 dark:text-[#7D7D7D] font-mono mt-1">
            "Share Ideas, Start Discussions."
          </p>
        </div>

        {/* Dynamic Search bar with controls */}
        <form onSubmit={handleSearchSubmit} className="w-full md:max-w-md flex gap-2">
          <div className="relative flex-grow">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search written titles, contents..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-black/10 dark:border-[#4B4B4B] bg-white/60 dark:bg-black/40 text-[#444D60] dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-charcha-purple transition"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-charcha-purple text-white hover:bg-[#865bc1] font-bold text-xs transition"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={clearSearch}
              className="px-3 py-2 rounded-xl border border-black/10 dark:border-[#4B4B4B] text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main List Column */}
        <div className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PostCardSkeleton />
              <PostCardSkeleton />
              <PostCardSkeleton />
              <PostCardSkeleton />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 bg-white/20 dark:bg-[#1E1E1E]/40 border border-[#4B4B4B]/10 rounded-3xl space-y-4">
              <div className="text-4xl text-center">📭</div>
              <h3 className="text-lg font-serif font-semibold">No discussions matched</h3>
              <p className="text-xs text-[#444D60]/80 dark:text-[#7D7D7D] max-w-sm mx-auto leading-relaxed">
                We couldn't find any blogs matching your search parameters. Try other search keywords or create a new blog entry!
              </p>
              <button
                onClick={clearSearch}
                className="mt-2 px-4 py-1.5 rounded-xl text-xs bg-charcha-purple text-white hover:bg-[#865bc1]"
              >
                Reset Feed
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post) => (
                <div
                  key={post._id}
                  onClick={() => navigate(`/posts/${post.slug}`)}
                  className="group relative flex flex-col justify-between bg-white/50 dark:bg-[#2E2E2E]/45 border border-black/5 dark:border-[#4B4B4B] rounded-3xl overflow-hidden hover:shadow-lg hover:border-charcha-purple/30 transition duration-300 cursor-pointer"
                >
                  <div>
                    <div className="relative h-44 w-full overflow-hidden">
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-[#2E2E2E]/80 backdrop-blur-sm rounded-lg text-white font-mono text-[9px] uppercase font-semibold tracking-widest">
                        {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    </div>

                    <div className="p-5 space-y-2.5">
                      <h3 className="font-serif text-lg font-bold text-[#444D60] dark:text-white line-clamp-2 leading-snug group-hover:text-charcha-purple dark:group-hover:text-charcha-lavender transition-colors">
                        <Link to={`/posts/${post.slug}`}>{post.title}</Link>
                      </h3>
                      <p className="text-xs text-[#444D60]/80 dark:text-[#BFBFBF]/85 line-clamp-3 leading-relaxed">
                        {post.content}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t border-black/5 dark:border-[#4B4B4B]/30 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={post.author?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=Anonymous'}
                        alt={post.author?.name || 'Anonymous'}
                        className="h-6 w-6 rounded-full border border-charcha-purple"
                      />
                      <span className="text-[11px] font-semibold text-[#444D60]/90 dark:text-[#BFBFBF]">{(post.author?.name || 'Anonymous').split(' ')[0]}</span>
                    </div>

                    <div className="flex gap-2.5 text-xs text-[#444D60]/60 dark:text-[#7D7D7D] font-mono">
                      <span className="flex items-center gap-0.5">
                        <ThumbsUp className="h-3 w-3 text-charcha-purple" />
                        {post.likesCount || 0}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <MessageSquare className="h-3 w-3" />
                        {post.commentsCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Tags Widget */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#A0D2EB]/30 dark:bg-zinc-900/40 border border-black/5 dark:border-[#4B4B4B] space-y-4">
            <h3 className="font-serif text-base font-bold text-[#444D60] dark:text-white">
              Trending Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {['Web Design', 'React JS', 'Node', 'Vite 6', 'Tailwind v4', 'Community', 'UIUX', 'Security'].map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    setSearch(tag);
                    fetchPosts(tag);
                  }}
                  className="px-2.5 py-1 text-[10px] font-mono rounded-lg border border-black/10 dark:border-[#4B4B4B] bg-white/40 dark:bg-zinc-800 text-[#444D60]/80 dark:text-dark-text hover:bg-[#9D6DD6]/15 hover:text-[#9D6DD6] dark:hover:bg-charcha-purple/30 dark:hover:text-white transition"
                >
                  #{tag.replace(/\s+/g,'').toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-br from-charcha-purple/10 to-[#D0BDF4]/10 border border-[#9D6DD6]/20 space-y-4">
            <h3 className="font-serif text-sm font-bold text-[#444D60] dark:text-white flex items-center gap-1.5">
              <PenTool className="h-4 w-4 text-charcha-purple" />
              Write at Charcha
            </h3>
            <p className="text-xs text-[#444D60]/80 dark:text-[#7D7D7D] leading-relaxed">
              Have some unique insights, templates, or experiences? Open discussions and share with friends immediately.
            </p>
            <Link
              to={user ? "/create-blog" : "/login?redirect=/create-blog"}
              className="block text-center w-full py-2 bg-charcha-purple text-white text-xs font-bold rounded-xl hover:bg-[#865bc1] transition"
            >
              Start Charcha Post
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
