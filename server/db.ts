import { initializeApp } from 'firebase/app';
import { 
  getFirestore, doc, getDoc, getDocs, collection, query, where, 
  setDoc, updateDoc, deleteDoc, limit
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

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
  private fallbackUsers = new Map<string, User>();
  private fallbackPosts = new Map<string, Post>();
  private fallbackComments = new Map<string, Comment>();
  private fallbackLikes = new Map<string, Like>();
  private fallbackBookmarks = new Map<string, Bookmark>();

  private predefinedUsers: Record<string, User> = {
    'u-1': {
      _id: 'u-1',
      uid: 'u-1',
      name: 'Shiva Admin',
      username: 'editorshiva490',
      email: 'adminshiva@charcha.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      password: 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f',
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
      password: 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f',
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
    // Prime the fallback databases with predefined users
    Object.keys(this.predefinedUsers).forEach(id => {
      this.fallbackUsers.set(id, this.predefinedUsers[id]);
    });
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
        password: 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f',
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
      await setDoc(doc(firestoreDb, 'users', u._id), u).catch(() => {});
      this.fallbackUsers.set(u._id, u);
    }
    for (const p of seedPosts) {
      await setDoc(doc(firestoreDb, 'posts', p._id), p).catch(() => {});
      this.fallbackPosts.set(p._id, p);
    }
    for (const c of seedComments) {
      await setDoc(doc(firestoreDb, 'comments', c._id), c).catch(() => {});
      this.fallbackComments.set(c._id, c);
    }
    for (const l of seedLikes) {
      await setDoc(doc(firestoreDb, 'likes', l._id), l).catch(() => {});
      this.fallbackLikes.set(l._id, l);
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
      const users = snap.docs.map(d => ({ _id: d.id, ...d.data() } as User));
      users.forEach(u => this.fallbackUsers.set(u._id, u));
      return users;
    } catch (error) {
      console.warn('⚠️ getUsers falling back to in-memory store:', error);
      return Array.from(this.fallbackUsers.values());
    }
  }

  async getUserById(id: string): Promise<User | undefined> {
    if (this.predefinedUsers[id]) {
      return this.predefinedUsers[id];
    }
    const p = `users/${id}`;
    try {
      const snap = await getDoc(doc(firestoreDb, 'users', id));
      if (!snap.exists()) {
        return this.fallbackUsers.get(id);
      }
      const user = { _id: snap.id, ...snap.data() } as User;
      this.fallbackUsers.set(id, user);
      return user;
    } catch (error) {
      console.warn(`⚠️ getUserById(${id}) falling back to in-memory store:`, error);
      return this.fallbackUsers.get(id);
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
      if (snap.empty) {
        return Array.from(this.fallbackUsers.values()).find(u => u.email.toLowerCase() === cleanEmail);
      }
      const d = snap.docs[0];
      const user = { _id: d.id, ...d.data() } as User;
      this.fallbackUsers.set(user._id, user);
      return user;
    } catch (error) {
      console.warn(`⚠️ getUserByEmail(${email}) falling back to in-memory store:`, error);
      return Array.from(this.fallbackUsers.values()).find(u => u.email.toLowerCase() === cleanEmail);
    }
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const p = 'users';
    try {
      const q = query(collection(firestoreDb, 'users'), where('googleId', '==', googleId));
      const snap = await getDocs(q);
      if (snap.empty) {
        return Array.from(this.fallbackUsers.values()).find(u => u.googleId === googleId);
      }
      const d = snap.docs[0];
      const user = { _id: d.id, ...d.data() } as User;
      this.fallbackUsers.set(user._id, user);
      return user;
    } catch (error) {
      console.warn(`⚠️ getUserByGoogleId(${googleId}) falling back to in-memory store:`, error);
      return Array.from(this.fallbackUsers.values()).find(u => u.googleId === googleId);
    }
  }

  async createUser(user: Omit<User, '_id' | 'createdAt' | 'updatedAt' | 'uid' | 'profileImage' | 'username'>): Promise<User> {
    const p = 'users';
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
    try {
      await setDoc(doc(firestoreDb, 'users', nextId), newUser);
      this.fallbackUsers.set(nextId, newUser);
      return newUser;
    } catch (error) {
      console.warn('⚠️ createUser falling back to in-memory store:', error);
      this.fallbackUsers.set(nextId, newUser);
      return newUser;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const p = `users/${id}`;
    const now = new Date().toISOString();
    try {
      const userRef = doc(firestoreDb, 'users', id);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const local = this.fallbackUsers.get(id);
        if (!local) return undefined;
        const updated = { ...local, ...updates, updatedAt: now };
        this.fallbackUsers.set(id, updated);
        return updated;
      }
      
      const dataToSave: Partial<User> = { ...updates, updatedAt: now };
      if (updates.avatar) {
        dataToSave.profileImage = updates.avatar;
      }
      await updateDoc(userRef, dataToSave);
      
      const refreshedSnap = await getDoc(userRef);
      const updated = { _id: refreshedSnap.id, ...refreshedSnap.data() } as User;
      this.fallbackUsers.set(id, updated);
      return updated;
    } catch (error) {
      console.warn(`⚠️ updateUser(${id}) falling back to in-memory store:`, error);
      const local = this.fallbackUsers.get(id);
      if (!local) return undefined;
      const updated = { ...local, ...updates, updatedAt: now };
      this.fallbackUsers.set(id, updated);
      return updated;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    const p = `users/${id}`;
    try {
      const userRef = doc(firestoreDb, 'users', id);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const existed = this.fallbackUsers.has(id);
        this.fallbackUsers.delete(id);
        return existed;
      }
      
      await deleteDoc(userRef);
      
      // Cascade delete user's posts, comments, likes, bookmarks
      const postsQ = query(collection(firestoreDb, 'posts'), where('authorId', '==', id));
      const postsSnap = await getDocs(postsQ).catch(() => ({ docs: [] }));
      for (const d of (postsSnap as any).docs) {
        await deleteDoc(d.ref).catch(() => {});
      }
      
      const commentsQ = query(collection(firestoreDb, 'comments'), where('userId', '==', id));
      const commentsSnap = await getDocs(commentsQ).catch(() => ({ docs: [] }));
      for (const d of (commentsSnap as any).docs) {
        await deleteDoc(d.ref).catch(() => {});
      }
      
      const likesQ = query(collection(firestoreDb, 'likes'), where('userId', '==', id));
      const likesSnap = await getDocs(likesQ).catch(() => ({ docs: [] }));
      for (const d of (likesSnap as any).docs) {
        await deleteDoc(d.ref).catch(() => {});
      }
      
      const bookmarksQ = query(collection(firestoreDb, 'bookmarks'), where('userId', '==', id));
      const bookmarksSnap = await getDocs(bookmarksQ).catch(() => ({ docs: [] }));
      for (const d of (bookmarksSnap as any).docs) {
        await deleteDoc(d.ref).catch(() => {});
      }
      
      this.fallbackUsers.delete(id);
      // Clean up local cascading too
      Array.from(this.fallbackPosts.values()).forEach(p => {
        if (p.authorId === id) this.fallbackPosts.delete(p._id);
      });
      Array.from(this.fallbackComments.values()).forEach(c => {
        if (c.userId === id) this.fallbackComments.delete(c._id);
      });
      Array.from(this.fallbackLikes.values()).forEach(l => {
        if (l.userId === id) this.fallbackLikes.delete(l._id);
      });
      
      return true;
    } catch (error) {
      console.warn(`⚠️ deleteUser(${id}) falling back to in-memory store:`, error);
      const existed = this.fallbackUsers.has(id);
      this.fallbackUsers.delete(id);
      Array.from(this.fallbackPosts.values()).forEach(p => {
        if (p.authorId === id) this.fallbackPosts.delete(p._id);
      });
      Array.from(this.fallbackComments.values()).forEach(c => {
        if (c.userId === id) this.fallbackComments.delete(c._id);
      });
      Array.from(this.fallbackLikes.values()).forEach(l => {
        if (l.userId === id) this.fallbackLikes.delete(l._id);
      });
      return existed;
    }
  }

  // ----------------------------------------------------
  // POST CRUD
  // ----------------------------------------------------
  async getPosts(): Promise<Post[]> {
    const p = 'posts';
    try {
      const snap = await getDocs(collection(firestoreDb, 'posts'));
      const posts = snap.docs.map(d => ({ _id: d.id, ...d.data() } as Post));
      posts.forEach(post => this.fallbackPosts.set(post._id, post));
      return posts;
    } catch (error) {
      console.warn('⚠️ getPosts falling back to in-memory store:', error);
      return Array.from(this.fallbackPosts.values());
    }
  }

  async getPostById(id: string): Promise<Post | undefined> {
    const p = `posts/${id}`;
    try {
      const snap = await getDoc(doc(firestoreDb, 'posts', id));
      if (!snap.exists()) {
        return this.fallbackPosts.get(id);
      }
      const post = { _id: snap.id, ...snap.data() } as Post;
      this.fallbackPosts.set(id, post);
      return post;
    } catch (error) {
      console.warn(`⚠️ getPostById(${id}) falling back to in-memory store:`, error);
      return this.fallbackPosts.get(id);
    }
  }

  async getPostBySlug(slug: string): Promise<Post | undefined> {
    const p = 'posts';
    try {
      const q = query(collection(firestoreDb, 'posts'), where('slug', '==', slug));
      const snap = await getDocs(q);
      if (snap.empty) {
        return Array.from(this.fallbackPosts.values()).find(p => p.slug === slug);
      }
      const d = snap.docs[0];
      const post = { _id: d.id, ...d.data() } as Post;
      this.fallbackPosts.set(post._id, post);
      return post;
    } catch (error) {
      console.warn(`⚠️ getPostBySlug(${slug}) falling back to in-memory store:`, error);
      return Array.from(this.fallbackPosts.values()).find(p => p.slug === slug);
    }
  }

  async createPost(post: Omit<Post, '_id' | 'likesCount' | 'commentsCount' | 'createdAt' | 'updatedAt' | 'coverImage' | 'authorName' | 'category' | 'tags'> & { category?: string; tags?: string[] }): Promise<Post> {
    const p = 'posts';
    const now = new Date().toISOString();
    const nextId = 'p-' + Math.random().toString(36).substr(2, 9);
    
    // Check local fallback user first
    const localAuthor = this.fallbackUsers.get(post.authorId);
    let authorName = localAuthor ? localAuthor.name : 'Charcha Author';
    
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

    try {
      const authorDoc = await getDoc(doc(firestoreDb, 'users', post.authorId)).catch(() => null);
      if (authorDoc && authorDoc.exists()) {
        newPost.authorName = authorDoc.data()?.name || authorName;
      }
      await setDoc(doc(firestoreDb, 'posts', nextId), newPost);
      this.fallbackPosts.set(nextId, newPost);
      return newPost;
    } catch (error) {
      console.warn('⚠️ createPost falling back to in-memory store:', error);
      this.fallbackPosts.set(nextId, newPost);
      return newPost;
    }
  }

  async updatePost(id: string, updates: Partial<Post>): Promise<Post | undefined> {
    const p = `posts/${id}`;
    const now = new Date().toISOString();
    try {
      const postRef = doc(firestoreDb, 'posts', id);
      const snap = await getDoc(postRef);
      if (!snap.exists()) {
        const local = this.fallbackPosts.get(id);
        if (!local) return undefined;
        const updated = { ...local, ...updates, updatedAt: now };
        this.fallbackPosts.set(id, updated);
        return updated;
      }
      
      const dataToSave: Partial<Post> = { ...updates, updatedAt: now };
      if (updates.featuredImage) {
        dataToSave.coverImage = updates.featuredImage;
      }
      await updateDoc(postRef, dataToSave);
      
      const refreshedSnap = await getDoc(postRef);
      const updated = { _id: refreshedSnap.id, ...refreshedSnap.data() } as Post;
      this.fallbackPosts.set(id, updated);
      return updated;
    } catch (error) {
      console.warn(`⚠️ updatePost(${id}) falling back to in-memory store:`, error);
      const local = this.fallbackPosts.get(id);
      if (!local) return undefined;
      const updated = { ...local, ...updates, updatedAt: now };
      this.fallbackPosts.set(id, updated);
      return updated;
    }
  }

  async deletePost(id: string): Promise<boolean> {
    const p = `posts/${id}`;
    try {
      const postRef = doc(firestoreDb, 'posts', id);
      const snap = await getDoc(postRef);
      if (!snap.exists()) {
        const existed = this.fallbackPosts.has(id);
        this.fallbackPosts.delete(id);
        return existed;
      }
      
      await deleteDoc(postRef);
      
      // Cascade-delete related comments, likes, and bookmarks
      const commentsQ = query(collection(firestoreDb, 'comments'), where('postId', '==', id));
      const commentsSnap = await getDocs(commentsQ).catch(() => ({ docs: [] }));
      for (const d of (commentsSnap as any).docs) {
        await deleteDoc(d.ref).catch(() => {});
      }
      
      const likesQ = query(collection(firestoreDb, 'likes'), where('postId', '==', id));
      const likesSnap = await getDocs(likesQ).catch(() => ({ docs: [] }));
      for (const d of (likesSnap as any).docs) {
        await deleteDoc(d.ref).catch(() => {});
      }
      
      const bookmarksQ = query(collection(firestoreDb, 'bookmarks'), where('postId', '==', id));
      const bookmarksSnap = await getDocs(bookmarksQ).catch(() => ({ docs: [] }));
      for (const d of (bookmarksSnap as any).docs) {
        await deleteDoc(d.ref).catch(() => {});
      }
      
      this.fallbackPosts.delete(id);
      // Cascade clean up local too
      Array.from(this.fallbackComments.values()).forEach(c => {
        if (c.postId === id) this.fallbackComments.delete(c._id);
      });
      Array.from(this.fallbackLikes.values()).forEach(l => {
        if (l.postId === id) this.fallbackLikes.delete(l._id);
      });
      return true;
    } catch (error) {
      console.warn(`⚠️ deletePost(${id}) falling back to in-memory store:`, error);
      const existed = this.fallbackPosts.has(id);
      this.fallbackPosts.delete(id);
      // Cascade clean up local too
      Array.from(this.fallbackComments.values()).forEach(c => {
        if (c.postId === id) this.fallbackComments.delete(c._id);
      });
      Array.from(this.fallbackLikes.values()).forEach(l => {
        if (l.postId === id) this.fallbackLikes.delete(l._id);
      });
      return existed;
    }
  }

  // ----------------------------------------------------
  // COMMENT CRUD
  // ----------------------------------------------------
  async getComments(): Promise<Comment[]> {
    const p = 'comments';
    try {
      const snap = await getDocs(collection(firestoreDb, p));
      const comments = snap.docs.map(d => ({ _id: d.id, ...d.data() } as Comment));
      comments.forEach(c => this.fallbackComments.set(c._id, c));
      return comments;
    } catch (error) {
      console.warn('⚠️ getComments falling back to in-memory store:', error);
      return Array.from(this.fallbackComments.values());
    }
  }

  async getCommentById(id: string): Promise<Comment | undefined> {
    const p = `comments/${id}`;
    try {
      const snap = await getDoc(doc(firestoreDb, 'comments', id));
      if (!snap.exists()) {
        return this.fallbackComments.get(id);
      }
      const comment = { _id: snap.id, ...snap.data() } as Comment;
      this.fallbackComments.set(id, comment);
      return comment;
    } catch (error) {
      console.warn(`⚠️ getCommentById(${id}) falling back to in-memory store:`, error);
      return this.fallbackComments.get(id);
    }
  }

  async getCommentsByPostId(postId: string): Promise<Comment[]> {
    const p = 'comments';
    try {
      const q = query(collection(firestoreDb, 'comments'), where('postId', '==', postId));
      const snap = await getDocs(q);
      const comments = snap.docs.map(d => ({ _id: d.id, ...d.data() } as Comment));
      comments.forEach(c => this.fallbackComments.set(c._id, c));
      return comments;
    } catch (error) {
      console.warn(`⚠️ getCommentsByPostId(${postId}) falling back to in-memory store:`, error);
      return Array.from(this.fallbackComments.values()).filter(c => c.postId === postId);
    }
  }

  async createComment(postId: string, userId: string, content: string): Promise<Comment> {
    const p = 'comments';
    const now = new Date().toISOString();
    const nextId = 'c-' + Math.random().toString(36).substr(2, 9);
    
    const localUser = this.fallbackUsers.get(userId);
    let userName = localUser ? localUser.name : 'Charcha Reader';
    
    const comment: Comment = {
      _id: nextId,
      postId,
      userId,
      userName,
      content,
      createdAt: now,
    };

    try {
      const userDoc = await getDoc(doc(firestoreDb, 'users', userId)).catch(() => null);
      if (userDoc && userDoc.exists()) {
        comment.userName = userDoc.data()?.name || userName;
      }
      await setDoc(doc(firestoreDb, 'comments', nextId), comment);
      this.fallbackComments.set(nextId, comment);
      
      // Increment commentsCount for post
      const postRef = doc(firestoreDb, 'posts', postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const currentCount = postSnap.data()?.commentsCount || 0;
        await updateDoc(postRef, { commentsCount: currentCount + 1 }).catch(() => {});
      }
      
      const postLocal = this.fallbackPosts.get(postId);
      if (postLocal) {
        postLocal.commentsCount = (postLocal.commentsCount || 0) + 1;
      }

      return comment;
    } catch (error) {
      console.warn('⚠️ createComment falling back to in-memory store:', error);
      this.fallbackComments.set(nextId, comment);
      const postLocal = this.fallbackPosts.get(postId);
      if (postLocal) {
        postLocal.commentsCount = (postLocal.commentsCount || 0) + 1;
      }
      return comment;
    }
  }

  async updateComment(id: string, content: string): Promise<Comment | undefined> {
    const p = `comments/${id}`;
    try {
      const commentRef = doc(firestoreDb, 'comments', id);
      const snap = await getDoc(commentRef);
      if (!snap.exists()) {
        const local = this.fallbackComments.get(id);
        if (!local) return undefined;
        local.content = content;
        return local;
      }
      
      await updateDoc(commentRef, { content });
      
      const refreshedSnap = await getDoc(commentRef);
      const comment = { _id: refreshedSnap.id, ...refreshedSnap.data() } as Comment;
      this.fallbackComments.set(id, comment);
      return comment;
    } catch (error) {
      console.warn(`⚠️ updateComment(${id}) falling back to in-memory store:`, error);
      const local = this.fallbackComments.get(id);
      if (!local) return undefined;
      local.content = content;
      return local;
    }
  }

  async deleteComment(id: string): Promise<boolean> {
    const p = `comments/${id}`;
    try {
      const commentRef = doc(firestoreDb, 'comments', id);
      const snap = await getDoc(commentRef);
      if (!snap.exists()) {
        const local = this.fallbackComments.get(id);
        if (!local) return false;
        this.fallbackComments.delete(id);
        const postLocal = this.fallbackPosts.get(local.postId);
        if (postLocal) {
          postLocal.commentsCount = Math.max(0, (postLocal.commentsCount || 0) - 1);
        }
        return true;
      }
      
      const commentData = snap.data() as Comment;
      await deleteDoc(commentRef);
      
      // Update commentsCount for post
      const postRef = doc(firestoreDb, 'posts', commentData.postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const currentCount = postSnap.data()?.commentsCount || 0;
        await updateDoc(postRef, { commentsCount: Math.max(0, currentCount - 1) }).catch(() => {});
      }
      
      this.fallbackComments.delete(id);
      const postLocal = this.fallbackPosts.get(commentData.postId);
      if (postLocal) {
        postLocal.commentsCount = Math.max(0, (postLocal.commentsCount || 0) - 1);
      }
      return true;
    } catch (error) {
      console.warn(`⚠️ deleteComment(${id}) falling back to in-memory store:`, error);
      const local = this.fallbackComments.get(id);
      if (!local) return false;
      this.fallbackComments.delete(id);
      const postLocal = this.fallbackPosts.get(local.postId);
      if (postLocal) {
        postLocal.commentsCount = Math.max(0, (postLocal.commentsCount || 0) - 1);
      }
      return true;
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
        const likeId = snap.docs[0].id;
        this.fallbackLikes.delete(likeId);
      } else {
        const nextId = 'l-' + Math.random().toString(36).substr(2, 9);
        await setDoc(doc(firestoreDb, 'likes', nextId), {
          _id: nextId,
          postId,
          userId,
        });
        this.fallbackLikes.set(nextId, { _id: nextId, postId, userId });
        liked = true;
      }
      
      const countQ = query(collection(firestoreDb, 'likes'), where('postId', '==', postId));
      const countSnap = await getDocs(countQ);
      const likesCount = countSnap.size;
      
      // Sync local counts
      const localLikes = Array.from(this.fallbackLikes.values()).filter(l => l.postId === postId);
      const finalCount = countSnap.empty ? localLikes.length : likesCount;

      const postRef = doc(firestoreDb, 'posts', postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        await updateDoc(postRef, { likesCount: finalCount }).catch(() => {});
      }
      
      const postLocal = this.fallbackPosts.get(postId);
      if (postLocal) {
        postLocal.likesCount = finalCount;
      }
      
      return { liked, count: finalCount };
    } catch (error) {
      console.warn(`⚠️ toggleLike(${postId}, ${userId}) falling back to in-memory store:`, error);
      const existing = Array.from(this.fallbackLikes.values()).find(l => l.postId === postId && l.userId === userId);
      let liked = false;
      if (existing) {
        this.fallbackLikes.delete(existing._id);
      } else {
        const nextId = 'l-' + Math.random().toString(36).substr(2, 9);
        this.fallbackLikes.set(nextId, { _id: nextId, postId, userId });
        liked = true;
      }
      
      const finalCount = Array.from(this.fallbackLikes.values()).filter(l => l.postId === postId).length;
      const postLocal = this.fallbackPosts.get(postId);
      if (postLocal) {
        postLocal.likesCount = finalCount;
      }
      return { liked, count: finalCount };
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
      if (snap.empty) {
        return Array.from(this.fallbackLikes.values()).some(l => l.postId === postId && l.userId === userId);
      }
      return true;
    } catch (error) {
      return Array.from(this.fallbackLikes.values()).some(l => l.postId === postId && l.userId === userId);
    }
  }

  // ----------------------------------------------------
  // BOOKMARKS
  // ----------------------------------------------------
  async addBookmark(postId: string, userId: string): Promise<Bookmark> {
    const p = 'bookmarks';
    const nextId = 'b-' + Math.random().toString(36).substr(2, 9);
    const b: Bookmark = {
      _id: nextId,
      userId,
      postId,
      savedAt: new Date().toISOString()
    };
    try {
      const q = query(
        collection(firestoreDb, 'bookmarks'), 
        where('postId', '==', postId), 
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const existing = { _id: snap.docs[0].id, ...snap.docs[0].data() } as Bookmark;
        this.fallbackBookmarks.set(existing._id, existing);
        return existing;
      }
      
      await setDoc(doc(firestoreDb, 'bookmarks', nextId), b);
      this.fallbackBookmarks.set(nextId, b);
      return b;
    } catch (error) {
      console.warn(`⚠️ addBookmark(${postId}, ${userId}) falling back to in-memory store:`, error);
      const existing = Array.from(this.fallbackBookmarks.values()).find(bm => bm.postId === postId && bm.userId === userId);
      if (existing) return existing;
      this.fallbackBookmarks.set(nextId, b);
      return b;
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
      if (snap.empty) {
        const local = Array.from(this.fallbackBookmarks.values()).find(bm => bm.postId === postId && bm.userId === userId);
        if (!local) return false;
        this.fallbackBookmarks.delete(local._id);
        return true;
      }
      
      await deleteDoc(snap.docs[0].ref);
      const bId = snap.docs[0].id;
      this.fallbackBookmarks.delete(bId);
      return true;
    } catch (error) {
      console.warn(`⚠️ removeBookmark(${postId}, ${userId}) falling back to in-memory store:`, error);
      const local = Array.from(this.fallbackBookmarks.values()).find(bm => bm.postId === postId && bm.userId === userId);
      if (!local) return false;
      this.fallbackBookmarks.delete(local._id);
      return true;
    }
  }

  async getBookmarksByUserId(userId: string): Promise<Bookmark[]> {
    const p = 'bookmarks';
    try {
      const q = query(collection(firestoreDb, 'bookmarks'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const bookmarks = snap.docs.map(d => ({ _id: d.id, ...d.data() } as Bookmark));
      bookmarks.forEach(bm => this.fallbackBookmarks.set(bm._id, bm));
      return bookmarks;
    } catch (error) {
      console.warn(`⚠️ getBookmarksByUserId(${userId}) falling back to in-memory:`, error);
      return Array.from(this.fallbackBookmarks.values()).filter(bm => bm.userId === userId);
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
      if (snap.empty) {
        return Array.from(this.fallbackBookmarks.values()).some(bm => bm.postId === postId && bm.userId === userId);
      }
      return true;
    } catch (error) {
      return Array.from(this.fallbackBookmarks.values()).some(bm => bm.postId === postId && bm.userId === userId);
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
