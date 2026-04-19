import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, User, CreditCard, Settings, Shield, LogOut, Star, Zap, Crown,
  Check, ChevronRight, Trash2, AlertTriangle, Bell, BellOff, Moon, Sun,
  Edit3, Save, Ticket, BookOpen, Calendar, RefreshCw, Eye, EyeOff,
  Sparkles, Lock, Mail, Award, TrendingUp, Clock, Flame
} from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from 'firebase/auth';
import { UserProfile, SubscriptionTier } from '../types';
import { getSubscriptionLimits, SUBSCRIPTION_PRICING } from '../constants';
import { AIService, AISettings, DEFAULT_AI_SETTINGS, OPENROUTER_MODELS, getEffectiveModel } from '../services/AIService';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

interface AccountPanelProps {
  userProfile: UserProfile;
  stories: any[];
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onClose: () => void;
  onUpgrade: () => void;
  onRedeem: () => void;
}

type Tab = 'profile' | 'billing' | 'preferences' | 'security';

const AVATAR_EMOJIS = ['✍️','📖','🪄','🌟','🎭','🦋','🏰','🌙','🔮','🎨','🦅','🌸','⚔️','🎪','🌊','🔥','💎','🦁','🌿','🎯','🧿','🦊','🌺','🎬','🛸','🧙','🦄','🌈','🏔️','🎭'];
const AVATAR_COLORS = ['#d4af37','#1a1a2e','#16213e','#0f3460','#533483','#e94560','#05c46b','#f19066','#3c40c4','#0fbcf9','#0be881','#f53b57','#485460','#808e9b','#d2dae2'];

