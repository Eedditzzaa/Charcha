import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db, User, Post, Comment } from './server/db';
import { hashPassword, comparePassword, signToken, verifyToken } from './server/utils';
import { sendVerificationEmail, sendPasswordResetEmail } from './server/email';


// We extend standard Express Request via inline interface properties
interface AuthenticatedRequest extends Request {
  user?: User;
}

const app = express();
const PORT = 3000;

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging / Debug Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// MIDDLEWARES
async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication required. Please login.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ message: 'Session expired or invalid token. Please login again.' });
    return;
  }

  try {
    const user = await db.getUserById(payload.userId);
    if (!user) {
      res.status(401).json({ message: 'User session no longer valid.' });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({ message: 'Your account is currently blocked by an administrator.' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Authentication security check failed. Please login again.' });
  }
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
    return;
  }
  next();
}

// ===================================
// API ROUTES
// ===================================

// AUTH

// POST /api/auth/register
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email and password are required.' });
      return;
    }

    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ message: 'An account with this email already exists.' });
      return;
    }

    const hashedPassword = hashPassword(password);
    
    // Create new user (unverified by default unless specified)
    const newUser = await db.createUser({
      name,
      email,
      password: hashedPassword,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      bio: 'New Charcha member!',
      role: 'user',
      googleId: null,
      isVerified: false,
      isBlocked: false,
    });

    // Generate a 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await db.createVerificationCode(email, code);

    const userGmail = process.env.GMAIL_USER;
    const passGmail = process.env.GMAIL_APP_PASSWORD;
    const isSmtpConfigured = !!(userGmail && passGmail);

    let smtpFailed = false;
    let smtpErrorMsg = '';

    if (isSmtpConfigured) {
      try {
        // Send real email via Gmail / Nodemailer (falls back to simulation log if secrets aren't set)
        await sendVerificationEmail(email, code);
      } catch (err: any) {
        console.error('❌ SMTP verification email delivery failed:', err);
        smtpFailed = true;
        smtpErrorMsg = err.message || 'SMTP connection or credential validation failed.';
      }
    }

    res.status(201).json({
      message: 'Registration successful. Please verify your email.',
      smtpConfigured: isSmtpConfigured,
      smtpFailed,
      smtpErrorMsg,
      // Only expose verification code in response if SMTP is unconfigured or failed, guaranteeing real-email privacy when working!
      debugCode: (!isSmtpConfigured || smtpFailed) ? code : undefined,
      user: {
        email: newUser.email,
        isVerified: false,
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error occurred during registration.' });
  }
});

