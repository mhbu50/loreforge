import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Plus, LogOut, ShieldAlert, BookOpen, Shield, Star, Bug, MessageSquare, Send, X, UserPlus, Crown, CreditCard, Loader2, Check, Zap, Share2, Monitor, FileText, Maximize2, Command, Eye, ChevronRight, ChevronLeft, Settings as SettingsIcon, Layout, Edit3, Image as ImageIcon, Palette, LifeBuoy, Bot, CheckCircle, Moon, Sun, Pencil, Users, Scroll } from 'lucide-react';
import { Story, StoryPage, StoryStyle, UserProfile, ImageAdjustments, NarrativeStructure } from '../types';
import { auth, db } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, orderBy, updateDoc, getDocs, getDoc, increment } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { Link } from 'react-router-dom';
import { getSubscriptionLimits, SUBSCRIPTION_PRICING } from '../constants';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { cn } from '../lib/utils';

import StoryCreator from './StoryCreator';
import StoryViewer from './StoryViewer';
import StoryLibrary from './StoryLibrary';
import HeadAdminPanel from './HeadAdminPanel';
import Settings from './Settings';
import Support from './Support';
import ThemeMarketplace from './ThemeMarketplace';
import BookTypeSelector from './BookTypeSelector';
import WidgetGrid from './WidgetGrid';
import WorkspacePresets from './WorkspacePresets';
import FloatingWindow from './FloatingWindow';
import TabbedWorkspace from './TabbedWorkspace';
import { WordCountWidget, ImagePreviewWidget, ProgressWidget } from './Widgets';
import { Book as BookEntity, BookType } from '../types';
import { ConfigService } from '../services/ConfigService';
import AccountPanel from './AccountPanel';
import CharacterArchitect from './CharacterArchitect';
import StoryBiblePanel from './StoryBiblePanel';

interface DashboardProps {
  userProfile: UserProfile | null;
  globalSettings?: any;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  accent?: string;
  onSetAccent?: (accent: string) => void;
}

