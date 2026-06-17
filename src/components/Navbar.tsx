import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import { Sun, Moon, Menu, X, BookMarked, User as UserIcon, LogOut, LayoutDashboard, PlusCircle, BookOpen, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const { user, theme, toggleTheme, logout, isAdminMode, setIsAdminMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setIsOpen(false);
    navigate('/');
  };

  // Theme matching styles
  // Light: cards/navbar -> #A0D2EB, text -> #444D60, accent -> #9D6DD6
  // Dark: cards/navbar -> #2E2E2E, border -> #4B4B4B, primary text -> #BFBFBF, accent -> #9D6DD6
  const navBgClass = "bg-[#A0D2EB] text-[#444D60] dark:bg-[#2E2E2E] dark:text-[#BFBFBF] dark:border-[#4B4B4B] border-b border-transparent shadow-sm";
  const textClass = "text-[#444D60] hover:text-[#9D6DD6] dark:text-[#BFBFBF] dark:hover:text-white transition-colors duration-200 font-medium text-sm";
  const activeTextClass = "text-[#9D6DD6] dark:text-white font-semibold text-sm border-b-2 border-[#9D6DD6] pb-1";

  const showAdminNavbar = isAdminMode;
  const isAdminPage = showAdminNavbar || location.pathname === '/admin-login';

  return (
    <nav className={`sticky top-0 z-40 transition-colors duration-300 ${navBgClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3" id="navbar-logo-area">
            <Link to="/" className="flex-shrink-0 flex items-center" id="navbar-logo-link">
              <Logo />
            </Link>
            {!isAdminPage && (
              <Link
                to="/admin-login"
                id="admin-login-navbar-tab"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#9D6DD6]/30 text-[#9D6DD6] dark:text-[#D0BDF4] bg-white/5 hover:bg-[#9D6DD6]/10 transition duration-200 text-xs font-mono font-bold uppercase tracking-wider shadow-sm cursor-pointer"
                title="Admin Authentication Portal"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Admin Login</span>
              </Link>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {showAdminNavbar ? (
              <>
                <Link 
                  to="/" 
                  className={isActive('/') ? activeTextClass : textClass}
                >
                  Home
                </Link>
                <Link 
                  to="/admin" 
                  className={isActive('/admin') ? activeTextClass : textClass}
                >
                  Admin Dashboard
                </Link>
                <button
                  id="admin-hidden-hamburger-desktop"
                  onClick={() => setIsOpen(!isOpen)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#9D6DD6]/30 text-[#444D60] dark:text-[#BFBFBF] hover:text-[#9D6DD6] dark:hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer text-sm font-bold uppercase tracking-wider"
                  title="Show more options"
                >
                  <span className="text-base pointer-events-none">☰</span>
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/" 
                  className={isActive('/') ? activeTextClass : textClass}
                >
                  Home
                </Link>
                <Link 
                  to="/blogs" 
                  className={isActive('/blogs') ? activeTextClass : textClass}
                >
                  Blogs
                </Link>

                {user && (
                  <>
                    <Link 
                      to="/my-posts" 
                      className={isActive('/my-posts') ? activeTextClass : textClass}
                    >
                      My Posts
                    </Link>
                    <Link 
                      to="/saved-posts" 
                      className={isActive('/saved-posts') ? activeTextClass : textClass}
                    >
                      Saved Posts
                    </Link>
                    <Link 
                      to="/create-blog" 
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#9D6DD6] text-white hover:bg-[#865bc1] transition duration-200 text-sm font-medium shadow-sm"
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span>Create Blog</span>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Action Items */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle Button */}
            <button
              id="theme-toggle-desktop"
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-[#D0BDF4]/40 hover:bg-[#D0BDF4]/65 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-[#444D60] dark:text-[#BFBFBF] border border-[#9D6DD6]/20 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon className="h-5 w-5 stroke-[2.2]" /> : <Sun className="h-5 w-5 stroke-[2.2]" />}
            </button>

            {/* Profile Menu Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  id="profile-dropdown-trigger"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-[#9D6DD6] p-1 bg-white/20 hover:bg-white/30 transition"
                >
                  <img
                    className="h-8 w-8 rounded-full object-cover border-2 border-[#9D6DD6]"
                    src={user.avatar}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                  />
                  <span className="font-medium pr-1 text-[#444D60] dark:text-[#BFBFBF]">{user.name.split(' ')[0]}</span>
                </button>

                {dropdownOpen && (
                  <div
                    id="profile-dropdown-menu"
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg py-1 bg-[#A0D2EB] dark:bg-[#2E2E2E] border border-black/10 dark:border-[#4B4B4B] focus:outline-none text-[#444D60] dark:text-[#BFBFBF]"
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/20 dark:hover:bg-zinc-700 w-full text-left"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <UserIcon className="h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                    <Link
                      to="/my-posts"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/20 dark:hover:bg-zinc-700 w-full text-left"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>My Written Posts</span>
                    </Link>
                    <Link
                      to="/saved-posts"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/20 dark:hover:bg-zinc-700 w-full text-left"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <BookMarked className="h-4 w-4" />
                      <span>Saved Bookmarks</span>
                    </Link>
                    {user.role === 'admin' && (
                      <>
                        <hr className="border-black/5 dark:border-[#4B4B4B]" />
                        {isAdminMode ? (
                          <button
                            id="user-page-dropdown-switch"
                            onClick={() => {
                              setIsAdminMode(false);
                              setDropdownOpen(false);
                              navigate('/');
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/20 dark:hover:bg-zinc-700 w-full text-left font-bold text-emerald-600 dark:text-emerald-400 cursor-pointer"
                          >
                            <UserIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <span>User Page</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setIsAdminMode(true);
                              setDropdownOpen(false);
                              navigate('/admin');
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/20 dark:hover:bg-zinc-700 w-full text-left font-bold text-charcha-purple dark:text-[#9D6DD6] cursor-pointer"
                          >
                            <ShieldCheck className="h-4 w-4 text-charcha-purple dark:text-[#9D6DD6]" />
                            <span>Admin Page</span>
                          </button>
                        )}
                      </>
                    )}
                    <hr className="border-black/5 dark:border-[#4B4B4B]" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-rose-500 hover:text-white dark:hover:bg-rose-9e0 w-full text-left font-medium text-rose-600 dark:text-rose-400"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-transparent hover:bg-white/10 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-[#9D6DD6] text-white hover:bg-[#865bc1] transition shadow-sm"
                >
                  Join Charcha
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden space-x-2">
            <button
              id="theme-toggle-mobile"
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-[#D0BDF4]/40 dark:bg-[#2E2E2E]/80 text-[#444D60] dark:text-[#BFBFBF] border border-[#9D6DD6]/25 transition-all duration-300 active:scale-95"
            >
              {theme === 'light' ? <Moon className="h-5 w-5 stroke-[2.2]" /> : <Sun className="h-5 w-5 stroke-[2.2]" />}
            </button>
            <button
              id="mobile-menu-toggle"
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-white/20 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Drawer / Sidebar / Slideout for Admin Page, and normal Mobile Menu for standard pages */}
      <AnimatePresence>
        {isOpen && showAdminNavbar && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 top-16 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
            />

            {/* Sidebar drawer holding hidden navigation items */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-16 right-0 bottom-0 z-50 w-80 max-w-full bg-[#A0D2EB] dark:bg-[#2E2E2E] border-l border-black/10 dark:border-[#4B4B4B] shadow-2xl overflow-y-auto flex flex-col justify-between"
            >
              <div className="p-6 space-y-6">
                {/* Title and Close */}
                <div className="flex items-center justify-between border-b border-black/10 dark:border-[#4B4B4B] pb-4">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#444D60]/70 dark:text-[#BFBFBF]/70">
                    Charcha Navigation
                  </span>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 px-2.5 rounded-lg text-rose-500 hover:bg-rose-500/10 font-bold transition flex items-center gap-1 text-sm cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Navigation Options */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    <span className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#444D60]/50 dark:text-[#BFBFBF]/40">
                      General
                    </span>
                    <Link
                      to="/blogs"
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-sm transition ${isActive('/blogs') ? 'bg-[#9D6DD6] text-white font-bold shadow-sm' : 'hover:bg-white/25 dark:hover:bg-zinc-800 text-[#444D60] dark:text-[#BFBFBF]'}`}
                      onClick={() => setIsOpen(false)}
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>Blogs Listing</span>
                    </Link>
                  </div>

                  {user && (
                    <div className="space-y-3 pt-2">
                      <span className="block text-[10px] font-mono font-bold uppercase tracking-widest text-[#444D60]/50 dark:text-[#BFBFBF]/40">
                        My Workspace
                      </span>
                      <Link
                        to="/my-posts"
                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-sm transition ${isActive('/my-posts') ? 'bg-[#9D6DD6] text-white font-bold shadow-sm' : 'hover:bg-white/25 dark:hover:bg-zinc-800 text-[#444D60] dark:text-[#BFBFBF]'}`}
                        onClick={() => setIsOpen(false)}
                      >
                        <UserIcon className="h-4 w-4" />
                        <span>My Posts</span>
                      </Link>
                      <Link
                        to="/saved-posts"
                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-sm transition ${isActive('/saved-posts') ? 'bg-[#9D6DD6] text-white font-bold shadow-sm' : 'hover:bg-white/25 dark:hover:bg-zinc-800 text-[#444D60] dark:text-[#BFBFBF]'}`}
                        onClick={() => setIsOpen(false)}
                      >
                        <BookMarked className="h-4 w-4" />
                        <span>Saved Bookmarks</span>
                      </Link>
                      <Link
                        to="/profile"
                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-sm transition ${isActive('/profile') ? 'bg-[#9D6DD6] text-white font-bold shadow-sm' : 'hover:bg-white/25 dark:hover:bg-zinc-800 text-[#444D60] dark:text-[#BFBFBF]'}`}
                        onClick={() => setIsOpen(false)}
                      >
                        <UserIcon className="h-4 w-4" />
                        <span>My Profile</span>
                      </Link>
                      <Link
                        to="/create-blog"
                        className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#9D6DD6] text-white hover:bg-[#865bc1] transition duration-200 text-sm font-medium shadow-sm"
                        onClick={() => setIsOpen(false)}
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span>Create Blog</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile / Footer inside the Sidebar */}
              <div className="p-6 bg-black/5 dark:bg-black/20 border-t border-black/10 dark:border-[#4B4B4B] space-y-4">
                {user ? (
                  <>
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-10 w-10 rounded-full border border-[#9D6DD6]"
                      />
                      <div className="overflow-hidden">
                        <h4 className="text-sm font-semibold text-[#444D60] dark:text-white truncate">
                          {user.name}
                        </h4>
                        <p className="text-xs text-[#444D60]/70 dark:text-[#7D7D7D] truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium hover:bg-rose-500 hover:text-white text-sm transition duration-200 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log Out</span>
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/login"
                      className="text-center py-2.5 rounded-xl text-xs font-medium border border-[#444D60]/20 hover:bg-white/10 text-[#444D60] dark:text-white"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="text-center py-2.5 rounded-xl text-xs font-medium bg-[#9D6DD6] text-white hover:bg-[#865bc1]"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      {isOpen && !showAdminNavbar && (
        <div className="md:hidden border-t border-black/10 dark:border-[#4B4B4B] bg-[#A0D2EB] dark:bg-[#2E2E2E]">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className={`block px-3 py-2 rounded-md ${isActive('/') ? 'bg-[#9D6DD6] text-white font-bold' : 'hover:bg-white/10'}`}
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/blogs"
              className={`block px-3 py-2 rounded-md ${isActive('/blogs') ? 'bg-[#9D6DD6] text-white font-bold' : 'hover:bg-white/10'}`}
              onClick={() => setIsOpen(false)}
            >
              Blogs Listing
            </Link>

            {user ? (
              <>
                <Link
                  to="/my-posts"
                  className={`block px-3 py-2 rounded-md ${isActive('/my-posts') ? 'bg-[#9D6DD6] text-white font-bold' : 'hover:bg-white/10'}`}
                  onClick={() => setIsOpen(false)}
                >
                  My Posts
                </Link>
                <Link
                  to="/saved-posts"
                  className={`block px-3 py-2 rounded-md ${isActive('/saved-posts') ? 'bg-[#9D6DD6] text-white font-bold' : 'hover:bg-white/10'}`}
                  onClick={() => setIsOpen(false)}
                >
                  Saved Bookmarks
                </Link>
                <Link
                  to="/profile"
                  className={`block px-3 py-2 rounded-md ${isActive('/profile') ? 'bg-[#9D6DD6] text-white font-bold' : 'hover:bg-white/10'}`}
                  onClick={() => setIsOpen(false)}
                >
                  My Profile
                </Link>
                <Link
                  to="/create-blog"
                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#9D6DD6] text-white font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Create Blog</span>
                </Link>

                <div className="pt-4 pb-2 border-t border-black/10 dark:border-[#4B4B4B]">
                  <div className="flex items-center px-3 gap-3">
                    <img className="h-10 w-10 rounded-full" src={user.avatar} alt={user.name} />
                    <div>
                      <div className="text-sm font-semibold text-[#444D60] dark:text-white">{user.name}</div>
                      <div className="text-xs text-[#444D60]/70 dark:text-[#7D7D7D]">{user.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="mt-3 flex items-center gap-2 w-full px-3 py-2 text-rose-600 dark:text-rose-400 font-medium hover:bg-rose-500 hover:text-white rounded-md transition"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-black/10 dark:border-[#4B4B4B] p-2">
                <Link
                  to="/login"
                  className="block text-center px-4 py-2 rounded-lg text-sm font-medium border border-black/20 hover:bg-white/10"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="block text-center px-4 py-2 rounded-lg text-sm font-medium bg-[#9D6DD6] text-white hover:bg-[#865bc1]"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
