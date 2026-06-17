import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';

export default function ForgotPassword() {
  const { showToast } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter your email address.', 'error');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      showToast('A secure password reset link has been sent to your email directly from Firebase.', 'success');
      navigate('/login');
    } catch (err: any) {
      showToast(err.message || 'Error executing forgot password request.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-light-bg dark:bg-black transition-colors duration-300">
      <div className="max-w-md w-full space-y-6 bg-[#A0D2EB]/40 dark:bg-[#2E2E2E]/80 border border-black/5 dark:border-[#4B4B4B] p-8 rounded-3xl backdrop-blur-md shadow-xl">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-charcha-purple dark:text-charcha-lavender hover:underline font-semibold font-mono uppercase">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Login
        </Link>

        <div>
          <h2 className="text-2xl font-serif font-bold text-[#444D60] dark:text-white">
            Reset Password
          </h2>
          <p className="mt-1 text-sm text-[#444D60]/80 dark:text-dark-text-muted">
            Enter your email to receive a password reset link.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#444D60]/80 dark:text-dark-text-muted font-bold mb-1">
              Your Registered Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="editorshiva490@gmail.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/10 dark:border-[#4B4B4B] bg-white/60 dark:bg-black/40 text-[#444D60] dark:text-white focus:outline-none focus:ring-2 focus:ring-charcha-purple"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-white bg-[#9D6DD6] hover:bg-[#865bc1] font-semibold text-sm transition flex justify-center items-center disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Request Recovery Code'}
          </button>
        </form>
      </div>
    </div>
  );
}
