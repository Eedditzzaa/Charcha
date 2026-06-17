import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

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
  const logout = () => {
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
    const savedToken = localStorage.getItem('charcha_token');
    if (!savedToken) {
      setLoading(false);
      return;
    }
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      const res = await axios.get('/api/auth/me');
      setUser(res.data.user);
      setToken(savedToken);
    } catch (err) {
      console.error('Session refresh failed', err);
      // Clean stale tokens on verification failure
      localStorage.removeItem('charcha_token');
      localStorage.removeItem('charcha_user');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
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

    // 2. Auth initialization
    const savedToken = localStorage.getItem('charcha_token');
    const savedUser = localStorage.getItem('charcha_user');
    if (savedToken && savedUser && savedUser !== 'undefined') {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      } catch (e) {
        console.error('Failed to parse saved user from localStorage:', e);
        localStorage.removeItem('charcha_user');
        localStorage.removeItem('charcha_token');
        setUser(null);
        setToken(null);
      }
    }
    
    // Call verification API to double check session freshness
    refreshUser();
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
