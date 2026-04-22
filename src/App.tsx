import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestore-utils';
import { auth, db } from './firebase';
import { UserProfile, Theme } from './types';
import { SystemHealthService } from './services/SystemHealthService';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Admin from './components/Admin';
import Marketplace from './components/Marketplace';
import Landing from './components/Landing';
import Particles from './components/Particles';
import CommandPalette from './components/CommandPalette';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster, toast } from 'sonner';
import { Loader2, Hammer, Sparkles } from 'lucide-react';

// Create the Firestore user profile document for a newly authenticated user.
// Called as a fallback when onSnapshot fires with no document, to handle both
// the race-condition (auth fires before setDoc completes in Auth.tsx) and the
// case where the Auth.tsx write failed silently (Firestore rules not deployed).
async function ensureUserProfile(authUser: any): Promise<boolean> {
  try {
    const ref = doc(db, 'users', authUser.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: authUser.uid,
        email: authUser.email || '',
        displayName: authUser.displayName || authUser.email?.split('@')[0] || 'User',
        role: authUser.email === 'alaa.abukhamseen@gmail.com' ? 'headadmin' : 'user',
        subscriptionTier: 'free',
        subscriptionStatus: 'active',
        subscriptionCycle: 'none',
        streak: 0,
        tokens: 5,
        createdAt: Date.now(),
      });
    }
    return true;
  } catch {
    return false;
  }
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileSetupFailed, setProfileSetupFailed] = useState(false);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('storycraft-theme') as 'light' | 'dark') || 'light';
  });

  // Apply / remove dark theme on <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('storycraft-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    // Absolute fallback — never stay stuck on loading screen longer than 10s
    const safetyTimer = setTimeout(() => setLoading(false), 10000);

    const unsubscribeSettings = onSnapshot(
      doc(db, 'settings', 'global'),
      (snapshot) => { if (snapshot.exists()) setGlobalSettings(snapshot.data()); },
      (error) => handleFirestoreError(error, OperationType.GET, 'settings/global')
    );

    let unsubProfile: (() => void) | null = null;
    // Track whether we've already attempted a self-heal for the current user
    let healAttempted = false;

    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      // Cancel the previous user's profile subscription
      if (unsubProfile) { unsubProfile(); unsubProfile = null; }
      healAttempted = false;

      if (!authUser) {
        setUser(null);
        setUserProfile(null);
        setProfileSetupFailed(false);
        clearTimeout(safetyTimer);
        setLoading(false);
        return;
      }

      setUser(authUser);

      unsubProfile = onSnapshot(
        doc(db, 'users', authUser.uid),
        async (snapshot) => {
          if (snapshot.exists()) {
            // Happy path — profile is ready
            const profile = snapshot.data() as UserProfile;
            setUserProfile(profile);
            setProfileSetupFailed(false);
            clearTimeout(safetyTimer);
            setLoading(false);
            if (profile.role === 'headadmin' || authUser.email === 'alaa.abukhamseen@gmail.com') {
              SystemHealthService.getInstance().runFullCheck();
            }
          } else if (!healAttempted) {
            // Profile missing — try to create it (handles race condition + silent write failure)
            healAttempted = true;
            const ok = await ensureUserProfile(authUser);
            if (!ok) {
              // Firestore is inaccessible (rules not deployed, offline, etc.)
              // Sign the user out so they're not stuck, and explain the error
              console.error('Could not create user profile — Firestore may be unreachable or rules are not deployed.');
              setProfileSetupFailed(true);
              clearTimeout(safetyTimer);
              setLoading(false);
            }
            // If ok === true, onSnapshot will fire again with the new document
          }
          // If healAttempted && !snapshot.exists(): profile write succeeded but snapshot
          // hasn't updated yet — wait (safety timer is the backstop).
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${authUser.uid}`);
          clearTimeout(safetyTimer);
          setLoading(false);
        }
      );
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribeSettings();
      unsubscribeAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  useEffect(() => {
    if (globalSettings?.uiSettings) {
      const { primaryColor, fontFamily } = globalSettings.uiSettings;
      if (primaryColor) document.documentElement.style.setProperty('--color-gold', primaryColor);
      if (fontFamily) {
        document.documentElement.style.setProperty('--font-sans', `var(--font-${fontFamily})`);
        document.documentElement.style.setProperty('--font-sans', `var(--font-${fontFamily})`);
      }
    }
  }, [globalSettings]);

  useEffect(() => {
    if (userProfile?.activeThemeId) {
      const fetchTheme = async () => {
        try {
          const themeDoc = await getDoc(doc(db, 'themes', userProfile.activeThemeId!));
          if (themeDoc.exists()) {
            const themeData = themeDoc.data() as Theme;
            let styleTag = document.getElementById('storycraft-custom-theme');
            if (!styleTag) {
              styleTag = document.createElement('style');
              styleTag.id = 'storycraft-custom-theme';
              document.head.appendChild(styleTag);
            }
            styleTag.innerHTML = themeData.css;
          }
        } catch (error) {
          console.error('Failed to fetch theme:', error);
        }
      };
      fetchTheme();
    } else {
      const styleTag = document.getElementById('storycraft-custom-theme');
      if (styleTag) styleTag.innerHTML = '';
    }
  }, [userProfile?.activeThemeId]);

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center luxury-bg overflow-hidden">
        <div className="atmosphere" />
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)' }} />
        </div>
        <div className="flex flex-col items-center gap-8 relative z-10">
          {/* Animated logo */}
          <div className="relative">
            <div className="w-20 h-20 bg-[#D97757]/10 border border-[#D97757]/20 rounded-3xl flex items-center justify-center">
              <Sparkles className="text-[#D97757] animate-pulse" size={36} />
            </div>
            <div className="absolute inset-0 rounded-3xl border border-[#D97757]/10 animate-ping opacity-20" />
          </div>
          <div className="space-y-3 text-center">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-[#D97757]/30" />
              <p className="small-caps text-[#D97757] text-xs tracking-[0.4em]">Crafting Reality</p>
              <div className="h-px w-8 bg-[#D97757]/30" />
            </div>
            {/* Progress dots */}
            <div className="flex items-center justify-center gap-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 bg-[#D97757]/40 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.3}s` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Profile setup failed — Firestore unreachable
  if (profileSetupFailed) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-400 mx-auto">
            <Hammer size={40} />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold text-white">Setup Failed</h1>
            <p className="text-white/50 leading-relaxed text-sm">
              Your account was created but we couldn't set up your profile.
              This usually means Firestore security rules haven't been deployed yet.
            </p>
            <p className="text-white/30 text-xs font-mono">
              Run: <span className="text-[#D97757]">firebase deploy --only firestore:rules</span>
            </p>
          </div>
          <button
            onClick={() => { signOut(auth); setProfileSetupFailed(false); }}
            className="px-8 py-3 bg-[#D97757] text-[#1a1a1a] font-bold rounded-xl hover:bg-[#D97757]/90 transition-all"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // Maintenance Mode Check
  if (globalSettings?.maintenanceMode && userProfile?.role !== 'headadmin') {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="w-24 h-24 bg-[#D97757]/20 rounded-3xl flex items-center justify-center text-[#D97757] mx-auto animate-bounce">
            <Hammer size={48} />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold text-white">Under Construction</h1>
            <p className="text-white/60 leading-relaxed">
              The App Architect is currently performing deep-level optimizations.
              We'll be back shortly with a more powerful experience.
            </p>
          </div>
          <div className="pt-8 border-t border-white/10">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[#D97757] font-bold">System Status: Maintenance</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <Toaster position="top-center" richColors theme="dark" />
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
        />
        {globalSettings?.uiSettings?.showParticles && <Particles />}
        {globalSettings?.uiSettings?.showGrain && <div className="grain-overlay" />}
        {globalSettings?.uiSettings?.showVignette && <div className="vignette-overlay" />}
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/" /> : <Auth globalSettings={globalSettings} />}
          />
          <Route
            path="/"
            element={
              user
                ? userProfile
                  ? <Dashboard userProfile={userProfile} globalSettings={globalSettings} theme={theme} onToggleTheme={toggleTheme} />
                  : (
                    // Authenticated but profile not ready yet — self-heal is in progress
                    <div className="min-h-screen flex items-center justify-center luxury-bg">
                      <div className="atmosphere" />
                      <div className="flex flex-col items-center gap-8">
                        <div className="w-16 h-16 bg-[#D97757]/10 border border-[#D97757]/20 rounded-2xl flex items-center justify-center">
                          <Loader2 className="text-[#D97757] animate-spin" size={28} />
                        </div>
                        <div className="text-center space-y-2">
                          <p className="small-caps text-[#D97757] text-xs tracking-[0.4em]">Setting up your studio</p>
                          <p className="text-white/20 text-[10px]">This only takes a moment...</p>
                        </div>
                      </div>
                    </div>
                  )
                : <Landing globalSettings={globalSettings} />
            }
          />
          <Route
            path="/marketplace"
            element={<Marketplace />}
          />
          <Route
            path="/admin"
            element={
              user && (userProfile?.role === 'admin' || userProfile?.role === 'headadmin' || user.email === 'alaa.abukhamseen@gmail.com')
                ? <Admin />
                : <Navigate to="/" />
            }
          />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
