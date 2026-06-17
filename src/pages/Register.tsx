import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Loader2 } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, firestoreDb } from '../firebase';

export default function Register() {
  const { login, showToast } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      showToast('All fields are required.', 'error');
      return;
    }

    setLoading(true);
    try {
      // 1. Create firebase user using client-side SDK
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const emailUsername = email.toLowerCase().split('@')[0];
      const nextId = firebaseUser.uid;

      // 2. Prepare user profile matched fields
      const newUserProfile = {
        _id: nextId,
        uid: nextId,
        name: name,
        username: emailUsername,
        email: email.toLowerCase(),
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
        profileImage: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
        bio: 'New Charcha member!',
        role: email.toLowerCase() === 'adminshiva@charcha.com' ? 'admin' : 'user',
        googleId: null,
        isVerified: true,
        isBlocked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 3. Document write directly to Firestore users collection
      await setDoc(doc(firestoreDb, 'users', nextId), newUserProfile);

      // 4. Retrieve client auth token
      const idToken = await firebaseUser.getIdToken();

      // 5. Trigger AuthContext login
      login(idToken, newUserProfile as any);
      showToast('Registration successful! Welcome to Charcha.', 'success');
      navigate('/');
    } catch (err: any) {
      showToast(err.message || 'Registration failed. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

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
