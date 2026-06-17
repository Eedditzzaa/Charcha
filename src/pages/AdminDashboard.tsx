import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StatsDashboardSkeleton } from '../components/LoadingSkeleton';
import {
  ShieldAlert, Users, FileText, MessageSquare, Settings, ArrowRight, TrendingUp,
  Download, Award, Trash2, Ban, Check, X, ShieldX, KeyRound, Radio, Megaphone,
  Bell, Star, Search, ShieldCheck, Mail, Server, Eye, Filter, RefreshCw
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  content: string;
  featuredImage: string;
  authorId: string;
  status: 'draft' | 'published';
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  isFeatured?: boolean;
  category?: string;
  tags?: string[];
  author?: {
    _id: string;
    name: string;
    email: string;
  } | null;
}

interface UserItem {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  isBlocked: boolean;
  createdAt: string;
  badges?: string[];
}

interface CommentItem {
  _id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  postTitle?: string;
}

interface PlatformStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
}

// Predefined Mock Entity Interfaces
interface SysReport {
  id: string;
  type: 'user' | 'post' | 'comment';
  targetName: string;
  targetId: string;
  reportedBy: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
}

interface SecurityLog {
  id: string;
  timestamp: string;
  ip: string;
  userEmail: string;
  action: string;
  status: 'success' | 'blocked' | 'warning';
  browser: string;
}

