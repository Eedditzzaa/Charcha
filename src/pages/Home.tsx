import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PostCardSkeleton } from '../components/LoadingSkeleton';
import { ArrowRight, Sparkles, MessageSquare, ThumbsUp, Bookmark, Calendar, PenTool } from 'lucide-react';
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

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const res = await axios.get('/api/posts?status=published');
        // Slice top 3 for the home page recent posts
        if (Array.isArray(res.data)) {
          setPosts(res.data.slice(0, 3));
        } else {
          console.error('Expected array of posts but got:', res.data);
          setPosts([]);
        }
      } catch (err) {
        console.error('Failed to load recent posts on home', err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRecentPosts();
  }, []);

  return (
    <div className="space-y-16 pb-16 bg-light-bg dark:bg-black text-[#444D60] dark:text-[#BFBFBF] transition-colors duration-300">
      
      {/* Hero Slider banner */}
      <section className="relative overflow-hidden py-16 sm:py-24 bg-gradient-to-br from-[#A0D2EB] via-indigo-50 to-[#D0BDF4] dark:from-zinc-900 dark:via-black dark:to-zinc-950/80 rounded-b-[40px] shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(157,109,214,0.15),transparent_60%)]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#9D6DD6]/15 text-charcha-purple dark:bg-charcha-purple/30 dark:text-charcha-lavender text-xs font-mono font-bold tracking-wider uppercase animate-bounce">
                <Sparkles className="h-3.5 w-3.5" />
                Discussion Platform Active
              </span>
              
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#444D60] dark:text-white leading-tight">
                Share Ideas. <br className="hidden sm:inline" />
                Start <span className="bg-gradient-to-r from-[#9D6DD6] to-indigo-500 bg-clip-text text-transparent">Discussions.</span>
              </h1>
              
              <p className="text-base sm:text-lg text-[#444D60]/90 dark:text-[#BFBFBF]/80 max-w-lg leading-relaxed">
                Welcome to <strong className="font-semibold text-charcha-purple dark:text-white">Charcha</strong>, the modern community space designed to write stories, explore trending engineering ideas, exchange constructive feedback, and debate designs.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link
                  to="/blogs"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#9D6DD6] text-white hover:bg-[#865bc1] font-bold text-sm shadow-md shadow-[#9D6DD6]/20 transition duration-300 hover:translate-x-1"
                >
                  Explore Discussions
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {user ? (
                  <Link
                    to="/create-blog"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-black/10 hover:border-black/20 bg-white/40 dark:border-[#4B4B4B] dark:bg-white/5 dark:hover:bg-white/10 text-sm font-bold transition duration-300"
                  >
                    <PenTool className="h-4 w-4 text-[#9D6DD6]" />
                    Write a Post
                  </Link>
                ) : (
                  <Link
                    to="/register"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-black/10 hover:border-black/20 bg-white/40 dark:border-[#4B4B4B] dark:bg-white/5 dark:hover:bg-white/10 text-sm font-bold transition duration-300"
                  >
                    Create Free Profile
                  </Link>
                )}
              </div>
            </div>

            {/* Platform Feature Blocks */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-3xl bg-[#A0D2EB]/50 dark:bg-[#2E2E2E]/80 border border-black/5 dark:border-[#4B4B4B] space-y-3">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-charcha-purple text-white font-bold text-lg shadow-sm">
                  💬
                </div>
                <h3 className="font-bold text-[#444D60] dark:text-white text-base">Conversational</h3>
                <p className="text-xs text-[#444D60]/80 dark:text-[#7D7D7D] leading-relaxed">
                  Interactive real-time comments and thread listings.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white/60 dark:bg-[#2E2E2E]/40 border border-black/5 dark:border-[#4B4B4B] space-y-3 mt-4">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber-500 text-white font-bold text-lg shadow-sm">
                  🔒
                </div>
                <h3 className="font-bold text-[#444D60] dark:text-white text-base">Verified Auth</h3>
                <p className="text-xs text-[#444D60]/80 dark:text-[#7D7D7D] leading-relaxed">
                  JWT secured profiles with email OTP verification.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white/60 dark:bg-[#2E2E2E]/40 border border-black/5 dark:border-[#4B4B4B] space-y-3">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-500 text-white font-bold text-lg shadow-sm">
                  🔮
                </div>
                <h3 className="font-bold text-[#444D60] dark:text-white text-base">Responsive Canvas</h3>
                <p className="text-xs text-[#444D60]/80 dark:text-[#7D7D7D] leading-relaxed">
                  Flawless Light-Dark adaptability with strict color accents.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#D0BDF4]/50 dark:bg-[#2E2E2E]/80 border border-black/5 dark:border-[#4B4B4B] space-y-3 mt-4">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#9D6DD6] text-white font-bold text-lg shadow-sm">
                  👑
                </div>
                <h3 className="font-bold text-[#444D60] dark:text-white text-base">Admin HUD</h3>
                <p className="text-xs text-[#444D60]/80 dark:text-[#7D7D7D] leading-relaxed">
                  Total moderation with metrics dashboards.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Dynamic recent posts section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-end justify-between border-b border-black/5 dark:border-[#4B4B4B] pb-4">
          <div>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-[#444D60] dark:text-white">
              Recent Conversations
            </h2>
            <p className="text-xs text-[#444D60]/80 dark:text-[#7D7D7D] font-mono mt-1">Explore written ideas starting with our active writers</p>
          </div>
          <Link
            to="/blogs"
            className="flex items-center gap-1.5 text-sm text-charcha-purple dark:text-charcha-lavender hover:underline font-bold"
          >
            All Blogs
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-white/25 dark:bg-[#1E1E1E]/40 border border-[#4B4B4B]/20 rounded-3xl">
            <h3 className="text-lg font-serif font-semibold">No discussions started yet</h3>
            <p className="text-sm text-[#444D60]/80 dark:text-dark-text-muted mt-1">Be the very first community member to write a blog post!</p>
            <Link
              to="/create-blog"
              className="mt-4 inline-flex items-center px-4 py-2 bg-charcha-purple text-white rounded-xl text-sm font-semibold hover:bg-[#865bc1]"
            >
              Start Charcha Post
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div
                key={post._id}
                onClick={() => navigate(`/posts/${post.slug}`)}
                className="group relative flex flex-col justify-between bg-white/50 dark:bg-[#2E2E2E]/45 border border-black/5 dark:border-[#4B4B4B] rounded-3xl overflow-hidden hover:shadow-lg dark:hover:border-charcha-purple/40 transition duration-300 cursor-pointer"
              >
                <div>
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 bg-[#2E2E2E]/80 backdrop-blur-sm rounded-lg text-white font-mono text-[10px] uppercase font-bold tracking-widest">
                      {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  
                  <div className="p-5 space-y-3">
                    <h3 className="font-serif text-xl font-bold text-[#444D60] dark:text-white line-clamp-2 leading-snug group-hover:text-charcha-purple dark:group-hover:text-charcha-lavender transition-colors">
                      <Link to={`/posts/${post.slug}`}>{post.title}</Link>
                    </h3>
                    <p className="text-xs text-[#444D60]/80 dark:text-[#BFBFBF]/80 line-clamp-3 leading-relaxed">
                      {post.content}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-black/5 dark:border-[#4B4B4B]/40 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <img
                      src={post.author?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=Anonymous'}
                      alt={post.author?.name || 'Anonymous'}
                      className="h-7 w-7 rounded-full border border-charcha-purple"
                    />
                    <span className="text-xs font-semibold text-[#444D60]/90 dark:text-[#BFBFBF]">{(post.author?.name || 'Anonymous').split(' ')[0]}</span>
                  </div>

                  <div className="flex gap-3 text-xs text-[#444D60]/70 dark:text-[#7D7D7D] font-mono">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-3.5 w-3.5 text-charcha-purple" />
                      {post.likesCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {post.commentsCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Community Callout Metrics */}
      {!user && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#9D6DD6]/10 dark:bg-zinc-900/40 p-8 sm:p-12 rounded-[32px] border border-charcha-purple/25 flex flex-col items-center justify-center text-center space-y-6">
            <div className="h-12 w-12 rounded-2xl bg-[#9D6DD6] text-white flex items-center justify-center text-xl shadow-md">
              📢
            </div>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-[#444D60] dark:text-white max-w-lg">
              "Your voice can spark the next great discussion."
            </h2>
            <p className="text-sm text-[#444D60]/80 dark:text-[#BFBFBF]/80 max-w-md antialiased leading-relaxed">
              Charcha belongs to writers, developers, and thinkers. Let’s create articles, read bookmarks, share creative processes, and have a good chat.
            </p>
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl bg-charcha-purple hover:bg-[#865bc1] text-white font-bold text-sm shadow-md shadow-charcha-purple/10 transition duration-200"
            >
              Create Your Account Today
            </Link>
          </div>
        </section>
      )}

    </div>
  );
}
