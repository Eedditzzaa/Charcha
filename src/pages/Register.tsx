import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, ShieldCheck, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function Register() {
  const { login, showToast } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation context checks
  const queryParams = new URLSearchParams(location.search);
  const initialVerifyState = queryParams.get('verify') === 'true';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Verification Screen State
  const [verificationPending, setVerificationPending] = useState(initialVerifyState);
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [debugOtpCode, setDebugOtpCode] = useState<string | null>(null);
  const [smtpDiagnostics, setSmtpDiagnostics] = useState<{
    configured: boolean;
    failed: boolean;
    errorMessage: string;
  } | null>(null);

  useEffect(() => {
    if (initialVerifyState) {
      setVerificationPending(true);
    }
  }, [initialVerifyState]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      showToast('All fields are required.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/register', { name, email, password });
      
      if (res.data.debugCode) {
        setDebugOtpCode(res.data.debugCode);
      }
      if (res.data.smtpConfigured !== undefined) {
        setSmtpDiagnostics({
          configured: res.data.smtpConfigured,
          failed: res.data.smtpFailed,
          errorMessage: res.data.smtpErrorMsg || '',
        });
      }

      // Complete registration only after correct OTP is entered (do not login yet)
      setVerificationPending(true);
      if (res.data.smtpFailed) {
        showToast('Account registered, but SMTP email delivery failed. See diagnostic notice.', 'warning');
      } else {
        showToast('Account registered! A verification code has been sent to your email.', 'success');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed. Try again.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      showToast('Please enter the 6-digit verification code.', 'error');
      return;
    }

    setVerifying(true);
    try {
      // Pass both email and code since user is not logged in yet
      const res = await axios.post('/api/auth/verify-email', { email, code: otpCode });
      showToast('Email verified successfully! Profile activated.', 'success');
      
      // Auto-save user credentials to local token context now
      login(res.data.token, res.data.user);
      
      navigate('/');
      window.location.reload(); // Hard reload context to update navbar states
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Invalid or expired verification code.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  if (verificationPending) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 bg-light-bg dark:bg-black transition-colors duration-300">
        <div className="max-w-md w-full space-y-6 bg-[#A0D2EB]/40 dark:bg-[#2E2E2E]/80 border border-black/5 dark:border-[#4B4B4B] p-8 rounded-3xl backdrop-blur-md shadow-xl">
          <div className="text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-charcha-purple mb-4">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#444D60] dark:text-white">
              Verify your Email
            </h2>
            <p className="mt-2 text-sm text-[#444D60]/80 dark:text-dark-text-muted px-4">
              We have sent a real 6-digit verification code to <strong className="text-charcha-purple dark:text-charcha-lavender">{email}</strong>. Please check your inbox (and spam folder) and enter it below to activate your account.
            </p>
          </div>

          {/* SMTP Diagnostic Falling-back Banner */}
          {smtpDiagnostics && smtpDiagnostics.failed && (
            <div className="p-4 bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/30 text-[#444D60] dark:text-orange-200 rounded-2xl text-xs space-y-2 font-sans text-left">
              <span className="font-bold text-orange-600 dark:text-orange-400 block font-mono uppercase tracking-wide">⚠️ SMTP Delivery Interrupted</span>
              <p className="leading-relaxed text-[11px]">
                The application attempted to send a real email using Gmail SMTP, but transport failed. 
                <span className="font-mono bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded ml-1">Reason: {smtpDiagnostics.errorMessage}</span>
              </p>
              <div className="pt-2 border-t border-orange-500/20 text-center font-semibold">
                <p className="mb-1 text-[10px] text-[#444D60]/70 dark:text-orange-300 font-mono">DEVELOPMENT FALLBACK CODE:</p>
                <span className="font-mono text-xl tracking-widest text-charcha-purple dark:text-white underline">{debugOtpCode}</span>
              </div>
            </div>
          )}

          {smtpDiagnostics && !smtpDiagnostics.configured && (
            <div className="p-4 bg-indigo-500/5 dark:bg-indigo-500/15 border border-indigo-500/20 text-[#444D60] dark:text-[#A0D2EB] rounded-2xl text-xs space-y-2 font-sans text-left">
              <span className="font-bold text-charcha-purple dark:text-charcha-lavender block font-mono uppercase tracking-wide">ℹ️ Simulating Email Delivery</span>
              <p className="leading-relaxed text-[11px]">
                Since Gmail SMTP credentials are not configured in your Environment / Secrets panel yet, the system is in Sandbox Simulation mode.
              </p>
              <div className="pt-2 border-t border-indigo-500/15 text-center font-semibold">
                <p className="mb-1 text-[10px] text-[#444D60]/70 dark:text-charcha-lavender font-mono">ACTIVE VERIFICATION CODE:</p>
                <span className="font-mono text-xl tracking-widest text-[#9D6DD6] dark:text-white underline">{debugOtpCode}</span>
              </div>
            </div>
          )}

          <form className="mt-4 space-y-6" onSubmit={handleVerifyOTP}>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#444D60]/80 dark:text-dark-text-muted text-center font-bold mb-3">
                6-Digit Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center tracking-widest text-2xl font-mono py-3 rounded-xl border border-black/10 dark:border-[#4B4B4B] bg-white/60 dark:bg-black/40 text-[#444D60] dark:text-white focus:outline-none focus:ring-2 focus:ring-charcha-purple"
              />
            </div>

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-3 px-4 rounded-xl text-white bg-charcha-purple hover:bg-[#865bc1] font-semibold text-sm transition flex justify-center items-center disabled:opacity-50"
            >
              {verifying ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                'Verify & Activate Profile'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-[#444D60]/60 dark:text-[#7D7D7D]">
            Did not receive a code? Try restarting registration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-light-bg dark:bg-black transition-colors duration-300">
      <div className="max-w-md w-full space-y-8 bg-[#A0D2EB]/40 dark:bg-[#2E2E2E]/80 border border-black/5 dark:border-[#4B4B4B] p-8 rounded-3xl backdrop-blur-md shadow-xl">
        <div>
          <h2 className="text-center font-serif text-3xl font-bold text-[#444D60] dark:text-white tracking-tight">
            Join the Charcha Community
          </h2>
          <p className="mt-2 text-center text-sm text-[#444D60]/80 dark:text-dark-text-muted">
            Create an account to comment, like, bookmark, and write blogs!
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleRegisterSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#444D60]/80 dark:text-dark-text-muted mb-1 font-semibold">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#444D60]/60 dark:text-dark-text-muted">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Shiva Sen"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/10 dark:border-[#4B4B4B] bg-white/60 dark:bg-black/40 text-[#444D60] dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-charcha-purple focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#444D60]/80 dark:text-dark-text-muted mb-1 font-semibold">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#444D60]/60 dark:text-dark-text-muted">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@charcha.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/10 dark:border-[#4B4B4B] bg-white/60 dark:bg-black/40 text-[#444D60] dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-charcha-purple focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#444D60]/80 dark:text-dark-text-muted mb-1 font-semibold">
                Choose Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#444D60]/60 dark:text-dark-text-muted">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/10 dark:border-[#4B4B4B] bg-white/60 dark:bg-black/40 text-[#444D60] dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-charcha-purple focus:border-transparent transition"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-[#9D6DD6] hover:bg-[#865bc1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-charcha-purple transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Create Account'}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-[#444D60]/80 dark:text-dark-text-muted">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-charcha-purple dark:text-charcha-lavender hover:underline"
          >
            Sign In Instead
          </Link>
        </p>
      </div>
    </div>
  );
}