export default function AccountPanel({ userProfile, stories, theme, onToggleTheme, onClose, onUpgrade, onRedeem }: AccountPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Profile edit state
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(userProfile.displayName);
  const [bio, setBio] = useState(userProfile.bio || '');
  const [editingBio, setEditingBio] = useState(false);
  const [avatarEmoji, setAvatarEmoji] = useState(userProfile.avatarEmoji || '');
  const [avatarColor, setAvatarColor] = useState(userProfile.avatarColor || '#d4af37');
  const [savingProfile, setSavingProfile] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Billing state
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Preferences
  const [notificationsEnabled, setNotificationsEnabled] = useState(userProfile.notificationsEnabled ?? true);
  const [emailNotifications, setEmailNotifications] = useState(userProfile.emailNotifications ?? true);

  // AI preferences (ultimate tier only)
  const [aiPrefs, setAiPrefs] = useState<{ text?: string; image?: string; enhance?: string; title?: string; }>(
    userProfile.preferredAI ?? {}
  );
  const [aiProviders, setAiProviders] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [loadingAiProviders, setLoadingAiProviders] = useState(false);

  // Security state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const limits = getSubscriptionLimits(userProfile.subscriptionTier);
  const isGoogleUser = auth.currentUser?.providerData?.[0]?.providerId === 'google.com';

  // ── Profile Save ──
  const saveProfile = async () => {
    if (!auth.currentUser) return;
    setSavingProfile(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        displayName: displayName.trim() || userProfile.displayName,
        bio: bio.trim(),
        avatarEmoji,
        avatarColor,
      });
      setEditingName(false);
      setEditingBio(false);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Password Change ──
  const handleChangePassword = async () => {
    if (!auth.currentUser || !currentPassword || !newPassword) return;
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSavingPassword(true);
    try {
      const cred = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      toast.success('Password updated successfully!');
    } catch (err: any) {
      const msgs: Record<string, string> = {
        'auth/wrong-password': 'Current password is incorrect.',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
        'auth/requires-recent-login': 'Please sign in again before changing your password.',
      };
      toast.error(msgs[err?.code] ?? 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  // ── Load AI providers for ultimate users ──
  const loadAiProviders = async () => {
    if (loadingAiProviders || userProfile.subscriptionTier !== 'ultimate') return;
    setLoadingAiProviders(true);
    try {
      const settings = await AIService.loadSettings();
      setAiProviders(settings);
    } catch { /* silent */ } finally {
      setLoadingAiProviders(false);
    }
  };

  // ── Save Preferences ──
  const savePreferences = async () => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        notificationsEnabled,
        emailNotifications,
        ...(userProfile.subscriptionTier === 'ultimate' ? { preferredAI: aiPrefs } : {}),
      });
      toast.success('Preferences saved!');
    } catch {
      toast.error('Failed to save preferences');
    }
  };

  // ── Delete Account ──
  const handleDeleteAccount = async () => {
    if (!auth.currentUser || deleteConfirmText !== 'DELETE') return;
    setDeletingAccount(true);
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid));
      await deleteUser(auth.currentUser);
      toast.success('Account deleted.');
    } catch (err: any) {
      if (err?.code === 'auth/requires-recent-login') {
        toast.error('Please sign out and sign back in before deleting your account.');
      } else {
        toast.error('Failed to delete account. Please try again.');
      }
    } finally {
      setDeletingAccount(false);
    }
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <User size={16} /> },
    { id: 'billing', label: 'Billing', icon: <CreditCard size={16} /> },
    { id: 'preferences', label: 'Preferences', icon: <Settings size={16} /> },
    { id: 'security', label: 'Security', icon: <Shield size={16} /> },
  ];

  const tierColors: Record<SubscriptionTier, string> = {
    free: 'text-white/40 bg-white/[0.05] border-white/[0.08]',
    standard: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    premium: 'text-gold bg-gold/10 border-gold/20',
    ultimate: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };

  const tierIcons: Record<SubscriptionTier, React.ReactNode> = {
    free: <Zap size={14} />,
    standard: <Star size={14} />,
    premium: <Crown size={14} />,
    ultimate: <Sparkles size={14} />,
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-2xl bg-[#111] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gold top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-gold to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-md cursor-pointer hover:scale-105 transition-transform relative"
              style={{ backgroundColor: avatarColor }}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              {avatarEmoji || userProfile.displayName?.[0]?.toUpperCase() || 'U'}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#111] rounded-full flex items-center justify-center shadow-sm">
                <Edit3 size={10} className="text-white/30" />
              </div>
            </div>
            <div>
              <div className="font-serif font-bold text-lg leading-tight text-white/90">{userProfile.displayName}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border', tierColors[userProfile.subscriptionTier])}>
                  {tierIcons[userProfile.subscriptionTier]}
                  {userProfile.subscriptionTier}
                </span>
                <span className="text-[10px] text-white/30 font-medium">{userProfile.email}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/[0.06] rounded-xl transition-all text-white/30 hover:text-white/80">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-8 pt-4 border-b border-white/[0.06] flex-shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all mb-[-1px]',
                activeTab === tab.id
                  ? 'bg-gold/15 text-gold border border-gold/25'
                  : 'text-white/35 hover:bg-white/[0.05] hover:text-white/60'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {/* ── PROFILE TAB ── */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.18 }}
                className="p-8 space-y-8"
              >
                {/* Avatar customization */}
                <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.06]">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-5">Avatar</h3>
                  <div className="flex items-start gap-6">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl shadow-md flex-shrink-0 cursor-pointer hover:scale-105 transition-transform border-2 border-black/5"
                      style={{ backgroundColor: avatarColor }}
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      {avatarEmoji || userProfile.displayName?.[0]?.toUpperCase() || 'U'}
                    </div>

                    <div className="flex-1 space-y-4">
                      <div>
                        <p className="text-xs font-bold text-white/40 mb-2">Background Color</p>
                        <div className="flex flex-wrap gap-2">
                          {AVATAR_COLORS.map(c => (
                            <button
                              key={c}
                              onClick={() => setAvatarColor(c)}
                              className={cn('w-7 h-7 rounded-xl transition-transform hover:scale-110', avatarColor === c && 'ring-2 ring-offset-1 ring-white/30 scale-110')}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white/40 mb-2">Emoji</p>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                          {AVATAR_EMOJIS.map(e => (
                            <button
                              key={e}
                              onClick={() => setAvatarEmoji(e)}
                              className={cn('w-8 h-8 rounded-lg text-lg hover:bg-white/[0.06] transition-all flex items-center justify-center', avatarEmoji === e && 'bg-gold/20 ring-1 ring-gold/40')}
                            >
                              {e}
                            </button>
                          ))}
                          <button
                            onClick={() => setAvatarEmoji('')}
                            className={cn('w-8 h-8 rounded-lg text-[10px] font-bold text-white/40 hover:bg-white/[0.06] transition-all', !avatarEmoji && 'bg-white/[0.06]')}
                          >
                            A
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Display Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">Display Name</label>
                  <div className="flex items-center gap-3">
                    {editingName ? (
                      <input
                        autoFocus
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveProfile()}
                        className="flex-1 px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl outline-none focus:border-gold/40 text-white/90 text-sm font-medium placeholder:text-white/25"
                        maxLength={40}
                      />
                    ) : (
                      <div className="flex-1 px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm font-medium text-white/60">
                        {displayName}
                      </div>
                    )}
                    <button
                      onClick={() => editingName ? saveProfile() : setEditingName(true)}
                      className={cn('p-3 rounded-xl transition-all', editingName ? 'bg-gold text-night shadow-md shadow-gold/20' : 'bg-white/[0.06] text-white/40 hover:bg-white/[0.1]')}
                    >
                      {savingProfile ? <RefreshCw size={16} className="animate-spin" /> : editingName ? <Save size={16} /> : <Edit3 size={16} />}
                    </button>
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/40">Bio</label>
                  <div className="flex gap-3">
                    {editingBio ? (
                      <textarea
                        autoFocus
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        className="flex-1 px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl outline-none focus:border-gold/40 text-white/90 text-sm resize-none placeholder:text-white/25"
                        placeholder="Write a short bio..."
                        rows={3}
                        maxLength={160}
                      />
                    ) : (
                      <div className="flex-1 px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white/50 min-h-[80px]">
                        {bio || <span className="italic text-white/25">No bio yet — tell your story...</span>}
                      </div>
                    )}
                    <button
                      onClick={() => editingBio ? saveProfile() : setEditingBio(true)}
                      className={cn('p-3 rounded-xl transition-all self-start', editingBio ? 'bg-gold text-night shadow-md shadow-gold/20' : 'bg-white/[0.06] text-white/40 hover:bg-white/[0.1]')}
                    >
                      {savingProfile ? <RefreshCw size={16} className="animate-spin" /> : editingBio ? <Save size={16} /> : <Edit3 size={16} />}
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Stats</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: <BookOpen size={16} />, val: stories.length, label: 'Stories Forged', color: 'text-white/80' },
                      { icon: <Flame size={16} />, val: userProfile.streak || 0, label: 'Day Streak', color: 'text-orange-500' },
                      { icon: <Zap size={16} />, val: (() => { const lim = (getSubscriptionLimits(userProfile.subscriptionTier) as any).tokensPerMonth ?? 0; const used = userProfile.usageThisMonth ?? 0; return lim === 0 ? '∞' : `${Math.min(100, Math.round((used/lim)*100))}%`; })(), label: 'Tokens Used', color: 'text-gold' },
                      { icon: <TrendingUp size={16} />, val: stories.filter(s => s.isPublished).length, label: 'Published', color: 'text-green-400' },
                    ].map(stat => (
                      <div key={stat.label} className="flex items-center gap-3 p-4 bg-white/[0.03] rounded-2xl border border-white/[0.06]">
                        <div className={cn('flex-shrink-0', stat.color)}>{stat.icon}</div>
                        <div>
                          <div className={cn('text-2xl font-serif font-bold leading-none', stat.color)}>{stat.val}</div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-white/30 mt-0.5">{stat.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Badges */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Achievements</h3>
                  {userProfile.badges && userProfile.badges.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {userProfile.badges.map(badge => (
                        <div key={badge} className="flex items-center gap-2 bg-gold/[0.08] border border-gold/20 px-3 py-2 rounded-xl">
                          <Award size={13} className="text-gold" />
                          <span className="text-xs font-bold text-white/70">{badge}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-white/[0.02] rounded-2xl border border-dashed border-white/[0.08]">
                      <Award size={24} className="text-white/15 mx-auto mb-2" />
                      <p className="text-xs text-white/25 italic">No badges yet — keep crafting!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── BILLING TAB ── */}
            {activeTab === 'billing' && (
              <motion.div
                key="billing"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.18 }}
                className="p-8 space-y-8"
              >
                {/* Current Plan */}
                <div className={cn(
                  'rounded-2xl p-6 border relative overflow-hidden',
                  userProfile.subscriptionTier === 'ultimate' ? 'bg-[#1a1020] border-purple-500/20' :
                  userProfile.subscriptionTier === 'premium' ? 'bg-[#1a1600] border-gold/20' :
                  userProfile.subscriptionTier === 'standard' ? 'bg-[#0d1520] border-blue-500/20' :
                  'bg-white/[0.02] border-white/[0.06]'
                )}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {tierIcons[userProfile.subscriptionTier]}
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Current Plan</span>
                      </div>
                      <div className="text-3xl font-serif font-bold capitalize text-white/90">{userProfile.subscriptionTier}</div>
                      {userProfile.subscriptionExpiresAt && userProfile.subscriptionTier !== 'free' && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-white/40">
                          <Calendar size={12} />
                          <span>Renews {new Date(userProfile.subscriptionExpiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      )}
                    </div>
                    {userProfile.subscriptionTier !== 'free' && (
                      <div className={cn('px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border',
                        userProfile.subscriptionStatus === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                      )}>
                        {userProfile.subscriptionStatus || 'active'}
                      </div>
                    )}
                  </div>

                  {/* Usage bar */}
                  {(() => {
                    const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
                    const lastReset = userProfile.lastUsageReset || userProfile.lastTokenRefill || 0;
                    const currentUsage = Date.now() - lastReset > MONTH_MS ? 0 : (userProfile.usageThisMonth ?? 0);
                    const monthlyLimit = (limits as any).tokensPerMonth ?? 0;
                    const usagePct = monthlyLimit > 0 ? Math.min((currentUsage / monthlyLimit) * 100, 100) : 0;
                    return (
                  <div className="mt-5 pt-5 border-t border-white/[0.08]">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-white/40 uppercase tracking-wider">Monthly Token Usage</span>
                      <span className={cn('text-sm font-bold', usagePct > 85 ? 'text-red-400' : 'text-gold')}>
                        {monthlyLimit === 0 ? '∞' : `${usagePct}%`}
                      </span>
                    </div>
                    <div className="h-2 bg-white/[0.08] rounded-full overflow-hidden mb-1.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: monthlyLimit === 0 ? '100%' : `${usagePct}%` }}
                        transition={{ duration: 0.8 }}
                        className={cn('h-full rounded-full', usagePct > 85 ? 'bg-gradient-to-r from-red-500/60 to-red-500' : usagePct > 70 ? 'bg-gradient-to-r from-amber-500/60 to-amber-400' : 'bg-gradient-to-r from-gold/60 to-gold')}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-white/25">{currentUsage.toLocaleString()} / {monthlyLimit === 0 ? '∞' : monthlyLimit.toLocaleString()} tokens</span>
                      {monthlyLimit > 0 && <span className="text-[10px] text-white/20">{Math.max(0, monthlyLimit - currentUsage).toLocaleString()} remaining</span>}
                    </div>
                    {(userProfile.lastUsageReset || userProfile.lastTokenRefill) && (
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-white/20">
                        <Clock size={10} />
                        <span>Resets monthly · Last reset: {new Date(userProfile.lastUsageReset || userProfile.lastTokenRefill!).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  );
                  })()}
                </div>

                {/* Usage cost summary */}
                <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/[0.06]">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Token Cost Per Operation</h3>
                  <div className="space-y-2.5">
                    {[
                      { label: 'Create Story', val: limits.bookTokenCost || 1 },
                      { label: 'Edit Story', val: (limits as any).editTokenCost ?? 0 },
                      { label: 'AI Script Generation', val: (limits as any).aiScriptCost ?? 1 },
                      { label: 'AI Image (per image)', val: (limits as any).aiImageCost ?? 1 },
                      { label: 'AI Text Enhance', val: (limits as any).aiEnhanceCost ?? 0 },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-white/[0.06] last:border-0">
                        <span className="text-sm text-white/50">{item.label}</span>
                        <span className={cn('text-sm font-bold', item.val === 0 ? 'text-green-400' : 'text-gold')}>
                          {item.val === 0 ? 'Free' : `${item.val.toLocaleString()} tokens`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upgrade plans */}
                {userProfile.subscriptionTier !== 'ultimate' && (
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Upgrade Plan</h3>
                      {/* Monthly / Yearly toggle */}
                      <div className="flex items-center gap-1 p-1 bg-white/[0.05] rounded-xl">
                        {(['monthly', 'yearly'] as const).map(c => (
                          <button
                            key={c}
                            onClick={() => setBillingCycle(c)}
                            className={cn('px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all', billingCycle === c ? 'bg-[#1a1a1a] text-white' : 'text-white/35')}
                          >
                            {c}
                            {c === 'yearly' && <span className="ml-1 text-green-500">−20%</span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {(['standard', 'premium', 'ultimate'] as const)
                        .filter(t => {
                          const order = { free: 0, standard: 1, premium: 2, ultimate: 3 };
                          return order[t] > order[userProfile.subscriptionTier];
                        })
                        .map(tier => {
                          const pricing = SUBSCRIPTION_PRICING[tier];
                          const price = billingCycle === 'yearly' ? (pricing.yearly / 12).toFixed(2) : pricing.monthly.toFixed(2);
                          const tierLimits = getSubscriptionLimits(tier);
                          const highlights: Record<string, string> = {
                            standard: `${tierLimits.tokensPerMonth.toLocaleString()} tokens/mo · 3 stories/mo · Collaboration`,
                            premium: `${tierLimits.tokensPerMonth.toLocaleString()} tokens/mo · Unlimited stories · All styles`,
                            ultimate: `${tierLimits.tokensPerMonth.toLocaleString()} tokens/mo · All styles · Marketplace`,
                          };
                          return (
                            <div key={tier} className={cn(
                              'flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer group hover:border-gold/30 hover:bg-gold/[0.02]',
                              tier === 'premium' ? 'border-gold/25 bg-gold/[0.03]' : 'border-white/[0.07] bg-white/[0.02]'
                            )}>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  {tier === 'premium' && <div className="px-2 py-0.5 bg-gold text-night text-[9px] font-bold uppercase tracking-widest rounded-full">Popular</div>}
                                  <span className="font-serif font-bold capitalize text-base text-white/90">{tier}</span>
                                </div>
                                <p className="text-xs text-white/35">{highlights[tier]}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="text-xl font-bold text-white/90">${price}</div>
                                  <div className="text-[9px] text-white/25 uppercase tracking-wider">/ month</div>
                                </div>
                                <button
                                  onClick={onUpgrade}
                                  className={cn(
                                    'px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all',
                                    tier === 'premium'
                                      ? 'bg-gold text-night shadow-md shadow-gold/20 hover:bg-gold/90'
                                      : 'bg-white/[0.1] text-white/90 hover:bg-gold hover:text-night'
                                  )}
                                >
                                  Upgrade
                                  <ChevronRight size={14} className="inline ml-1" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Redeem code */}
                <button
                  onClick={onRedeem}
                  className="w-full flex items-center justify-between p-5 bg-white/[0.02] border border-white/[0.07] rounded-2xl hover:border-gold/25 hover:bg-gold/[0.02] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center group-hover:bg-gold group-hover:text-night transition-all">
                      <Ticket size={18} />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-sm text-white/90">Redeem a Code</div>
                      <div className="text-xs text-white/35">Enter a subscription or bonus token code</div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-white/20 group-hover:text-gold transition-colors" />
                </button>
              </motion.div>
            )}

            {/* ── PREFERENCES TAB ── */}
            {activeTab === 'preferences' && (
              <motion.div
                key="preferences"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.18 }}
                className="p-8 space-y-6"
              >
                {/* Appearance */}
                <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.06] space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Appearance</h3>

                  <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      {theme === 'dark' ? <Moon size={18} className="text-gold" /> : <Sun size={18} className="text-white/50" />}
                      <div>
                        <div className="text-sm font-bold text-white/90">Theme</div>
                        <div className="text-xs text-white/35">{theme === 'dark' ? 'Dark mode active' : 'Light mode active'}</div>
                      </div>
                    </div>
                    <button
                      onClick={onToggleTheme}
                      className={cn(
                        'w-12 h-6 rounded-full transition-all relative',
                        theme === 'dark' ? 'bg-gold' : 'bg-black/15'
                      )}
                    >
                      <motion.div
                        animate={{ x: theme === 'dark' ? 24 : 4 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                    </button>
                  </div>
                </div>

                {/* Notifications */}
                <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.06] space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Notifications</h3>

                  {[
                    { key: 'notificationsEnabled', label: 'In-App Notifications', desc: 'Toast alerts for actions and updates', icon: <Bell size={16} />, val: notificationsEnabled, set: setNotificationsEnabled },
                    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates via email', icon: <Mail size={16} />, val: emailNotifications, set: setEmailNotifications },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-3 border-b border-white/[0.06] last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="text-white/40">{item.icon}</div>
                        <div>
                          <div className="text-sm font-bold text-white/90">{item.label}</div>
                          <div className="text-xs text-white/35">{item.desc}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => item.set(!item.val)}
                        className={cn('w-12 h-6 rounded-full transition-all relative', item.val ? 'bg-gold' : 'bg-black/15')}
                      >
                        <motion.div
                          animate={{ x: item.val ? 24 : 4 }}
                          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                        />
                      </button>
                    </div>
                  ))}
                </div>

                {/* AI Preferences (Ultimate only) */}
                {userProfile.subscriptionTier === 'ultimate' && (
                  <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.06] space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">AI Preferences</h3>
                        <p className="text-[10px] text-white/25 mt-0.5">Choose which AI powers each task for you</p>
                      </div>
                      <div className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                        <Sparkles size={12} className="text-purple-400" />
                      </div>
                    </div>

                    {aiProviders === DEFAULT_AI_SETTINGS && !loadingAiProviders && (
                      <button
                        onClick={loadAiProviders}
                        className="text-xs text-gold/60 hover:text-gold transition-colors"
                      >
                        Load AI settings →
                      </button>
                    )}

                    <div className="flex items-center justify-between py-2">
                      <div>
                        <div className="text-sm font-bold text-white/80">AI Model</div>
                        <div className="text-[10px] text-white/30">Model used for all story writing tasks</div>
                      </div>
                      <select
                        value={aiPrefs.text ?? getEffectiveModel(aiProviders, 'ultimate')}
                        onChange={e => setAiPrefs(p => ({ ...p, text: e.target.value }))}
                        className="bg-white/[0.05] border border-white/[0.09] rounded-lg px-2.5 py-1.5 text-xs text-white/80 outline-none focus:border-gold/40 max-w-[180px]"
                      >
                        {OPENROUTER_MODELS.map(m => (
                          <option key={m.id} value={m.id} className="bg-[#111] text-white">
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <button
                  onClick={savePreferences}
                  className="w-full py-3.5 bg-black text-white rounded-xl font-bold hover:bg-gold hover:text-night transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  Save Preferences
                </button>
              </motion.div>
            )}

            {/* ── SECURITY TAB ── */}
            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.18 }}
                className="p-8 space-y-6"
              >
                {/* Account info */}
                <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.06]">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/35 mb-4">Account Info</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <Mail size={16} className="text-white/35" />
                        <div>
                          <div className="text-sm font-bold text-white/90">Email</div>
                          <div className="text-xs text-white/35">{userProfile.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <Check size={11} className="text-green-400" />
                        <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Verified</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <Lock size={16} className="text-white/35" />
                        <div>
                          <div className="text-sm font-bold text-white/90">Sign-in Method</div>
                          <div className="text-xs text-white/35">{isGoogleUser ? 'Google Account' : 'Email & Password'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <Calendar size={16} className="text-white/35" />
                        <div>
                          <div className="text-sm font-bold text-white/90">Member Since</div>
                          <div className="text-xs text-white/35">{new Date(userProfile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Change Password (email users only) */}
                {!isGoogleUser && (
                  <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/[0.06]">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Change Password</h3>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/35">Current Password</label>
                        <div className="relative">
                          <input
                            type={showNewPw ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl outline-none focus:border-gold/40 text-white/90 text-sm pr-10 placeholder:text-white/25"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/35">New Password</label>
                        <div className="relative">
                          <input
                            type={showNewPw ? 'text' : 'password'}
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl outline-none focus:border-gold/40 text-white/90 text-sm pr-10 placeholder:text-white/25"
                            placeholder="Min. 6 characters"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPw(p => !p)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50"
                          >
                            {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={handleChangePassword}
                        disabled={savingPassword || !currentPassword || !newPassword}
                        className="w-full py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-gold hover:text-night transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                      >
                        {savingPassword ? <RefreshCw size={15} className="animate-spin" /> : <Lock size={15} />}
                        Update Password
                      </button>
                    </div>
                  </div>
                )}

                {/* Sign Out */}
                <button
                  onClick={() => { onClose(); auth.signOut(); }}
                  className="w-full flex items-center gap-3 p-5 bg-white/[0.03] border border-white/[0.07] rounded-2xl hover:bg-red-500/10 hover:border-red-500/20 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] text-white/40 flex items-center justify-center group-hover:bg-red-500/15 group-hover:text-red-400 transition-all flex-shrink-0">
                    <LogOut size={18} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm text-white/80 group-hover:text-red-400 transition-colors">Sign Out</div>
                    <div className="text-xs text-white/35">Sign out of your account</div>
                  </div>
                  <ChevronRight size={16} className="text-white/20 ml-auto group-hover:text-red-400 transition-colors" />
                </button>

                {/* Danger Zone */}
                <div className="bg-red-500/[0.05] rounded-2xl p-6 border border-red-500/15">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle size={16} className="text-red-500" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-red-400">Danger Zone</h3>
                  </div>

                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full flex items-center justify-between p-4 bg-white/[0.04] border border-red-500/20 rounded-xl hover:border-red-500/40 hover:bg-red-500/10 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <Trash2 size={16} className="text-red-400" />
                        <div className="text-left">
                          <div className="text-sm font-bold text-red-400">Delete Account</div>
                          <div className="text-xs text-red-400/60">Permanently delete your account and all data</div>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-red-300" />
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-red-500 leading-relaxed">
                        This action is <strong>irreversible</strong>. All your stories, tokens, and account data will be permanently deleted. Type <strong>DELETE</strong> to confirm.
                      </p>
                      <input
                        autoFocus
                        value={deleteConfirmText}
                        onChange={e => setDeleteConfirmText(e.target.value)}
                        className="w-full px-4 py-3 bg-white/[0.04] border border-red-500/20 rounded-xl outline-none focus:border-red-400 text-white/90 text-sm font-mono placeholder:text-white/25"
                        placeholder="Type DELETE to confirm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                          className="flex-1 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm font-bold text-white/50 hover:bg-white/[0.08] transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
                          className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                        >
                          {deletingAccount ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          Delete Forever
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
