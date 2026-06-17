import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Sparkles, Key, PenTool, Loader2, Camera, Trash2, Upload, RefreshCw } from 'lucide-react';
import axios from 'axios';

export default function Profile() {
  const { user, updateCurrentUser, showToast } = useAuth();
  const navigate = useNavigate();

  // Profile data states
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Drag and drop / file input references
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Password fields states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (!user) {
      showToast('Validation required. Please login.', 'info');
      navigate('/login');
      return;
    }
    setName(user.name);
    setBio(user.bio || '');
    setAvatar(user.avatar || '');
  }, [user]);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('The uploaded file must be an image.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl === 'string') {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 160; // Max 160x160 avatar size
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.7);
            setAvatar(compressed);
            showToast('Avatar compressed and loaded successfully! Click save to apply.', 'success');
          } else {
            setAvatar(dataUrl);
            showToast('Avatar loaded successfully! Click save to apply.', 'success');
          }
        };
        img.onerror = () => {
          showToast('Failed to parse uploaded image file.', 'error');
        };
        img.src = dataUrl;
      }
    };
    reader.onerror = () => {
      showToast('Failed to read image file.', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveAvatar = () => {
    const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || user?.name || 'user')}`;
    setAvatar(defaultAvatar);
    showToast('Custom profile picture removed. Reverted to default avatar pattern.', 'info');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Your name cannot be empty.', 'error');
      return;
    }

    setUpdatingProfile(true);
    try {
      const res = await axios.put('/api/profile', { name, bio, avatar });
      updateCurrentUser(res.data.user);
      showToast('Profile information successfully saved!', 'success');
    } catch (err: any) {
      showToast('Failed to update profile.', 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      showToast('Please fill out password credentials.', 'error');
      return;
    }

    setUpdatingPassword(true);
    try {
      await axios.put('/api/profile/change-password', { oldPassword, newPassword });
      setOldPassword('');
      setNewPassword('');
      showToast('Password changed successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Password update failed.', 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const randomizeAvatar = () => {
    const seed = Math.random().toString(36).substring(2, 9);
    setAvatar(`https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`);
    showToast('Randomized avatar suggestion generated!', 'info');
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8 bg-light-bg dark:bg-black text-[#444D60] dark:text-[#BFBFBF] transition-colors duration-300">
      
      <div className="border-b border-black/5 dark:border-[#4B4B4B] pb-4">
        <h1 className="font-serif text-3xl font-black text-[#444D60] dark:text-white tracking-tight">
          Manage Profile
        </h1>
        <p className="text-xs text-[#444D60]/80 dark:text-[#7D7D7D] font-mono mt-0.5">
          Revise email details, choose unique avatars, and adjust biological taglines.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Profile Card / Avatar Selector */}
        <div 
          className={`p-6 rounded-3xl border transition-all duration-300 bg-[#A0D2EB]/30 dark:bg-zinc-900/40 text-center space-y-5 relative ${
            isDragging 
              ? 'border-[#9D6DD6] scale-[1.02] bg-[#A0D2EB]/50 dark:bg-zinc-900/60 shadow-lg' 
              : 'border-black/5 dark:border-[#4B4B4B]'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Instructions overlay when dragging */}
          {isDragging && (
            <div className="absolute inset-0 bg-[#9D6DD6]/10 dark:bg-[#9D6DD6]/25 rounded-3xl flex flex-col items-center justify-center pointer-events-none z-10 backdrop-blur-sm">
              <Upload className="h-10 w-10 text-charcha-purple animate-bounce" />
              <p className="text-xs font-mono font-bold text-charcha-purple mt-2">Drop Avatar Image Here</p>
            </div>
          )}

          <div className="relative inline-block mx-auto group">
            <div className="relative h-28 w-28 rounded-full border-4 border-charcha-purple overflow-hidden mx-auto bg-white/40 shadow-md group-hover:border-[#9D6DD6] transition-all duration-300">
              <img
                src={avatar || user.avatar}
                alt="Avatar Profile"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Cover overlay on hover */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300 text-white cursor-pointer"
                title="Upload Custom Avatar Image"
              >
                <Camera className="h-6 w-6 mb-1 text-white" />
                <span className="text-[10px] font-mono leading-none">Choose File</span>
              </button>
            </div>

            {/* Quick random generator overlay */}
            <button
              type="button"
              onClick={randomizeAvatar}
              className="absolute bottom-0 right-0 p-2 rounded-xl bg-charcha-purple text-white hover:bg-[#865bc1] transition shadow-md hover:scale-105 active:scale-95 duration-200"
              title="Generate Random Robot Avatar"
            >
              🎲
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <div>
            <h3 className="font-serif text-lg font-bold text-[#444D60] dark:text-white">{user.name}</h3>
            <span className="inline-block mt-1 font-mono text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-lg bg-charcha-purple/15 text-charcha-purple dark:text-charcha-lavender">
              {user.role} Status
            </span>
          </div>

          {/* Interactive controls for custom uploaded avatar */}
          <div className="space-y-2 border-t border-black/5 dark:border-[#4B4B4B] pt-4.5">
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#444D60]/70 dark:text-dark-text-muted">
              Configure Avatar Image
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#9D6DD6] hover:bg-[#865bc1] text-white transition-all duration-200 shadow-sm cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload
              </button>
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#D0BDF4]/40 hover:bg-[#D0BDF4]/70 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[#444D60] dark:text-[#BFBFBF] border border-transparent dark:border-[#4B4B4B] transition-all duration-200 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                Remove
              </button>
            </div>
            <p className="text-[9px] font-mono text-[#444D60]/60 dark:text-[#7D7D7D] leading-normal pt-1">
              Drag & drop photo directly onto the card to change instantly.
            </p>
          </div>

          <p className="text-xs text-[#444D60]/90 dark:text-dark-text leading-relaxed italic border-t border-black/5 dark:border-[#4B4B4B] pt-3.5">
            "{bio || 'No biological tagline established yet. Update info on the right.'}"
          </p>
        </div>

        {/* Update Profile Form */}
        <div className="md:col-span-2 space-y-8">
          
          <div className="p-8 rounded-3xl border border-black/5 dark:border-[#4B4B4B] bg-white/45 dark:bg-zinc-900/15 space-y-6">
            <h3 className="font-serif text-lg font-bold text-[#444D60] dark:text-white flex items-center gap-1.5 border-b border-black/5 dark:border-[#4B4B4B] pb-2">
              <User className="h-4.5 w-4.5 text-charcha-purple" />
              General Coordinates
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#444D60]/80 dark:text-dark-text-muted mb-1 font-semibold">
                    Email Account (Constant)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      disabled
                      value={user.email}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-black/10 dark:border-[#4B4B4B] bg-black/10 text-zinc-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#444D60]/80 dark:text-dark-text-muted mb-1 font-semibold">
                    Public Screen Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-black/10 dark:border-[#4B4B4B] bg-white/60 dark:bg-black/40 text-[#444D60] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9D6DD6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#444D60]/80 dark:text-dark-text-muted mb-1 font-semibold">
                  Personal Biography / Profile Description
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell our community members about your professional interests..."
                  className="w-full p-3 text-xs rounded-xl border border-black/10 dark:border-[#4B4B4B] bg-white/60 dark:bg-black/40 text-[#444D60] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9D6DD6]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="px-4 py-2 rounded-xl text-white bg-charcha-purple hover:bg-[#865bc1] font-bold text-xs transition flex items-center gap-1.5"
                >
                  {updatingProfile ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : 'Save Coordinates'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form (No social logins support password updates directly) */}
          {!user.avatar.includes('photo') && (
            <div className="p-8 rounded-3xl border border-rose-500/10 dark:border-[#4B4B4B] bg-white/45 dark:bg-zinc-900/15 space-y-6">
              <h3 className="font-serif text-lg font-bold text-[#444D60] dark:text-white flex items-center gap-1.5 border-b border-black/5 dark:border-[#4B4B4B] pb-2">
                <Key className="h-4.5 w-4.5 text-rose-500" />
                Change Password Credential
              </h3>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#444D60]/80 dark:text-dark-text-muted mb-1 font-semibold">
                      Current Password
                    </label>
                    <input
                      type="password"
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-black/10 dark:border-[#4B4B4B] bg-white/60 dark:bg-black/40 text-[#444D60] dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#444D60]/80 dark:text-dark-text-muted mb-1 font-semibold">
                      New Secure Password
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-black/10 dark:border-[#4B4B4B] bg-white/60 dark:bg-black/40 text-[#444D60] dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="px-4 py-2 rounded-xl text-white bg-rose-600 hover:bg-rose-700 font-bold text-xs transition"
                  >
                    {updatingPassword ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : 'Confirm New Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
