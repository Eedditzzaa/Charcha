import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PostCardSkeleton } from '../components/LoadingSkeleton';
import { Bookmark, Eye, Heart, MessageSquare, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  content: string;
  featuredImage: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  author: {
    _id: string;
    name: string;
    avatar: string;
  } | null;
}

export default function SavedPosts() {
  const { user, showToast } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = async () => {
    try {
      const res = await axios.get('/api/bookmarks');
      if (Array.isArray(res.data)) {
        setPosts(res.data);
      } else {
        console.error('Expected array for bookmarks but got:', res.data);
        setPosts([]);
      }
    } catch (e) {
      showToast('Could not fetch bookmarks.', 'error');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      showToast('Session required.', 'info');
      navigate('/login');
      return;
    }
    fetchBookmarks();
  }, [user]);

  const handleRemoveBookmark = async (postId: string, e: React.MouseEvent) => {
    e.preventDefault(); // prevent navigation
    e.stopPropagation(); // prevent parent card click handler
    try {
      await axios.delete(`/api/bookmarks/${postId}`);
      setPosts(posts.filter(p => p._id !== postId));
      showToast('Bookmark removed.', 'info');
    } catch (err) {
      showToast('Error removing bookmark.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-light-bg dark:bg-black text-[#444D60] dark:text-[#BFBFBF] transition-colors duration-300">
      
      <div className="border-b border-black/5 dark:border-[#4B4B4B] pb-4 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-black text-[#444D60] dark:text-white tracking-tight flex items-center gap-2">
            <Bookmark className="h-7 w-7 text-charcha-purple" />
            Saved Bookmarks
          </h1>
          <p className="text-xs text-[#444D60]/80 dark:text-[#7D7D7D] font-mono mt-0.5">
            Your personalized reading directory list.
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-3 py-1 bg-[#9D6DD6]/10 text-charcha-purple rounded-lg">
          {posts.length} Stories Saved
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 bg-white/20 dark:bg-[#1E1E1E]/45 border border-[#4B4B4B]/10 rounded-[32px] space-y-4 max-w-lg mx-auto">
          <div className="text-4xl">📚</div>
          <h3 className="text-lg font-serif font-semibold">No Bookmarks Saved</h3>
          <p className="text-xs text-[#444D60]/80 dark:text-dark-text-muted px-6 leading-relaxed">
            Articles or technical design structures you save or bookmark on Single Blog reader sheets will assemble here.
          </p>
          <Link
            to="/blogs"
            className="mt-2 inline-flex items-center px-4 py-2 bg-charcha-purple hover:bg-[#865bc1] text-white font-bold text-xs rounded-xl"
          >
            Explore Directory
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div
              key={post._id}
              onClick={() => navigate(`/posts/${post.slug}`)}
              className="group relative flex flex-col justify-between bg-white/50 dark:bg-[#2E2E2E]/45 border border-black/5 dark:border-[#4B4B4B] rounded-3xl overflow-hidden hover:shadow-lg transition duration-300 cursor-pointer"
            >
              <div>
                <div className="relative h-44 w-full overflow-hidden">
                  <img src={post.featuredImage} alt={post.title} className="h-full w-full object-cover group-hover:scale-105 transition duration-500" />
                  <button
                    onClick={(e) => handleRemoveBookmark(post._id, e)}
                    className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-black/70 hover:bg-rose-600 text-white transition"
                    title="Remove Bookmark"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                
                <div className="p-5 space-y-2">
                  <h3 className="font-serif text-lg font-bold text-[#444D60] dark:text-white line-clamp-2 leading-snug group-hover:text-charcha-purple dark:group-hover:text-charcha-lavender transition-colors">
                    <Link to={`/posts/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="text-xs text-[#444D60]/80 dark:text-[#BFBFBF]/80 line-clamp-3 leading-relaxed">
                    {post.content}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-black/5 dark:border-[#4B4B4B]/30 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-1.5">
                  <img src={post.author?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=Anonymous'} alt={post.author?.name || 'Anonymous'} className="h-6 w-6 rounded-full border border-charcha-purple" />
                  <span className="text-[11px] font-semibold text-[#444D60]/90 dark:text-[#BFBFBF]">{(post.author?.name || 'Anonymous').split(' ')[0]}</span>
                </div>

                <div className="flex gap-2.5 text-xs text-[#444D60]/60 dark:text-[#7D7D7D] font-mono">
                  <span className="flex items-center gap-0.5">
                    <Heart className="h-3.5 w-3.5 text-charcha-purple fill-[#9D6DD6]" />
                    {post.likesCount}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {post.commentsCount}
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
