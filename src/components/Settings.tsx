import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings as SettingsIcon,
  Cpu,
  Zap,
  Volume2,
  Eye,
  Lock,
  Save,
  RefreshCw,
  Monitor,
  Shield,
  Clock,
  Layout,
  Type,
  CheckCircle2,
  AlertCircle,
  Info,
  Cloud,
  Brain,
  Thermometer,
  Sword,
  Heart,
  Rocket,
  Sparkles,
  Palette,
  Trash2,
  Accessibility,
  Ticket
} from 'lucide-react';
import { ConfigService } from '../services/ConfigService';
import { AppConfig, UserProfile } from '../types';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { auth, db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

interface SettingsProps {
  onRedeem?: () => void;
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-12 h-6 rounded-full transition-all relative shadow-md flex-shrink-0",
        on ? "bg-gold" : "bg-black/10"
      )}
    >
      <motion.div
        animate={{ x: on ? 24 : 4 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
      />
    </button>
  );
}

function SectionCard({ children, accentColor = "border-gold/40" }: { children: React.ReactNode; accentColor?: string }) {
  return (
    <div className={cn("border-l-4 rounded-[2rem]", accentColor)} style={{ borderLeftColor: undefined }}>
      <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden -ml-1">
        {children}
      </div>
    </div>
  );
}