export default function Dashboard({ userProfile, globalSettings, theme = 'light', onToggleTheme, accent = 'amber', onSetAccent }: DashboardProps) {
  const appName = globalSettings?.appName || 'StoryCraft';
  const appIcon = globalSettings?.appIcon || '';
  const [stories, setStories] = useState<Story[]>([]);
  const [books, setBooks] = useState<BookEntity[]>([]);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [selectedBookType, setSelectedBookType] = useState<BookType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [activeView, setActiveView] = useState<'library' | 'workspace' | 'themes' | 'forge-settings' | 'support' | 'publish' | 'characters' | 'bible'>('library');
  const [storyBibleContext, setStoryBibleContext] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const [widgets, setWidgets] = useState<string[]>(['word-count', 'image-preview', 'progress']);
  const [isForging, setIsForging] = useState(false);
  const [showSupportMenu, setShowSupportMenu] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [detachedWidgets, setDetachedWidgets] = useState<string[]>([]);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth > 200 && newWidth < 600) {
        setSidebarWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  const [showProfile, setShowProfile] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [dynamicSubscriptionSettings, setDynamicSubscriptionSettings] = useState<any>(null);
  const [partnerModal, setPartnerModal] = useState<{ show: boolean, story: Story | null }>({ show: false, story: null });
  const [partnerEmail, setPartnerEmail] = useState('');
  const [isAddingPartner, setIsAddingPartner] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [config, setConfig] = useState(ConfigService.getConfig());

  const isHeadAdmin = userProfile?.email === 'alaa.abukhamseen@gmail.com';

  const currentLimits = useMemo(() => {
    const tier = userProfile?.subscriptionTier || 'free';
    const baseLimits = getSubscriptionLimits(tier);
    const settingsLimits = dynamicSubscriptionSettings?.[tier] || {};

    return {
      ...baseLimits,
      ...settingsLimits
    };
  }, [userProfile, dynamicSubscriptionSettings]);

  const getStoriesCreatedThisMonth = useCallback(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return stories.filter(s => s.createdAt >= startOfMonth && s.userId === userProfile?.uid).length;
  }, [stories, userProfile]);

  const canCreateStory = useMemo(() => {
    if (!userProfile) return false;
    if (userProfile.subscriptionTier === 'premium' || userProfile.subscriptionTier === 'ultimate') return true;
    
    if (userProfile.subscriptionTier === 'free') {
      const totalStories = stories.filter(s => s.userId === userProfile.uid).length;
      return totalStories < (currentLimits.maxStoriesTotal || 1);
    }
    
    if (userProfile.subscriptionTier === 'standard') {
      const createdThisMonth = getStoriesCreatedThisMonth();
      return createdThisMonth < (currentLimits.maxStoriesPerMonth || 3);
    }
    
    return false;
  }, [userProfile, stories, currentLimits, getStoriesCreatedThisMonth]);

  useEffect(() => {
    if (!auth.currentUser || !userProfile) return;

    // Update streak and lastActive
    const today = new Date().setHours(0, 0, 0, 0);
    const lastActive = userProfile.lastActive || 0;
    
    if (lastActive < today) {
      const isConsecutive = lastActive === today - 86400000;
      const path = `users/${auth.currentUser.uid}`;
      updateDoc(doc(db, 'users', auth.currentUser.uid), {
        streak: isConsecutive ? (userProfile.streak || 0) + 1 : 1,
        lastActive: today
      }).catch(error => handleFirestoreError(error, OperationType.UPDATE, path));
    }

    const q1 = query(
      collection(db, 'stories'), 
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const q2 = query(
      collection(db, 'stories'), 
      where('collaborators', 'array-contains', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub1 = onSnapshot(q1, (snapshot) => {
      const ownedStories = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Story[];
      setStories(prev => {
        const others = prev.filter(s => s.userId !== auth.currentUser?.uid);
        const combined = [...ownedStories, ...others].sort((a, b) => b.createdAt - a.createdAt);
        // Remove duplicates
        return Array.from(new Map(combined.map(item => [item.id, item])).values());
      });
      setIsLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'stories'));

    const unsub2 = onSnapshot(q2, (snapshot) => {
      const collabStories = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Story[];
      setStories(prev => {
        const others = prev.filter(s => s.userId === auth.currentUser?.uid);
        const combined = [...collabStories, ...others].sort((a, b) => b.createdAt - a.createdAt);
        // Remove duplicates
        return Array.from(new Map(combined.map(item => [item.id, item])).values());
      });
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'stories'));

    const fetchSettings = async () => {
      const path = 'settings/subscription';
      try {
        const subDoc = await getDoc(doc(db, 'settings', 'subscription'));
        if (subDoc.exists()) {
          setDynamicSubscriptionSettings(subDoc.data());
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
      }
    };
    fetchSettings();

    // Monthly usage reset logic
    const resetMonthlyUsage = async () => {
      if (!auth.currentUser || !userProfile) return;

      const now = Date.now();
      const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
      const lastReset = userProfile.lastUsageReset || userProfile.lastTokenRefill || 0;
      if (now - lastReset > MONTH_MS) {
        try {
          await updateDoc(doc(db, 'users', userProfile.uid), {
            usageThisMonth: 0,
            lastUsageReset: now,
          });
          toast.success('Monthly token budget reset! You\'re ready for a new month.');
        } catch (error) {
          console.error("Failed to reset usage:", error);
        }
      }
    };
    resetMonthlyUsage();

    return () => {
      unsub1();
      unsub2();
    };
  }, [userProfile?.uid]);

  const handleUpgrade = async (tier: 'standard' | 'premium' | 'ultimate', cycle: 'monthly' | 'yearly') => {
    if (!auth.currentUser) return;
    setIsUpgrading(true);
    const path = `users/${auth.currentUser.uid}`;
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const expiresAt = Date.now() + (cycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000;
      
      await updateDoc(userRef, {
        subscriptionTier: tier,
        subscriptionStatus: 'active',
        subscriptionCycle: cycle,
        subscriptionExpiresAt: expiresAt
      });

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: tier === 'ultimate' ? ['#FFD700', '#C0C0C0', '#000000'] : (tier === 'premium' ? ['#D4AF37', '#000000', '#FFFFFF'] : ['#9333EA', '#000000', '#FFFFFF'])
      });

      toast.success(`Welcome to ${tier}! Your journey has just begun.`);
      setShowPricingModal(false);
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
      toast.error("Failed to upgrade subscription");
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleAddPartner = async () => {
    if (!partnerEmail.trim() || !partnerModal.story || !auth.currentUser) return;
    
    const limits = currentLimits;
    if (!limits.allowCollaboration) {
      toast.error("Collaboration is a Premium feature. Upgrade to forge stories with your friends!");
      return;
    }

    setIsAddingPartner(true);
    const pathUsers = 'users';
    const pathStory = `stories/${partnerModal.story.id}`;
    try {
      // Find user by email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', partnerEmail.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast.error("User not found. Make sure they have signed up!");
        return;
      }

      const partnerUser = querySnapshot.docs[0].data() as UserProfile;
      if (partnerUser.uid === auth.currentUser.uid) {
        toast.error("You are already the author!");
        return;
      }

      const storyRef = doc(db, 'stories', partnerModal.story.id);
      const currentCollaborators = partnerModal.story.collaborators || [];
      
      if (currentCollaborators.includes(partnerUser.uid)) {
        toast.error("User is already a collaborator!");
        return;
      }

      await updateDoc(storyRef, {
        collaborators: [...currentCollaborators, partnerUser.uid]
      });

      toast.success(`Added ${partnerUser.displayName} as a partner!`);
      setPartnerModal({ show: false, story: null });
      setPartnerEmail('');
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.UPDATE, pathStory);
      }
      toast.error("Failed to add partner");
    } finally {
      setIsAddingPartner(false);
    }
  };

  const handleRedeemCode = async () => {
    if (!userProfile || !redeemCode) return;
    if (redeemCode.length !== 12) {
      toast.error("Code must be 12 characters");
      return;
    }

    setIsRedeeming(true);
    const path = `subscription_codes/${redeemCode}`;
    try {
      const codeRef = doc(db, 'subscription_codes', redeemCode);
      const codeDoc = await getDoc(codeRef);

      if (!codeDoc.exists()) {
        toast.error("Invalid code. Please check and try again.");
        return;
      }

      const codeData = codeDoc.data();
      if (codeData.isUsed) {
        toast.error("This code has already been redeemed.");
        return;
      }

      // Update code status
      await updateDoc(codeRef, {
        isUsed: true,
        usedBy: userProfile.uid,
        usedAt: Date.now()
      });

      // Update user subscription
      const userRef = doc(db, 'users', userProfile.uid);
      const tierLimits = getSubscriptionLimits(codeData.tier as any);
      
      await updateDoc(userRef, {
        subscriptionTier: codeData.tier,
        subscriptionStatus: 'active',
        subscriptionCycle: 'monthly',
        subscriptionExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        tokens: increment(tierLimits.tokensPerMonth || 0),
        lastTokenRefill: Date.now()
      });

      toast.success(`Successfully redeemed ${codeData.tier} subscription!`);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      setShowRedeemModal(false);
      setRedeemCode('');
    } catch (error) {
      console.error(error);
      handleFirestoreError(error, OperationType.UPDATE, path);
      toast.error("Failed to redeem code. Please try again.");
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleCreateComplete = async (title: string, pages: StoryPage[], style: StoryStyle, category: string, language: string, ageGroup: string, bookType: BookType = 'story', authorName?: string, coverImage?: string, coverImageAdjustments?: ImageAdjustments, narrativeStructure?: NarrativeStructure, isBranching?: boolean) => {
    if (!auth.currentUser || !userProfile) return;
    
    setIsForging(true);
    const tokenCost = isEditing
      ? (currentLimits.editTokenCost ?? 0)
      : (currentLimits.bookTokenCost || 1);
    const limits = getSubscriptionLimits(userProfile.subscriptionTier);
    const monthlyLimit = (limits as any).tokensPerMonth ?? 0;
    const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
    const lastReset = userProfile.lastUsageReset || userProfile.lastTokenRefill || 0;
    const currentUsage = Date.now() - lastReset > MONTH_MS ? 0 : (userProfile.usageThisMonth ?? 0);
    const usageLeft = monthlyLimit === 0 ? Infinity : Math.max(0, monthlyLimit - currentUsage);
    const hasUsage = monthlyLimit === 0 || usageLeft >= tokenCost;

    if (!hasUsage) {
      const pct = monthlyLimit > 0 ? Math.round((currentUsage / monthlyLimit) * 100) : 0;
      toast.error(`Monthly token limit reached. ${currentUsage.toLocaleString()} / ${monthlyLimit.toLocaleString()} tokens used (${pct}%).`);
      setShowPricingModal(true);
      return;
    }

    const pathStory = 'stories';
    const pathUser = `users/${auth.currentUser.uid}`;
    try {
      if (isEditing && editingStory) {
        // Update existing story
        await updateDoc(doc(db, 'stories', editingStory.id), {
          title,
          pages,
          style,
          category,
          language,
          ageGroup,
          authorName: authorName || userProfile.displayName,
          coverImage: coverImage || '',
          coverImageAdjustments: coverImageAdjustments || null,
          updatedAt: Date.now()
        });

        if (editingStory.bookId) {
          await updateDoc(doc(db, 'books', editingStory.bookId), {
            title,
            coverImage: coverImage || '',
            updatedAt: Date.now(),
            metadata: {
              style,
              language,
              ageGroup,
              authorName: authorName || userProfile.displayName
            }
          });
        }
        
        // Track usage for edit if editTokenCost > 0
        if (tokenCost > 0) {
          await handleConsumeTokens(tokenCost, 'edit story');
        }
        toast.success("Story updated successfully!");
        setIsEditing(false);
        setEditingStory(null);
        setCurrentStory(null);
      } else {
        // Create the Book entity
        const newBookData = {
          userId: auth.currentUser.uid,
          title,
          type: bookType,
          description: `A new ${bookType} project by ${authorName || userProfile.displayName}.`,
          status: 'draft',
          coverImage: coverImage || '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          metadata: {
            style,
            language,
            ageGroup,
            authorName: authorName || userProfile.displayName
          }
        };

        const bookRef = await addDoc(collection(db, 'books'), newBookData);

        // Create the initial story/pages as chapters or a main story document
        const newStoryData = {
          userId: auth.currentUser.uid,
          bookId: bookRef.id,
          authorName: authorName || userProfile?.displayName || 'Anonymous',
          coverImage: coverImage || '',
          coverImageAdjustments: coverImageAdjustments || null,
          title,
          pages,
          style,
          category: (ageGroup === 'Adult' || ageGroup === 'YA') ? 'drama' : 'adventure',
          language,
          ageGroup,
          isPublished: false,
          price: 9.99,
          likes: 0,
          createdAt: Date.now(),
          ...(narrativeStructure && narrativeStructure !== 'freeform' ? { narrativeStructure } : {}),
          ...(isBranching ? { isBranching: true } : {}),
        };

        await addDoc(collection(db, 'stories'), newStoryData);
        
        // Also create a first chapter for the workspace
        await addDoc(collection(db, `books/${bookRef.id}/chapters`), {
          title: 'Chapter 1',
          content: pages.map(p => p.text || p.content).join('\n\n'),
          order: 1,
          wordCount: pages.reduce((acc, p) => acc + (p.text || p.content || '').split(/\s+/).length, 0),
          isLocked: false,
          isGhost: false,
          createdAt: Date.now()
        });
        
        const updates: any = {};
        // Track usage for story creation
        await handleConsumeTokens(tokenCost, 'create story');

        // Award badge for first story
        const newBadges = [...(userProfile?.badges || [])];
        let badgeAwarded = false;

        if (stories.length === 0 && !newBadges.includes('First Tale')) {
          newBadges.push('First Tale');
          toast.success("Achievement Unlocked: First Tale!");
          badgeAwarded = true;
        }
        
        if (stories.length === 4 && !newBadges.includes('Storyteller')) {
          newBadges.push('Storyteller');
          toast.success("Achievement Unlocked: Storyteller!");
          badgeAwarded = true;
        }

        if (stories.length === 9 && !newBadges.includes('Legend')) {
          newBadges.push('Legend');
          toast.success("Achievement Unlocked: Legend!");
          badgeAwarded = true;
        }

        const hour = new Date().getHours();
        if ((hour >= 22 || hour <= 4) && !newBadges.includes('Night Owl')) {
          newBadges.push('Night Owl');
          toast.success("Achievement Unlocked: Night Owl!");
          badgeAwarded = true;
        }

        if (badgeAwarded) {
          updates.badges = newBadges;
        }

        await updateDoc(doc(db, 'users', auth.currentUser.uid), updates);
        
        setIsCreating(false);
        toast.success("Story forged successfully!");
      }
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.CREATE, 'stories');
      }
      toast.error("Failed to save story.");
    } finally {
      setIsForging(false);
    }
  };

  // Track monthly AI usage (replaces token deduction)
  const handleConsumeTokens = async (amount: number, reason: string): Promise<boolean> => {
    if (!auth.currentUser || !userProfile) return false;
    if (amount <= 0) return true;
    const limits = getSubscriptionLimits(userProfile.subscriptionTier);
    const monthlyLimit = (limits as any).tokensPerMonth ?? 0;

    // Monthly reset check
    const now = Date.now();
    const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
    const lastReset = userProfile.lastUsageReset || userProfile.lastTokenRefill || 0;
    const shouldReset = now - lastReset > MONTH_MS;
    const currentUsage = shouldReset ? 0 : (userProfile.usageThisMonth ?? 0);

    // Unlimited if monthlyLimit === 0 (e.g. ultimate with no cap)
    if (monthlyLimit > 0 && currentUsage + amount > monthlyLimit) {
      const pct = Math.round((currentUsage / monthlyLimit) * 100);
      toast.error(`Monthly token limit reached — ${currentUsage.toLocaleString()} / ${monthlyLimit.toLocaleString()} tokens (${pct}%).`);
      return false;
    }

    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        usageThisMonth: currentUsage + amount,
        ...(shouldReset ? { lastUsageReset: now } : {}),
      });
      return true;
    } catch {
      return true; // don't block on tracking failure
    }
  };

  const handlePublish = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const limits = currentLimits;
    if (!limits.allowMarketplacePublishing) {
      toast.error("Publishing to the marketplace is a Premium feature. Upgrade to share your tales with the world!");
      return;
    }

    const path = `stories/${id}`;
    try {
      await updateDoc(doc(db, 'stories', id), {
        isPublished: true,
        price: 9.99
      });
      toast.success("Story published to marketplace!");
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
      toast.error("Failed to publish story");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const path = `stories/${id}`;
    try {
      await deleteDoc(doc(db, 'stories', id));
      if (currentStory?.id === id) setCurrentStory(null);
      toast.success("Story deleted");
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
      toast.error("Failed to delete story");
    }
  };

  const handleSelectStory = (story: Story) => {
    // Particle burst effect
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#D4AF37', '#000000', '#FFFFFF'],
      shapes: ['circle', 'square'],
      scalar: 0.8
    });
    setCurrentStory(story);
  };

  const filteredStories = stories.filter(story => 
    story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    story.style.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Usage display values
  const _limits = getSubscriptionLimits(userProfile?.subscriptionTier || 'free');
  const _monthlyLimit = (_limits as any).tokensPerMonth ?? 0;
  const _MONTH_MS = 30 * 24 * 60 * 60 * 1000;
  const _lastReset = (userProfile?.lastUsageReset) || (userProfile?.lastTokenRefill) || 0;
  const _currentUsage = Date.now() - _lastReset > _MONTH_MS ? 0 : (userProfile?.usageThisMonth ?? 0);
  const _usageLeft = _monthlyLimit === 0 ? Infinity : Math.max(0, _monthlyLimit - _currentUsage);
  const _usagePct = _monthlyLimit === 0 ? 0 : Math.min(100, Math.round((_currentUsage / _monthlyLimit) * 100));
  const _isUnlimited = _monthlyLimit === 0;

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white/90 flex selection:bg-[#D97757]/30 overflow-hidden">
      <div className="atmosphere opacity-[0.03]" />
      
      {/* Forging Overlay */}
      <AnimatePresence>
        {isForging && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#111]/95 backdrop-blur-3xl flex flex-col items-center justify-center text-center p-8 overflow-hidden"
          >
            <div className="atmosphere opacity-40" />
            
            {/* Floating particles for forging */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: Math.random() * window.innerWidth, 
                    y: window.innerHeight + 100,
                    opacity: 0 
                  }}
                  animate={{ 
                    y: -100,
                    opacity: [0, 1, 0],
                    rotate: 360
                  }}
                  transition={{ 
                    duration: 3 + Math.random() * 5,
                    repeat: Infinity,
                    delay: Math.random() * 5,
                    ease: "linear"
                  }}
                  className="absolute w-1 h-1 bg-[#D97757]/30 rounded-full blur-[1px]"
                />
              ))}
            </div>

            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-[#D97757]/10 border border-[#D97757]/20 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles size={28} className="text-[#D97757]" />
                </motion.div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-10 space-y-4 relative z-10"
            >
              <div className="space-y-1.5">
                <h2 className="text-[26px] font-semibold text-white tracking-tight">Crafting your story</h2>
                <p className="text-white/35 text-sm">This usually takes a few moments…</p>
              </div>

              <div className="w-64 h-0.5 bg-white/[0.06] rounded-full overflow-hidden mx-auto relative">
                <motion.div
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-1/2 h-full bg-gradient-to-r from-transparent via-[#D97757] to-transparent"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside
        style={{ width: sidebarWidth, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-light)' }}
        className={cn(
          "fixed left-0 top-0 bottom-0 z-[60] flex flex-col transition-transform duration-500 select-none",
          isZenMode && "-translate-x-full"
        )}
      >
        {/* Logo area */}
        <div className="px-4 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}>
              {appIcon?.startsWith('http') ? (
                <img src={appIcon} className="w-full h-full object-cover" alt="icon" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : appIcon ? (
                <span className="text-xs">{appIcon}</span>
              ) : (
                <Sparkles size={13} />
              )}
            </div>
            <span className="font-semibold text-[14px] tracking-tight truncate" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>{appName}</span>
          </div>
        </div>

        {/* New story shortcut */}
        <div className="px-3 pb-3">
          <button
            onClick={() => canCreateStory ? setShowTypeSelector(true) : setShowPricingModal(true)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all btn-gradient-gold"
          >
            <Plus size={14} />
            New story
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 overflow-y-auto space-y-0.5">
          {/* Primary views */}
          <div className="mb-1">
            {([
              { view: 'library',        icon: <Layout   size={14} />, label: 'Library' },
              { view: 'workspace',      icon: <Edit3    size={14} />, label: 'Workspace' },
              { view: 'characters',     icon: <Users    size={14} />, label: 'Characters' },
              { view: 'bible',          icon: <Scroll   size={14} />, label: 'Story Bible' },
              { view: 'themes',         icon: <Palette  size={14} />, label: 'Themes' },
              { view: 'publish',        icon: <Share2   size={14} />, label: 'Publish' },
            ] as const).map(({ view, icon, label }) => (
              <button
                key={view}
                onClick={() => { setCurrentStory(null); setIsCreating(false); setShowAdmin(false); setActiveView(view); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all text-left"
                style={activeView === view
                  ? { background: 'var(--accent-bg)', color: 'var(--text-primary)', borderLeft: '2px solid var(--accent)' }
                  : { color: 'var(--text-tertiary)' }}
              >
                <span className="flex-shrink-0 transition-colors" style={{ color: activeView === view ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                  {icon}
                </span>
                {label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="h-px mx-2 my-2" style={{ background: 'var(--border-light)' }} />

          {/* Secondary views */}
          <div>
            {([
              { view: 'forge-settings', icon: <SettingsIcon size={14} />, label: 'Settings' },
              { view: 'support',        icon: <LifeBuoy    size={14} />, label: 'Help & Support' },
            ] as const).map(({ view, icon, label }) => (
              <button
                key={view}
                onClick={() => { setCurrentStory(null); setIsCreating(false); setShowAdmin(false); setActiveView(view); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all text-left"
                style={activeView === view
                  ? { background: 'var(--accent-bg)', color: 'var(--text-primary)', borderLeft: '2px solid var(--accent)' }
                  : { color: 'var(--text-tertiary)' }}
              >
                <span className="flex-shrink-0" style={{ color: activeView === view ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                  {icon}
                </span>
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Bottom user area */}
        <div className="px-2 pb-3 pt-2 space-y-0.5" style={{ borderTop: '1px solid var(--border-light)' }}>
          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <span style={{ color: 'var(--text-tertiary)' }}>{theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}</span>
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>

          {/* User profile */}
          <button
            onClick={() => setShowProfile(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all group"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0"
              style={{ backgroundColor: userProfile?.avatarColor || 'var(--accent)', color: 'var(--text-on-accent)' }}
            >
              {userProfile?.avatarEmoji || userProfile?.displayName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13px] font-medium truncate leading-tight" style={{ color: 'var(--text-primary)' }}>{userProfile?.displayName}</p>
              <p className="text-[11px] capitalize" style={{ color: 'var(--text-tertiary)' }}>{userProfile?.subscriptionTier || 'free'}</p>
            </div>
            <ChevronRight size={11} className="flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
          </button>
        </div>

        {/* Resize handle */}
        <div
          onMouseDown={startResizing}
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize transition-colors z-[70]"
          style={{ background: 'transparent' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-ring)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-500" style={{ marginLeft: isZenMode ? 0 : sidebarWidth, background: 'var(--bg-primary)' }}>
        {/* ── Header ── */}
        <header
          className={cn("h-12 flex items-center justify-between px-5 sticky top-0 z-40 transition-all duration-500", isZenMode && "-translate-y-full")}
          style={{ borderBottom: '1px solid var(--border-light)', background: 'var(--bg-primary)', backdropFilter: 'blur(16px)', opacity: 0.97 }}
        >
          {/* Left: current view label */}
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium" style={{ color: 'var(--text-tertiary)' }}>{appName}</span>
            <span className="text-[13px]" style={{ color: 'var(--border-strong)' }}>/</span>
            <span className="text-[13px] font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{activeView.replace('-', ' ')}</span>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1.5">
            {/* Token usage */}
            <div className="group relative">
              <button
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[12px] font-medium transition-all cursor-help"
                style={_usagePct >= 90
                  ? { background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.20)', color: '#ef4444' }
                  : { background: 'var(--bg-secondary)', borderColor: 'var(--border-default)', color: 'var(--text-tertiary)' }}
              >
                <Zap size={12} style={{ color: _usagePct >= 90 ? '#ef4444' : 'var(--accent)' }} />
                {_isUnlimited ? '∞' : `${_usagePct}%`}
              </button>
              {/* Tooltip */}
              <div className="absolute top-full right-0 mt-2 w-72 rounded-2xl p-4 shadow-2xl opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all pointer-events-none z-50"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-xl)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>Monthly usage</span>
                  <span className="text-[12px] font-bold" style={{ color: _usagePct >= 90 ? '#ef4444' : 'var(--accent)' }}>{_usagePct}%</span>
                </div>
                {!_isUnlimited && (
                  <>
                    <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: 'var(--bg-tertiary)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${_usagePct}%`, background: _usagePct >= 90 ? '#ef4444' : _usagePct >= 70 ? '#f59e0b' : 'var(--accent)' }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] mb-3" style={{ color: 'var(--text-tertiary)' }}>
                      <span>{_currentUsage.toLocaleString()} used</span>
                      <span>{_usageLeft.toLocaleString()} left</span>
                    </div>
                  </>
                )}
                <div className="space-y-1 pt-3" style={{ borderTop: '1px solid var(--border-light)' }}>
                  {[
                    { label: 'Create story', cost: currentLimits.bookTokenCost || 100 },
                    { label: 'Edit story',   cost: currentLimits.editTokenCost ?? 0 },
                    { label: 'AI Script',    cost: (currentLimits as any).aiScriptCost ?? 50 },
                    { label: 'AI Image',     cost: (currentLimits as any).aiImageCost ?? 100 },
                    { label: 'AI Enhance',   cost: (currentLimits as any).aiEnhanceCost ?? 25 },
                  ].map(({ label, cost }) => (
                    <div key={label} className="flex justify-between items-center py-0.5">
                      <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
                      <span className="text-[12px] font-semibold" style={{ color: cost === 0 ? '#16a34a' : 'var(--text-secondary)' }}>
                        {cost === 0 ? 'Free' : `${cost.toLocaleString()}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {isHeadAdmin && (
              <button
                onClick={() => setShowAdmin(!showAdmin)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                style={showAdmin
                  ? { background: 'var(--accent)', color: 'var(--text-on-accent)' }
                  : { background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', color: 'var(--text-tertiary)' }}
              >
                <Shield size={12} />
                <span className="hidden md:inline">Admin</span>
              </button>
            )}

            <button onClick={() => auth.signOut()} className="p-2 rounded-lg transition-all" style={{ color: 'var(--text-tertiary)' }} title="Sign out">
              <LogOut size={14} />
            </button>
          </div>
        </header>

      {/* Profile / Account Panel */}
      <AnimatePresence>
        {showProfile && userProfile && (
          <AccountPanel
            userProfile={userProfile}
            stories={stories}
            theme={theme}
            onToggleTheme={onToggleTheme}
            onClose={() => setShowProfile(false)}
            onUpgrade={() => { setShowProfile(false); setShowPricingModal(true); }}
            onRedeem={() => { setShowProfile(false); setShowRedeemModal(true); }}
          />
        )}
      </AnimatePresence>

      {/* Book Type Selector */}
      <AnimatePresence>
        {showTypeSelector && (
          <BookTypeSelector 
            onSelect={(type) => {
              setSelectedBookType(type);
              setShowTypeSelector(false);
              setIsCreating(true);
            }}
            onCancel={() => setShowTypeSelector(false)}
          />
        )}
      </AnimatePresence>

      {/* Detached Floating Windows */}
      <AnimatePresence>
      </AnimatePresence>

      {/* Floating support button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        <AnimatePresence>
          {showSupportMenu && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="flex flex-col gap-1.5 mb-1"
            >
              {[
                { icon: <Bug size={14} />, label: 'Report a bug' },
                { icon: <MessageSquare size={14} />, label: 'Send feedback' },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => { setShowSupportMenu(false); setActiveView('support'); }}
                  className="flex items-center gap-2.5 px-4 py-2.5 bg-[#1e1e1e] border border-white/[0.09] text-white/60 hover:text-white/90 hover:bg-[#252525] rounded-xl shadow-xl text-[13px] font-medium transition-all"
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setShowSupportMenu(!showSupportMenu)}
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95 border",
            showSupportMenu
              ? "bg-[#1e1e1e] text-white/60 border-white/[0.09]"
              : "bg-[#D97757] text-white border-[#D97757] shadow-[#D97757]/20"
          )}
        >
          {showSupportMenu ? <X size={16} /> : <LifeBuoy size={16} />}
        </button>
      </div>

      <main className={cn(
        "flex-1 px-6 py-7 max-w-7xl w-full mx-auto relative z-10 transition-all duration-300",
        isZenMode && "opacity-0 pointer-events-none"
      )}>
        <AnimatePresence mode="wait">
          {isCreating || isEditing ? (
            <motion.div
              key="creator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <StoryCreator
                userId={userProfile?.uid || ''}
                onComplete={handleCreateComplete}
                onCancel={() => { setIsCreating(false); setIsEditing(false); setEditingStory(null); }}
                userDisplayName={userProfile?.displayName || 'Anonymous'}
                userSubscriptionTier={userProfile?.subscriptionTier || 'standard'}
                subscriptionLimits={currentLimits}
                userTokens={userProfile?.tokens || 0}
                onConsumeTokens={handleConsumeTokens}
                userPreferredAI={userProfile?.preferredAI}
                bookType={selectedBookType}
                config={config}
                initialStory={editingStory}
                storyBibleContext={storyBibleContext}
              />
            </motion.div>
          ) : currentStory ? (
            <motion.div
              key="viewer"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <StoryViewer 
                story={currentStory}
                onClose={() => setCurrentStory(null)}
                onEdit={(story) => {
                  setEditingStory(story);
                  setIsEditing(true);
                }}
                narrator="Kore"
              />
            </motion.div>
          ) : showAdmin && isHeadAdmin ? (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <HeadAdminPanel />
            </motion.div>
          ) : activeView === 'library' ? (
            <motion.div
              key="library"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* ── Page header ── */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <p className="text-[11px] font-medium text-white/30 mb-1">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  <h1 className="text-[24px] font-semibold text-white tracking-tight">
                    Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
                    <span className="text-[#D97757]">{userProfile?.displayName?.split(' ')[0] || 'Creator'}</span>
                  </h1>
                  <p className="text-[13px] text-white/35 mt-1">
                    {stories.length === 0
                      ? 'Start writing your first story.'
                      : `${stories.length} stor${stories.length !== 1 ? 'ies' : 'y'} · ${stories.filter(s => s.isPublished).length} published`}
                    {(userProfile?.streak ?? 0) > 0 && (
                      <span className="ml-3 text-orange-400">🔥 {userProfile!.streak}-day streak</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsZenMode(!isZenMode)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] text-white/45 hover:text-white/70 rounded-lg text-[12px] font-medium transition-all"
                  >
                    <Eye size={13} /> Zen mode
                  </button>
                </div>
              </div>

              {/* ── Story Library ── */}
              <StoryLibrary
                stories={filteredStories}
                isLoading={isLoading}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                viewMode={viewMode}
                setViewMode={setViewMode}
                onSelect={handleSelectStory}
                onEdit={(story, e) => {
                  e.stopPropagation();
                  setEditingStory(story);
                  setIsEditing(true);
                  setSelectedBookType(story.category as any || 'story');
                }}
                onPublish={handlePublish}
                onDelete={handleDelete}
                onAddPartner={(story) => setPartnerModal({ show: true, story })}
                onCreate={() => canCreateStory ? setShowTypeSelector(true) : setShowPricingModal(true)}
              />
            </motion.div>
          ) : activeView === 'workspace' ? (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="h-[calc(100vh-200px)] flex flex-col"
            >
              <div className="flex items-center justify-between mb-7">
                <div>
                  <h1 className="text-[22px] font-semibold text-white tracking-tight">Workspace</h1>
                  <p className="text-[13px] text-white/35 mt-0.5">Multi-tab editor for your projects.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.07] rounded-lg text-[11px] text-white/30">
                    <Command size={11} />
                    <span>+P</span>
                  </div>
                  <button
                    onClick={() => setIsZenMode(true)}
                    className="p-2 bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.07] rounded-lg text-white/35 hover:text-white/65 transition-all"
                  >
                    <Eye size={15} />
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <TabbedWorkspace />
              </div>
            </motion.div>
          ) : activeView === 'themes' ? (
            <motion.div
              key="themes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ThemeMarketplace />
            </motion.div>
          ) : activeView === 'forge-settings' ? (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Settings onRedeem={() => setShowRedeemModal(true)} accent={accent} onSetAccent={onSetAccent} onToggleTheme={onToggleTheme} theme={theme} />
            </motion.div>
          ) : activeView === 'support' ? (
            <motion.div
              key="support"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Support />
            </motion.div>
          ) : activeView === 'characters' ? (
            <motion.div
              key="characters"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <CharacterArchitect
                storyId={undefined}
                userSubscriptionTier={userProfile?.subscriptionTier}
              />
            </motion.div>
          ) : activeView === 'bible' ? (
            <motion.div
              key="bible"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <StoryBiblePanel onBibleContext={setStoryBibleContext} />
            </motion.div>
          ) : activeView === 'publish' ? (
            <motion.div
              key="publish"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full overflow-y-auto"
            >
              <header className="mb-8">
                <h1 className="text-[22px] font-semibold text-white tracking-tight">Publish</h1>
                <p className="text-[13px] text-white/35 mt-0.5">Share your stories with the world.</p>
              </header>

              {isHeadAdmin && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#1e1e1e] border border-white/[0.07] rounded-2xl p-6 shadow-xl relative overflow-hidden group cursor-pointer mb-6"
                  onClick={() => setShowAdmin(true)}
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#D97757]/10 rounded-xl flex items-center justify-center text-[#D97757] border border-[#D97757]/15">
                          <Bot size={20} />
                        </div>
                        <div>
                          <h3 className="text-[15px] font-semibold text-white">App Architect</h3>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[11px] text-white/35">Active & Monitoring</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] text-[#D97757] font-medium">Open console →</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-white/[0.04] rounded-xl border border-white/[0.06]">
                        <div className="text-[10px] text-white/30 mb-1">System Health</div>
                        <div className="text-base font-semibold text-[#D97757]">98%</div>
                      </div>
                      <div className="p-3 bg-white/[0.04] rounded-xl border border-white/[0.06]">
                        <div className="text-[10px] text-white/30 mb-1">Latency</div>
                        <div className="text-base font-semibold text-[#D97757]">1.2s</div>
                      </div>
                      <div className="p-3 bg-white/[0.04] rounded-xl border border-white/[0.06]">
                        <div className="text-[10px] text-white/30 mb-1">Active Tools</div>
                        <div className="text-base font-semibold text-[#D97757]">8</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  { id: 'flipbook', title: 'Interactive Flipbook', desc: 'Export as a web-based book with realistic 3D page-turn animations.', icon: <BookOpen size={28} /> },
                  { id: 'kdp', title: 'Amazon KDP Format', desc: 'Automatically format your manuscript for Kindle or Print-on-Demand.', icon: <ImageIcon size={28} /> },
                  { id: 'epub', title: 'Standard ePub', desc: 'Universal ebook format compatible with all major e-readers.', icon: <FileText size={28} /> },
                  { id: 'pdf', title: 'Print-Ready PDF', desc: 'High-resolution PDF with bleed and crop marks for professional printing.', icon: <FileText size={28} /> },
                  { id: 'web', title: 'Web Serial', desc: 'Publish as a series of blog posts or a dedicated web portal.', icon: <Monitor size={28} /> },
                ].map(option => (
                  <button
                    key={option.id}
                    className="group p-6 bg-[#1e1e1e] border border-white/[0.07] rounded-2xl text-left hover:border-[#D97757]/20 hover:bg-[#232323] transition-all"
                  >
                    <div className="w-11 h-11 bg-[#D97757]/10 border border-[#D97757]/15 rounded-xl flex items-center justify-center text-[#D97757] mb-5 group-hover:scale-105 transition-transform">
                      {option.icon}
                    </div>
                    <h3 className="text-[15px] font-semibold text-white/90 mb-1.5">{option.title}</h3>
                    <p className="text-xs text-white/35 leading-relaxed">{option.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
    </div>

      {/* Zen Mode Overlay */}
      <AnimatePresence>
        {isZenMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#111] flex flex-col items-center justify-center p-12 text-center"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="relative z-10 flex flex-col items-center gap-5 text-center"
            >
              <div className="w-12 h-12 bg-[#D97757]/10 border border-[#D97757]/20 rounded-2xl flex items-center justify-center text-[#D97757]">
                <Eye size={22} />
              </div>
              <div>
                <h2 className="text-[22px] font-semibold text-white mb-1.5">Zen mode</h2>
                <p className="text-[13px] text-white/35 max-w-xs leading-relaxed">Distractions hidden. Focus on what matters — your story.</p>
              </div>
              <button
                onClick={() => setIsZenMode(false)}
                className="px-7 py-3 bg-[#D97757] hover:bg-[#C86A48] text-white rounded-xl font-semibold text-[14px] transition-colors shadow-lg shadow-[#D97757]/20"
              >
                Exit zen mode
              </button>
              <div className="flex items-center gap-5 text-[11px] text-white/20 mt-1">
                <span className="flex items-center gap-1.5"><Command size={10} /> +P</span>
                <span className="flex items-center gap-1.5"><Zap size={10} /> Auto-save</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="py-6 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#D97757] rounded-md flex items-center justify-center">
              <Sparkles size={11} className="text-white" />
            </div>
            <span className="text-[12px] font-medium text-white/30">{appName}</span>
          </div>
          <p className="text-[11px] text-white/15">&copy; 2026 {appName}</p>
        </div>
      </footer>

      {/* Add Partner Modal */}
      <AnimatePresence>
        {partnerModal.show && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPartnerModal({ show: false, story: null })}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="relative w-full max-w-sm bg-[#1e1e1e] border border-white/[0.09] rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-[17px] font-semibold text-white">Add collaborator</h3>
                  <p className="text-[12px] text-white/35 mt-0.5">Invite someone to edit this story</p>
                </div>
                <button onClick={() => setPartnerModal({ show: false, story: null })} className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-all text-white/35 hover:text-white/65">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 mb-5">
                <input
                  type="email"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  placeholder="partner@example.com"
                  className="w-full bg-[#252525] border border-white/[0.08] focus:border-[#D97757]/40 rounded-xl px-4 py-3 text-[14px] text-white/80 placeholder:text-white/20 outline-none transition-all"
                />
              </div>

              <button
                onClick={handleAddPartner}
                disabled={isAddingPartner || !partnerEmail.trim()}
                className="w-full py-2.5 bg-[#D97757] hover:bg-[#C86A48] text-white rounded-xl font-semibold text-[14px] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAddingPartner ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><UserPlus size={15} /><span>Send invite</span></>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pricing Modal */}
      <AnimatePresence>
        {showPricingModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPricingModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl bg-[#1a1a1a] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row max-h-[90vh] overflow-y-auto"
            >
              {/* Left Side: Benefits */}
              <div className="lg:w-1/3 bg-[#141414] border-r border-white/[0.06] p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 bg-[#D97757] rounded-xl flex items-center justify-center text-white">
                      <Sparkles size={18} />
                    </div>
                    <span className="text-xs font-semibold text-[#D97757] uppercase tracking-wider">{appName} Premium</span>
                  </div>
                  <h3 className="text-[22px] font-semibold text-white mb-6 leading-tight tracking-tight">Unlock the full studio.</h3>
                  <div className="space-y-4">
                    {[
                      "Unlimited Stories Per Month",
                      "Up to 100 Pages Per Story",
                      "Unlimited Magic Enhancements",
                      "All 50+ Artistic Styles",
                      "Full Audio Narration Suite",
                      "Collaborative Storytelling",
                      "FREE Marketplace Books",
                      "Priority Generation"
                    ].map((benefit, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-[#D97757]/15 border border-[#D97757]/25 flex items-center justify-center text-[#D97757] flex-shrink-0">
                          <Check size={10} />
                        </div>
                        <span className="text-sm text-white/55">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-8 p-4 bg-white/[0.04] rounded-xl border border-white/[0.06]">
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Current Plan</p>
                  <p className="text-sm font-semibold text-[#D97757] capitalize">{userProfile?.subscriptionTier} Tier</p>
                </div>
              </div>

              {/* Right Side: Pricing Options */}
              <div className="flex-1 p-10 flex flex-col">
                <div className="flex justify-between items-center mb-8">
                  <h4 className="text-[20px] font-semibold text-white tracking-tight">Choose your plan</h4>
                  <button onClick={() => setShowPricingModal(false)} className="p-2 hover:bg-white/[0.06] rounded-lg transition-all text-white/40 hover:text-white/70">
                    <X size={18} />
                  </button>
                </div>

                {/* Billing Toggle */}
                <div className="flex p-1 bg-white/[0.04] border border-white/[0.07] rounded-xl mb-8">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={cn("flex-1 py-2.5 rounded-lg text-sm font-bold transition-all", billingCycle === 'monthly' ? "bg-white/[0.1] text-white" : "text-white/30")}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={cn("flex-1 py-2.5 rounded-lg text-sm font-bold transition-all relative", billingCycle === 'yearly' ? "bg-white/[0.1] text-white" : "text-white/30")}
                  >
                    Yearly
                    <span className="absolute -top-2 -right-2 bg-green-500/80 text-white text-[8px] px-2 py-0.5 rounded-full">Save 20%</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">
                  {/* Standard Plan */}
                  <div className="p-6 rounded-xl border border-white/[0.08] flex flex-col justify-between hover:border-[#D97757]/20 transition-all group bg-white/[0.02]">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium uppercase tracking-widest text-white/35">Standard</span>
                        <Star className="w-4 h-4 text-[#D97757] opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                      <div className="flex items-baseline gap-1 mb-5">
                        <span className="text-3xl font-semibold text-white">${billingCycle === 'monthly' ? SUBSCRIPTION_PRICING.standard.monthly : (SUBSCRIPTION_PRICING.standard.yearly / 12).toFixed(2)}</span>
                        <span className="text-white/30 text-xs uppercase">/mo</span>
                      </div>
                      <ul className="space-y-2.5 mb-6">
                        <li className="text-xs text-white/45 flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-[#D97757]" />3 Stories Per Month</li>
                        <li className="text-xs text-white/45 flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-[#D97757]" />15 Pages Per Story</li>
                        <li className="text-xs text-white/45 flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-[#D97757]" />Collaboration Access</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => handleUpgrade('standard', billingCycle)}
                      disabled={userProfile?.subscriptionTier === 'standard' || isUpgrading}
                      className="w-full py-3 bg-white/[0.08] border border-white/[0.1] text-white/80 rounded-xl font-bold text-sm hover:bg-[#D97757] hover:text-white hover:border-[#D97757] transition-all disabled:opacity-40"
                    >
                      {userProfile?.subscriptionTier === 'standard' ? 'Current Plan' : 'Select Standard'}
                    </button>
                  </div>

                  {/* Premium Plan */}
                  <div className="p-6 rounded-xl border border-[#D97757]/30 bg-[#D97757]/[0.04] flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.07]">
                      <Crown className="w-12 h-12 text-[#D97757] -rotate-12" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium uppercase tracking-widest text-[#D97757]">Premium</span>
                        <Crown className="w-4 h-4 text-[#D97757]" />
                      </div>
                      <div className="flex items-baseline gap-1 mb-5">
                        <span className="text-3xl font-semibold text-white">${billingCycle === 'monthly' ? SUBSCRIPTION_PRICING.premium.monthly : (SUBSCRIPTION_PRICING.premium.yearly / 12).toFixed(2)}</span>
                        <span className="text-white/30 text-xs uppercase">/mo</span>
                      </div>
                      <ul className="space-y-2.5 mb-6">
                        <li className="text-xs text-[#D97757] flex items-center gap-2 font-medium"><Sparkles className="w-3 h-3" />Unlimited Stories</li>
                        <li className="text-xs text-white/45 flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-[#D97757]" />50 Pages Per Story</li>
                        <li className="text-xs text-white/45 flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-[#D97757]" />All Artistic Styles</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => handleUpgrade('premium', billingCycle)}
                      disabled={userProfile?.subscriptionTier === 'premium' || isUpgrading}
                      className="w-full py-3 bg-[#D97757] hover:bg-[#C86A48] text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-[#D97757]/20 disabled:opacity-40"
                    >
                      {userProfile?.subscriptionTier === 'premium' ? 'Current Plan' : 'Go Premium'}
                    </button>
                  </div>

                  {/* Ultimate Plan */}
                  <div className="p-6 rounded-xl border border-[#D97757]/30 bg-[#D97757]/[0.04] flex flex-col justify-between relative overflow-hidden md:col-span-2">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.07]">
                      <Zap className="w-16 h-16 text-[#D97757] -rotate-12" />
                    </div>
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-medium uppercase tracking-widest text-[#D97757]">Ultimate</span>
                          <span className="bg-[#D97757] text-white text-[8px] px-2 py-0.5 rounded-full font-medium">BEST VALUE</span>
                          <Zap className="w-4 h-4 text-[#D97757] ml-auto" />
                        </div>
                        <div className="flex items-baseline gap-1 mb-4">
                          <span className="text-4xl font-semibold text-white">${billingCycle === 'monthly' ? SUBSCRIPTION_PRICING.ultimate.monthly : (SUBSCRIPTION_PRICING.ultimate.yearly / 12).toFixed(2)}</span>
                          <span className="text-white/30 text-xs uppercase">/mo</span>
                        </div>
                        <p className="text-sm text-white/40 font-medium">The definitive experience. No limits, no boundaries.</p>
                      </div>
                      <div className="flex-1">
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mb-6">
                          {["Unlimited Stories","100 Pages Per Story","FREE Marketplace Books","Priority Generation","All 50+ Artistic Styles","Early Access Features","Dedicated Support","All Premium Features"].map((feat, i) => (
                            <li key={i} className="text-xs text-white/45 flex items-center gap-2">
                              <Check size={11} className="text-[#D97757] flex-shrink-0" />{feat}
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={() => handleUpgrade('ultimate', billingCycle)}
                          disabled={userProfile?.subscriptionTier === 'ultimate' || isUpgrading}
                          className="w-full py-4 bg-[#D97757] hover:bg-[#C86A48] text-white rounded-xl font-bold text-base transition-all shadow-2xl shadow-[#D97757]/15 disabled:opacity-40"
                        >
                          {userProfile?.subscriptionTier === 'ultimate' ? 'Current Plan' : 'Become Ultimate'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Donation Section */}
                <div className="mt-8 p-6 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex-1">
                      <h5 className="text-base font-semibold text-white mb-1">Support the project</h5>
                      <p className="text-sm text-white/35 font-medium">Your contributions help us keep the magic alive.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[5, 10, 50].map(amount => (
                        <button
                          key={amount}
                          onClick={() => toast.success(`Thank you for your $${amount} donation! (Demo)`)}
                          className="px-5 py-2.5 bg-white/[0.06] border border-white/[0.09] rounded-lg font-bold text-sm text-white/60 hover:bg-[#D97757] hover:text-white hover:border-[#D97757] transition-all"
                        >
                          ${amount}
                        </button>
                      ))}
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 font-bold text-sm">$</span>
                        <input
                          type="number"
                          placeholder="Custom"
                          className="w-28 pl-7 pr-3 py-2.5 bg-white/[0.06] border border-white/[0.09] rounded-lg font-bold text-sm text-white/60 outline-none focus:border-[#D97757]/40 transition-all placeholder:text-white/20"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = (e.target as HTMLInputElement).value;
                              if (val) toast.success(`Thank you for your $${val} donation! (Demo)`);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-center text-white/15 mt-6 uppercase tracking-widest font-bold">Secure Payment Powered by Stripe</p>

                <div className="mt-6 pt-6 border-t border-white/[0.06] flex flex-col items-center gap-3">
                  <p className="text-sm text-white/30 font-medium">Have a subscription code?</p>
                  <button
                    onClick={() => { setShowPricingModal(false); setShowRedeemModal(true); }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white/[0.05] border border-white/[0.09] rounded-xl font-bold text-sm text-white/50 hover:border-[#D97757]/30 hover:text-[#D97757] transition-all"
                  >
                    <Zap size={14} className="text-[#D97757]" />
                    Redeem 12-Character Code
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Redeem Code Modal */}
      <AnimatePresence>
        {showRedeemModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowRedeemModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[#1e1e1e] border border-white/[0.09] rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-[17px] font-semibold text-white">Redeem code</h3>
                  <p className="text-[12px] text-white/35 mt-0.5">Enter your 12-character code</p>
                </div>
                <button onClick={() => setShowRedeemModal(false)} className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-all text-white/35">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 mb-5">
                <div className="relative">
                  <input
                    type="text"
                    maxLength={12}
                    value={redeemCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                      setRedeemCode(val);
                    }}
                    placeholder="ABC123XYZ789"
                    className="w-full bg-white/[0.05] border border-white/[0.09] rounded-xl px-4 py-5 outline-none font-mono text-2xl text-center tracking-[0.2em] text-white/80 placeholder:text-white/15 focus:border-[#D97757]/40 transition-colors"
                  />
                  {redeemCode.length === 12 && (
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500"
                    >
                      <CheckCircle size={22} />
                    </motion.div>
                  )}
                </div>
              </div>

              <button
                onClick={handleRedeemCode}
                disabled={redeemCode.length !== 12 || isRedeeming}
                className="w-full py-3.5 bg-[#D97757] hover:bg-[#C86A48] text-white rounded-xl font-bold text-base transition-all shadow-lg shadow-[#D97757]/20 disabled:opacity-40 flex items-center justify-center gap-3"
              >
                {isRedeeming ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Redeeming...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Redeem Now
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