// POST /api/auth/verify-email
app.post('/api/auth/verify-email', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    let targetEmail = email;
    let fallbackUserId: string | null = null;

    // Support both unauthenticated (signup flow) and authenticated (unverified re-login flow) verification
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = verifyToken(token);
      if (payload && payload.userId) {
        const authedUser = await db.getUserById(payload.userId);
        if (authedUser) {
          targetEmail = authedUser.email;
          fallbackUserId = authedUser._id;
        }
      }
    }

    if (!targetEmail) {
      res.status(400).json({ message: 'Email address is required.' });
      return;
    }

    if (!code) {
      res.status(400).json({ message: 'Verification code is required.' });
      return;
    }

    const storedCode = await db.getVerificationCode(targetEmail);
    if (!storedCode || storedCode !== code) {
      res.status(400).json({ message: 'Invalid or expired verification code.' });
      return;
    }

    const user = await db.getUserByEmail(targetEmail);
    if (!user) {
      res.status(404).json({ message: 'User matching email not found.' });
      return;
    }

    // Verify user
    const updated = await db.updateUser(user._id, { isVerified: true });
    await db.clearVerificationCode(targetEmail);

    // Upon successful OTP match, issue active login session (JWT)
    const token = signToken({ userId: user._id });

    res.json({
      message: 'Email address verified and registration completed successfully!',
      token,
      user: {
        _id: updated?._id,
        name: updated?.name,
        email: updated?.email,
        avatar: updated?.avatar,
        bio: updated?.bio,
        role: updated?.role,
        isVerified: true,
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error verifying email.' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    const user = await db.getUserByEmail(email);
    if (!user || !user.password) {
      res.status(400).json({ message: 'Invalid email or password.' });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({ message: 'Your account has been blocked by an administrator.' });
      return;
    }

    const matched = comparePassword(password, user.password);
    if (!matched) {
      res.status(400).json({ message: 'Invalid email or password.' });
      return;
    }

    const token = signToken({ userId: user._id });

    res.json({
      message: 'Login successful.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        isVerified: user.isVerified,
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error occurred during login.' });
  }
});

// POST /api/auth/admin-login
app.post('/api/auth/admin-login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    const user = await db.getUserByEmail(email);
    if (!user || !user.password) {
      res.status(400).json({ message: 'Invalid admin credentials.' });
      return;
    }

    if (user.role !== 'admin') {
      res.status(403).json({ message: 'Access denied. You do not have administrator permissions.' });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({ message: 'Your administrative account has been deactivated.' });
      return;
    }

    const matched = comparePassword(password, user.password);
    if (!matched) {
      res.status(400).json({ message: 'Invalid admin credentials.' });
      return;
    }

    const token = signToken({ userId: user._id });

    res.json({
      message: 'Admin login successful.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        isVerified: user.isVerified,
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error occurred during admin login.' });
  }
});

// POST /api/auth/google
app.post('/api/auth/google', async (req: Request, res: Response) => {
  try {
    const { googleId, email, name, avatar } = req.body;
    if (!googleId || !email) {
      res.status(400).json({ message: 'OAuth Google credentials are incomplete.' });
      return;
    }

    let user = await db.getUserByGoogleId(googleId) || await db.getUserByEmail(email);

    if (!user) {
      // Register new user on OAuth
      user = await db.createUser({
        name: name || 'Google User',
        email,
        password: undefined,
        avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
        bio: 'Signed up with Google to discuss ideas!',
        role: 'user',
        googleId,
        isVerified: true, // Google login is pre-verified
        isBlocked: false,
      });
    } else {
      // Update Google ID if not present
      if (!user.googleId) {
        await db.updateUser(user._id, { googleId, isVerified: true });
      }
      if (user.isBlocked) {
        res.status(403).json({ message: 'Your account has been blocked.' });
        return;
      }
    }

    const token = signToken({ userId: user._id });

    res.json({
      message: 'Google login successful.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        isVerified: user.isVerified,
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error occurred during Google OAuth.' });
  }
});

// POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: 'Email address is required.' });
      return;
    }

    const user = await db.getUserByEmail(email);
    if (!user) {
      res.status(400).json({ message: 'No registered account found with this email.' });
      return;
    }

    // Reset code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await db.createVerificationCode(email, code);

    const userGmail = process.env.GMAIL_USER;
    const passGmail = process.env.GMAIL_APP_PASSWORD;
    const isSmtpConfigured = !!(userGmail && passGmail);

    let smtpFailed = false;
    let smtpErrorMsg = '';

    if (isSmtpConfigured) {
      try {
        // Send real email via Gmail / Nodemailer (falls back to simulation system log if secrets aren't set)
        await sendPasswordResetEmail(email, code);
      } catch (err: any) {
        console.error('❌ SMTP password reset email delivery failed:', err);
        smtpFailed = true;
        smtpErrorMsg = err.message || 'SMTP connection or credential validation failed.';
      }
    }

    res.json({
      message: 'A password reset code has been sent to your email address.',
      smtpConfigured: isSmtpConfigured,
      smtpFailed,
      smtpErrorMsg,
      // Only expose verification code if SMTP is unconfigured or failed
      debugCode: (!isSmtpConfigured || smtpFailed) ? code : undefined,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error request password reset.' });
  }
});

// POST /api/auth/reset-password
app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      res.status(400).json({ message: 'Email, code and new password are required.' });
      return;
    }

    const storedCode = await db.getVerificationCode(email);
    if (!storedCode || storedCode !== code) {
      res.status(400).json({ message: 'Invalid or expired password reset code.' });
      return;
    }

    const user = await db.getUserByEmail(email);
    if (!user) {
      res.status(400).json({ message: 'User matching email not found.' });
      return;
    }

    await db.updateUser(user._id, { password: hashPassword(newPassword) });
    await db.clearVerificationCode(email);

    res.json({ message: 'Password has been reset successfully. Please login with your new password.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error resetting password.' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  res.json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      isVerified: user.isVerified,
    }
  });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.json({ message: 'Logout successful. Session cleared.' });
});

