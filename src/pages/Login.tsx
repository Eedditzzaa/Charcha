import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, UserCheck, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, firestoreDb } from '../firebase';

export default function Login() {
  const { login, showToast } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectPath = new URLSearchParams(location.search).get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    setLoading(true);
    try {
      // 1. Direct Firebase Auth Sign In with automatic on-the-fly registration fallback for the pre-seeded admin account
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (authErr: any) {
        if (
          email.toLowerCase() === 'adminshiva@charcha.com' &&
          (authErr.code?.includes('invalid-credential') ||
            authErr.code?.includes('user-not-found') ||
            authErr.message?.includes('invalid-credential') ||
            authErr.message?.includes('user-not-found'))
        ) {
          try {
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
          } catch (createErr) {
            throw authErr;
          }
        } else {
          throw authErr;
        }
      }
      const firebaseUser = userCredential.user;

      // 2. Fetch respective Firestore user profile document
      const userDocRef = doc(firestoreDb, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      let userProfile: any = null;
      if (userDocSnap.exists()) {
        userProfile = { _id: firebaseUser.uid, ...userDocSnap.data() };
      } else {
        // Fallback default profile if document doesn't exist
        const emailUsername = email.toLowerCase().split('@')[0];
        userProfile = {
          _id: firebaseUser.uid,
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || emailUsername,
          username: emailUsername,
          email: email.toLowerCase(),
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
          profileImage: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
          bio: 'New Charcha member!',
          role: email.toLowerCase() === 'adminshiva@charcha.com' ? 'admin' : 'user',
          googleId: null,
          isVerified: true,
          isBlocked: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(userDocRef, userProfile);
      }

      // 3. Acquire current ID token
      const idToken = await firebaseUser.getIdToken();

      // 4. Update frontend context state
      login(idToken, userProfile);
      showToast(`Welcome back!`, 'success');
      navigate(redirectPath);
    } catch (err: any) {
      showToast(err.message || 'Login failed. Please check credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-light-bg dark:bg-black transition-colors duration-300">
      <div className="max-w-md w-full space-y-8 bg-[#A0D2EB]/40 dark:bg-[#2E2E2E]/80 border border-black/5 dark:border-[#4B4B4B] p-8 rounded-3xl backdrop-blur-md shadow-xl">
        <div>
          <h2 className="text-center font-serif text-3xl font-bold text-[#444D60] dark:text-white tracking-tight">
            Welcome back to Charcha
          </h2>
          <p className="mt-2 text-center text-sm text-[#444D60]/80 dark:text-dark-text-muted">
            Share Ideas, Start Discussions.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
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
              <div className="flex justify-between mb-1">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#444D60]/80 dark:text-dark-text-muted font-semibold">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-charcha-purple dark:text-charcha-lavender hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
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
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-charcha-purple hover:bg-[#865bc1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-charcha-purple transition disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <span className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Sign In
                </span>
              )}
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-[#444D60]/80 dark:text-dark-text-muted mt-4">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-charcha-purple dark:text-charcha-lavender hover:underline"
          >
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
}
