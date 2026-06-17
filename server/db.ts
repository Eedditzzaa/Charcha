import { initializeApp } from 'firebase/app';
import { 
  getFirestore, doc, getDoc, getDocs, collection, query, where, 
  setDoc, updateDoc, deleteDoc, limit
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import crypto from 'crypto';

// Initialize Firebase Core & Firestore connection
const app = initializeApp(firebaseConfig);
export const firestoreDb = getFirestore(app);

// Define DB Types matching collections and application states
export interface User {
  _id: string; // unique UID
  uid: string; // duplicate for collection spec fields
  name: string;
  username: string; // derived or unique hand-off
  email: string;
  password?: string;
  avatar: string; // default profile placeholder
  profileImage: string; // specified profile spec
  bio: string;
  role: 'user' | 'admin';
  googleId: string | null;
  isVerified: boolean;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  _id: string;
  title: string;
  slug: string;
  content: string;
  featuredImage: string; // design variable
  coverImage: string; // spec mapping
  authorId: string; // reference to user
  authorName: string; // stored name as requested
  category: string;
  tags: string[];
  status: 'draft' | 'published';
  likesCount: number;
  commentsCount: number;
  isFeatured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  postId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface Like {
  _id: string;
  postId: string;
  userId: string;
}

export interface Bookmark {
  _id: string;
  userId: string;
  postId: string;
  savedAt: string;
}

export interface VerificationCode {
  _id: string;
  email: string;
  code: string;
  createdAt: string;
}

// ----------------------------------------------------
// Core Integration Skill Compliant Error Handlers
// ----------------------------------------------------
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ----------------------------------------------------
// Database Adapter Class connected directly to Firestore
// ----------------------------------------------------
class Database {
  private inMemoryVerificationCodes = new Map<string, string>();
  private predefinedUsers: Record<string, User> = {
    'u-1': {
      _id: 'u-1',
      uid: 'u-1',
      name: 'Shiva Admin',
      username: 'editorshiva490',
      email: 'adminshiva@charcha.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      password: crypto.createHash('sha256').update('Shiva@123').digest('hex'),
      bio: 'Lead Developer and Founder of Charcha. Passionate about community building.',
      role: 'admin',
      googleId: null,
      isVerified: true,
      isBlocked: false,
      createdAt: '2026-06-17T10:48:46Z',
      updatedAt: '2026-06-17T10:48:46Z',
    },
    'u-admin-predefined': {
      _id: 'u-admin-predefined',
      uid: 'u-admin-predefined',
      name: 'Shiva Admin',
      username: 'editorshiva490',
      email: 'adminshiva@charcha.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      password: crypto.createHash('sha256').update('Shiva@123').digest('hex'),
      bio: 'Lead Developer and Founder of Charcha. Passionate about community building.',
      role: 'admin',
      googleId: null,
      isVerified: true,
      isBlocked: false,
      createdAt: '2026-06-17T10:48:46Z',
      updatedAt: '2026-06-17T10:48:46Z',
    },
    'u-2': {
      _id: 'u-2',
      uid: 'u-2',
      name: 'Aarav Mehta',
      username: 'aarav',
      email: 'aarav@charcha.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
      password: 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f',
      bio: 'Tech enthusiast, writer, and tea lover. I write about React, Node, and Web3.',
      role: 'user',
      googleId: null,
      isVerified: true,
      isBlocked: false,
      createdAt: '2026-06-17T10:48:46Z',
      updatedAt: '2026-06-17T10:48:46Z',
    },
    'u-3': {
      _id: 'u-3',
      uid: 'u-3',
      name: 'Neha Sen',
      username: 'neha',
      email: 'neha@charcha.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
      profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
      password: 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f',
      bio: 'UX Designer & Content Strategist. Believes in human-centric design processes.',
      role: 'user',
      googleId: null,
      isVerified: true,
      isBlocked: false,
      createdAt: '2026-06-17T10:48:46Z',
      updatedAt: '2026-06-17T10:48:46Z',
    }
  };

  constructor() {
    this.checkAndSeed();
  }

  // Automatic developer data seeding if Firestore database is empty
  async checkAndSeed() {
    try {
      const snap = await getDocs(query(collection(firestoreDb, 'users'), limit(1)));
      if (snap.empty) {
        console.log('🌱 Firestore database is empty. Seeding initial data...');
        await this.runSeeds();
      }
    } catch (err) {
      console.warn('⚠️ Seeding check failed. Continuing normally:', err);
    }
  }

  private async runSeeds() {
    const now = new Date().toISOString();
    
    const seedUsers: User[] = [
      {
        _id: 'u-1',
        uid: 'u-1',
        name: 'Shiva Admin',
        username: 'editorshiva490',
        email: 'adminshiva@charcha.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
        password: crypto.createHash('sha256').update('Shiva@123').digest('hex'),
        bio: 'Lead Developer and Founder of Charcha. Passionate about community building.',
        role: 'admin',
        googleId: null,
        isVerified: true,
        isBlocked: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: 'u-2',
        uid: 'u-2',
        name: 'Aarav Mehta',
        username: 'aarav',
        email: 'aarav@charcha.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
        password: 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f',
        bio: 'Tech enthusiast, writer, and tea lover. I write about React, Node, and Web3.',
        role: 'user',
        googleId: null,
        isVerified: true,
        isBlocked: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: 'u-3',
        uid: 'u-3',
        name: 'Neha Sen',
        username: 'neha',
        email: 'neha@charcha.com',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
        profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
        password: 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f',
        bio: 'UX Designer & Content Strategist. Believes in human-centric design processes.',
        role: 'user',
        googleId: null,
        isVerified: true,
        isBlocked: false,
        createdAt: now,
        updatedAt: now,
      }
    ];

    const seedPosts: Post[] = [
      {
        _id: 'p-1',
        title: 'Building Inclusive Online Communities',
        slug: 'building-inclusive-online-communities',
        content: 'Online spaces are the coffee shops of the 21st century. To make a digital community thrive, we need more than just software—we need empathy, clear guidelines, and active facilitation. Charcha was created with the express goal of allowing people to safely and constructively express ideas, start interesting discussions, and organize knowledge. In this blog, we explore the core principles of building high-engagement, diverse, and respectful forums.',
        featuredImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop',
        coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop',
        authorId: 'u-1',
        authorName: 'Shiva Admin',
        status: 'published',
        likesCount: 2,
        commentsCount: 2,
        category: 'Community',
        tags: ['web', 'community', 'charcha'],
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: 'p-2',
        title: 'Why I Switched to Tailwind CSS v4',
        slug: 'why-i-switched-to-tailwind-css-v4',
        content: 'Tailwind v4 is an absolute beast when it comes to performance and developer environment setup. The introduction of CSS-first configuration makes editing utility definitions as easy as importing `@import "tailwindcss";` and setting variables right in your `.css` wrapper. Gone are the days of giant custom config files clogging the root path of your repository. In this technical review, I analyze build speeds, size gains, and the seamless integration with Vite.',
        featuredImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800&auto=format&fit=crop',
        coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800&auto=format&fit=crop',
        authorId: 'u-2',
        authorName: 'Aarav Mehta',
        status: 'published',
        likesCount: 1,
        commentsCount: 1,
        category: 'Tech Stack',
        tags: ['css', 'tailwind', 'frontend'],
        createdAt: now,
        updatedAt: now,
      }
    ];

    const seedComments: Comment[] = [
      {
        _id: 'c-1',
        postId: 'p-1',
        userId: 'u-2',
        userName: 'Aarav Mehta',
        content: 'This is super spot on! Inclusive communities need visual standards and moderation models that support creative thinkers.',
        createdAt: now,
      },
      {
        _id: 'c-2',
        postId: 'p-1',
        userId: 'u-3',
        userName: 'Neha Sen',
        content: 'Really loved this article, Shiva. Looking forward to see Charcha grow.',
        createdAt: now,
      },
      {
        _id: 'c-3',
        postId: 'p-2',
        userId: 'u-1',
        userName: 'Shiva Admin',
        content: 'I agree, the build times for Tailwind v4 with the Vite plugin are absolutely lightning fast.',
        createdAt: now,
      }
    ];

    const seedLikes: Like[] = [
      { _id: 'l-1', postId: 'p-1', userId: 'u-2' },
      { _id: 'l-2', postId: 'p-1', userId: 'u-3' },
      { _id: 'l-3', postId: 'p-2', userId: 'u-1' }
    ];

    for (const u of seedUsers) {
      await setDoc(doc(firestoreDb, 'users', u._id), u);
    }
    for (const p of seedPosts) {
      await setDoc(doc(firestoreDb, 'posts', p._id), p);
    }
    for (const c of seedComments) {
      await setDoc(doc(firestoreDb, 'comments', c._id), c);
    }
    for (const l of seedLikes) {
      await setDoc(doc(firestoreDb, 'likes', l._id), l);
    }

    console.log('✅ Firestore seeding completed safely!');
  }

  // ----------------------------------------------------
  // USER CRUD
  // ----------------------------------------------------
  async getUsers(): Promise<User[]> {
    const p = 'users';
    try {
      const snap = await getDocs(collection(firestoreDb, p));
      return snap.docs.map(d => ({ _id: d.id, ...d.data() } as User));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, p);
    }
  }

  async getUserById(id: string): Promise<User | undefined> {
    if (this.predefinedUsers[id]) {
      return this.predefinedUsers[id];
    }
    const p = `users/${id}`;
    try {
      const snap = await getDoc(doc(firestoreDb, 'users', id));
      if (!snap.exists()) return undefined;
      return { _id: snap.id, ...snap.data() } as User;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, p);
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const cleanEmail = email.toLowerCase().trim();
    const predefined = Object.values(this.predefinedUsers).find(u => u.email.toLowerCase() === cleanEmail);
    if (predefined) {
      return predefined;
    }
    const p = 'users';
    try {
      const q = query(collection(firestoreDb, 'users'), where('email', '==', cleanEmail));
      const snap = await getDocs(q);
      if (snap.empty) return undefined;
      const d = snap.docs[0];
      return { _id: d.id, ...d.data() } as User;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, p + '?email=' + email);
    }
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const p = 'users';
    try {
      const q = query(collection(firestoreDb, 'users'), where('googleId', '==', googleId));
      const snap = await getDocs(q);
      if (snap.empty) return undefined;
      const d = snap.docs[0];
      return { _id: d.id, ...d.data() } as User;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, p + '?googleId=' + googleId);
    }
  }

  async createUser(user: Omit<User, '_id' | 'createdAt' | 'updatedAt' | 'uid' | 'profileImage' | 'username'>): Promise<User> {
    const p = 'users';
    try {
      const now = new Date().toISOString();
      const nextId = 'u-' + Math.random().toString(36).substr(2, 9);
      const emailUsername = user.email.toLowerCase().split('@')[0];
      const newUser: User = {
        ...user,
        _id: nextId,
        uid: nextId,
        username: emailUsername,
        avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`,
        profileImage: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`,
        email: user.email.toLowerCase(),
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(doc(firestoreDb, 'users', nextId), newUser);
      return newUser;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, p);
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const p = `users/${id}`;
    try {
      const userRef = doc(firestoreDb, 'users', id);
      const snap = await getDoc(userRef);
      if (!snap.exists()) return undefined;
      
      const now = new Date().toISOString();
      const dataToSave: Partial<User> = { ...updates, updatedAt: now };
      if (updates.avatar) {
        dataToSave.profileImage = updates.avatar;
      }
      await updateDoc(userRef, dataToSave);
      
      const refreshedSnap = await getDoc(userRef);
      return { _id: refreshedSnap.id, ...refreshedSnap.data() } as User;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, p);
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    const p = `users/${id}`;
    try {
      const userRef = doc(firestoreDb, 'users', id);
      const snap = await getDoc(userRef);
      if (!snap.exists()) return false;
      
      await deleteDoc(userRef);
      
      // Cascade delete user's posts, comments, likes, bookmarks
      const postsQ = query(collection(firestoreDb, 'posts'), where('authorId', '==', id));
      const postsSnap = await getDocs(postsQ);
      for (const d of postsSnap.docs) {
        await deleteDoc(d.ref);
      }
      
      const commentsQ = query(collection(firestoreDb, 'comments'), where('userId', '==', id));
      const commentsSnap = await getDocs(commentsQ);
      for (const d of commentsSnap.docs) {
        await deleteDoc(d.ref);
      }
      
      const likesQ = query(collection(firestoreDb, 'likes'), where('userId', '==', id));
      const likesSnap = await getDocs(likesQ);
      for (const d of likesSnap.docs) {
        await deleteDoc(d.ref);
      }
      
      const bookmarksQ = query(collection(firestoreDb, 'bookmarks'), where('userId', '==', id));
      const bookmarksSnap = await getDocs(bookmarksQ);
      for (const d of bookmarksSnap.docs) {
        await deleteDoc(d.ref);
      }
      
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, p);
    }
  }

  // ----------------------------------------------------
  // POST CRUD
  // ----------------------------------------------------
  async getPosts(): Promise<Post[]> {
    const p = 'posts';
    try {
      const snap = await getDocs(collection(firestoreDb, 'posts'));
      return snap.docs.map(d => ({ _id: d.id, ...d.data() } as Post));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, p);
    }
  }

  async getPostById(id: string): Promise<Post | undefined> {
    const p = `posts/${id}`;
    try {
      const snap = await getDoc(doc(firestoreDb, 'posts', id));
      if (!snap.exists()) return undefined;
      return { _id: snap.id, ...snap.data() } as Post;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, p);
    }
  }

  async getPostBySlug(slug: string): Promise<Post | undefined> {
    const p = 'posts';
    try {
      const q = query(collection(firestoreDb, 'posts'), where('slug', '==', slug));
      const snap = await getDocs(q);
      if (snap.empty) return undefined;
      const d = snap.docs[0];
      return { _id: d.id, ...d.data() } as Post;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, p + '?slug=' + slug);
    }
  }

  async createPost(post: Omit<Post, '_id' | 'likesCount' | 'commentsCount' | 'createdAt' | 'updatedAt' | 'coverImage' | 'authorName' | 'category' | 'tags'> & { category?: string; tags?: string[] }): Promise<Post> {
    const p = 'posts';
    try {
      const now = new Date().toISOString();
      const nextId = 'p-' + Math.random().toString(36).substr(2, 9);
      
      const authorDoc = await getDoc(doc(firestoreDb, 'users', post.authorId));
      const authorName = authorDoc.exists() ? (authorDoc.data()?.name || 'Charcha Author') : 'Charcha Author';
      
      const newPost: Post = {
        ...post,
        _id: nextId,
        authorName,
        featuredImage: post.featuredImage || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=800&auto=format&fit=crop',
        coverImage: post.featuredImage || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=800&auto=format&fit=crop',
        likesCount: 0,
        commentsCount: 0,
        category: (post as any).category || 'General',
        tags: (post as any).tags || ['charcha'],
        status: post.status || 'published',
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(doc(firestoreDb, 'posts', nextId), newPost);
      return newPost;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, p);
    }
  }

  async updatePost(id: string, updates: Partial<Post>): Promise<Post | undefined> {
    const p = `posts/${id}`;
    try {
      const postRef = doc(firestoreDb, 'posts', id);
      const snap = await getDoc(postRef);
      if (!snap.exists()) return undefined;
      
      const now = new Date().toISOString();
      const dataToSave: Partial<Post> = { ...updates, updatedAt: now };
      if (updates.featuredImage) {
        dataToSave.coverImage = updates.featuredImage;
      }
      await updateDoc(postRef, dataToSave);
      
      const refreshedSnap = await getDoc(postRef);
      return { _id: refreshedSnap.id, ...refreshedSnap.data() } as Post;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, p);
    }
  }

  async deletePost(id: string): Promise<boolean> {
    const p = `posts/${id}`;
    try {
      const postRef = doc(firestoreDb, 'posts', id);
      const snap = await getDoc(postRef);
      if (!snap.exists()) return false;
      
      await deleteDoc(postRef);
      
      // Cascade-delete related comments, likes, and bookmarks
      const commentsQ = query(collection(firestoreDb, 'comments'), where('postId', '==', id));
      const commentsSnap = await getDocs(commentsQ);
      for (const d of commentsSnap.docs) {
        await deleteDoc(d.ref);
      }
      
      const likesQ = query(collection(firestoreDb, 'likes'), where('postId', '==', id));
      const likesSnap = await getDocs(likesQ);
      for (const d of likesSnap.docs) {
        await deleteDoc(d.ref);
      }
      
      const bookmarksQ = query(collection(firestoreDb, 'bookmarks'), where('postId', '==', id));
      const bookmarksSnap = await getDocs(bookmarksQ);
      for (const d of bookmarksSnap.docs) {
        await deleteDoc(d.ref);
      }
      
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, p);
    }
  }

  // ----------------------------------------------------
  // COMMENT CRUD
  // ----------------------------------------------------
  async getComments(): Promise<Comment[]> {
    const p = 'comments';
    try {
      const snap = await getDocs(collection(firestoreDb, p));
      return snap.docs.map(d => ({ _id: d.id, ...d.data() } as Comment));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, p);
    }
  }

  async getCommentById(id: string): Promise<Comment | undefined> {
    const p = `comments/${id}`;
    try {
      const snap = await getDoc(doc(firestoreDb, 'comments', id));
      if (!snap.exists()) return undefined;
      return { _id: snap.id, ...snap.data() } as Comment;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, p);
    }
  }

  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    const p = 'comments';
    try {
      const q = query(collection(firestoreDb, 'comments'), where('postId', '==', postId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ _id: d.id, ...d.data() } as Comment));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, p + '?postId=' + postId);
    }
  }

  async createComment(postId: string, userId: string, content: string): Promise<Comment> {
    const p = 'comments';
    try {
      const now = new Date().toISOString();
      const nextId = 'c-' + Math.random().toString(36).substr(2, 9);
      
      const userDoc = await getDoc(doc(firestoreDb, 'users', userId));
      const userName = userDoc.exists() ? (userDoc.data()?.name || 'Charcha Reader') : 'Charcha Reader';
      
      const comment: Comment = {
        _id: nextId,
        postId,
        userId,
        userName,
        content,
        createdAt: now,
      };
      await setDoc(doc(firestoreDb, 'comments', nextId), comment);
      
      // Increment commentsCount for post
      const postRef = doc(firestoreDb, 'posts', postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const currentCount = postSnap.data()?.commentsCount || 0;
        await updateDoc(postRef, { commentsCount: currentCount + 1 });
      }
      
      return comment;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, p);
    }
  }

  async updateComment(id: string, content: string): Promise<Comment | undefined> {
    const p = `comments/${id}`;
    try {
      const commentRef = doc(firestoreDb, 'comments', id);
      const snap = await getDoc(commentRef);
      if (!snap.exists()) return undefined;
      
      await updateDoc(commentRef, { content });
      
      const refreshedSnap = await getDoc(commentRef);
      return { _id: refreshedSnap.id, ...refreshedSnap.data() } as Comment;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, p);
    }
  }

  async deleteComment(id: string): Promise<boolean> {
    const p = `comments/${id}`;
    try {
      const commentRef = doc(firestoreDb, 'comments', id);
      const snap = await getDoc(commentRef);
      if (!snap.exists()) return false;
      
      const commentData = snap.data() as Comment;
      await deleteDoc(commentRef);
      
      // Update commentsCount for post
      const postRef = doc(firestoreDb, 'posts', commentData.postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const currentCount = postSnap.data()?.commentsCount || 0;
        await updateDoc(postRef, { commentsCount: Math.max(0, currentCount - 1) });
      }
      
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, p);
    }
  }

  // ----------------------------------------------------
  // LIKES
  // ----------------------------------------------------
  async toggleLike(postId: string, userId: string): Promise<{ liked: boolean; count: number }> {
    const p = 'likes';
    try {
      const q = query(
        collection(firestoreDb, 'likes'), 
        where('postId', '==', postId), 
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      let liked = false;
      
      if (!snap.empty) {
        await deleteDoc(snap.docs[0].ref);
      } else {
        const nextId = 'l-' + Math.random().toString(36).substr(2, 9);
        await setDoc(doc(firestoreDb, 'likes', nextId), {
          _id: nextId,
          postId,
          userId,
        });
        liked = true;
      }
      
      // Calculate current size of likes
      const countQ = query(collection(firestoreDb, 'likes'), where('postId', '==', postId));
      const countSnap = await getDocs(countQ);
      const likesCount = countSnap.size;
      
      const postRef = doc(firestoreDb, 'posts', postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        await updateDoc(postRef, { likesCount });
      }
      
      return { liked, count: likesCount };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, p);
    }
  }

  async hasLiked(postId: string, userId: string): Promise<boolean> {
    try {
      const q = query(
        collection(firestoreDb, 'likes'), 
        where('postId', '==', postId), 
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      return !snap.empty;
    } catch (error) {
      return false;
    }
  }

  // ----------------------------------------------------
  // BOOKMARKS
  // ----------------------------------------------------
  async addBookmark(postId: string, userId: string): Promise<Bookmark> {
    const p = 'bookmarks';
    try {
      const q = query(
        collection(firestoreDb, 'bookmarks'), 
        where('postId', '==', postId), 
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        return { _id: snap.docs[0].id, ...snap.docs[0].data() } as Bookmark;
      }
      
      const nextId = 'b-' + Math.random().toString(36).substr(2, 9);
      const b: Bookmark = {
        _id: nextId,
        userId,
        postId,
        savedAt: new Date().toISOString()
      };
      await setDoc(doc(firestoreDb, 'bookmarks', nextId), b);
      return b;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, p);
    }
  }

  async removeBookmark(postId: string, userId: string): Promise<boolean> {
    const p = 'bookmarks';
    try {
      const q = query(
        collection(firestoreDb, 'bookmarks'), 
        where('postId', '==', postId), 
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      if (snap.empty) return false;
      
      await deleteDoc(snap.docs[0].ref);
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, p);
    }
  }

  async getBookmarksByUserId(userId: string): Promise<Bookmark[]> {
    const p = 'bookmarks';
    try {
      const q = query(collection(firestoreDb, 'bookmarks'), where('userId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ _id: d.id, ...d.data() } as Bookmark));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, p + '?userId=' + userId);
    }
  }

  async isBookmarked(postId: string, userId: string): Promise<boolean> {
    try {
      const q = query(
        collection(firestoreDb, 'bookmarks'), 
        where('postId', '==', postId), 
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      return !snap.empty;
    } catch (error) {
      return false;
    }
  }

  // ----------------------------------------------------
  // VERIFICATION CODE CRUD (In-memory storage for email OTP flow)
  // ----------------------------------------------------
  async createVerificationCode(email: string, code: string): Promise<VerificationCode> {
    const id = 'vc-' + Math.random().toString(36).substr(2, 9);
    this.inMemoryVerificationCodes.set(email.toLowerCase(), code);
    return {
      _id: id,
      email,
      code,
      createdAt: new Date().toISOString()
    };
  }

  async getVerificationCode(email: string): Promise<string | null> {
    return this.inMemoryVerificationCodes.get(email.toLowerCase()) || null;
  }

  async clearVerificationCode(email: string): Promise<void> {
    this.inMemoryVerificationCodes.delete(email.toLowerCase());
  }
}

export const db = new Database();