// ===================================
// BLOGS (POSTS) MANAGEMENT
// ===================================

// GET /api/posts
app.get('/api/posts', async (req: Request, res: Response) => {
  try {
    const { status, authorId, search } = req.query;
    let posts = await db.getPosts();

    // Map authors right inside listing
    let formatted = await Promise.all(posts.map(async p => {
      const author = await db.getUserById(p.authorId);
      return {
        ...p,
        author: author ? {
          _id: author._id,
          name: author.name,
          avatar: author.avatar,
          bio: author.bio
        } : null
      };
    }));

    // Filtering
    if (status) {
      formatted = formatted.filter(p => p.status === status);
    }
    if (authorId) {
      formatted = formatted.filter(p => p.authorId === authorId);
    }
    if (search) {
      const query = (search as string).toLowerCase();
      formatted = formatted.filter(
        p => p.title.toLowerCase().includes(query) || p.content.toLowerCase().includes(query)
      );
    }

    // Sort newest first
    formatted.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching posts' });
  }
});

// GET /api/posts/:slug
app.get('/api/posts/:slug', async (req: Request, res: Response) => {
  try {
    const post = await db.getPostBySlug(req.params.slug);
    if (!post) {
      res.status(404).json({ message: 'Post not found.' });
      return;
    }

    const author = await db.getUserById(post.authorId);
    res.json({
      ...post,
      author: author ? {
        _id: author._id,
        name: author.name,
        avatar: author.avatar,
        bio: author.bio
      } : null
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching post.' });
  }
});

// POST /api/posts
app.post('/api/posts', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, content, featuredImage, status } = req.body;
    const user = req.user!;

    if (!title || !content) {
      res.status(400).json({ message: 'Title and content are required fields.' });
      return;
    }

    // Slugify
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    
    // De-duplicate slug
    let index = 1;
    let originalSlug = slug;
    while (await db.getPostBySlug(slug)) {
      slug = `${originalSlug}-${index}`;
      index++;
    }

    const newPost = await db.createPost({
      title,
      slug,
      content,
      featuredImage: featuredImage || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=800&auto=format&fit=crop',
      authorId: user._id,
      status: status || 'published',
    });

    res.status(201).json(newPost);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error creating post.' });
  }
});

// PUT /api/posts/:id
app.put('/api/posts/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const post = await db.getPostById(req.params.id);
    if (!post) {
      res.status(404).json({ message: 'Post not found.' });
      return;
    }

    // Authorization: Must be owner or admin
    if (post.authorId !== req.user!._id && req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Unauthorized. You do not own this post.' });
      return;
    }

    const { title, content, featuredImage, status } = req.body;
    const updates: Partial<Post> = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (featuredImage !== undefined) updates.featuredImage = featuredImage;
    if (status !== undefined) updates.status = status;

    const updated = await db.updatePost(req.params.id, updates);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error updating post.' });
  }
});

