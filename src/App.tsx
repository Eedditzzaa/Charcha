import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ToastContainer from './components/ToastContainer';
import AdminLayout from './components/AdminLayout';
import UserLayout from './components/UserLayout';

// Pages
import Home from './pages/Home';
import Blogs from './pages/Blogs';
import SingleBlog from './pages/SingleBlog';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CreateBlog from './pages/CreateBlog';
import EditBlog from './pages/EditBlog';
import Profile from './pages/Profile';
import SavedPosts from './pages/SavedPosts';
import MyPosts from './pages/MyPosts';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';

// Helper Wrapper for Route Guard Protection
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

// Admin Route guard
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user && user.role === 'admin' ? <>{children}</> : <Navigate to="/admin-login" replace />;
}

function LayoutProvider({ children }: { children: React.ReactNode }) {
  const { isAdminMode } = useAuth();

  if (isAdminMode) {
    return <AdminLayout>{children}</AdminLayout>;
  }

  return <UserLayout>{children}</UserLayout>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <LayoutProvider>
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<Home />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/posts/:slug" element={<SingleBlog />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin-login" element={<AdminLogin />} />

            {/* Protected Pages */}
            <Route
              path="/create-blog"
              element={
                <ProtectedRoute>
                  <CreateBlog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-blog/:id"
              element={
                <ProtectedRoute>
                  <EditBlog />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/saved-posts"
              element={
                <ProtectedRoute>
                  <SavedPosts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-posts"
              element={
                <ProtectedRoute>
                  <MyPosts />
                </ProtectedRoute>
              }
            />

            {/* Admin Pages */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard defaultTab="stats" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminDashboard defaultTab="users" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/posts"
              element={
                <AdminRoute>
                  <AdminDashboard defaultTab="posts" />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/comments"
              element={
                <AdminRoute>
                  <AdminDashboard defaultTab="comments" />
                </AdminRoute>
              }
            />

            {/* Fallback segment redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LayoutProvider>
      </Router>
    </AuthProvider>
  );
}
