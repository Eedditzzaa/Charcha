import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Lock, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, firestoreDb } from '../firebase';

export default function AdminLogin() {
  const { login, showToast } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    setLoading(true);
    try {
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

      const userDocRef = doc(firestoreDb, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      let userProfile: any = null;
      if (userDocSnap.exists()) {
        userProfile = { _id: firebaseUser.uid, ...userDocSnap.data() };
      } else {
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

      if (userProfile.role !== 'admin') {
        await auth.signOut();
        showToast('Access denied. You do not have administrator permissions.', 'error');
        return;
      }

      const idToken = await firebaseUser.getIdToken();
      login(idToken, userProfile);
      showToast('Admin pre-authentication verified. Welcome to Charcha System Control!', 'success');
      navigate('/admin');
    } catch (err: any) {
      showToast(err.message || 'Admin login failed. Please check credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#E6EAF3] to-[#D1D9EB] dark:from-black dark:to-[#121212] transition-colors duration-300">
      <div className="max-w-md w-full space-y-6 bg-white/70 dark:bg-[#1A1A1A]/90 border border-black/10 dark:border-white/10 p-8 rounded-3xl backdrop-blur-lg shadow-2xl relative overflow-hidden">
        
        {/* Sleek aesthetic visual header background */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#9D6DD6]" />

        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-2xl bg-charcha-purple/10 dark:bg-charcha-purple/20 text-[#9D6DD6] mb-4">
            <ShieldCheck className="h-6 w-6" id="admin-shield-icon" />
          </div>
          <h2 className="font-serif text-3xl font-bold text-[#444D60] dark:text-white tracking-tight">
            Charcha Administration
          </h2>
          <p className="mt-2 text-xs uppercase tracking-widest font-mono text-charcha-purple dark:text-charcha-lavender font-semibold">
            SECURE SYSTEM CONTROL
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#444D60]/80 dark:text-dark-text-muted mb-1 font-semibold">
              System Admin Email
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
                placeholder="admin@charcha.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/30 text-[#444D60] dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-charcha-purple transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#444D60]/80 dark:text-dark-text-muted mb-1 font-semibold">
              Admin Security Password
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
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/30 text-[#444D60] dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-charcha-purple transition"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 text-sm font-semibold rounded-xl text-white bg-charcha-purple hover:bg-[#865bc1] focus:outline-none focus:ring-2 focus:ring-charcha-purple transition disabled:opacity-50 shadow-md shadow-charcha-purple/20"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Access Admin Panel
                </span>
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-xs text-[#444D60]/60 dark:text-[#BFBFBF]/60 hover:text-charcha-purple dark:hover:text-charcha-lavender transition"
          >
            Go back to Regular User Login
          </button>
        </div>
      </div>
    </div>
  );
}
