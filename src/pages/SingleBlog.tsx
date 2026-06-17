import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PostDetailSkeleton } from '../components/LoadingSkeleton';
import { Heart, Bookmark, MessageSquare, ArrowLeft, Calendar, User, Trash2, Edit3, Check, X, Send } from 'lucide-react';
import axios from 'axios';

interface Comment {
  _id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    _id: string;
    name: string;
    avatar: string;
  } | null;
}

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

export default function SingleBlog() {
  const { slug } = useParams<{ slug: string }>();
  const { user, showToast } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // User Actions State
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [newComment, setNewComment] = useState('');
  
  // Edit comment states
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const fetchPostDetails = async () => {
    try {
      const postRes = await axios.get(`/api/posts/${slug}`);
      const fetchedPost = postRes.data;
      setPost(fetchedPost);

      // Load comments for this post
      const commentsRes = await axios.get(`/api/posts/${fetchedPost._id}/comments`);
      setComments(commentsRes.data);

      if (user) {
        // Hydrate checked interactions state
        const likedRes = await axios.get(`/api/posts/${fetchedPost._id}/liked-state`);
        setLiked(likedRes.data.liked);

        const bookmarksRes = await axios.get('/api/bookmarks');
        const isSaved = bookmarksRes.data.some((b: any) => b._id === fetchedPost._id);
        setBookmarked(isSaved);
      }
    } catch (err: any) {
      showToast('Could not find the requested story.', 'error');
      navigate('/blogs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostDetails();
  }, [slug, user]);

  const handleLikeToggle = async () => {
    if (!user) {
      showToast('Please sign in to like blog posts.', 'info');
      navigate(`/login?redirect=/posts/${slug}`);
      return;
    }
    if (!post) return;

    try {
      const res = await axios.post(`/api/posts/${post._id}/like`);
      setLiked(res.data.liked);
      setPost({
        ...post,
        likesCount: res.data.likesCount,
      });
      showToast(res.data.liked ? 'Post added to your likes!' : 'Removed from your likes.', 'success');
    } catch (e) {
      showToast('Could not toggle like.', 'error');
    }
  };

  const handleBookmarkToggle = async () => {
    if (!user) {
      showToast('Please sign in to save bookmarks.', 'info');
      navigate(`/login?redirect=/posts/${slug}`);
      return;
    }
    if (!post) return;

    try {
      if (bookmarked) {
        await axios.delete(`/api/bookmarks/${post._id}`);
        setBookmarked(false);
        showToast('Bookmark removed.', 'info');
      } else {
        await axios.post(`/api/bookmarks/${post._id}`);
        setBookmarked(true);
        showToast('Story bookmarked successfully!', 'success');
      }
    } catch (e) {
      showToast('Could not toggle bookmark.', 'error');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to add comments.', 'info');
      navigate(`/login?redirect=/posts/${slug}`);
      return;
    }
    if (!newComment.trim() || !post) return;

    try {
      const res = await axios.post('/api/comments', {
        postId: post._id,
        content: newComment,
      });
      setComments([res.data, ...comments]);
      setPost({
        ...post,
        commentsCount: (post.commentsCount || 0) + 1,
      });
      setNewComment('');
      showToast('Comment added!', 'success');
    } catch (err: any) {
      showToast('Failed to add comment.', 'error');
    }
  };

  const handleEditCommentSubmit = async (commentId: string) => {
    if (!editingContent.trim()) return;
    try {
      const res = await axios.put(`/api/comments/${commentId}`, { content: editingContent });
      setComments(comments.map(c => c._id === commentId ? { ...c, content: res.data.content } : c));
      setEditingCommentId(null);
      setEditingContent('');
      showToast('Comment updated.', 'success');
    } catch (e) {
      showToast('Failed to edit comment.', 'error');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this comment?')) return;
    try {
      await axios.delete(`/api/comments/${commentId}`);
      setComments(comments.filter(c => c._id !== commentId));
      if (post) {
        setPost({
          ...post,
          commentsCount: Math.max(0, (post.commentsCount || 1) - 1),
        });
      }
      showToast('Comment deleted.', 'info');
    } catch (e) {
      showToast('Failed to delete comment.', 'error');
    }
  };

  const handleDeletePostByAdminOrOwner = async () => {
    if (!post) return;
    if (!window.confirm('Delete this post permanently? This cannot be undone.')) return;

    try {
      await axios.delete(`/api/posts/${post._id}`);
      showToast('Post deleted successfully.', 'success');
      navigate('/blogs');
    } catch (e) {
      showToast('Failed to delete post.', 'error');
    }
  };

  if (loading) return <PostDetailSkeleton />;
  if (!post) return null;

  const canManagePost = user && (post.authorId === user._id || user.role === 'admin');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8 bg-light-bg dark:bg-black text-[#444D60] dark:text-[#BFBFBF] transition-colors duration-300">
      
      {/* Back flow controller */}
      <div className="flex items-center justify-between">
        <Link
          to="/blogs"
          className="inline-flex items-center gap-1.5 text-xs text-charcha-purple dark:text-charcha-lavender hover:underline font-bold uppercase font-mono tracking-wider"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blogs
        </Link>
        
        {canManagePost && (
          <div className="flex gap-2">
            <Link
              to={`/edit-blog/${post._id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-charcha-purple/30 text-xs text-charcha-purple dark:text-charcha-lavender bg-white dark:bg-zinc-900 font-bold transition hover:bg-[#9D6DD6]/10"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit Post
            </Link>
            <button
              onClick={handleDeletePostByAdminOrOwner}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 border border-rose-300/40 bg-rose-50 hover:bg-rose-500 hover:text-white dark:bg-zinc-900/40 dark:hover:bg-rose-950 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Code
            </button>
          </div>
        )}
      </div>

      {/* Main post layout */}
      <article className="space-y-6">
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-[10px] font-mono font-bold bg-[#9D6DD6] text-white rounded-md uppercase tracking-widest">
              {post.status}
            </span>
            <span className="text-xs text-[#444D60]/80 dark:text-[#7D7D7D] font-mono flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(post.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-[#444D60] dark:text-white leading-tight">
            {post.title}
          </h1>

          {/* Author info detail */}
          <div className="flex items-center gap-3.5 p-4 border border-black/5 dark:border-[#4B4B4B] rounded-2xl bg-[#A0D2EB]/15 dark:bg-zinc-900/30">
            <img
              src={post.author?.avatar}
              alt={post.author?.name}
              className="h-11 w-11 rounded-full border-2 border-[#9D6DD6]"
            />
            <div>
              <div className="text-sm font-bold text-[#444D60] dark:text-white flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-charcha-purple" />
                {post.author?.name}
              </div>
              <p className="text-xs text-[#444D60]/80 dark:text-[#7D7D7D] line-clamp-1 italic mt-0.5">
                {post.author?.bio || 'Charcha creator & contributor.'}
              </p>
            </div>
          </div>
        </header>

        {/* Hero visual header */}
        <div className="w-full rounded-2xl overflow-hidden shadow-sm h-64 sm:h-[400px] border border-black/5 dark:border-[#4B4B4B]">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Actions bar layer: Likes, Bookmark, comments aggregate */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-black/5 dark:border-[#4B4B4B] bg-[#A0D2EB]/30 dark:bg-zinc-900/60 font-mono text-xs">
          <div className="flex gap-4">
            <button
              onClick={handleLikeToggle}
              className={`flex items-center gap-1.5 font-bold transition hover:scale-105 ${liked ? 'text-[#9D6DD6]' : 'text-[#444D60] dark:text-dark-text'}`}
            >
              <Heart className={`h-4 w-4 ${liked ? 'fill-[#9D6DD6] text-[#9D6DD6]' : ''}`} />
              <span>{post.likesCount || 0} Likes</span>
            </button>
            <span className="flex items-center gap-1.5 font-bold">
              <MessageSquare className="h-4 w-4" />
              <span>{post.commentsCount || 0} Comments</span>
            </span>
          </div>

          <button
            onClick={handleBookmarkToggle}
            className={`flex items-center gap-1 font-bold transition hover:scale-105 ${bookmarked ? 'text-[#9D6DD6]' : ''}`}
          >
            <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-[#9D6DD6]' : ''}`} />
            <span>{bookmarked ? 'Saved' : 'Save Book'}</span>
          </button>
        </div>

        {/* Content body with beautiful design */}
        <section className="prose prose-zinc dark:prose-invert max-w-none antialiased py-4 border-b border-black/5 dark:border-[#4B4B4B] leading-relaxed text-[#444D60] dark:text-[#BFBFBF] whitespace-pre-wrap text-base">
          {post.content}
        </section>
      </article>

      {/* COMMENTS COMPONENT METRICS */}
      <section className="space-y-6">
        <h3 className="font-serif text-2xl font-black text-[#444D60] dark:text-white flex items-center gap-2">
          Discussion Board
          <span className="text-sm font-mono font-medium px-2.5 py-0.5 bg-black/10 dark:bg-zinc-800 rounded-lg">
            {comments.length}
          </span>
        </h3>

        {/* Add comment input form */}
        <form onSubmit={handleAddComment} className="flex gap-3 items-start">
          <img
            src={user ? user.avatar : `https://api.dicebear.com/7.x/bottts/svg?seed=guest`}
            alt="My Av"
            className="h-9 w-9 rounded-full bg-[#A0D2EB] dark:bg-zinc-800"
          />
          <div className="flex-grow space-y-2">
            <textarea
              required
              rows={2}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={user ? "Join raw discussions here, voice your insights constructively..." : "Sign in to join community discussions!"}
              disabled={!user}
              className="w-full p-4 text-sm rounded-2xl border border-black/10 dark:border-[#4B4B4B] bg-white/60 dark:bg-black/40 text-[#444D60] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9D6DD6] placeholder-[#444D60]/60 dark:placeholder-[#7D7D7D] disabled:opacity-50"
            />
            {user && (
              <button
                type="submit"
                className="flex items-center gap-1 px-4 py-2 text-xs rounded-xl bg-[#9D6DD6] hover:bg-[#865bc1] text-white font-bold transition shadow-sm"
              >
                <Send className="h-3 w-3" />
                <span>Submit Post</span>
              </button>
            )}
          </div>
        </form>

        {/* Interactive comments list */}
        <div className="space-y-4 pt-4 border-t border-black/5 dark:border-[#4B4B4B]/60">
          {comments.length === 0 ? (
            <p className="text-center text-xs dark:text-[#7D7D7D] py-4">
              Charcha comments board is empty. Start the dialogue yourself!
            </p>
          ) : (
            comments.map((comment) => {
              const isCommentAuthor = user && comment.userId === user._id;
              const isAdmin = user && user.role === 'admin';
              const canEdit = isCommentAuthor;
              const canDelete = isCommentAuthor || isAdmin;

              return (
                <div
                  key={comment._id}
                  className="flex gap-3.5 p-4 rounded-2xl border border-black/5 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/25 transition"
                >
                  <img
                    src={comment.user?.avatar}
                    alt={comment.user?.name}
                    className="h-8 w-8 rounded-full border border-charcha-purple"
                  />
                  <div className="flex-grow space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#444D60] dark:text-white">
                          {comment.user?.name}
                        </span>
                        {comment.user?._id === post.authorId && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-lg bg-[#9D6DD6]/20 text-[#9D6DD6] font-bold">
                            Author
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#444D60]/60 dark:text-[#7D7D7D] font-mono">
                        {new Date(comment.createdAt).toLocaleDateString(undefined, { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>

                    {editingCommentId === comment._id ? (
                      <div className="space-y-2 mt-1">
                        <textarea
                          rows={2}
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="w-full text-xs p-3 rounded-xl border border-[#9D6DD6]/30 bg-white dark:bg-zinc-950 text-white focus:outline-none"
                        />
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleEditCommentSubmit(comment._id)}
                            className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition"
                            title="Save Content"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => setEditingCommentId(null)}
                            className="p-1.5 rounded-lg bg-zinc-400 dark:bg-zinc-800 hover:bg-zinc-50 transition"
                            title="Cancel"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-[#444D60]/95 dark:text-dark-text leading-relaxed">
                        {comment.content}
                      </p>
                    )}

                    {/* Controls */}
                    {!editingCommentId && (canEdit || canDelete) && (
                      <div className="flex gap-3 justify-end pt-1">
                        {canEdit && (
                          <button
                            onClick={() => {
                              setEditingCommentId(comment._id);
                              setEditingContent(comment.content);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] text-charcha-purple hover:underline"
                          >
                            <Edit3 className="h-3 w-3" />
                            Edit
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="inline-flex items-center gap-1 text-[10px] text-rose-500 hover:underline"
                          >
                            <Trash2 className="h-3 w-3" />
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

    </div>
  );
}