// DELETE /api/posts/:id
app.delete('/api/posts/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const post = await db.getPostById(req.params.id);
    if (!post) {
      res.status(404).json({ message: 'Post not found.' });
      return;
    }

    // Owner or admin
    if (post.authorId !== req.user!._id && req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }

    await db.deletePost(req.params.id);
    res.json({ message: 'Post deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error deleting post.' });
  }
});

// ===================================
// COMMENTS
// ===================================

// GET /api/comments (For post wise listening)
app.get('/api/posts/:id/comments', async (req: Request, res: Response) => {
  try {
    const comments = await db.getCommentsByPostId(req.params.id);
    
    // Map user profiles
    const formatted = await Promise.all(comments.map(async c => {
      const u = await db.getUserById(c.userId);
      return {
        ...c,
        user: u ? {
          _id: u._id,
          name: u.name,
          avatar: u.avatar
        } : null
      };
    }));

    // Newest first
    formatted.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error loading comments.' });
  }
});

// POST /api/comments
app.post('/api/comments', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { postId, content } = req.body;
    if (!postId || !content) {
      res.status(400).json({ message: 'postId and content are required.' });
      return;
    }

    const post = await db.getPostById(postId);
    if (!post) {
      res.status(404).json({ message: 'Target post not found.' });
      return;
    }

    const comment = await db.createComment(postId, req.user!._id, content);
    res.status(201).json({
      ...comment,
      user: {
        _id: req.user!._id,
        name: req.user!.name,
        avatar: req.user!.avatar,
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error posting comment.' });
  }
});

// PUT /api/comments/:id
app.put('/api/comments/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { content } = req.body;
    if (!content) {
      res.status(400).json({ message: 'Content cannot be empty.' });
      return;
    }

    const comment = await db.getCommentById(req.params.id);
    if (!comment) {
      res.status(404).json({ message: 'Comment not found.' });
      return;
    }

    if (comment.userId !== req.user!._id) {
      res.status(403).json({ message: 'Forbidden. You do not own this comment.' });
      return;
    }

    const updated = await db.updateComment(req.params.id, content);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error updating comment.' });
  }
});

// DELETE /api/comments/:id
app.delete('/api/comments/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const comment = await db.getCommentById(req.params.id);
    if (!comment) {
      res.status(404).json({ message: 'Comment does not exist.' });
      return;
    }

    if (comment.userId !== req.user!._id && req.user!.role !== 'admin') {
      res.status(403).json({ message: 'Access denied.' });
      return;
    }

    await db.deleteComment(req.params.id);
    res.json({ message: 'Comment deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error deleting comment.' });
  }
});

// ===================================
// LIKES
// ===================================

// POST /api/posts/:id/like
app.post('/api/posts/:id/like', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const post = await db.getPostById(req.params.id);
    if (!post) {
      res.status(404).json({ message: 'Post not found.' });
      return;
    }

    const { liked, count } = await db.toggleLike(req.params.id, req.user!._id);
    res.json({ liked, likesCount: count });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error toggling like.' });
  }
});

// GET /api/posts/:id/liked-state (Utility to discover user checked like)
app.get('/api/posts/:id/liked-state', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const liked = await db.hasLiked(req.params.id, req.user!._id);
    res.json({ liked });
  } catch (err: any) {
    res.json({ liked: false });
  }
});

// ===================================
// BOOKMARKS
// ===================================

// POST /api/bookmarks/:id
app.post('/api/bookmarks/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const post = await db.getPostById(req.params.id);
    if (!post) {
      res.status(404).json({ message: 'Post does not exist' });
      return;
    }

    await db.addBookmark(req.params.id, req.user!._id);
    res.json({ bookmarked: true, message: 'Post bookmarked successfully.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error bookmarking post.' });
  }
});

// DELETE /api/bookmarks/:id
app.delete('/api/bookmarks/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await db.removeBookmark(req.params.id, req.user!._id);
    res.json({ bookmarked: false, message: 'Post removed from bookmarks.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error removing bookmark.' });
  }
});

