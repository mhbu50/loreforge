import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
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
import { Toaster } from 'sonner';
import { Loader2, Hammer } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

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
    // Safety fallback: if loading hasn't resolved in 8s, force it off
    const safetyTimer = setTimeout(() => setLoading(false), 8000);

    const path = 'settings/global';
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setGlobalSettings(snapshot.data());
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    // Track the profile subscription so we can cancel it when the user changes
    let unsubProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      // Always cancel any previous profile subscription first
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (authUser) {
        setUser(authUser);
        const userPath = `users/${authUser.uid}`;

        unsubProfile = onSnapshot(doc(db, 'users', authUser.uid), (snapshot) => {
          if (snapshot.exists()) {
            const profile = snapshot.data() as UserProfile;
            setUserProfile(profile);

            if (profile.role === 'headadmin' || authUser.email === 'alaa.abukhamseen@gmail.com') {
              SystemHealthService.getInstance().runFullCheck();
            }
          } else {
            // Profile doc doesn't exist yet (new user race condition) — clear it
            setUserProfile(null);
          }
          clearTimeout(safetyTimer);
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, userPath);
          clearTimeout(safetyTimer);
          setLoading(false);
        });
      } else {
        setUser(null);
        setUserProfile(null);
        clearTimeout(safetyTimer);
        setLoading(false);
      }
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
      document.documentElement.style.setProperty('--color-gold', primaryColor);
      document.documentElement.style.setProperty('--font-sans', `var(--font-${fontFamily})`);
      document.documentElement.style.setProperty('--font-serif', `var(--font-${fontFamily})`);
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
          console.error("Failed to fetch theme:", error);
        }
      };
      fetchTheme();
    } else {
      const styleTag = document.getElementById('storycraft-custom-theme');
      if (styleTag) styleTag.innerHTML = '';
    }
  }, [userProfile?.activeThemeId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center luxury-bg">
        <div className="atmosphere" />
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center text-night animate-float">
            <Loader2 className="animate-spin" size={32} />
          </div>
          <p className="small-caps text-gold animate-pulse">Crafting Reality...</p>
        </div>
      </div>
    );
  }

  // Maintenance Mode Check
  if (globalSettings?.maintenanceMode && userProfile?.role !== 'headadmin') {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="w-24 h-24 bg-gold/20 rounded-3xl flex items-center justify-center text-gold mx-auto animate-bounce">
            <Hammer size={48} />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-serif font-bold text-white">Under Construction</h1>
            <p className="text-white/60 leading-relaxed">
              The App Architect is currently performing deep-level optimizations. 
              We'll be back shortly with a more powerful experience.
            </p>
          </div>
          <div className="pt-8 border-t border-white/10">
            <div className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">System Status: Maintenance</div>
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
            element={user ? <Navigate to="/" /> : <Auth />} 
          />
          <Route
            path="/"
            element={
              user
                ? userProfile
                  ? <Dashboard userProfile={userProfile} />
                  : (
                    // User is authenticated but profile not loaded yet — show brief spinner
                    <div className="min-h-screen flex items-center justify-center luxury-bg">
                      <div className="atmosphere" />
                      <div className="flex flex-col items-center gap-6">
                        <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center text-night animate-float">
                          <Loader2 className="animate-spin" size={32} />
                        </div>
                        <p className="small-caps text-gold animate-pulse">Setting up your studio...</p>
                      </div>
                    </div>
                  )
                : <Landing />
            }
          />
          <Route 
            path="/marketplace" 
            element={<Marketplace />} 
          />
          <Route 
            path="/admin" 
            element={
              user && (userProfile?.role === 'admin' || userProfile?.role === 'headadmin' || user.email === 'alaa.abukhamseen@gmail.com') ? (
                <Admin />
              ) : (
                <Navigate to="/" />
              )
            } 
          />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
