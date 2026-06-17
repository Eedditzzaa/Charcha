import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { auth, firestoreDb } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  role: 'user' | 'admin';
  isVerified: boolean;
}

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  theme: 'light' | 'dark';
  toasts: ToastMessage[];
  isAdminMode: boolean;
  setIsAdminMode: (mode: boolean) => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  toggleTheme: () => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isAdminModeState, setIsAdminModeState] = useState<boolean>(() => {
    const saved = localStorage.getItem('charcha_is_admin_mode');
    return saved !== 'false';
  });

  const setIsAdminMode = (mode: boolean) => {
    setIsAdminModeState(mode);
    localStorage.setItem('charcha_is_admin_mode', String(mode));
  };

  const isAdminMode = !!(user && user.role === 'admin' && isAdminModeState);

  // Show dynamic toast
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Toggle Theme
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('charcha_theme', nextTheme);
  };

  // Login
  const login = (jwtToken: string, loggedInUser: User) => {
    setToken(jwtToken);
    setUser(loggedInUser);
    localStorage.setItem('charcha_token', jwtToken);
    localStorage.setItem('charcha_user', JSON.stringify(loggedInUser));
    if (loggedInUser.role === 'admin') {
      setIsAdminMode(true);
    }
    // Set default Authorization header
    axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
    showToast(`Welcome back, ${loggedInUser.name}!`, 'success');
  };

  // Logout
  const logout = async () => {
    try {
      await auth.signOut();
    } catch (e) {
      console.error('Firebase signOut error:', e);
    }
    setToken(null);
    setUser(null);
    setIsAdminMode(false);
    localStorage.removeItem('charcha_token');
    localStorage.removeItem('charcha_user');
    delete axios.defaults.headers.common['Authorization'];
    showToast('Logged out successfully.', 'info');
  };

  const updateCurrentUser = (updates: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...updates };
      setUser(updated);
      localStorage.setItem('charcha_user', JSON.stringify(updated));
    }
  };

  const refreshUser = async () => {
    // Client-side direct Firebase sync, no API route needed
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      try {
        const idToken = await firebaseUser.getIdToken(true);
        const userDocRef = doc(firestoreDb, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userProfile = { _id: firebaseUser.uid, ...userDocSnap.data() } as User;
          setUser(userProfile);
          setToken(idToken);
          localStorage.setItem('charcha_token', idToken);
          localStorage.setItem('charcha_user', JSON.stringify(userProfile));
        }
      } catch (err) {
        console.error('Failed to manually refresh user token:', err);
      }
    }
  };

  // Init theme & credentials
  useEffect(() => {
    // 1. Theme initialization
    const savedTheme = localStorage.getItem('charcha_theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // Default to Elegant Dark
      setTheme('dark');
    }

    // 2. Auth initialization using direct Firebase Authentication
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          const userDocRef = doc(firestoreDb, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userProfile = { _id: firebaseUser.uid, ...userDocSnap.data() } as User;
            setUser(userProfile);
            setToken(idToken);
            localStorage.setItem('charcha_token', idToken);
            localStorage.setItem('charcha_user', JSON.stringify(userProfile));
            axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
          } else {
            // Profile doc doesn't exist yet, wait or construct default
            const emailUsername = firebaseUser.email?.toLowerCase().split('@')[0] || 'user';
            const fallbackProfile = {
              _id: firebaseUser.uid,
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || emailUsername,
              username: emailUsername,
              email: firebaseUser.email || '',
              avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(firebaseUser.email || '')}`,
              profileImage: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(firebaseUser.email || '')}`,
              bio: 'New Charcha member!',
              role: (firebaseUser.email?.toLowerCase() === 'adminshiva@charcha.com' ? 'admin' : 'user') as 'admin' | 'user',
              googleId: null,
              isVerified: true,
              isBlocked: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            } as any;
            setUser(fallbackProfile);
            setToken(idToken);
            localStorage.setItem('charcha_token', idToken);
            localStorage.setItem('charcha_user', JSON.stringify(fallbackProfile));
            axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
          }
        } catch (err) {
          console.error('Failed to load user profile from Firestore:', err);
        }
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('charcha_token');
        localStorage.removeItem('charcha_user');
        delete axios.defaults.headers.common['Authorization'];
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync theme changes with body element selectors
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.backgroundColor = '#000000';
    } else {
      root.classList.remove('dark');
      root.style.backgroundColor = '#E6EAF3';
    }
  }, [theme]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        theme,
        toasts,
        isAdminMode,
        setIsAdminMode,
        showToast,
        removeToast,
        toggleTheme,
        login,
        logout,
        updateCurrentUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