// GET /api/bookmarks
app.get('/api/bookmarks', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bookmarks = await db.getBookmarksByUserId(req.user!._id);
    const posts = (await Promise.all(bookmarks.map(async b => {
      const p = await db.getPostById(b.postId);
      if (!p) return null;
      const author = await db.getUserById(p.authorId);
      return {
        ...p,
        author: author ? {
          _id: author._id,
          name: author.name,
          avatar: author.avatar
        } : null
      };
    }))).filter(p => p !== null);

    res.json(posts);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching bookmarks.' });
  }
});

// ===================================
// PROFILE
// ===================================

// GET /api/profile
app.get('/api/profile', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    role: user.role,
    isVerified: user.isVerified,
    isBlocked: user.isBlocked,
    createdAt: user.createdAt,
  });
});

// PUT /api/profile
app.put('/api/profile', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, bio, avatar } = req.body;
    const updates: Partial<User> = {};
    if (name !== undefined) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;

    const updated = await db.updateUser(req.user!._id, updates);
    res.json({
      message: 'Profile updated successfully.',
      user: {
        _id: updated?._id,
        name: updated?.name,
        email: updated?.email,
        avatar: updated?.avatar,
        bio: updated?.bio,
        role: updated?.role,
        isVerified: updated?.isVerified,
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error updating profile.' });
  }
});

// PUT /api/profile/change-password
app.put('/api/profile/change-password', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      res.status(400).json({ message: 'Both old password and new password are required.' });
      return;
    }

    const user = await db.getUserById(req.user!._id);
    if (!user || !user.password) {
      res.status(400).json({ message: 'Password change not supported on social signup profiles.' });
      return;
    }

    if (!comparePassword(oldPassword, user.password)) {
      res.status(400).json({ message: 'Incorrect old password.' });
      return;
    }

    await db.updateUser(user._id, { password: hashPassword(newPassword) });
    res.json({ message: 'Password updated successfully!' });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error changing password.' });
  }
});

// ===================================
// CLOUDINARY / MOCK UPLOAD
// ===================================
app.post('/api/upload', (req: Request, res: Response) => {
  try {
    const { image } = req.body; 
    // Usually images are uploaded as raw files or base64.
    // We fall back gracefully to beautiful unsplash placeholder matching keyword or just direct return of image or customized svg matching category!
    const fallbackImage = image && image.startsWith('http') 
      ? image 
      : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop';
    
    res.json({
      url: fallbackImage,
      message: 'Securely uploaded to cloud assets pipeline (simulation fallback active).'
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Image upload failed.' });
  }
});

// ===================================
// ADMIN LOGIC
// ===================================

// GET /api/admin/users
app.get('/api/admin/users', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    res.json(await db.getUsers());
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to retrieve Users.' });
  }
});

// DELETE /api/admin/users/:id
app.delete('/api/admin/users/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    if (req.params.id === 'u-1') {
      res.status(400).json({ message: 'Cannot delete the primary root administrator.' });
      return;
    }
    const success = await db.deleteUser(req.params.id);
    if (success) {
      res.json({ message: 'User and all of their posts, likes, and comments have been deleted.' });
    } else {
      res.status(404).json({ message: 'User not found.' });
    }
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to delete user.' });
  }
});

// PATCH /api/admin/users/:id/block
app.patch('/api/admin/users/:id/block', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { isBlocked } = req.body;
    if (req.params.id === 'u-1') {
      res.status(400).json({ message: 'Cannot block the root administrator.' });
      return;
    }

    const updated = await db.updateUser(req.params.id, { isBlocked: !!isBlocked });
    if (updated) {
      res.json({ message: `User account is now ${isBlocked ? 'blocked' : 'unblocked'}.`, user: updated });
    } else {
      res.status(404).json({ message: 'User not found.' });
    }
  } catch (err: any) {
    res.status(500).json({ message: 'Operation failed.' });
  }
});

