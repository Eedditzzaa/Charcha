import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, ShieldCheck, KeyRound, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function ResetPassword() {
  const { showToast } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const initialEmail = queryParams.get('email') || '';
  const initialCode = queryParams.get('code') || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(initialCode);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
    if (initialCode) setCode(initialCode);
  }, [initialEmail, initialCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code || !newPassword) {
      showToast('All fields are required.', 'error');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/auth/reset-password', { email, code, newPassword });
      showToast('Password updated! You can now sign in.', 'success');
      navigate('/login');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error occurred during reset.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 bg-light-bg dark:bg-black transition-colors duration-300">
      <div className="max-w-md w-full space-y-6 bg-[#A0D2EB]/40 dark:bg-[#2E2E2E]/80 border border-black/5 dark:border-[#4B4B4B] p-8 rounded-3xl backdrop-blur-md shadow-xl">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-charcha-purple/10 text-charcha-purple mb-3">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#444D60] dark:text-white">
            Set New Password
          </h2>
          <p className="mt-1 text-sm text-[#444D60]/80 dark:text-dark-text-muted">
            Provide the reset verification code and choose a new secure password.
          </p>
        </div>

        {initialCode && (
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center text-xs font-semibold text-charcha-purple dark:text-charcha-lavender">
            Code pre-filled from recovery request pipeline
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#444D60]/80 dark:text-dark-text-muted mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="editorshiva490@gmail.com"
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-[#4B4B4B] bg-white/60 dark:bg-black/40 text-[#444D60] dark:text-white focus:outline-none focus:ring-2 focus:ring-charcha-purple"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#444D60]/80 dark:text-dark-text-muted mb-1">
              6-Digit Reset Code
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 dark:border-[#4B4B4B] bg-white/60 dark:bg-black/40 text-[#444D60] dark:text-white focus:outline-none focus:ring-2 focus:ring-charcha-purple"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#444D60]/80 dark:text-dark-text-muted mb-1">
              New Secure Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-black/10 dark:border-[#4B4B4B] bg-white/60 dark:bg-black/40 text-[#444D60] dark:text-white focus:outline-none focus:ring-2 focus:ring-charcha-purple"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-white bg-charcha-purple hover:bg-[#865bc1] font-semibold text-sm transition flex justify-center items-center disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Confirm New Password'}
          </button>
        </form>

        <p className="text-center text-sm">
          <Link to="/login" className="text-xs text-charcha-purple dark:text-charcha-lavender hover:underline font-semibold uppercase">
            Cancel
          </Link>
        </p>
      </div>
    </div>
  );
}
