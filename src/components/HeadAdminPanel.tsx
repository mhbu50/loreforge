import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, User, Star, Trash2, Search, CheckCircle, XCircle, Settings, BookOpen, Zap, AlertTriangle, Bug, MessageSquare, Clock, Crown, Send, Sparkles, Code, Terminal, Bot, Activity, Database, Cpu, ShieldCheck, RefreshCw, Wand2, Plus, FileText, Brain, Key, Eye, EyeOff, ToggleLeft, ToggleRight, ChevronDown, Save, Image as ImageIconLucide } from 'lucide-react';
import { AIService, AISettings, DEFAULT_AI_SETTINGS, PROVIDER_MODELS, PROVIDER_INFO } from '../services/AIService';
import { PhotoPickerService, PhotoServiceSettings, DEFAULT_PHOTO_SETTINGS } from '../services/PhotoPickerService';
import { db, auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, getDocs, setDoc, getDoc, orderBy, addDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { UserProfile, Story, Feedback, SubscriptionCode } from '../types';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { SUBSCRIPTION_LIMITS, SUBSCRIPTION_PRICING } from '../constants';

export default function HeadAdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [subscriptionCodes, setSubscriptionCodes] = useState<SubscriptionCode[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'stories' | 'settings' | 'feedback' | 'subscription' | 'codes' | 'legal' | 'ai' | 'photos'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'admin' | 'user'>('all');
  
  const [subscriptionSettings, setSubscriptionSettings] = useState({
    free: {
      maxStoriesTotal: 1,
      maxPagesPerStory: 5,
      tokensPerMonth: 5,
      bookTokenCost: 1,
      editTokenCost: 0,
      aiScriptCost: 1,
      aiImageCost: 1,
      aiEnhanceCost: 0,
    },
    standard: {
      monthlyPrice: 7.00,
      yearlyPrice: 67.20,
      maxStoriesPerMonth: 3,
      maxPagesPerStory: 15,
      tokensPerMonth: 20,
      bookTokenCost: 1,
      editTokenCost: 0,
      aiScriptCost: 1,
      aiImageCost: 1,
      aiEnhanceCost: 0,
    },
    premium: {
      monthlyPrice: 19.99,
      yearlyPrice: 191.90,
      maxPagesPerStory: 50,
      tokensPerMonth: 100,
      bookTokenCost: 1,
      editTokenCost: 0,
      aiScriptCost: 1,
      aiImageCost: 1,
      aiEnhanceCost: 0,
    },
    ultimate: {
      monthlyPrice: 20.00,
      yearlyPrice: 200.00,
      maxPagesPerStory: 100,
      tokensPerMonth: 500,
      bookTokenCost: 1,
      editTokenCost: 0,
      aiScriptCost: 1,
      aiImageCost: 1,
      aiEnhanceCost: 0,
    }
  });

  const [globalSettings, setGlobalSettings] = useState({
    maintenanceMode: false,
    featuredStoryId: '',
    appName: 'StoryCraft',
    appIcon: '',
    termsOfConditions: 'Default Terms of Conditions...',
    privacyPolicy: 'Default Privacy Policy...',
    uiSettings: {
      showParticles: true,
      showGrain: true,
      showVignette: true,
      primaryColor: '#D97757',
      secondaryColor: '#0a0a0a',
      fontFamily: 'serif',
      animationsEnabled: true
    }
  });

  const [aiSettings, setAiSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [aiSaving, setAiSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState<string | null>(null);

  const [photoSettings, setPhotoSettings] = useState<PhotoServiceSettings>(DEFAULT_PHOTO_SETTINGS);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [visiblePhotoKeys, setVisiblePhotoKeys] = useState<Record<string, boolean>>({});

  const defaultUISettings = {
    showParticles: true,
    showGrain: true,
    showVignette: true,
    primaryColor: '#D97757',
    secondaryColor: '#0a0a0a',
    fontFamily: 'serif',
    animationsEnabled: true
  };

  const awardBadge = async (user: UserProfile, badge: string) => {
    const path = `users/${user.uid}`;
    try {
      const userRef = doc(db, 'users', user.uid);
      const currentBadges = user.badges || [];
      if (currentBadges.includes(badge)) return toast.error("User already has this badge!");
      await updateDoc(userRef, {
        badges: [...currentBadges, badge]
      });
      toast.success(`Awarded ${badge} to ${user.displayName}`);
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
      toast.error("Failed to award badge");
    }
  };

  const toggleAdmin = async (user: UserProfile) => {
    const path = `users/${user.uid}`;
    try {
      const userRef = doc(db, 'users', user.uid);
      const newRole = user.role === 'admin' ? 'user' : 'admin';
      await updateDoc(userRef, {
        role: newRole
      });
      toast.success(`Updated ${user.displayName} to ${newRole}`);
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
      toast.error("Failed to update role");
    }
  };

  const toggleSubscription = async (user: UserProfile, tier: 'free' | 'standard' | 'premium' | 'ultimate' = 'premium', cycle: 'monthly' | 'yearly' = 'monthly') => {
    const path = `users/${user.uid}`;
    try {
      const userRef = doc(db, 'users', user.uid);
      const newCycle = tier === 'free' ? 'none' : cycle;
      
      // Set expiration to 30 days for monthly, 365 for yearly
      const expiresAt = tier === 'free' ? null : Date.now() + (cycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000;

      await updateDoc(userRef, {
        subscriptionTier: tier,
        subscriptionStatus: 'active',
        subscriptionCycle: newCycle,
        subscriptionExpiresAt: expiresAt
      });
      toast.success(`Updated ${user.displayName} to ${tier} tier (${newCycle})`);
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
      toast.error("Failed to update subscription");
    }
  };

  const generateSubscriptionCode = async (tier: 'standard' | 'premium' | 'ultimate') => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const path = `subscription_codes/${code}`;
    try {
      await setDoc(doc(db, 'subscription_codes', code), {
        code,
        tier,
        isUsed: false,
        createdAt: Date.now(),
        createdBy: auth.currentUser?.uid
      });
      toast.success(`Generated 12-digit code for ${tier}: ${code}`);
    } catch (error) {
      console.error(error);
      handleFirestoreError(error, OperationType.CREATE, path);
      toast.error("Failed to generate code");
    }
  };

  const deleteSubscriptionCode = async (codeId: string) => {
    const path = `subscription_codes/${codeId}`;
    try {
      await deleteDoc(doc(db, 'subscription_codes', codeId));
      toast.success("Code deleted");
    } catch (error) {
      console.error(error);
      handleFirestoreError(error, OperationType.DELETE, path);
      toast.error("Failed to delete code");
    }
  };

  useEffect(() => {
    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      })) as UserProfile[];
      setUsers(fetchedUsers);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    const qStories = query(collection(db, 'stories'));
    const unsubStories = onSnapshot(qStories, (snapshot) => {
      const fetchedStories = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Story[];
      setStories(fetchedStories);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'stories'));

    const qFeedback = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
    const unsubFeedback = onSnapshot(qFeedback, (snapshot) => {
      const fetchedFeedback = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Feedback[];
      setFeedback(fetchedFeedback);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'feedback'));

    const qCodes = query(collection(db, 'subscription_codes'), orderBy('createdAt', 'desc'));
    const unsubCodes = onSnapshot(qCodes, (snapshot) => {
      const fetchedCodes = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as SubscriptionCode[];
      setSubscriptionCodes(fetchedCodes);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'subscription_codes'));

    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
        if (settingsDoc.exists()) {
          setGlobalSettings(prev => ({ ...prev, ...settingsDoc.data() }));
        } else if (auth.currentUser?.email === 'alaa.abukhamseen@gmail.com') {
          await setDoc(doc(db, 'settings', 'global'), globalSettings);
        }
        const subDoc = await getDoc(doc(db, 'settings', 'subscription'));
        if (subDoc.exists()) {
          setSubscriptionSettings(subDoc.data() as any);
        } else if (auth.currentUser?.email === 'alaa.abukhamseen@gmail.com') {
          await setDoc(doc(db, 'settings', 'subscription'), subscriptionSettings);
        }
        const loaded = await AIService.loadSettings();
        setAiSettings(loaded);
        const photoDoc = await getDoc(doc(db, 'settings', 'photo_services'));
        if (photoDoc.exists()) {
          const d = photoDoc.data();
          setPhotoSettings({
            unsplash: { ...DEFAULT_PHOTO_SETTINGS.unsplash, ...(d.unsplash || {}) },
            pexels:   { ...DEFAULT_PHOTO_SETTINGS.pexels,   ...(d.pexels   || {}) },
            pixabay:  { ...DEFAULT_PHOTO_SETTINGS.pixabay,  ...(d.pixabay  || {}) },
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'settings');
      }
    };
    fetchSettings();

    return () => {
      unsubUsers();
      unsubStories();
      unsubFeedback();
      unsubCodes();
    };
  }, []);

  const updateSubscriptionSettings = async (updates: any) => {
    const path = 'settings/subscription';
    try {
      await setDoc(doc(db, 'settings', 'subscription'), updates);
      setSubscriptionSettings(updates);
      toast.success("Subscription settings updated!");
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
      toast.error("Failed to update subscription settings");
    }
  };

  const updateGlobalSettings = async (updates: Partial<typeof globalSettings>) => {
    const path = 'settings/global';
    try {
      const newSettings = { ...globalSettings, ...updates };
      await setDoc(doc(db, 'settings', 'global'), newSettings);
      setGlobalSettings(newSettings);
      toast.success("Settings updated!");
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
      toast.error("Failed to update settings");
    }
  };

  const saveAiSettings = async () => {
    setAiSaving(true);
    try {
      await AIService.saveSettings(aiSettings);
      toast.success('AI settings saved!');
    } catch (error) {
      toast.error('Failed to save AI settings');
    } finally {
      setAiSaving(false);
    }
  };

  const savePhotoSettings = async () => {
    setPhotoSaving(true);
    try {
      await PhotoPickerService.saveSettings(photoSettings);
      toast.success('Photo service settings saved!');
    } catch (error) {
      toast.error('Failed to save photo settings');
    } finally {
      setPhotoSaving(false);
    }
  };

  const updatePhotoService = (service: keyof PhotoServiceSettings, field: string, value: any) => {
    setPhotoSettings(prev => ({
      ...prev,
      [service]: { ...prev[service], [field]: value }
    }));
  };

  const updateFeedbackStatus = async (id: string, status: Feedback['status']) => {
    const path = `feedback/${id}`;
    try {
      await updateDoc(doc(db, 'feedback', id), { status });
      toast.success(`Feedback marked as ${status}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
      toast.error("Failed to update feedback status");
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this feedback?")) return;
    const path = `feedback/${id}`;
    try {
      await deleteDoc(doc(db, 'feedback', id));
      toast.success("Feedback deleted");
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
      toast.error("Failed to delete feedback");
    }
  };

  const deleteStory = async (storyId: string) => {
    if (!window.confirm("Are you sure you want to delete this story?")) return;
    const path = `stories/${storyId}`;
    try {
      await deleteDoc(doc(db, 'stories', storyId));
      toast.success("Story deleted");
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
      toast.error("Failed to delete story");
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(`Password reset email sent to ${email}`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send reset email');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || user.role === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="relative bg-[#141414] rounded-[2rem] p-8 overflow-hidden mb-2">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 translate-x-1/2 -translate-y-1/2 rounded-full" style={{background: 'radial-gradient(circle, rgba(217,119,87,0.08) 0%, transparent 70%)'}} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-[#D97757]/10 border border-[#D97757]/20 rounded-2xl flex items-center justify-center text-[#D97757]">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-white">Control Center</h2>
              <p className="text-white/40 text-sm mt-0.5">Full platform management & configuration</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
            <div className="px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              System Online
            </div>
            <div className="px-4 py-2 bg-[#D97757]/10 text-[#D97757] border border-[#D97757]/20 rounded-xl">
              {users.length} Users
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex flex-wrap items-center gap-2 p-1 bg-white/[0.04] rounded-2xl">
        {([
          { id: 'users', label: 'Users', icon: <User size={14} /> },
          { id: 'stories', label: 'Stories', icon: <BookOpen size={14} /> },
          { id: 'feedback', label: 'Feedback', icon: <MessageSquare size={14} /> },
          { id: 'settings', label: 'Settings', icon: <Settings size={14} /> },
          { id: 'subscription', label: 'Subscription', icon: <Crown size={14} /> },
          { id: 'codes', label: 'Codes', icon: <Zap size={14} /> },
          { id: 'legal', label: 'Legal', icon: <FileText size={14} /> },
          { id: 'ai', label: 'AI', icon: <Brain size={14} /> },
          { id: 'photos', label: 'Photos', icon: <ImageIconLucide size={14} /> },
        ] as const).map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
              activeTab === id
                ? "bg-[#141414] text-[#D97757] shadow-lg shadow-black/20"
                : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
            )}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:ring-2 focus:ring-[#D97757]/30 text-white/90 placeholder:text-white/25 outline-none transition-all w-full"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 bg-white/[0.05] border border-white/[0.09] rounded-xl text-white/90 focus:ring-2 focus:ring-[#D97757]/30 outline-none transition-all"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins</option>
              <option value="user">Users</option>
            </select>
          </div>

          <div className="bg-[#111] rounded-2xl border border-white/[0.07] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.03] border-b border-white/[0.06]">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/35">User</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/35">Role / Tier</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/35">Tokens</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/35">Badges</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/35 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full bg-[#D97757]/10 text-[#D97757] flex items-center justify-center font-bold text-sm flex-shrink-0"
                          style={(user as any).avatarColor ? { backgroundColor: (user as any).avatarColor } : {}}
                        >
                          {(user as any).avatarEmoji || user.displayName?.[0] || 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-white/90 truncate">{user.displayName}</div>
                          <div className="text-xs text-white/55 truncate select-all">{user.email}</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            {(user as any).authProvider === 'google' ? (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md text-[9px] font-bold text-blue-400 uppercase tracking-wider">
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-3 h-3" alt="" />
                                Google
                              </span>
                            ) : (user as any).authProvider === 'email' ? (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-white/[0.05] border border-white/[0.08] rounded-md text-[9px] font-bold text-white/40 uppercase tracking-wider">
                                ✉ Email
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest w-fit ${
                          user.role === 'headadmin' ? 'bg-[#D97757]/10 text-[#D97757]' :
                          user.role === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-white/[0.06] text-white/50'
                        }`}>
                          {user.role}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest w-fit flex items-center gap-1 ${
                          user.subscriptionTier === 'premium' ? 'bg-[#D97757]/10 text-[#D97757] border border-[#D97757]/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {user.subscriptionTier}
                          {user.subscriptionTier === 'premium' && <Crown size={10} />}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white/35 uppercase">Tokens</span>
                          <input
                            type="number"
                            value={user.tokens || 0}
                            onChange={(e) => updateDoc(doc(db, 'users', user.uid), { tokens: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) })}
                            className="w-20 bg-white/[0.04] border border-white/[0.07] text-white/90 rounded-lg px-2 py-1 text-sm font-bold"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.badges?.map(badge => (
                          <span key={badge} className="bg-[#D97757]/10 text-[#D97757] text-[10px] px-2 py-0.5 rounded-full border border-[#D97757]/20">
                            {badge}
                          </span>
                        ))}
                        <button 
                          onClick={() => awardBadge(user, 'Elite Author')}
                          className="text-[10px] text-[#D97757]/60 hover:text-[#D97757] font-bold"
                        >
                          + Award
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="flex bg-white/[0.06] p-1 rounded-lg">
                          <button
                            onClick={() => toggleSubscription(user, 'free')}
                            className={cn("p-2 rounded-md transition-all", user.subscriptionTier === 'free' ? "bg-white/[0.1] shadow-sm text-blue-400" : "text-white/30 hover:text-blue-400")}
                            title="Set to Free"
                          >
                            <span className="text-[10px] font-bold">F</span>
                          </button>
                          <button
                            onClick={() => toggleSubscription(user, 'standard')}
                            className={cn("p-2 rounded-md transition-all", user.subscriptionTier === 'standard' ? "bg-white/[0.1] shadow-sm text-[#D97757]" : "text-white/30 hover:text-[#D97757]")}
                            title="Set to Standard"
                          >
                            <span className="text-[10px] font-bold">S</span>
                          </button>
                          <button
                            onClick={() => toggleSubscription(user, 'premium')}
                            className={cn("p-2 rounded-md transition-all", user.subscriptionTier === 'premium' ? "bg-white/[0.1] shadow-sm text-[#D97757]" : "text-white/30 hover:text-[#D97757]")}
                            title="Set to Premium"
                          >
                            <Crown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleSubscription(user, 'ultimate')}
                            className={cn("p-2 rounded-md transition-all", user.subscriptionTier === 'ultimate' ? "bg-white/[0.1] shadow-sm text-red-400" : "text-white/30 hover:text-red-400")}
                            title="Set to Ultimate"
                          >
                            <Zap className="w-4 h-4" />
                          </button>
                        </div>
                        {user.email !== 'alaa.abukhamseen@gmail.com' && (
                          <button
                            onClick={() => toggleAdmin(user)}
                            className={`p-2 rounded-lg transition-all ${
                              user.role === 'admin' ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-[#D97757]/10 text-[#D97757] hover:bg-[#D97757]/20'
                            }`}
                            title={user.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        )}
                        {user.email && (
                          <button
                            onClick={() => sendPasswordReset(user.email!)}
                            className="p-2 rounded-lg bg-white/[0.05] text-white/35 hover:bg-blue-500/10 hover:text-blue-400 transition-all"
                            title="Send Password Reset Email"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'stories' && (
        <div className="bg-[#111] rounded-2xl border border-white/[0.07] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/[0.06]">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/35">Story</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/35">Author</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/35">Pages</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/35">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-white/35 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {stories.map((story) => (
                <tr key={story.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white/90">{story.title}</div>
                    <div className="text-xs text-white/40">{story.style}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-white/55">{story.authorName}</td>
                  <td className="px-6 py-4 text-sm text-white/55">{story.pages.length}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${
                      story.isPublished ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/[0.06] text-white/50'
                    }`}>
                      {story.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deleteStory(story.id)}
                      className="p-2 text-white/35 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {feedback.map((item) => (
              <div key={item.id} className="bg-[#111] rounded-2xl p-6 border border-white/[0.07] hover:border-white/[0.12] transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.type === 'bug' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {item.type === 'bug' ? <Bug size={24} /> : <MessageSquare size={24} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold uppercase tracking-widest text-white/80">{item.type}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          item.status === 'resolved' ? 'bg-green-500/10 text-green-400' :
                          item.status === 'reviewed' ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-white/35">{item.userEmail} • {new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateFeedbackStatus(item.id!, 'reviewed')}
                      className="p-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-all"
                      title="Mark as Reviewed"
                    >
                      <CheckCircle size={18} />
                    </button>
                    <button
                      onClick={() => updateFeedbackStatus(item.id!, 'resolved')}
                      className="p-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl hover:bg-green-500/20 transition-all"
                      title="Mark as Resolved"
                    >
                      <CheckCircle size={18} />
                    </button>
                    <button
                      onClick={() => deleteFeedback(item.id!)}
                      className="p-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <p className="text-lg font-medium text-white/80 leading-relaxed">{item.content}</p>
              </div>
            ))}
            {feedback.length === 0 && (
              <div className="text-center py-20 bg-[#111] rounded-2xl border border-dashed border-white/[0.08]">
                <MessageSquare className="mx-auto mb-4 text-white/15" size={48} />
                <p className="text-white/30 font-sans italic text-xl">No feedback received yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'subscription' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Free Tier */}
            <div className="bg-[#111] p-6 rounded-2xl border border-white/[0.07] space-y-8">
              <div className="flex items-center gap-3">
                <Star className="text-blue-400" />
                <h3 className="text-xl font-bold text-white/90">Free Tier Limits</h3>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/35">Max Stories (Total)</label>
                  <input 
                    type="number" 
                    value={subscriptionSettings.free?.maxStoriesTotal ?? 1}
                    onChange={(e) => updateSubscriptionSettings({
                      ...subscriptionSettings,
                      free: { ...subscriptionSettings.free, maxStoriesTotal: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                    })}
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/35">Max Pages Per Story</label>
                  <input 
                    type="number" 
                    value={subscriptionSettings.free?.maxPagesPerStory ?? 5}
                    onChange={(e) => updateSubscriptionSettings({
                      ...subscriptionSettings,
                      free: { ...subscriptionSettings.free, maxPagesPerStory: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                    })}
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/35">Tokens / Month</label>
                    <input
                      type="number"
                      value={subscriptionSettings.free?.tokensPerMonth ?? 0}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        free: { ...subscriptionSettings.free, tokensPerMonth: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                      })}
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/35">Create Story (tokens)</label>
                    <input
                      type="number"
                      value={subscriptionSettings.free?.bookTokenCost ?? 0}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        free: { ...subscriptionSettings.free, bookTokenCost: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                      })}
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/35">Edit Story (tokens)</label>
                    <input
                      type="number"
                      value={subscriptionSettings.free?.editTokenCost ?? 0}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        free: { ...subscriptionSettings.free, editTokenCost: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                      })}
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-3">Token Cost Per Operation</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/35">AI Script (tokens)</label>
                      <input
                        type="number"
                        value={(subscriptionSettings.free as any)?.aiScriptCost ?? 0}
                        onChange={(e) => updateSubscriptionSettings({
                          ...subscriptionSettings,
                          free: { ...subscriptionSettings.free, aiScriptCost: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                        })}
                        className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/35">AI Image (tokens)</label>
                      <input
                        type="number"
                        value={(subscriptionSettings.free as any)?.aiImageCost ?? 0}
                        onChange={(e) => updateSubscriptionSettings({
                          ...subscriptionSettings,
                          free: { ...subscriptionSettings.free, aiImageCost: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                        })}
                        className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/35">AI Enhance (tokens)</label>
                      <input
                        type="number"
                        value={(subscriptionSettings.free as any)?.aiEnhanceCost ?? 0}
                        onChange={(e) => updateSubscriptionSettings({
                          ...subscriptionSettings,
                          free: { ...subscriptionSettings.free, aiEnhanceCost: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                        })}
                        className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Standard Tier */}
            <div className="bg-[#111] p-6 rounded-2xl border border-white/[0.07] space-y-8">
              <div className="flex items-center gap-3">
                <Star className="text-[#D97757]" />
                <h3 className="text-xl font-bold text-white/90">Standard Tier Settings</h3>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/35">Monthly Price ($)</label>
                    <input 
                      type="number" step="0.01"
                      value={subscriptionSettings.standard.monthlyPrice}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        standard: { ...subscriptionSettings.standard, monthlyPrice: (v => isNaN(v) ? 0 : v)(parseFloat(e.target.value)) }
                      })}
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/35">Yearly Price ($)</label>
                    <input 
                      type="number" step="0.01"
                      value={subscriptionSettings.standard.yearlyPrice}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        standard: { ...subscriptionSettings.standard, yearlyPrice: (v => isNaN(v) ? 0 : v)(parseFloat(e.target.value)) }
                      })}
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/35">Max Stories Per Month</label>
                  <input 
                    type="number" 
                    value={subscriptionSettings.standard.maxStoriesPerMonth ?? 3}
                    onChange={(e) => updateSubscriptionSettings({
                      ...subscriptionSettings,
                      standard: { ...subscriptionSettings.standard, maxStoriesPerMonth: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                    })}
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/35">Max Pages Per Story</label>
                  <input 
                    type="number" 
                    value={subscriptionSettings.standard.maxPagesPerStory}
                    onChange={(e) => updateSubscriptionSettings({
                      ...subscriptionSettings,
                      standard: { ...subscriptionSettings.standard, maxPagesPerStory: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                    })}
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/35">Tokens / Month</label>
                    <input
                      type="number"
                      value={subscriptionSettings.standard.tokensPerMonth ?? 0}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        standard: { ...subscriptionSettings.standard, tokensPerMonth: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                      })}
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/35">Create Story (tokens)</label>
                    <input
                      type="number"
                      value={subscriptionSettings.standard.bookTokenCost ?? 0}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        standard: { ...subscriptionSettings.standard, bookTokenCost: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                      })}
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/35">Edit Story (tokens)</label>
                    <input
                      type="number"
                      value={subscriptionSettings.standard.editTokenCost ?? 0}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        standard: { ...subscriptionSettings.standard, editTokenCost: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                      })}
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-3">Token Cost Per Operation</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/35">AI Script (tokens)</label>
                      <input
                        type="number"
                        value={(subscriptionSettings.standard as any)?.aiScriptCost ?? 0}
                        onChange={(e) => updateSubscriptionSettings({
                          ...subscriptionSettings,
                          standard: { ...subscriptionSettings.standard, aiScriptCost: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                        })}
                        className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/35">AI Image (tokens)</label>
                      <input
                        type="number"
                        value={(subscriptionSettings.standard as any)?.aiImageCost ?? 0}
                        onChange={(e) => updateSubscriptionSettings({
                          ...subscriptionSettings,
                          standard: { ...subscriptionSettings.standard, aiImageCost: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                        })}
                        className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/35">AI Enhance (tokens)</label>
                      <input
                        type="number"
                        value={(subscriptionSettings.standard as any)?.aiEnhanceCost ?? 0}
                        onChange={(e) => updateSubscriptionSettings({
                          ...subscriptionSettings,
                          standard: { ...subscriptionSettings.standard, aiEnhanceCost: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                        })}
                        className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Tier */}
            <div className="bg-[#111] p-6 rounded-2xl border border-white/[0.07] space-y-8">
              <div className="flex items-center gap-3">
                <Crown className="text-[#D97757]" />
                <h3 className="text-xl font-bold text-white/90">Premium Tier Settings</h3>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/35">Monthly Price ($)</label>
                    <input 
                      type="number" step="0.01"
                      value={subscriptionSettings.premium.monthlyPrice}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        premium: { ...subscriptionSettings.premium, monthlyPrice: (v => isNaN(v) ? 0 : v)(parseFloat(e.target.value)) }
                      })}
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/35">Yearly Price ($)</label>
                    <input 
                      type="number" step="0.01"
                      value={subscriptionSettings.premium.yearlyPrice}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        premium: { ...subscriptionSettings.premium, yearlyPrice: (v => isNaN(v) ? 0 : v)(parseFloat(e.target.value)) }
                      })}
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/35">Max Pages Per Story</label>
                  <input 
                    type="number" 
                    value={subscriptionSettings.premium.maxPagesPerStory}
                    onChange={(e) => updateSubscriptionSettings({
                      ...subscriptionSettings,
                      premium: { ...subscriptionSettings.premium, maxPagesPerStory: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                    })}
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/35">Tokens / Month</label>
                    <input
                      type="number"
                      value={subscriptionSettings.premium.tokensPerMonth ?? 0}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        premium: { ...subscriptionSettings.premium, tokensPerMonth: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                      })}
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/35">Create Story (tokens)</label>
                    <input
                      type="number"
                      value={subscriptionSettings.premium.bookTokenCost ?? 0}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        premium: { ...subscriptionSettings.premium, bookTokenCost: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                      })}
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/35">Edit Story (tokens)</label>
                    <input
                      type="number"
                      value={(subscriptionSettings.premium as any).editTokenCost ?? 0}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        premium: { ...subscriptionSettings.premium, editTokenCost: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                      })}
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-3">Token Cost Per Operation</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/35">AI Script (tokens)</label>
                      <input
                        type="number"
                        value={(subscriptionSettings.premium as any)?.aiScriptCost ?? 0}
                        onChange={(e) => updateSubscriptionSettings({
                          ...subscriptionSettings,
                          premium: { ...subscriptionSettings.premium, aiScriptCost: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                        })}
                        className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/35">AI Image (tokens)</label>
                      <input
                        type="number"
                        value={(subscriptionSettings.premium as any)?.aiImageCost ?? 0}
                        onChange={(e) => updateSubscriptionSettings({
                          ...subscriptionSettings,
                          premium: { ...subscriptionSettings.premium, aiImageCost: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                        })}
                        className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/35">AI Enhance (tokens)</label>
                      <input
                        type="number"
                        value={(subscriptionSettings.premium as any)?.aiEnhanceCost ?? 0}
                        onChange={(e) => updateSubscriptionSettings({
                          ...subscriptionSettings,
                          premium: { ...subscriptionSettings.premium, aiEnhanceCost: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                        })}
                        className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ultimate Tier */}
            <div className="bg-[#111] p-6 rounded-2xl border border-white/[0.07] space-y-8">
              <div className="flex items-center gap-3">
                <Zap className="text-red-500" />
                <h3 className="text-xl font-bold text-white/90">Ultimate Tier Settings</h3>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/35">Monthly Price ($)</label>
                    <input 
                      type="number" step="0.01"
                      value={subscriptionSettings.ultimate?.monthlyPrice ?? 20}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        ultimate: { ...subscriptionSettings.ultimate, monthlyPrice: (v => isNaN(v) ? 0 : v)(parseFloat(e.target.value)) }
                      })}
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/35">Yearly Price ($)</label>
                    <input 
                      type="number" step="0.01"
                      value={subscriptionSettings.ultimate?.yearlyPrice ?? 200}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        ultimate: { ...subscriptionSettings.ultimate, yearlyPrice: (v => isNaN(v) ? 0 : v)(parseFloat(e.target.value)) }
                      })}
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/35">Max Pages Per Story</label>
                  <input 
                    type="number" 
                    value={subscriptionSettings.ultimate?.maxPagesPerStory ?? 100}
                    onChange={(e) => updateSubscriptionSettings({
                      ...subscriptionSettings,
                      ultimate: { ...subscriptionSettings.ultimate, maxPagesPerStory: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                    })}
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/35">Tokens / Month</label>
                    <input
                      type="number"
                      value={subscriptionSettings.ultimate?.tokensPerMonth ?? 0}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        ultimate: { ...subscriptionSettings.ultimate, tokensPerMonth: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                      })}
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/35">Create Story (tokens)</label>
                    <input
                      type="number"
                      value={subscriptionSettings.ultimate?.bookTokenCost ?? 0}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        ultimate: { ...subscriptionSettings.ultimate, bookTokenCost: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                      })}
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/35">Edit Story (tokens)</label>
                    <input
                      type="number"
                      value={(subscriptionSettings.ultimate as any)?.editTokenCost ?? 0}
                      onChange={(e) => updateSubscriptionSettings({
                        ...subscriptionSettings,
                        ultimate: { ...subscriptionSettings.ultimate, editTokenCost: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                      })}
                      className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-3">Token Cost Per Operation</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/35">AI Script (tokens)</label>
                      <input
                        type="number"
                        value={(subscriptionSettings.ultimate as any)?.aiScriptCost ?? 0}
                        onChange={(e) => updateSubscriptionSettings({
                          ...subscriptionSettings,
                          ultimate: { ...subscriptionSettings.ultimate, aiScriptCost: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                        })}
                        className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/35">AI Image (tokens)</label>
                      <input
                        type="number"
                        value={(subscriptionSettings.ultimate as any)?.aiImageCost ?? 0}
                        onChange={(e) => updateSubscriptionSettings({
                          ...subscriptionSettings,
                          ultimate: { ...subscriptionSettings.ultimate, aiImageCost: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                        })}
                        className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-white/35">AI Enhance (tokens)</label>
                      <input
                        type="number"
                        value={(subscriptionSettings.ultimate as any)?.aiEnhanceCost ?? 0}
                        onChange={(e) => updateSubscriptionSettings({
                          ...subscriptionSettings,
                          ultimate: { ...subscriptionSettings.ultimate, aiEnhanceCost: (v => isNaN(v) ? 0 : v)(parseInt(e.target.value)) }
                        })}
                        className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#111] p-6 rounded-2xl border border-white/[0.07] space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="text-[#D97757]" />
              <h3 className="text-xl font-bold text-white/90">Global Configuration</h3>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-amber-500" />
                <div>
                  <div className="font-bold text-white/90">Maintenance Mode</div>
                  <div className="text-xs text-white/40">Restrict access to the app</div>
                </div>
              </div>
              <button 
                onClick={() => updateGlobalSettings({ maintenanceMode: !globalSettings.maintenanceMode })}
                className={cn("w-12 h-6 rounded-full transition-all relative", globalSettings.maintenanceMode ? "bg-red-500" : "bg-white/[0.12]")}
              >
                <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", globalSettings.maintenanceMode ? "right-1" : "left-1")} />
              </button>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/[0.07]">
              <label className="text-xs font-bold uppercase tracking-widest text-white/35">Terms and Conditions</label>
              <textarea
                value={globalSettings.termsOfConditions}
                onChange={(e) => updateGlobalSettings({ termsOfConditions: e.target.value })}
                className="w-full h-64 px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 placeholder:text-white/25 outline-none transition-all font-sans text-sm resize-none"
                placeholder="Enter the long terms and conditions here..."
              />
              <p className="text-[10px] text-white/35 italic">This text will be displayed on the login page.</p>
            </div>
          </div>

          {/* Branding Card */}
          <div className="bg-[#111] p-6 rounded-2xl border border-white/[0.07] space-y-6 md:col-span-2">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="text-[#D97757]" />
              <h3 className="text-xl font-bold text-white/90">App Branding</h3>
            </div>

            {/* Live preview */}
            <div className="flex items-center gap-5 p-6 bg-[#141414] rounded-2xl border border-white/5">
              <div className="w-14 h-14 bg-[#D97757] rounded-2xl flex items-center justify-center text-[#1a1a1a] overflow-hidden flex-shrink-0 shadow-lg shadow-[#D97757]/30">
                {globalSettings.appIcon?.startsWith('http') ? (
                  <img src={globalSettings.appIcon} className="w-full h-full object-cover" alt="app icon" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : globalSettings.appIcon ? (
                  <span className="text-2xl">{globalSettings.appIcon}</span>
                ) : (
                  <Sparkles size={28} />
                )}
              </div>
              <div>
                <div className="font-sans text-2xl font-bold text-white">{globalSettings.appName || 'StoryCraft'}</div>
                <div className="text-[10px] text-[#D97757]/50 uppercase tracking-widest font-bold mt-1">Live Preview</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/35">App Name</label>
                <input
                  value={globalSettings.appName || 'StoryCraft'}
                  onChange={(e) => setGlobalSettings(prev => ({ ...prev, appName: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 placeholder:text-white/25 outline-none transition-all font-sans text-lg"
                  placeholder="StoryCraft"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-white/35">App Icon (emoji or image URL)</label>
                <input
                  value={globalSettings.appIcon || ''}
                  onChange={(e) => setGlobalSettings(prev => ({ ...prev, appIcon: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl focus:border-[#D97757]/40 focus:ring-0 text-white/90 placeholder:text-white/25 outline-none transition-all"
                  placeholder="✨  or  https://example.com/icon.png"
                />
                <p className="text-[10px] text-white/35 italic">Enter an emoji like ✨ or a direct image URL</p>
              </div>
            </div>

            <button
              onClick={() => updateGlobalSettings({ appName: globalSettings.appName, appIcon: globalSettings.appIcon })}
              className="px-8 py-3 bg-[#D97757] text-[#1a1a1a] font-bold rounded-xl hover:bg-[#D97757]/90 transition-all text-sm flex items-center gap-2"
            >
              <Save size={16} />
              Save Branding
            </button>
          </div>

          <div className="bg-[#111] p-6 rounded-2xl border border-white/[0.07] space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="text-[#D97757]" />
              <h3 className="text-xl font-bold text-white/90">UI & Visuals</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl">
                <div>
                  <div className="font-bold text-sm text-white/90">Ambient Particles</div>
                  <div className="text-[10px] text-white/40">Floating dust & magic</div>
                </div>
                <button 
                  onClick={() => updateGlobalSettings({ 
                    uiSettings: { ...(globalSettings.uiSettings || defaultUISettings), showParticles: !(globalSettings.uiSettings?.showParticles ?? true) } 
                  })}
                  className={cn("w-10 h-5 rounded-full transition-all relative", (globalSettings.uiSettings?.showParticles ?? true) ? "bg-[#D97757]" : "bg-white/[0.12]")}
                >
                  <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all", (globalSettings.uiSettings?.showParticles ?? true) ? "right-0.5" : "left-0.5")} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl">
                <div>
                  <div className="font-bold text-sm text-white/90">Film Grain</div>
                  <div className="text-[10px] text-white/40">Subtle texture overlay</div>
                </div>
                <button 
                  onClick={() => updateGlobalSettings({ 
                    uiSettings: { ...(globalSettings.uiSettings || defaultUISettings), showGrain: !(globalSettings.uiSettings?.showGrain ?? true) } 
                  })}
                  className={cn("w-10 h-5 rounded-full transition-all relative", (globalSettings.uiSettings?.showGrain ?? true) ? "bg-[#D97757]" : "bg-white/[0.12]")}
                >
                  <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all", (globalSettings.uiSettings?.showGrain ?? true) ? "right-0.5" : "left-0.5")} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl">
                <div>
                  <div className="font-bold text-sm text-white/90">Vignette</div>
                  <div className="text-[10px] text-white/40">Soft dark edges</div>
                </div>
                <button 
                  onClick={() => updateGlobalSettings({ 
                    uiSettings: { ...(globalSettings.uiSettings || defaultUISettings), showVignette: !(globalSettings.uiSettings?.showVignette ?? true) } 
                  })}
                  className={cn("w-10 h-5 rounded-full transition-all relative", (globalSettings.uiSettings?.showVignette ?? true) ? "bg-[#D97757]" : "bg-white/[0.12]")}
                >
                  <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all", (globalSettings.uiSettings?.showVignette ?? true) ? "right-0.5" : "left-0.5")} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl">
                <div>
                  <div className="font-bold text-sm text-white/90">Animations</div>
                  <div className="text-[10px] text-white/40">Global micro-interactions</div>
                </div>
                <button 
                  onClick={() => updateGlobalSettings({ 
                    uiSettings: { ...(globalSettings.uiSettings || defaultUISettings), animationsEnabled: !(globalSettings.uiSettings?.animationsEnabled ?? true) } 
                  })}
                  className={cn("w-10 h-5 rounded-full transition-all relative", (globalSettings.uiSettings?.animationsEnabled ?? true) ? "bg-[#D97757]" : "bg-white/[0.12]")}
                >
                  <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all", (globalSettings.uiSettings?.animationsEnabled ?? true) ? "right-0.5" : "left-0.5")} />
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/[0.07]">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/35">Primary Color (Gold)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={globalSettings.uiSettings?.primaryColor || '#D97757'}
                    onChange={(e) => updateGlobalSettings({
                      uiSettings: { ...(globalSettings.uiSettings || defaultUISettings), primaryColor: e.target.value }
                    })}
                    className="w-10 h-10 rounded-xl cursor-pointer border-none bg-transparent"
                  />
                  <input
                    type="text"
                    value={globalSettings.uiSettings?.primaryColor || '#D97757'}
                    onChange={(e) => updateGlobalSettings({
                      uiSettings: { ...(globalSettings.uiSettings || defaultUISettings), primaryColor: e.target.value }
                    })}
                    className="flex-1 px-4 py-2 bg-white/[0.05] border border-white/[0.09] rounded-xl text-white/90 outline-none font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/35">Main Font Family</label>
                <select
                  value={globalSettings.uiSettings?.fontFamily || 'serif'}
                  onChange={(e) => updateGlobalSettings({
                    uiSettings: { ...(globalSettings.uiSettings || defaultUISettings), fontFamily: e.target.value }
                  })}
                  className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.09] rounded-xl text-white/90 outline-none text-sm"
                >
                  <option value="serif">Classic Serif (Cormorant)</option>
                  <option value="sans">Modern Sans (Inter)</option>
                  <option value="playfair">Elegant Serif (Playfair)</option>
                  <option value="mono">Technical (JetBrains)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-[#111] p-6 rounded-2xl border border-white/[0.07] space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="text-[#D97757]" />
              <h3 className="text-xl font-bold text-white/90">Platform Stats</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-[#D97757]/10 rounded-2xl border border-[#D97757]/20">
                <div className="text-xs font-bold text-[#D97757]/60 uppercase tracking-widest mb-1">Total Users</div>
                <div className="text-3xl font-semibold text-[#D97757]">{users.length}</div>
              </div>
              <div className="p-6 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Stories Forged</div>
                <div className="text-3xl font-semibold text-blue-400">{stories.length}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'codes' && (
        <div className="space-y-6">
          <div className="bg-[#111] p-6 rounded-2xl border border-white/[0.07]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-semibold text-white/90">Subscription Codes</h3>
                <p className="text-sm text-white/40">Generate 12-digit codes for manual subscription redemption</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => generateSubscriptionCode('standard')}
                  className="px-6 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl font-bold text-xs hover:bg-blue-500/20 transition-all"
                >
                  + Standard Code
                </button>
                <button 
                  onClick={() => generateSubscriptionCode('premium')}
                  className="px-6 py-2 bg-[#D97757]/10 text-[#D97757] rounded-xl font-bold text-xs hover:bg-[#D97757]/20 transition-all"
                >
                  + Premium Code
                </button>
                <button 
                  onClick={() => generateSubscriptionCode('ultimate')}
                  className="px-6 py-2 bg-[#D97757]/20 text-[#D97757] rounded-xl font-bold text-xs hover:bg-[#D97757]/30 transition-all"
                >
                  + Ultimate Code
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-bold uppercase tracking-widest text-white/35 border-b border-white/[0.06]">
                    <th className="pb-4 px-4">Code</th>
                    <th className="pb-4 px-4">Tier</th>
                    <th className="pb-4 px-4">Status</th>
                    <th className="pb-4 px-4">Redeemed By</th>
                    <th className="pb-4 px-4">Created At</th>
                    <th className="pb-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {subscriptionCodes.map((code) => (
                    <tr key={code.id} className="group hover:bg-white/[0.02] transition-all">
                      <td className="py-4 px-4">
                        <span className="font-mono font-bold text-lg tracking-wider">{code.code}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                          code.tier === 'ultimate' ? "bg-[#D97757]/20 text-[#D97757]" :
                          code.tier === 'premium' ? "bg-[#D97757]/10 text-[#D97757]" :
                          "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        )}>
                          {code.tier}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {code.isUsed ? (
                          <span className="flex items-center gap-2 text-green-400 text-xs font-bold">
                            <CheckCircle size={14} />
                            Redeemed
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                            <Clock size={14} />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs text-white/40">
                        {code.isUsed ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-white/90">{users.find(u => u.uid === code.usedBy)?.displayName || 'Unknown User'}</span>
                            <span>{new Date(code.usedAt!).toLocaleDateString()}</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="py-4 px-4 text-xs text-white/40">
                        {new Date(code.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button 
                          onClick={() => deleteSubscriptionCode(code.id)}
                          className="p-2 text-white/25 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'ai' && (
        <div className="space-y-8">

          {/* Header */}
          <div className="bg-[#141414] text-white rounded-[2.5rem] p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D97757]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-14 h-14 bg-[#D97757]/20 rounded-2xl flex items-center justify-center text-[#D97757] text-2xl">🤖</div>
              <div>
                <h3 className="text-2xl font-semibold">AI Providers</h3>
                <p className="text-white/40 text-sm">Enable any provider, add its API key, choose a model — then assign it per subscription tier.</p>
              </div>
            </div>
          </div>

          {/* Provider Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {(Object.entries(aiSettings.providers) as [string, any][]).map(([key, provider]) => {
              const info = PROVIDER_INFO[key];
              const models = PROVIDER_MODELS[key] ?? [];
              const showKey = showApiKey === key;
              return (
                <div
                  key={key}
                  className={cn(
                    "bg-[#111] rounded-2xl border-2 p-6 space-y-4 transition-all",
                    provider.enabled ? "border-[#D97757]/30 shadow-lg shadow-[#D97757]/5" : "border-white/[0.07]"
                  )}
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold",
                        provider.enabled ? "bg-[#D97757]/10" : "bg-white/[0.06]"
                      )}>
                        {info?.icon ?? '🤖'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white/90">{provider.name}</h4>
                          {info?.isFree && <span className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-[9px] font-bold text-green-400 uppercase">Free</span>}
                        </div>
                        <p className="text-[10px] text-white/35 mt-0.5 max-w-[240px]">{provider.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAiSettings(prev => ({
                        ...prev,
                        providers: { ...prev.providers, [key]: { ...prev.providers[key], enabled: !provider.enabled } }
                      }))}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                        provider.enabled
                          ? "bg-[#D97757]/10 text-[#D97757] border-[#D97757]/20 hover:bg-[#D97757]/20"
                          : "bg-white/[0.05] text-white/40 border-white/[0.08] hover:bg-white/[0.10]"
                      )}
                    >
                      {provider.enabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      {provider.enabled ? 'On' : 'Off'}
                    </button>
                  </div>

                  {/* API Key */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                      API Key {info?.keyUrl && <a href={info.keyUrl} target="_blank" rel="noreferrer" className="text-[#D97757]/60 hover:text-[#D97757] normal-case ml-1">Get key →</a>}
                    </label>
                    <div className="relative">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={provider.apiKey}
                        onChange={e => setAiSettings(prev => ({
                          ...prev,
                          providers: { ...prev.providers, [key]: { ...prev.providers[key], apiKey: e.target.value } }
                        }))}
                        placeholder={info?.keyHint ?? 'Enter API key...'}
                        className="w-full bg-white/[0.05] border border-white/[0.09] rounded-xl px-3 py-2 pr-10 text-xs text-white/80 outline-none focus:border-[#D97757]/40 font-mono"
                      />
                      <button
                        onClick={() => setShowApiKey(prev => prev === key ? null : key)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                      >
                        {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                    {provider.apiKey && (
                      <p className="text-[10px] text-green-400/80 flex items-center gap-1">
                        <CheckCircle size={9} /> Key stored ({provider.apiKey.length} chars)
                      </p>
                    )}
                  </div>

                  {/* Model */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Model</label>
                    <select
                      value={provider.model}
                      onChange={e => setAiSettings(prev => ({
                        ...prev,
                        providers: { ...prev.providers, [key]: { ...prev.providers[key], model: e.target.value } }
                      }))}
                      className="w-full bg-white/[0.05] border border-white/[0.09] rounded-xl px-3 py-2 text-xs text-white/80 outline-none focus:border-[#D97757]/40"
                    >
                      {models.map(m => (
                        <option key={m.id} value={m.id} className="bg-[#111] text-white">
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tier Assignments */}
          <div className="bg-[#111] border border-white/[0.07] rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white/90">Provider per Tier</h4>
                <p className="text-xs text-white/35 mt-0.5">Which AI provider each subscription tier uses</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40">Ultimate can choose</span>
                <button
                  onClick={() => setAiSettings(prev => ({ ...prev, allowUltimateChoice: !prev.allowUltimateChoice }))}
                  className={cn('relative w-10 h-5 rounded-full transition-colors', aiSettings.allowUltimateChoice ? 'bg-[#D97757]' : 'bg-white/[0.12]')}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform"
                    style={{ transform: aiSettings.allowUltimateChoice ? 'translateX(20px)' : 'translateX(2px)' }}
                  />
                </button>
              </div>
            </div>

            {(['free', 'standard', 'premium', 'ultimate'] as const).map(tier => {
              const tierColors: Record<string, string> = {
                free: 'text-white/50 bg-white/[0.06]', standard: 'text-blue-400 bg-blue-500/10',
                premium: 'text-[#D97757] bg-[#D97757]/10', ultimate: 'text-purple-400 bg-purple-500/10',
              };
              const enabledProviders = Object.entries(aiSettings.providers).filter(([, p]) => p.enabled);
              return (
                <div key={tier} className="flex items-center gap-4 py-3 border-t border-white/[0.04]">
                  <div className={cn('px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider w-20 text-center flex-shrink-0', tierColors[tier])}>
                    {tier}
                  </div>
                  <select
                    value={aiSettings.tierAssignments[tier] ?? 'openrouter'}
                    onChange={e => setAiSettings(prev => ({
                      ...prev,
                      tierAssignments: { ...prev.tierAssignments, [tier]: e.target.value }
                    }))}
                    className="flex-1 bg-white/[0.05] border border-white/[0.09] rounded-xl px-3 py-2 text-xs text-white/80 outline-none focus:border-[#D97757]/40"
                  >
                    {enabledProviders.length === 0 && (
                      <option value="openrouter" className="bg-[#111] text-white">No providers enabled — enable one above</option>
                    )}
                    {enabledProviders.map(([k, p]) => (
                      <option key={k} value={k} className="bg-[#111] text-white">
                        {PROVIDER_INFO[k]?.icon ?? ''} {p.name} — {p.model}
                      </option>
                    ))}
                  </select>
                  <span className={cn(
                    'text-[10px] font-bold w-12 text-right flex-shrink-0',
                    PROVIDER_INFO[aiSettings.tierAssignments[tier] ?? 'openrouter']?.isFree ? 'text-green-400/70' : 'text-yellow-400/70'
                  )}>
                    {PROVIDER_INFO[aiSettings.tierAssignments[tier] ?? 'openrouter']?.isFree ? 'Free' : 'Paid'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Image Generation */}
          <div className="bg-[#111] border border-white/[0.07] rounded-2xl p-6 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-white/90">🖼️ Image Generation — Stability AI (Optional)</h4>
              <p className="text-xs text-white/35 mt-0.5">
                Without a key, story scripts still work — illustrations are skipped.
                Get a key at <a href="https://platform.stability.ai" target="_blank" rel="noreferrer" className="text-[#D97757] hover:underline">platform.stability.ai</a>.
              </p>
            </div>
            <div className="relative">
              <input
                type={showApiKey === 'image' ? 'text' : 'password'}
                value={aiSettings.imageApiKey}
                onChange={e => setAiSettings(prev => ({ ...prev, imageApiKey: e.target.value }))}
                placeholder="sk-..."
                className="w-full bg-white/[0.05] border border-white/[0.09] rounded-xl px-4 py-3 pr-12 text-sm text-white/80 outline-none focus:border-[#D97757]/40 font-mono"
              />
              <button
                onClick={() => setShowApiKey(prev => prev === 'image' ? null : 'image')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showApiKey === 'image' ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {aiSettings.imageApiKey && <p className="text-[10px] text-green-400 flex items-center gap-1"><CheckCircle size={10} /> Key stored ({aiSettings.imageApiKey.length} chars)</p>}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/30">Image Model</label>
              <select
                value={aiSettings.imageModel}
                onChange={e => setAiSettings(prev => ({ ...prev, imageModel: e.target.value }))}
                className="w-full bg-white/[0.05] border border-white/[0.09] rounded-xl px-3 py-2 text-xs text-white/80 outline-none focus:border-[#D97757]/40"
              >
                <option value="stable-image-core" className="bg-[#111] text-white">Stable Image Core (Fast, High Quality)</option>
                <option value="stable-image-ultra" className="bg-[#111] text-white">Stable Image Ultra (Best Quality)</option>
                <option value="sd3-medium" className="bg-[#111] text-white">SD3 Medium</option>
                <option value="sd3-large" className="bg-[#111] text-white">SD3 Large</option>
              </select>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button
              onClick={saveAiSettings}
              disabled={aiSaving}
              className="flex items-center gap-3 px-10 py-5 bg-[#D97757] text-[#1a1a1a] rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-[#D97757]/20 disabled:opacity-50"
            >
              {aiSaving ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
              {aiSaving ? 'Saving...' : 'Save AI Settings'}
            </button>
          </div>
        </div>
      )}



      {activeTab === 'photos' && (
        <div className="space-y-8">
          {/* Header */}
          <div className="bg-[#141414] text-white rounded-[2.5rem] p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D97757]/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-14 h-14 bg-[#D97757]/20 rounded-2xl flex items-center justify-center text-[#D97757]">
                <ImageIconLucide size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-semibold">Stock Photo Services</h3>
                <p className="text-white/40 text-sm">Configure API keys so users can browse free photos inside the Story Creator.</p>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-[#D97757]/5 border border-[#D97757]/15 rounded-[2rem] p-6 flex gap-4">
            <div className="w-10 h-10 bg-[#D97757]/20 rounded-xl flex items-center justify-center text-[#D97757] flex-shrink-0 mt-0.5">
              <Sparkles size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white/90">How this works</p>
              <p className="text-[13px] text-white/50 leading-relaxed">
                When users add images to their story pages they can pick from <strong className="text-[#D97757]">Unsplash</strong>, <strong className="text-[#D97757]">Pexels</strong>, or <strong className="text-[#D97757]">Pixabay</strong> using the API keys you add below.
                <strong className="text-white/80"> Vecteezy</strong> and <strong className="text-white/80">Pinterest</strong> open in a new tab (no key needed).
                Free API keys are available on each service's website.
              </p>
            </div>
          </div>

          {/* Service Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {([
              {
                key: 'unsplash' as const,
                name: 'Unsplash',
                logo: 'U',
                color: '#111111',
                desc: 'The largest library of high-quality free photos. Requires a free developer account at unsplash.com/developers.',
                docsUrl: 'https://unsplash.com/developers',
              },
              {
                key: 'pexels' as const,
                name: 'Pexels',
                logo: 'P',
                color: '#05A081',
                desc: 'Thousands of free stock photos and videos. Get a free API key at pexels.com/api.',
                docsUrl: 'https://www.pexels.com/api/',
              },
              {
                key: 'pixabay' as const,
                name: 'Pixabay',
                logo: 'X',
                color: '#2EC66B',
                desc: 'Over 2.5 million free images, videos, and music. Register at pixabay.com/api/docs.',
                docsUrl: 'https://pixabay.com/api/docs/',
              },
            ]).map(({ key, name, logo, color, desc, docsUrl }) => {
              const service = photoSettings[key];
              const showKey = visiblePhotoKeys[key];
              return (
                <div
                  key={key}
                  className={cn(
                    "bg-[#111] rounded-2xl border-2 p-6 space-y-6 transition-all",
                    service.enabled ? "border-[#D97757]/30 shadow-lg shadow-[#D97757]/5" : "border-white/[0.07]"
                  )}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-lg"
                        style={{ backgroundColor: color }}
                      >
                        {logo}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white/90">{name}</h4>
                        <a
                          href={docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-[#D97757] hover:underline flex items-center gap-1"
                        >
                          Get free API key
                          <ChevronDown size={10} className="-rotate-90" />
                        </a>
                      </div>
                    </div>
                    {/* Enable Toggle */}
                    <button
                      onClick={() => updatePhotoService(key, 'enabled', !service.enabled)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                        service.enabled
                          ? "bg-[#D97757]/10 text-[#D97757] hover:bg-[#D97757]/20"
                          : "bg-white/[0.06] text-white/40 hover:bg-white/[0.1]"
                      )}
                    >
                      {service.enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      {service.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  <p className="text-xs text-white/35 leading-relaxed">{desc}</p>

                  {/* API Key */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/35">
                      <Key size={12} />
                      API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={service.apiKey}
                        onChange={(e) => updatePhotoService(key, 'apiKey', e.target.value)}
                        placeholder={`Paste your ${name} API key…`}
                        className="w-full pr-12 pl-4 py-3 bg-white/[0.05] border border-white/[0.09] rounded-xl font-mono text-sm text-white/90 placeholder:text-white/25 outline-none focus:border-[#D97757]/40 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setVisiblePhotoKeys(prev => ({ ...prev, [key]: !prev[key] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                      >
                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {service.apiKey && (
                      <p className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                        <CheckCircle size={10} /> Key entered — {service.apiKey.length} characters
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* External services info */}
          <div className="bg-[#111] rounded-2xl border border-white/[0.07] p-6 space-y-4">
            <h4 className="text-lg font-bold text-white/90 flex items-center gap-3">
              <span className="w-8 h-8 bg-white/[0.06] rounded-xl flex items-center justify-center text-sm">🔗</span>
              External Browse (No API Key Required)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Vecteezy', color: '#FF5F5F', desc: 'Free vectors, photos, and videos. Opens in a new tab.' },
                { name: 'Pinterest', color: '#E60023', desc: 'Visual discovery platform. Opens in a new tab.' },
              ].map(s => (
                <div key={s.name} className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-2xl">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow" style={{ backgroundColor: s.color }}>
                    {s.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white/90">{s.name}</p>
                    <p className="text-xs text-white/35">{s.desc}</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded-full uppercase tracking-widest">Always On</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={savePhotoSettings}
              disabled={photoSaving}
              className="flex items-center gap-3 px-10 py-5 bg-[#D97757] text-[#1a1a1a] rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-[#D97757]/20 disabled:opacity-50"
            >
              {photoSaving ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <Save size={20} />
              )}
              {photoSaving ? 'Saving…' : 'Save Photo Settings'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'legal' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Terms of Conditions */}
            <div className="bg-[#111] p-6 rounded-2xl border border-white/[0.07]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#D97757]/10 text-[#D97757] flex items-center justify-center">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-white/90">Terms of Conditions</h3>
                  <p className="text-sm text-white/40">Manage legal terms of use</p>
                </div>
              </div>
              <textarea
                value={globalSettings.termsOfConditions}
                onChange={(e) => setGlobalSettings({ ...globalSettings, termsOfConditions: e.target.value })}
                className="w-full h-[500px] bg-white/[0.05] border border-white/[0.09] rounded-2xl p-6 text-sm text-white/80 font-light leading-relaxed outline-none focus:border-[#D97757]/40 focus:ring-0 resize-none custom-scrollbar placeholder:text-white/25"
                placeholder="Enter terms of conditions..."
              />
            </div>

            {/* Privacy Policy */}
            <div className="bg-[#111] p-6 rounded-2xl border border-white/[0.07]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-white/90">Privacy Policy</h3>
                  <p className="text-sm text-white/40">Manage data privacy policy</p>
                </div>
              </div>
              <textarea
                value={globalSettings.privacyPolicy}
                onChange={(e) => setGlobalSettings({ ...globalSettings, privacyPolicy: e.target.value })}
                className="w-full h-[500px] bg-white/[0.05] border border-white/[0.09] rounded-2xl p-6 text-sm text-white/80 font-light leading-relaxed outline-none focus:border-[#D97757]/40 focus:ring-0 resize-none custom-scrollbar placeholder:text-white/25"
                placeholder="Enter privacy policy..."
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              onClick={() => updateGlobalSettings(globalSettings)}
              className="px-10 py-5 bg-[#D97757] text-[#1a1a1a] rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-[#D97757]/20 flex items-center gap-3"
            >
              <RefreshCw size={20} />
              Save Legal Documents
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