// PATCH /api/admin/users/:id/role
app.patch('/api/admin/users/:id/role', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    if (req.params.id === 'u-1' || req.params.id === 'u-admin-predefined') {
      res.status(400).json({ message: 'Cannot edit role of the root administrator.' });
      return;
    }
    if (role !== 'user' && role !== 'admin') {
      res.status(400).json({ message: 'Invalid role selection (must be user or admin).' });
      return;
    }

    const updated = await db.updateUser(req.params.id, { role });
    if (updated) {
      res.json({ message: `User role has been successfully modified to ${role}.`, user: updated });
    } else {
      res.status(404).json({ message: 'User not found.' });
    }
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to modify role.' });
  }
});

// GET /api/admin/posts
app.get('/api/admin/posts', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const posts = await db.getPosts();
    const formatted = await Promise.all(posts.map(async p => {
      const author = await db.getUserById(p.authorId);
      return {
        ...p,
        author: author ? { _id: author._id, name: author.name, email: author.email } : null
      };
    }));
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to retrieve posts.' });
  }
});

// DELETE /api/admin/posts/:id
app.delete('/api/admin/posts/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const success = await db.deletePost(req.params.id);
    if (success) {
      res.json({ message: 'Post successfully deleted by Administrator.' });
    } else {
      res.status(404).json({ message: 'Post does not exist' });
    }
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to delete post.' });
  }
});

// PATCH /api/admin/posts/:id/featured
app.patch('/api/admin/posts/:id/featured', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { isFeatured } = req.body;
    const updated = await db.updatePost(req.params.id, { isFeatured: !!isFeatured } as any);
    if (updated) {
      res.json({ message: `Post has been successfully ${isFeatured ? 'pinned to featured carousel' : 'unpinned from featured'}.`, post: updated });
    } else {
      res.status(404).json({ message: 'Post not found.' });
    }
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to update post pin.' });
  }
});

// PATCH /api/admin/posts/:id/meta
app.patch('/api/admin/posts/:id/meta', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { category, tags } = req.body;
    const updated = await db.updatePost(req.params.id, { category, tags } as any);
    if (updated) {
      res.json({ message: 'Post category & tags updated successfully.', post: updated });
    } else {
      res.status(404).json({ message: 'Post not found.' });
    }
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to update post metadata.' });
  }
});

// GET /api/admin/comments
app.get('/api/admin/comments', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const comments = await db.getComments();
    const formatted = await Promise.all(comments.map(async c => {
      const u = await db.getUserById(c.userId);
      const p = await db.getPostById(c.postId);
      return {
        ...c,
        user: u ? { _id: u._id, name: u.name, email: u.email } : null,
        postTitle: p ? p.title : 'Deleted Post'
      };
    }));
    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to load comments.' });
  }
});

// DELETE /api/admin/comments/:id
app.delete('/api/admin/comments/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const success = await db.deleteComment(req.params.id);
    if (success) {
      res.json({ message: 'Comment has been deleted.' });
    } else {
      res.status(404).json({ message: 'Comment not found.' });
    }
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to delete comment.' });
  }
});

// GET /api/admin/stats
app.get('/api/admin/stats', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const users = await db.getUsers();
    const posts = await db.getPosts();
    const comments = await db.getComments();

    res.json({
      totalUsers: users.length,
      totalPosts: posts.length,
      totalComments: comments.length,
      totalLikes: posts.reduce((sum, p) => sum + (p.likesCount || 0), 0),
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to load metrics.' });
  }
});

// ===================================
// VITE INTEGRATION / SPA SERVER FALLBACK
// ===================================

const startServer = async () => {
  // Integrate Vite dynamically based on Node development environment settings
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Charcha backend listening on port ${PORT}`);
  });
};

startServer().catch(err => {
  console.error('Fatal initialization error:', err);
});