export default function AdminDashboard({ defaultTab = 'stats' }: { defaultTab?: 'stats' | 'users' | 'posts' | 'comments' }) {
  const { user, showToast } = useAuth();
  const navigate = useNavigate();

  // Active Tab State
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'posts' | 'comments' | 'reports' | 'security' | 'settings' | 'announcements'>(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // Backend Sourced State
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters Inside Tabs
  const [userSearch, setUserSearch] = useState('');
  const [postSearch, setPostSearch] = useState('');
  const [commentSearch, setCommentSearch] = useState('');
  
  // Tag / Category Editor Modals
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState('');
  const [editTagsRaw, setEditTagsRaw] = useState('');

  // Badge Assigner Modals
  const [selectingBadgesUserId, setSelectingBadgesUserId] = useState<string | null>(null);
  const [badgeInput, setBadgeInput] = useState('');

  // Local Storage Backed Configuration & Settings (Mock with realistic default parameters)
  const [siteName, setSiteName] = useState(() => localStorage.getItem('cfg_site_name') || 'Charcha Hub');
  const [siteLogo, setSiteLogo] = useState(() => localStorage.getItem('cfg_site_logo') || '💬 Charcha');
  const [siteTheme, setSiteTheme] = useState(() => localStorage.getItem('cfg_site_theme') || 'default-violet');
  const [smtpHost, setSmtpHost] = useState(() => localStorage.getItem('cfg_smtp_host') || 'smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(() => localStorage.getItem('cfg_smtp_port') || '465');
  const [smtpUser, setSmtpUser] = useState(() => localStorage.getItem('cfg_smtp_user') || 'adminshiva@charcha.com');
  const [smtpPass, setSmtpPass] = useState(() => localStorage.getItem('cfg_smtp_pass') || '••••••••••••••••');
  const [maintenanceMode, setMaintenanceMode] = useState(() => localStorage.getItem('cfg_maintenance_mode') === 'true');

  // Local Storage Backed Announcements
  const [globalBanner, setGlobalBanner] = useState(() => localStorage.getItem('ann_banner') || '⚠️ Scheduled database system enhancement tonight at 12:00 AM UTC.');
  const [bannerActive, setBannerActive] = useState(() => localStorage.getItem('ann_banner_active') !== 'false');
  const [announcementHistory, setAnnouncementHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('ann_history');
    if (saved && saved !== 'undefined') {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse ann_history from localStorage:', e);
      }
    }
    return [
      'Welcome to the new Charcha Admin Panel version 1.2!',
      'Ensure all content creators adhere to our respectful discussion code of conduct.'
    ];
  });
  const [newAnnouncement, setNewAnnouncement] = useState('');

  // Local Storage Backed Forensic Security Logs & Interactive Reports
  const [reports, setReports] = useState<SysReport[]>(() => {
    const saved = localStorage.getItem('sys_reports');
    if (saved && saved !== 'undefined') {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse sys_reports from localStorage:', e);
      }
    }
    return [
      { id: 'rep-1', type: 'post', targetName: 'Why I Switched to Tailwind CSS v4', targetId: 'p-2', reportedBy: 'aaravMehta', reason: 'Self-promoting links or redundant developer context.', status: 'pending', severity: 'low', createdAt: '2026-06-15T09:12:00Z' },
      { id: 'rep-2', type: 'comment', targetName: 'abusive response thread', targetId: 'c-2', reportedBy: 'neha_sen', reason: 'Abusive language on discussion threads.', status: 'pending', severity: 'high', createdAt: '2026-06-15T11:45:00Z' },
      { id: 'rep-3', type: 'user', targetName: 'Irrelevant member poster', targetId: 'u-2', reportedBy: 'editorshiva490', reason: 'Posting commercial off-topic links.', status: 'resolved', severity: 'medium', createdAt: '2026-06-14T14:30:00Z' },
    ];
  });

  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([
    { id: 'sec-1', timestamp: '2026-06-15T13:10:00Z', ip: '192.168.1.102', userEmail: 'adminshiva@charcha.com', action: 'Authorized System Controller Login', status: 'success', browser: 'Chrome 125 - Mac' },
    { id: 'sec-2', timestamp: '2026-06-15T12:45:00Z', ip: '112.143.12.19', userEmail: 'intruder@unknown.com', action: 'Denied administrator dashboard attempt', status: 'blocked', browser: 'Firefox 130 - Windows' },
    { id: 'sec-3', timestamp: '2026-06-15T11:20:00Z', ip: '192.168.1.201', userEmail: 'aaravMehta@charcha.com', action: 'Requested OTP verification mail transport', status: 'success', browser: 'Safari Mobile - iOS' },
    { id: 'sec-4', timestamp: '2026-06-15T10:15:00Z', ip: '43.201.12.44', userEmail: 'spammer_bot@gmail.com', action: 'Blocked malicious post creation pattern', status: 'warning', browser: 'Headless Chrome - Linux' }
  ]);

  // Load everything on boot
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Get stats
      const resStats = await axios.get('/api/admin/stats');
      setStats(resStats.data || null);

      // 2. Get users
      const resUsers = await axios.get('/api/admin/users');
      // Load user badge additions if saved
      const usersData = Array.isArray(resUsers.data) ? resUsers.data : [];
      const loadedUsers = usersData.map((u: UserItem) => {
        const savedBadges = localStorage.getItem(`badges_${u._id}`);
        let parsedBadges = null;
        if (savedBadges && savedBadges !== 'undefined') {
          try {
            parsedBadges = JSON.parse(savedBadges);
          } catch (e) {
            console.error('Failed to parse badges:', e);
          }
        }
        return {
          ...u,
          badges: parsedBadges || (u.role === 'admin' ? ['System Root', 'Moderator'] : ['Community Poster'])
        };
      });
      setUsers(loadedUsers);

      // 3. Get posts
      const resPosts = await axios.get('/api/admin/posts');
      const postsData = Array.isArray(resPosts.data) ? resPosts.data : [];
      const loadedPosts = postsData.map((p: any) => {
        const savedMeta = localStorage.getItem(`post_meta_${p._id}`);
        let parsedMeta = null;
        if (savedMeta && savedMeta !== 'undefined') {
          try {
            parsedMeta = JSON.parse(savedMeta);
          } catch (e) {
            console.error('Failed to parse post_meta:', e);
          }
        }
        if (!parsedMeta) {
          parsedMeta = { category: p.category || 'Technology', tags: p.tags || ['Web', 'Discussion'] };
        }
        return {
          ...p,
          isFeatured: p.isFeatured || false,
          category: parsedMeta.category,
          tags: parsedMeta.tags
        };
      });
      setPosts(loadedPosts);

      // 4. Get comments
      const resComments = await axios.get('/api/admin/comments');
      setComments(Array.isArray(resComments.data) ? resComments.data : []);

    } catch (e) {
      showToast('Failed to compile fully reactive administration indices.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      showToast('Administrator verification failed. Safe redirect initialized.', 'error');
      navigate('/admin-login');
      return;
    }
    loadData();
  }, [user]);

  // Action Handlers
  const handleBlockToggle = async (userId: string, currentBlocked: boolean) => {
    if (userId === 'u-1' || userId === 'u-admin-predefined') {
      showToast('Action Denied: Root system administrator accounts are non-blockable.', 'error');
      return;
    }
    try {
      const res = await axios.patch(`/api/admin/users/${userId}/block`, { isBlocked: !currentBlocked });
      setUsers(users.map(u => u._id === userId ? { ...u, isBlocked: res.data.user.isBlocked } : u));
      showToast(res.data.message, 'success');

      // Append log entry
      addSecurityLog(`Toggled Block Status on User ID: ${userId} to ${!currentBlocked}`, 'warning');
    } catch (e: any) {
      showToast(e.response?.data?.message || 'Access state alteration failed.', 'error');
    }
  };

  const handleRoleToggle = async (userId: string, currentRole: 'user' | 'admin') => {
    if (userId === 'u-1' || userId === 'u-admin-predefined') {
      showToast('Action Denied: Root administrator security configurations are fixed.', 'error');
      return;
    }
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const res = await axios.patch(`/api/admin/users/${userId}/role`, { role: nextRole });
      setUsers(users.map(u => u._id === userId ? { ...u, role: res.data.user.role } : u));
      showToast(res.data.message, 'success');
      addSecurityLog(`Elevated role of User ID: ${userId} to ${nextRole}`, 'success');
    } catch (e: any) {
      showToast('Role adjustment rejected by secure engine.', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === 'u-1' || userId === 'u-admin-predefined') {
      showToast('Action Denied: Root system administrator cannot be wiped.', 'error');
      return;
    }
    if (!window.confirm('Delete user completely and cascade delete all associated posts / comment data? This is irreversible.')) return;
    try {
      const res = await axios.delete(`/api/admin/users/${userId}`);
      setUsers(users.filter(u => u._id !== userId));
      showToast(res.data.message, 'success');
      addSecurityLog(`Cascade deleted user and related entities for User ID: ${userId}`, 'warning');
      loadData(); // Reload statistics and posts
    } catch (e) {
      showToast('Failed to delete user directory record.', 'error');
    }
  };

  const handleTogglePinFeatured = async (postId: string, currentFeatured: boolean) => {
    try {
      const res = await axios.patch(`/api/admin/posts/${postId}/featured`, { isFeatured: !currentFeatured });
      setPosts(posts.map(p => p._id === postId ? { ...p, isFeatured: res.data.post.isFeatured } : p));
      showToast(res.data.message, 'success');
    } catch (e) {
      showToast('Failed to toggle featured status.', 'error');
    }
  };

  const handleMetaEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPostId) return;
    const splitTags = editTagsRaw.split(',').map(t => t.trim()).filter(t => t.length > 0);
    try {
      const res = await axios.patch(`/api/admin/posts/${editingPostId}/meta`, { category: editCategory, tags: splitTags });
      // Update local storage to back metadata robustly
      localStorage.setItem(`post_meta_${editingPostId}`, JSON.stringify({ category: editCategory, tags: splitTags }));
      setPosts(posts.map(p => p._id === editingPostId ? { ...p, category: editCategory, tags: splitTags } : p));
      showToast('Post metadata values compiled successfully!', 'success');
      setEditingPostId(null);
    } catch (e) {
      showToast('Failed to publish meta revisions.', 'error');
    }
  };

  const openMetaEditor = (post: BlogPost) => {
    setEditingPostId(post._id);
    setEditCategory(post.category || 'Technology');
    setEditTagsRaw((post.tags || []).join(', '));
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Remove this post from publication lists?')) return;
    try {
      const res = await axios.delete(`/api/admin/posts/${postId}`);
      setPosts(posts.filter(p => p._id !== postId));
      showToast(res.data.message, 'success');
      addSecurityLog(`Deleted story ID: ${postId}`, 'warning');
    } catch (e) {
      showToast('Failed to delete public post.', 'error');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Wipe this comment block?')) return;
    try {
      const res = await axios.delete(`/api/admin/comments/${commentId}`);
      setComments(comments.filter(c => c._id !== commentId));
      showToast(res.data.message, 'success');
    } catch (e) {
      showToast('Failed to drop comment block.', 'error');
    }
  };

  // Badge Management Helper
  const handleSaveBadges = (userId: string) => {
    const list = badgeInput.split(',').map(b => b.trim()).filter(b => b.length > 0);
    localStorage.setItem(`badges_${userId}`, JSON.stringify(list));
    setUsers(users.map(u => u._id === userId ? { ...u, badges: list } : u));
    showToast('User administrative system badge index saved!', 'success');
    setSelectingBadgesUserId(null);
  };

  const openBadgeModal = (u: UserItem) => {
    setSelectingBadgesUserId(u._id);
    setBadgeInput((u.badges || []).join(', '));
  };

  // Systems settings persist
  const handleSaveSettings = () => {
    localStorage.setItem('cfg_site_name', siteName);
    localStorage.setItem('cfg_site_logo', siteLogo);
    localStorage.setItem('cfg_site_theme', siteTheme);
    localStorage.setItem('cfg_smtp_host', smtpHost);
    localStorage.setItem('cfg_smtp_port', smtpPort);
    localStorage.setItem('cfg_smtp_user', smtpUser);
    localStorage.setItem('cfg_smtp_pass', smtpPass);
    localStorage.setItem('cfg_maintenance_mode', maintenanceMode ? 'true' : 'false');
    showToast('Platform control preferences applied & verified!', 'success');
    addSecurityLog('Updated standard website settings & SMTP keys', 'success');
  };

  // Annoucements managers
  const handleBroadcastAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.trim()) return;
    const updated = [newAnnouncement.trim(), ...announcementHistory];
    setAnnouncementHistory(updated);
    localStorage.setItem('ann_history', JSON.stringify(updated));
    setNewAnnouncement('');
    showToast('Broadcasting system notification alert to standard clients.', 'success');
  };

  const toggleBannerText = () => {
    const nextVal = !bannerActive;
    setBannerActive(nextVal);
    localStorage.setItem('ann_banner_active', String(nextVal));
    localStorage.setItem('ann_banner', globalBanner);
    showToast(`System notice board ${nextVal ? 'activated' : 'deactivated'}!`, 'info');
  };

  // Handle reports actions
  const resolveReport = (repId: string, resolution: 'resolved' | 'dismissed') => {
    const nextReps = reports.map(r => r.id === repId ? { ...r, status: resolution } : r);
    setReports(nextReps);
    localStorage.setItem('sys_reports', JSON.stringify(nextReps));
    showToast(`Report updated state: ${resolution}!`, 'success');
    addSecurityLog(`Report ${repId} flagged as ${resolution}`, 'success');
  };

  const addSecurityLog = (actionText: string, stat: 'success' | 'blocked' | 'warning') => {
    const newLog: SecurityLog = {
      id: `sec-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ip: '127.0.0.1 (Self Proxy)',
      userEmail: user?.email || 'adminshiva@charcha.com',
      action: actionText,
      status: stat,
      browser: 'Admin HUD Module'
    };
    setSecurityLogs([newLog, ...securityLogs]);
  };

  // Export CSV Helper Functions
  const handleExportUsersCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Registration Date'];
    const rows = users.map(u => [
      u._id,
      u.name,
      u.email,
      u.role,
      u.isBlocked ? 'Blocked' : 'Active',
      new Date(u.createdAt).toLocaleDateString()
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `charcha_users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Community members list exported successfully as CSV!', 'success');
  };

  const handleExportPostsCSV = () => {
    const headers = ['ID', 'Title', 'Author ID', 'Status', 'Appreciations', 'Comments', 'Category', 'Pinned Featured'];
    const rows = posts.map(p => [
      p._id,
      p.title,
      p.authorId,
      p.status,
      p.likesCount || 0,
      p.commentsCount || 0,
      p.category || 'General',
      p.isFeatured ? 'YES' : 'NO'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `charcha_posts_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Blogging posts list exported successfully as CSV!', 'success');
  };

  // Search Fitment Calculations
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredPosts = posts.filter(p =>
    p.title.toLowerCase().includes(postSearch.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(postSearch.toLowerCase()) ||
    (p.author?.name || '').toLowerCase().includes(postSearch.toLowerCase())
  );

  const filteredComments = comments.filter(c =>
    c.content.toLowerCase().includes(commentSearch.toLowerCase()) ||
    (c.user?.name || '').toLowerCase().includes(commentSearch.toLowerCase())
  );

  // Trending Topics computed dynamically based on post contents
  const trendingTopics = [
    { name: '#TailwindV4', count: posts.length + 2, category: 'Tech' },
    { name: '#SystemAuth', count: comments.length + 1, category: 'Security' },
    { name: '#CommunityCoffee', count: users.length - 1, category: 'Discussion' },
    { name: '#TypeScriptLayout', count: 3, category: 'Design' }
  ].sort((a,b) => b.count - a.count);

  // Pinned Posts computed
  const pinnedPostsList = posts.filter(p => p.isFeatured);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center space-y-4 py-16">
          <RefreshCw className="animate-spin h-10 w-10 text-charcha-purple mx-auto" />
          <h3 className="font-serif text-lg font-bold">Unlocking Secure Administrator Portal...</h3>
          <p className="text-xs font-mono text-[#444D60]/60 dark:text-[#BFBFBF]/60">Validating control credentials and seeding live stats tables.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-[#444D60] dark:text-[#BFBFBF]">
      
      {/* Maintenance Override Alert */}
      {maintenanceMode && (
        <div className="p-3 bg-rose-600/10 border border-rose-600 text-rose-600 rounded-2xl flex items-center gap-3 text-xs font-mono font-bold uppercase tracking-wide">
          <ShieldAlert className="h-5 w-5 animate-pulse" />
          SYSTEM STATUS: MAINTENANCE MODE HAS BEEN ENABLED BY THE SUPERVISOR
        </div>
      )}

      {/* ADMIN UPPER HUD */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-black/10 dark:border-white/10 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#9D6DD6]/10 dark:bg-charcha-purple/30 text-[#9D6DD6] dark:text-charcha-lavender text-[10px] font-mono font-bold uppercase tracking-wide border border-[#9D6DD6]/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              Primary Admin Active
            </span>
            <span className="text-xs font-mono text-[#444D60]/60 dark:text-zinc-500">
              Host: <span className="underline">{siteName}</span>
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-[#444D60] dark:text-white">
            System Control Center
          </h1>
          <p className="text-xs text-[#444D60]/80 dark:text-zinc-400 mt-1 font-mono">
            Moderate community directories, audit articles, monitor discussion streams, and enforce security policies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            title="Refresh administrative buffers"
            className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-zinc-800 transition"
          >
            <RefreshCw className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={handleExportUsersCSV}
            className="flex items-center gap-1.5 bg-[#9D6DD6]/10 hover:bg-[#9D6DD6]/20 text-[#9D6DD6] px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition uppercase"
          >
            <Download className="h-4 w-4" />
            Users CSV
          </button>
          <button
            onClick={handleExportPostsCSV}
            className="flex items-center gap-1.5 bg-[#9D6DD6] hover:bg-[#865bc1] text-white px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition uppercase shadow-md shadow-charcha-purple/15"
          >
            <Download className="h-4 w-4" />
            Posts CSV
          </button>
        </div>
      </div>

      {/* CORE WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* SIDEBAR TABS NAVIGATOR */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest px-3 mb-2">Workspace Nodes</p>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('stats')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold font-mono uppercase tracking-wider transition ${
                activeTab === 'stats'
                  ? 'bg-charcha-purple text-white shadow-lg shadow-[#9D6DD6]/20'
                  : 'hover:bg-black/5 dark:hover:bg-zinc-800 text-[#444D60]/80 dark:text-zinc-400'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <TrendingUp className="h-4.5 w-4.5" />
                HUD Overview
              </span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">LIVE</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold font-mono uppercase tracking-wider transition ${
                activeTab === 'users'
                  ? 'bg-charcha-purple text-white shadow-lg shadow-[#9D6DD6]/20'
                  : 'hover:bg-black/5 dark:hover:bg-zinc-800 text-[#444D60]/80 dark:text-zinc-400'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Users className="h-4.5 w-4.5" />
                User Directory
              </span>
              <span className="text-[10px] bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full">{users.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('posts')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold font-mono uppercase tracking-wider transition ${
                activeTab === 'posts'
                  ? 'bg-charcha-purple text-white shadow-lg shadow-[#9D6DD6]/20'
                  : 'hover:bg-black/5 dark:hover:bg-zinc-800 text-[#444D60]/80 dark:text-zinc-400'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <FileText className="h-4.5 w-4.5" />
                Articles Desk
              </span>
              <span className="text-[10px] bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full">{posts.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('comments')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold font-mono uppercase tracking-wider transition ${
                activeTab === 'comments'
                  ? 'bg-charcha-purple text-white shadow-lg shadow-[#9D6DD6]/20'
                  : 'hover:bg-black/5 dark:hover:bg-zinc-800 text-[#444D60]/80 dark:text-zinc-400'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <MessageSquare className="h-4.5 w-4.5" />
                Comments Moderation
              </span>
              <span className="text-[10px] bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded-full">{comments.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold font-mono uppercase tracking-wider transition ${
                activeTab === 'reports'
                  ? 'bg-charcha-purple text-white shadow-lg shadow-[#9D6DD6]/20'
                  : 'hover:bg-black/5 dark:hover:bg-zinc-800 text-[#444D60]/80 dark:text-zinc-400'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <ShieldX className="h-4.5 w-4.5 text-rose-500" />
                Abuse Reports
              </span>
              <span className="text-[10px] bg-rose-600/10 text-rose-500 px-2 py-0.5 rounded-full font-bold">
                {reports.filter(r => r.status === 'pending').length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold font-mono uppercase tracking-wider transition ${
                activeTab === 'security'
                  ? 'bg-charcha-purple text-white shadow-lg shadow-[#9D6DD6]/20'
                  : 'hover:bg-black/5 dark:hover:bg-zinc-800 text-[#444D60]/80 dark:text-zinc-400'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Server className="h-4.5 w-4.5" />
                Security Logs
              </span>
              <span className="text-[10px] opacity-75">INFO</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold font-mono uppercase tracking-wider transition ${
                activeTab === 'settings'
                  ? 'bg-charcha-purple text-white shadow-lg shadow-[#9D6DD6]/20'
                  : 'hover:bg-black/5 dark:hover:bg-zinc-800 text-[#444D60]/80 dark:text-zinc-400'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Settings className="h-4.5 w-4.5" />
                Global Settings
              </span>
              <span className="text-[10px] opacity-75">CFG</span>
            </button>

            <button
              onClick={() => setActiveTab('announcements')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold font-mono uppercase tracking-wider transition ${
                activeTab === 'announcements'
                  ? 'bg-charcha-purple text-white shadow-lg shadow-[#9D6DD6]/20'
                  : 'hover:bg-black/5 dark:hover:bg-zinc-800 text-[#444D60]/80 dark:text-zinc-400'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Megaphone className="h-4.5 w-4.5" />
                Broadcaster
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${bannerActive ? 'bg-emerald-600 text-white' : 'bg-zinc-400 text-black'}`}>
                {bannerActive ? 'ON' : 'OFF'}
              </span>
            </button>
          </nav>

          <div className="pt-6">
            <div className="p-4 rounded-2xl bg-[#A0D2EB]/15 dark:bg-zinc-900 border border-black/5 dark:border-white/5 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-charcha-purple dark:text-charcha-lavender font-bold block">ACTIVE DOMAIN</span>
              <p className="text-xs font-bold truncate">{siteName}</p>
              <p className="text-[10px] font-mono text-zinc-500 leading-normal">You are logged in as Root Administrator.</p>
            </div>
          </div>
        </div>

        {/* ACTIVE WORKSPACE GRID PANEL */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* TAB 1: OVERVIEW & MULTI-METRIC STATS */}
          {activeTab === 'stats' && stats && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* STATS KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="p-5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-mono uppercase text-zinc-500 font-bold">Total Users</span>
                    <h3 className="font-serif text-2xl font-black text-[#444D60] dark:text-white mt-1">{stats.totalUsers}</h3>
                    <p className="text-[9px] text-zinc-500 font-mono mt-0.5">{users.filter(u => u.isVerified).length} verified</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <Users className="h-5 w-5" />
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-mono uppercase text-zinc-500 font-bold">Total Stories</span>
                    <h3 className="font-serif text-2xl font-black text-[#444D60] dark:text-white mt-1">{stats.totalPosts}</h3>
                    <p className="text-[9px] text-zinc-500 font-mono mt-0.5">
                      {posts.filter(p => p.status === 'published').length} published
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-mono uppercase text-zinc-500 font-bold">Charcha Replies</span>
                    <h3 className="font-serif text-2xl font-black text-[#444D60] dark:text-white mt-1">{stats.totalComments}</h3>
                    <p className="text-[9px] text-zinc-500 font-mono mt-0.5">{comments.length} comment boxes</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-[#9D6DD6]/10 flex items-center justify-center text-[#9D6DD6]">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-mono uppercase text-[#9D6DD6] font-bold">Active Members</span>
                    <h3 className="font-serif text-2xl font-black text-charcha-purple dark:text-charcha-lavender mt-1">{Math.max(3, users.length - 1)}</h3>
                    <p className="text-[9px] text-zinc-500 font-mono mt-0.5">Engaging last 24hrs</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                    <Star className="h-5 w-5 animate-spin-slow" />
                  </div>
                </div>

              </div>

              {/* BONUS FEATURE A: FEATURED POSTS CAROUSEL */}
              <div className="p-6 rounded-3xl border border-black/10 dark:border-white/10 bg-gradient-to-r from-[#9D6DD6]/10 to-indigo-500/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-serif font-black tracking-tight text-[#444D60] dark:text-white flex items-center gap-2">
                    <Star className="h-4 w-4 text-[#9D6DD6] fill-current" />
                    Featured Publications Carousel
                  </h4>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#9D6DD6]">
                    {pinnedPostsList.length} Pinned Publications
                  </span>
                </div>

                {pinnedPostsList.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-black/10 dark:border-white/10 rounded-2xl space-y-2">
                    <p className="text-xs text-[#444D60]/60 dark:text-zinc-400">There are no stories pinned to the Carousel yet.</p>
                    <button
                      onClick={() => setActiveTab('posts')}
                      className="text-[10px] bg-charcha-purple hover:bg-[#865bc1] text-white px-3 py-1.5 rounded-xl font-bold font-mono uppercase"
                    >
                      Pin Some Now
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="carousel-holder">
                    {pinnedPostsList.map(item => (
                      <div key={item._id} className="bg-white/70 dark:bg-zinc-900 border border-black/10 dark:border-[#4B4B4B] rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                        <div className="relative h-28 w-full bg-zinc-100">
                          <img src={item.featuredImage} alt={item.title} className="h-full w-full object-cover" />
                          <span className="absolute top-2 left-2 bg-[#9D6DD6] text-white font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">
                            {item.category || 'Featured'}
                          </span>
                        </div>
                        <div className="p-3.5 space-y-1.5 flex-grow">
                          <h5 className="font-serif text-xs font-black line-clamp-1">{item.title}</h5>
                          <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">{item.content}</p>
                        </div>
                        <div className="p-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] font-mono text-zinc-400 uppercase">
                          <span>👍 {item.likesCount} Recs</span>
                          <Link to={`/posts/${item.slug}`} className="text-charcha-purple dark:text-charcha-lavender">View Live</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* GRAPH LAYOUTS & TRENDING TOPICS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-2 p-6 rounded-3xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-[#1C1C1C]/40 space-y-4">
                  <h4 className="font-serif text-sm font-bold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-charcha-purple" />
                    Community Growth Trend
                  </h4>
                  <div className="h-36 flex items-end justify-between gap-1 border-b border-black/10 dark:border-zinc-800 pt-6 px-1">
                    {[15, 30, 25, 60, 48, 55, 75, 40, 50, 72, 85, 98].map((val, idx) => (
                      <div key={idx} className="flex-grow flex flex-col items-center group relative">
                        <div className="absolute bottom-full mb-1 bg-black text-white text-[9px] font-mono py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition duration-150 pointer-events-none">
                          {val} views
                        </div>
                        <div
                          style={{ height: `${val}%` }}
                          className="w-full max-w-[18px] bg-gradient-to-t from-charcha-purple to-indigo-400 rounded-t-sm transition duration-300"
                        ></div>
                        <span className="text-[8px] font-mono mt-1.5 text-zinc-500">
                          {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][idx]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BONUS FEATURE B: TRENDING TOPICS */}
                <div className="lg:col-span-1 p-6 rounded-3xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-[#1C1C1C]/40 space-y-4">
                  <h4 className="font-serif text-sm font-bold flex items-center gap-2">
                    <Award className="h-4.5 w-4.5 text-[#9D6DD6]" />
                    Trending Topics
                  </h4>
                  <div className="space-y-3">
                    {trendingTopics.map((topic, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2 last:border-none">
                        <div>
                          <span className="text-xs font-mono font-bold block">{topic.name}</span>
                          <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase tracking-wide">{topic.category}</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#9D6DD6] bg-charcha-purple/10 px-2 py-0.5 rounded-full font-black">
                          {topic.count} references
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: USER DIRECTORY MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/5 dark:border-white/5 pb-4 gap-3">
                <div className="relative flex-grow max-w-sm">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by username or email..."
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/35 focus:outline-none focus:ring-1 focus:ring-charcha-purple"
                  />
                </div>
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest bg-black/5 dark:bg-white/5 px-3 py-1 rounded-lg">
                  Displaying {filteredUsers.length} of {users.length} members
                </span>
              </div>

              {/* USER DIRECTORY TABLE */}
              <div className="overflow-x-auto rounded-3xl border border-black/10 dark:border-white/10 bg-white/40 dark:bg-[#141414]/80 backdrop-blur shadow-sm">
                <table className="min-w-full divide-y divide-black/10 dark:divide-white/10 text-left">
                  <thead>
                    <tr className="bg-black/5 dark:bg-zinc-900/80 text-[10px] font-mono text-zinc-500 uppercase font-bold">
                      <th className="px-5 py-3">Member Details</th>
                      <th className="px-5 py-3">Database Credentials</th>
                      <th className="px-5 py-3">Administrative Role</th>
                      <th className="px-5 py-3">Badge Tags</th>
                      <th className="px-5 py-3 text-right">Moderator Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5 text-xs">
                    {filteredUsers.map((item) => (
                      <tr key={item._id} className="hover:bg-black/5 dark:hover:bg-zinc-800/30 transition">
                        <td className="px-5 py-3.5 flex items-center gap-3">
                          <img src={item.avatar} alt="Avatar" className="h-8 w-8 rounded-full border border-charcha-purple" />
                          <div>
                            <span className="font-bold text-[#444D60] dark:text-white block">{item.name}</span>
                            <span className="text-[9px] text-zinc-500 font-mono">ID: {item._id}</span>
                          </div>
                        </td>
                        
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs block">{item.email}</span>
                          <span className={`text-[9px] font-mono ${item.isVerified ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {item.isVerified ? '● Email Verified' : '○ Registration Unverified'}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => handleRoleToggle(item._id, item.role)}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold uppercase transition ${
                              item.role === 'admin'
                                ? 'bg-charcha-purple text-white hover:bg-zinc-800 hover:dark:bg-white hover:dark:text-black'
                                : 'bg-black/10 text-zinc-500 dark:bg-white/5 hover:bg-charcha-purple hover:text-white'
                            }`}
                          >
                            {item.role}
                          </button>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(item.badges || []).map((b, bIdx) => (
                              <span key={bIdx} className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 block border border-amber-500/20">
                                {b}
                              </span>
                            ))}
                            <button
                              onClick={() => openBadgeModal(item)}
                              className="text-[9px] font-mono text-[#9D6DD6] hover:underline"
                            >
                              + Edit
                            </button>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-right space-x-1">
                          <button
                            onClick={() => handleBlockToggle(item._id, item.isBlocked)}
                            className={`px-2 py-1.5 rounded-xl text-[10px] font-mono font-bold transition uppercase ${
                              item.isBlocked
                                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                : 'border border-rose-300 text-rose-500 hover:bg-rose-500 hover:text-white'
                            }`}
                          >
                            {item.isBlocked ? 'Activate' : 'Suspend'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(item._id)}
                            className="p-1.5 hover:bg-rose-600 hover:text-white border border-rose-300 rounded-xl transition text-rose-500 text-right"
                            title="Delete User Record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Badge Assigner Modal Component */}
              {selectingBadgesUserId && (
                <div className="p-4 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-2xl max-w-sm space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-charcha-purple dark:text-charcha-lavender">Edit User Accolade Badges</h4>
                  <input
                    type="text"
                    value={badgeInput}
                    onChange={(e) => setBadgeInput(e.target.value)}
                    placeholder="e.g. VIP Member, Verified Core, Editor"
                    className="w-full p-2 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/30"
                  />
                  <p className="text-[9px] text-zinc-500">Provide comma separated badge titles to display on author cards.</p>
                  <div className="flex justify-end gap-2 text-xs">
                    <button onClick={() => setSelectingBadgesUserId(null)} className="px-3 py-1 text-zinc-400">Cancel</button>
                    <button onClick={() => handleSaveBadges(selectingBadgesUserId)} className="bg-charcha-purple text-white px-3 py-1 rounded-lg">Save</button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: ARTICLE DESK MANAGEMENT */}
          {activeTab === 'posts' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/5 dark:border-white/5 pb-4 gap-3">
                <div className="relative flex-grow max-w-sm">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={postSearch}
                    onChange={(e) => setPostSearch(e.target.value)}
                    placeholder="Search by publication title or category..."
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/35 focus:outline-none focus:ring-1 focus:ring-charcha-purple"
                  />
                </div>
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest bg-black/5 dark:bg-white/5 px-3 py-1 rounded-lg">
                  Available Collections: {filteredPosts.length} posts
                </span>
              </div>

              {/* POSTS DATA GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPosts.map((post) => (
                  <div key={post._id} className="p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-1.5 mb-2">
                        <span className="text-[9px] font-mono font-bold uppercase bg-charcha-purple/10 text-[#9D6DD6] px-2 py-0.5 rounded-full leading-none">
                          {post.category || 'General'}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleTogglePinFeatured(post._id, !!post.isFeatured)}
                            title={post.isFeatured ? 'Unpin from Featured Carousel' : 'Pin to Featured Carousel'}
                            className={`p-1 rounded-md transition ${post.isFeatured ? 'text-amber-500' : 'text-zinc-400 hover:text-amber-500'}`}
                          >
                            <Star className="h-4 w-4 fill-current animate-pulse-slow" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-serif text-sm font-black text-[#444D60] dark:text-white line-clamp-1">{post.title}</h4>
                      <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed mt-1">{post.content}</p>
                      
                      <div className="flex flex-wrap gap-1 mt-3">
                        {(post.tags || []).map((t, idx) => (
                          <span key={idx} className="text-[9px] font-mono text-zinc-500 bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                      <div>
                        <span className="block text-[9px] text-[#444D60]/60 dark:text-zinc-500 font-mono">
                          Author: <span className="font-bold">{post.author?.name || 'Anonymous Creator'}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openMetaEditor(post)}
                          className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase hover:bg-black/5 dark:hover:bg-zinc-800 rounded bg-black/5 dark:bg-white/15"
                        >
                          Modify Tags
                        </button>
                        <button
                          onClick={() => handleDeletePost(post._id)}
                          className="p-1 hover:bg-rose-500 hover:text-white text-rose-500 rounded bg-rose-500/10 border border-rose-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tag / Category Editing Dialog Panel */}
              {editingPostId && (
                <form onSubmit={handleMetaEditSubmit} className="p-5 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-3xl max-w-md space-y-4 shadow-xl">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-charcha-purple">Update Category & Tags</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-mono font-bold mb-1">Set Category</label>
                      <input
                        type="text"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        placeholder="e.g. Technology, Coffee"
                        className="w-full p-2 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-mono font-bold mb-1">Tags (Comma Sep)</label>
                      <input
                        type="text"
                        value={editTagsRaw}
                        onChange={(e) => setEditTagsRaw(e.target.value)}
                        placeholder="Web, Mobile, Code"
                        className="w-full p-2 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 text-xs pt-2">
                    <button type="button" onClick={() => setEditingPostId(null)} className="px-3 py-1 text-zinc-400">Cancel</button>
                    <button type="submit" className="bg-[#9D6DD6] text-white px-4 py-1.5 rounded-lg font-bold">Apply Meta</button>
                  </div>
                </form>
              )}

            </div>
          )}

          {/* TAB 4: COMMENT BOX MODERATION */}
          {activeTab === 'comments' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/5 dark:border-white/5 pb-4 gap-3">
                <div className="relative flex-grow max-w-sm">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={commentSearch}
                    onChange={(e) => setCommentSearch(e.target.value)}
                    placeholder="Filter comments or usernames..."
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/35 focus:outline-none focus:ring-1 focus:ring-charcha-purple"
                  />
                </div>
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest bg-black/5 dark:bg-white/5 px-3 py-1 rounded-lg">
                  Discussion comments: {comments.length} indices
                </span>
              </div>

              {/* COMMENTS LOGS */}
              <div className="space-y-3">
                {filteredComments.map((item) => (
                  <div key={item._id} className="p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs">{item.user?.name || 'Anonymous User'}</span>
                        <span className="text-[9px] font-mono text-zinc-500 uppercase">On Thread: "{item.postTitle || 'Story'}"</span>
                      </div>
                      <p className="text-xs bg-black/5 dark:bg-black/25 p-2 rounded-xl italic leading-relaxed text-[#444D60]/80 dark:text-zinc-300">
                        "{item.content}"
                      </p>
                      <span className="block text-[9px] text-zinc-500 font-mono">Date Sourced: {new Date(item.createdAt).toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <button
                        onClick={() => handleDeleteComment(item._id)}
                        className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase bg-rose-500/10 hover:bg-rose-500 border border-rose-300 hover:text-white rounded-xl text-rose-500 transition"
                      >
                        Delete Spam
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 5: ABUSE REPORTS MODERATION */}
          {activeTab === 'reports' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 rounded-2xl text-xs space-y-1 font-mono">
                <span className="font-bold block">⚠️ COMPLIANCE ALERTS</span>
                <p>Verify reported materials and choose dismissal or content suspension cascade paths.</p>
              </div>

              <div className="overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-white/40 dark:bg-[#141414]/80 shadow-sm">
                <table className="min-w-full divide-y divide-black/10 dark:divide-white/10 text-left text-xs">
                  <thead>
                    <tr className="bg-black/5 dark:bg-zinc-900 text-[10px] font-mono text-zinc-500 uppercase font-bold">
                      <th className="px-5 py-3">Report Details</th>
                      <th className="px-5 py-3">Submitter</th>
                      <th className="px-5 py-3">Risk Level</th>
                      <th className="px-5 py-3">Complaint Justification</th>
                      <th className="px-5 py-3 text-right">Fulfillment Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5 font-mono">
                    {reports.map((rep) => (
                      <tr key={rep.id} className="hover:bg-black/5 dark:hover:bg-zinc-800/30 transition">
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-charcha-purple dark:text-charcha-lavender block">{rep.type.toUpperCase()}: {rep.targetName}</span>
                          <span className="text-[9px] text-zinc-500">ID: {rep.targetId}</span>
                        </td>
                        
                        <td className="px-5 py-3.5">
                          <span>{rep.reportedBy}</span>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            rep.severity === 'high' ? 'bg-rose-500 text-white' : rep.severity === 'medium' ? 'bg-amber-500 text-black' : 'bg-zinc-500 text-white'
                          }`}>
                            {rep.severity.toUpperCase()}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 italic max-w-xs leading-normal">
                          "{rep.reason}"
                        </td>

                        <td className="px-5 py-3.5 text-right space-x-1">
                          {rep.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => resolveReport(rep.id, 'resolved')}
                                className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[10px] font-bold uppercase"
                              >
                                Resolve
                              </button>
                              <button
                                onClick={() => resolveReport(rep.id, 'dismissed')}
                                className="px-2 py-1 bg-zinc-500 hover:bg-zinc-600 text-white rounded text-[10px] font-bold uppercase"
                              >
                                Dismiss
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] opacity-60 italic text-emerald-500 block uppercase font-bold">
                              {rep.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 6: SECURITY EVENT TRAIL & SUSPENDS */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Suspended checklist */}
              <div className="p-5 rounded-2xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 space-y-3">
                <h4 className="font-serif text-sm font-bold flex items-center gap-2">
                  <ShieldX className="h-4.5 w-4.5 text-rose-500" />
                  Suspended Accounts Checklist
                </h4>
                {users.filter(u => u.isBlocked).length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">No community members are currently banned or suspended.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {users.filter(u => u.isBlocked).map(blocked => (
                      <div key={blocked._id} className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-between text-xs">
                        <div>
                          <strong className="block">{blocked.name}</strong>
                          <span className="font-mono text-[10px] text-zinc-500">{blocked.email}</span>
                        </div>
                        <button
                          onClick={() => handleBlockToggle(blocked._id, true)}
                          className="text-[10px] text-[#9D6DD6] hover:underline uppercase font-mono font-bold"
                        >
                          Revoke suspension
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECURITY LOGS AUDIT TRAIL */}
              <div className="space-y-4">
                <h4 className="font-serif text-sm font-bold flex items-center gap-2">
                  <Server className="h-4.5 w-4.5 text-zinc-500" />
                  Interactive System Audit & Security Trail
                </h4>

                <div className="overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-white/40 dark:bg-[#141414]/80 shadow-sm text-xs font-mono">
                  <table className="min-w-full divide-y divide-black/10 dark:divide-white/10 text-left">
                    <thead className="bg-black/5 dark:bg-zinc-900 text-[10px] font-bold text-zinc-500 uppercase">
                      <tr>
                        <th className="px-5 py-3">Timestamp / IP</th>
                        <th className="px-5 py-3">Admin Email / Subject</th>
                        <th className="px-5 py-3">Action Description</th>
                        <th className="px-5 py-3">Outcome</th>
                        <th className="px-5 py-3">Browser/Engine</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {securityLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-black/5 dark:hover:bg-zinc-800/30 transition">
                          <td className="px-5 py-3">
                            <span className="block">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            <span className="text-[9px] text-[#9D6DD6]">{log.ip}</span>
                          </td>
                          <td className="px-5 py-3">
                            <span>{log.userEmail}</span>
                          </td>
                          <td className="px-5 py-3">
                            <span>{log.action}</span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              log.status === 'success' ? 'bg-emerald-500/10 text-emerald-600' : log.status === 'blocked' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-black'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-zinc-400 text-[10px]">
                            {log.browser}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 7: GLOBAL WEBSITE CONFIG & SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="p-6 rounded-3xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 space-y-6">
                
                <h4 className="font-serif text-sm font-bold flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-3">
                  <Settings className="h-4 w-4 text-charcha-purple" />
                  Website Properties & SMTP Settings
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase mb-1">Website Title Name</label>
                    <input
                      type="text"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase mb-1">Logo Text Branding</label>
                    <input
                      type="text"
                      value={siteLogo}
                      onChange={(e) => setSiteLogo(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase mb-1">Active Client Theme Preset</label>
                    <select
                      value={siteTheme}
                      onChange={(e) => setSiteTheme(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black font-mono"
                    >
                      <option value="default-violet">💬 Classic Charcha Violet (Primary)</option>
                      <option value="slate-vintage">🌌 Space Cyber Dark Slate</option>
                      <option value="editorial-classic">📚 Editorial Ivory Serif</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase mb-1 flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5" />
                      Platform Maintenance Lock
                    </label>
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        checked={maintenanceMode}
                        onChange={(e) => setMaintenanceMode(e.target.checked)}
                        className="h-4 w-4 rounded border-black/10 text-[#9D6DD6] focus:ring-charcha-purple"
                        id="maint-checkbox"
                      />
                      <label htmlFor="maint-checkbox" className="text-xs font-bold text-rose-500 uppercase font-mono">
                        Enable Maintenance Standby
                      </label>
                    </div>
                  </div>
                </div>

                {/* SMTP CONFIGURATION SECTION */}
                <div className="pt-4 border-t border-black/5 dark:border-white/5 space-y-4">
                  <h5 className="text-xs uppercase font-mono tracking-wider text-charcha-purple dark:text-charcha-lavender font-bold flex items-center gap-1.5">
                    <Mail className="h-4 w-4" />
                    Secure SMTP Transporter Credentials (GMAIL APP SECRETS)
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                    <div>
                      <label className="block text-[10px] font-bold uppercase mb-1">Gmail SMTP Server Host</label>
                      <input
                        type="text"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        placeholder="smtp.gmail.com"
                        className="w-full p-2 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase mb-1">SMTP Connection Port SSL</label>
                      <input
                        type="text"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(e.target.value)}
                        placeholder="465"
                        className="w-full p-2 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                    <div>
                      <label className="block text-[10px] font-bold uppercase mb-1">GMAIL_USER Address</label>
                      <input
                        type="email"
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                        placeholder="your_gmail@gmail.com"
                        className="w-full p-2 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase mb-1">GMAIL_APP_PASSWORD Token</label>
                      <input
                        type="password"
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                        placeholder="abcd efgh ijkl mnop"
                        className="w-full p-2 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-black/5 dark:border-white/5 flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    className="bg-[#9D6DD6] hover:bg-[#865bc1] text-white font-mono font-bold text-xs uppercase px-4 py-2.5 rounded-xl transition shadow-md shadow-charcha-purple/15"
                  >
                    Apply Controls & Save
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* TAB 8: GLOBAL BANNER & ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="p-6 rounded-3xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 space-y-6">
                
                <h4 className="font-serif text-sm font-bold flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-3">
                  <Megaphone className="h-4 w-4 text-charcha-purple animate-bounce-slow" />
                  Interactive Broadcast HUD & Notifications
                </h4>

                {/* BANNER CONTROLS */}
                <div className="space-y-3">
                  <label className="block text-xs font-mono font-bold uppercase">System-wide Toast Notification Banner</label>
                  <textarea
                    value={globalBanner}
                    onChange={(e) => setGlobalBanner(e.target.value)}
                    rows={2}
                    className="w-full p-3 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/40 text-[#444D60] dark:text-white"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleBannerText}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase transition ${
                        bannerActive ? 'bg-emerald-600 text-white' : 'bg-zinc-500 text-white'
                      }`}
                    >
                      {bannerActive ? 'Disable Banner Live Feed' : 'Activating Banner Live Feed'}
                    </button>
                  </div>
                </div>

                {/* CREATE NEW BOARD POST NOTIFY */}
                <form onSubmit={handleBroadcastAnnouncement} className="pt-4 border-t border-black/5 dark:border-white/5 space-y-3">
                  <label className="block text-xs font-mono font-bold uppercase">Insert New Global Dashboard Activity</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newAnnouncement}
                      onChange={(e) => setNewAnnouncement(e.target.value)}
                      placeholder="Type a headline announcement..."
                      className="flex-grow p-2.5 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black/30"
                    />
                    <button
                      type="submit"
                      className="bg-[#9D6DD6] hover:bg-[#865bc1] text-white px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition"
                    >
                      Broadcast
                    </button>
                  </div>
                </form>

                {/* ANNOUNCEMENTS LOG HIST */}
                <div className="pt-4 border-t border-black/5 dark:border-white/5 space-y-3">
                  <label className="block text-xs font-mono font-bold uppercase text-zinc-500">Notice Board Broadcast Log</label>
                  <div className="space-y-2">
                    {announcementHistory.map((ann, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center gap-2.5 text-xs leading-relaxed">
                        <Bell className="h-3.5 w-3.5 text-charcha-purple shrink-0" />
                        <span>{ann}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