export default function Settings({ onRedeem }: SettingsProps) {
  const [config, setConfig] = useState<AppConfig>(ConfigService.getConfig());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (auth.currentUser) {
      getDoc(doc(db, 'users', auth.currentUser.uid)).then(snap => {
        if (snap.exists()) setUserProfile(snap.data() as UserProfile);
      });
    }
  }, []);

  const handleResetTheme = async () => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        activeThemeId: null
      });
      setUserProfile(prev => prev ? { ...prev, activeThemeId: undefined } : null);
      toast.success("Theme reset to default");
    } catch (error) {
      toast.error("Failed to reset theme");
    }
  };

  const handleUpdate = (updates: Partial<AppConfig>) => {
    const updated = ConfigService.updateConfig(updates);
    setConfig(updated);
    toast.success("Settings updated");
  };

  const handleNestedUpdate = (section: keyof AppConfig, updates: any) => {
    const updatedSection = { ...(config[section] as any), ...updates };
    handleUpdate({ [section]: updatedSection });
  };

  return (
    <div className="max-w-5xl mx-auto p-8 pb-32">
      {/* Page Header */}
      <header className="mb-14">
        <h1 className="text-6xl font-serif font-light mb-3 leading-none">
          Forge <span className="italic text-gold">Settings</span>
        </h1>
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-black/40">
          Optimize your creative engine
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ── Writing Flow ── */}
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden"
          style={{ borderLeft: '4px solid rgba(212,175,55,0.4)' }}>
          <div className="p-8">
            {/* Section header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gold/10 text-gold">
                <Zap size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-0.5">Writing</p>
                <h2 className="text-xl font-serif font-bold leading-none">Writing Flow</h2>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-black/[0.03] rounded-xl border border-black/5">
                <div>
                  <p className="text-sm font-bold">Distraction-Free Mode</p>
                  <p className="text-xs text-black/40 mt-0.5">Hide all UI elements while typing</p>
                </div>
                <Toggle
                  on={config.writing.distractionFree}
                  onToggle={() => handleNestedUpdate('writing', { distractionFree: !config.writing.distractionFree })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-black/[0.03] rounded-xl border border-black/5">
                <div>
                  <p className="text-sm font-bold">Typewriter Scrolling</p>
                  <p className="text-xs text-black/40 mt-0.5">Keep the active line centered</p>
                </div>
                <Toggle
                  on={config.writing.typewriterMode}
                  onToggle={() => handleNestedUpdate('writing', { typewriterMode: !config.writing.typewriterMode })}
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-2 block">
                  Ambient Soundscape
                </label>
                <select
                  value={config.writing.ambientSound}
                  onChange={(e) => handleNestedUpdate('writing', { ambientSound: e.target.value })}
                  className="w-full p-4 bg-black/[0.03] rounded-xl border border-black/5 outline-none text-sm font-medium"
                >
                  <option value="none">None</option>
                  <option value="rain">Rainy Cafe</option>
                  <option value="forest">Ancient Forest</option>
                  <option value="space">Deep Space Hub</option>
                  <option value="library">Grand Library</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── Security ── */}
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden"
          style={{ borderLeft: '4px solid rgba(239,68,68,0.35)' }}>
          <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-50 text-red-500">
                <Shield size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-0.5">Privacy</p>
                <h2 className="text-xl font-serif font-bold leading-none">Security</h2>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-black/[0.03] rounded-xl border border-black/5">
                <div>
                  <p className="text-sm font-bold">App Lock</p>
                  <p className="text-xs text-black/40 mt-0.5">Require password to open StoryCraft</p>
                </div>
                <Toggle
                  on={config.security.appLockEnabled}
                  onToggle={() => handleNestedUpdate('security', { appLockEnabled: !config.security.appLockEnabled })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-black/[0.03] rounded-xl border border-black/5">
                <div>
                  <p className="text-sm font-bold">Stealth Mode</p>
                  <p className="text-xs text-black/40 mt-0.5">Instantly hide app with a hotkey</p>
                </div>
                <Toggle
                  on={config.security.stealthMode}
                  onToggle={() => handleNestedUpdate('security', { stealthMode: !config.security.stealthMode })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Interface ── */}
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden"
          style={{ borderLeft: '4px solid rgba(245,158,11,0.4)' }}>
          <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-500">
                <Layout size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-0.5">Appearance</p>
                <h2 className="text-xl font-serif font-bold leading-none">Interface</h2>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 block">Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['modern', 'classic', 'brutalist'] as const).map(theme => (
                    <button
                      key={theme}
                      onClick={() => handleNestedUpdate('ui', { theme })}
                      className={cn(
                        "py-3 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all",
                        config.ui.theme === theme
                          ? "bg-black text-white border-black"
                          : "bg-white border-black/5 hover:border-black/20"
                      )}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-black/40">
                  <span>Font Size</span>
                  <span>{config.ui.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="12" max="24"
                  value={config.ui.fontSize}
                  onChange={(e) => handleNestedUpdate('ui', { fontSize: parseInt(e.target.value) })}
                  className="w-full accent-gold"
                />
              </div>

              {userProfile?.activeThemeId && (
                <div className="p-5 bg-gold/5 border border-gold/20 rounded-2xl space-y-3">
                  <div className="flex items-center gap-3">
                    <Palette size={18} className="text-gold" />
                    <h4 className="text-sm font-bold">Active Custom Theme</h4>
                  </div>
                  <p className="text-xs text-black/40">You are using a custom theme from the marketplace. This may override some interface settings.</p>
                  <button
                    onClick={handleResetTheme}
                    className="w-full py-3 bg-white border border-red-500/20 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} />
                    <span>Reset to Default Theme</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Accessibility ── */}
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden"
          style={{ borderLeft: '4px solid rgba(34,197,94,0.4)' }}>
          <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-50 text-green-500">
                <Accessibility size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-0.5">Inclusion</p>
                <h2 className="text-xl font-serif font-bold leading-none">Accessibility</h2>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-black/[0.03] rounded-xl border border-black/5">
                <div>
                  <p className="text-sm font-bold">High Contrast</p>
                  <p className="text-xs text-black/40 mt-0.5">Enhance visibility with sharper colors</p>
                </div>
                <Toggle
                  on={!!config.accessibility?.highContrast}
                  onToggle={() => handleNestedUpdate('accessibility', { highContrast: !config.accessibility?.highContrast })}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-black/[0.03] rounded-xl border border-black/5">
                <div>
                  <p className="text-sm font-bold">Dyslexic Font</p>
                  <p className="text-xs text-black/40 mt-0.5">Use OpenDyslexic for better readability</p>
                </div>
                <Toggle
                  on={!!config.accessibility?.dyslexicFont}
                  onToggle={() => handleNestedUpdate('accessibility', { dyslexicFont: !config.accessibility?.dyslexicFont })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Subscription — full width ── */}
        <div className="md:col-span-2 bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden"
          style={{ borderLeft: '4px solid rgba(212,175,55,0.6)' }}>
          <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gold/10 text-gold">
                <Ticket size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mb-0.5">Access</p>
                <h2 className="text-xl font-serif font-bold leading-none">Subscription &amp; Access</h2>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-8 bg-black/[0.03] rounded-[1.5rem] border border-black/5">
              <div className="flex-1">
                <h3 className="text-xl font-serif font-bold mb-2">Redeem Access Code</h3>
                <p className="text-sm text-black/40 font-medium leading-relaxed">
                  Have a 12-character subscription code? Enter it here to upgrade your account instantly.
                </p>
              </div>
              <button
                onClick={() => {
                  if (onRedeem) {
                    onRedeem();
                  } else {
                    toast.info("Please use the 'REDEEM' button in the sidebar or your profile to enter your code.");
                  }
                }}
                className="flex items-center gap-2 px-8 py-4 bg-black text-white rounded-2xl font-bold hover:bg-gold hover:text-night transition-all shadow-xl shadow-black/10 flex-shrink-0"
              >
                <Zap size={18} />
                Redeem Code
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
