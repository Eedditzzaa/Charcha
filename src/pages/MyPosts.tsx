import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PostCardSkeleton } from '../components/LoadingSkeleton';
import { Edit2, Trash2, PenTool, MessageSquare, ThumbsUp, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  content: string;
  featuredImage: string;
  status: 'draft' | 'published';
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export default function MyPosts() {
  const { user, showToast } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyPosts = async () => {
    try {
      const res = await axios.get(`/api/posts?authorId=${user?._id}`);
      if (Array.isArray(res.data)) {
        setPosts(res.data);
      } else {
        console.error('Expected array of my posts but got:', res.data);
        setPosts([]);
      }
    } catch (e) {
      showToast('Could not fetch writing log.', 'error');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      showToast('Authentication required.', 'info');
      navigate('/login');
      return;
    }
    fetchMyPosts();
  }, [user]);

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Delete this article? This is an absolute action.')) return;
    try {
      await axios.delete(`/api/posts/${postId}`);
      setPosts(posts.filter(p => p._id !== postId));
      showToast('Post deleted successfully!', 'success');
    } catch (err) {
      showToast('Failed to delete story.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-light-bg dark:bg-black text-[#444D60] dark:text-[#BFBFBF] transition-colors duration-300">
      
      <div className="border-b border-black/5 dark:border-[#4B4B4B] pb-4 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-black text-[#444D60] dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="h-7 w-7 text-charcha-purple" />
            My Written Posts
          </h1>
          <p className="text-xs text-[#444D60]/80 dark:text-[#7D7D7D] font-mono mt-0.5">
            Manage your draft layouts, publications, and discussion statistics.
          </p>
        </div>
        
        <Link
          to="/create-blog"
          className="px-4 py-2 bg-charcha-purple hover:bg-[#865bc1] text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
        >
          <PenTool className="h-4 w-4" />
          Create New Blog
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 bg-white/20 dark:bg-[#1E1E1E]/45 border border-[#4B4B4B]/10 rounded-[32px] space-y-4 max-w-lg mx-auto">
          <div className="text-4xl">✒️</div>
          <h3 className="text-lg font-serif font-semibold">Your Writing Desk is Empty</h3>
          <p className="text-xs text-[#444D60]/80 dark:text-dark-text-muted px-6 leading-relaxed">
            You haven’t created any stories or saved draft writeups yet. Start sharing details, templates or reviews with the community.
          </p>
          <Link
            to="/create-blog"
            className="mt-2 inline-flex items-center px-4 py-2 bg-charcha-purple hover:bg-[#865bc1] text-white font-bold text-xs rounded-xl"
          >
            Draft First Link
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
                  
                  {/* Status Badge */}
                  <span className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg font-mono text-[9px] uppercase font-bold text-white tracking-widest ${
                    post.status === 'published' ? 'bg-emerald-600' : 'bg-amber-600'
                  }`}>
                    {post.status}
                  </span>

                  <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                    <Link
                      to={`/edit-blog/${post._id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-xl bg-black/70 hover:bg-[#9D6DD6] text-white transition"
                      title="Edit Document"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePost(post._id);
                      }}
                      className="p-2 rounded-xl bg-black/70 hover:bg-rose-600 text-white transition"
                      title="Delete Story"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
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
                <span className="text-[10px] text-[#444D60]/60 dark:text-[#7D7D7D] font-mono font-medium">
                  Created: {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>

                <div className="flex gap-2.5 text-xs text-[#444D60]/60 dark:text-[#7D7D7D] font-mono">
                  <span className="flex items-center gap-0.5" title="Likes">
                    <ThumbsUp className="h-3.5 w-3.5 text-charcha-purple" />
                    {post.likesCount || 0}
                  </span>
                  <span className="flex items-center gap-0.5" title="Comments">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {post.commentsCount || 0}
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
