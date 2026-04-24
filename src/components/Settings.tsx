import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Shield, Layout, Accessibility, Ticket, Palette, Trash2, Pen, Volume2, Eye, Lock, Type, ChevronRight } from 'lucide-react';
import { ConfigService } from '../services/ConfigService';
import { AppConfig, UserProfile } from '../types';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { auth, db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

interface SettingsProps {
  onRedeem?: () => void;
  onToggleTheme?: () => void;
  theme?: 'light' | 'dark';
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-11 h-6 rounded-full transition-colors duration-200 relative flex-shrink-0",
        on ? "bg-accent" : "bg-app-tertiary"
      )}
    >
      <motion.div
        animate={{ x: on ? 22 : 3 }}
        transition={{ type: "spring", stiffness: 600, damping: 35 }}
        className="absolute top-[3px] w-[18px] h-[18px] bg-app-card rounded-full shadow-md"
      />
    </button>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-black/[0.05] last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        {description && <p className="text-xs text-black/40 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

const TABS = [
  { id: 'writing',      icon: Pen,           label: 'Writing',      color: 'text-[#D97757]',     bg: 'bg-[#D97757]/10' },
  { id: 'security',     icon: Shield,        label: 'Security',     color: 'text-red-400',  bg: 'bg-red-500/10' },
  { id: 'interface',    icon: Layout,        label: 'Interface',    color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'accessibility',icon: Accessibility, label: 'Accessibility',color: 'text-green-400',bg: 'bg-green-500/10' },
  { id: 'subscription', icon: Ticket,        label: 'Subscription', color: 'text-[#D97757]',     bg: 'bg-[#D97757]/10' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function Settings({ onRedeem, onToggleTheme, theme = 'light' }: SettingsProps) {
  const [tab, setTab] = useState<TabId>('writing');
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
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { activeThemeId: null });
      setUserProfile(prev => prev ? { ...prev, activeThemeId: undefined } : null);
      toast.success("Theme reset to default");
    } catch {
      toast.error("Failed to reset theme");
    }
  };

  const upd = (section: keyof AppConfig, updates: any) => {
    const updated = ConfigService.updateConfig({ [section]: { ...(config[section] as any), ...updates } });
    setConfig(updated);
    toast.success("Saved");
  };

  const activeTab = TABS.find(t => t.id === tab)!;

  return (
    <div className="flex h-full min-h-screen bg-app">
      {/* ── Left Tab Rail ── */}
      <aside className="w-56 flex-shrink-0 border-r border-app-light pt-10 pb-8 flex flex-col gap-1 px-3 bg-app-secondary">
        <p className="text-xs font-bold uppercase tracking-wider text-app-subtle px-3 mb-3">Settings</p>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left",
                active ? "bg-app-card text-app shadow-sm" : "text-app-subtle hover:bg-app-tertiary hover:text-app-muted"
              )}
            >
              <div className={cn("w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 transition-colors", active ? "bg-accent-bg text-accent" : "bg-app-tertiary text-app-muted")}>
                <Icon size={16} />
              </div>
              <span className="text-sm font-medium">{t.label}</span>
              {active && <ChevronRight size={14} className="ml-auto text-app-subtle" />}
            </button>
          );
        })}
      </aside>

      {/* ── Right Content ── */}
      <div className="flex-1 overflow-y-auto bg-app">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
            className="max-w-2xl mx-auto px-10 pt-10 pb-32"
          >
            {/* Section header */}
            <div className="flex items-center gap-4 mb-10">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", "bg-accent-bg text-accent")}>
                <activeTab.icon size={20} />
              </div>
              <div>
                <h2 className="text-3xl font-serif font-normal text-app">{activeTab.label}</h2>
                <p className="text-xs text-app-subtle mt-1 font-medium">
                  {tab === 'writing' && 'Focus mode, sound, and writing experience'}
                  {tab === 'security' && 'App lock and privacy controls'}
                  {tab === 'interface' && 'Theme, typography, and layout preferences'}
                  {tab === 'accessibility' && 'Readability and visual accessibility aids'}
                  {tab === 'subscription' && 'Plan, access codes, and billing'}
                </p>
              </div>
            </div>

            {/* ── Writing ── */}
            {tab === 'writing' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
                  <div className="px-6 pt-6 pb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/30 mb-1">Focus</p>
                  </div>
                  <div className="px-6 pb-4">
                    <Row label="Distraction-Free Mode" description="Hide all UI elements while typing">
                      <Toggle on={config.writing.distractionFree} onToggle={() => upd('writing', { distractionFree: !config.writing.distractionFree })} />
                    </Row>
                    <Row label="Typewriter Scrolling" description="Keep the active line vertically centered">
                      <Toggle on={config.writing.typewriterMode} onToggle={() => upd('writing', { typewriterMode: !config.writing.typewriterMode })} />
                    </Row>
                    <Row label="Pomodoro Timer" description="Work in focused intervals with breaks">
                      <Toggle on={config.writing.pomodoroEnabled} onToggle={() => upd('writing', { pomodoroEnabled: !config.writing.pomodoroEnabled })} />
                    </Row>
                  </div>
                </div>

                {config.writing.pomodoroEnabled && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-6"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/30 mb-4">Pomodoro Settings</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-black/50">Work duration (min)</label>
                        <input type="number" min="1" max="120"
                          value={config.writing.pomodoroWorkTime}
                          onChange={e => upd('writing', { pomodoroWorkTime: parseInt(e.target.value) || 25 })}
                          className="w-full px-4 py-3 bg-black/[0.03] border border-black/[0.06] rounded-xl outline-none focus:border-[#D97757]/40 text-sm font-medium transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-black/50">Break duration (min)</label>
                        <input type="number" min="1" max="60"
                          value={config.writing.pomodoroBreakTime}
                          onChange={e => upd('writing', { pomodoroBreakTime: parseInt(e.target.value) || 5 })}
                          className="w-full px-4 py-3 bg-black/[0.03] border border-black/[0.06] rounded-xl outline-none focus:border-[#D97757]/40 text-sm font-medium transition-colors"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-6 space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">Ambient Sound</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { v: 'none',    label: 'Silence' },
                      { v: 'rain',    label: 'Rainy Café' },
                      { v: 'forest',  label: 'Ancient Forest' },
                      { v: 'space',   label: 'Deep Space' },
                      { v: 'library', label: 'Grand Library' },
                    ].map(({ v, label }) => (
                      <button
                        key={v}
                        onClick={() => upd('writing', { ambientSound: v })}
                        className={cn(
                          "py-3 px-4 rounded-xl text-sm font-semibold transition-all border text-left",
                          config.writing.ambientSound === v
                            ? "bg-[#141414] text-white border-[#141414]"
                            : "bg-black/[0.03] border-black/[0.06] text-black/50 hover:border-black/20 hover:text-black/80"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Security ── */}
            {tab === 'security' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
                  <div className="px-6 pt-6 pb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/30 mb-1">Protection</p>
                  </div>
                  <div className="px-6 pb-4">
                    <Row label="App Lock" description="Require a password to open StoryCraft">
                      <Toggle on={config.security.appLockEnabled} onToggle={() => upd('security', { appLockEnabled: !config.security.appLockEnabled })} />
                    </Row>
                    <Row label="Stealth Mode" description="Instantly hide the app with a keyboard shortcut">
                      <Toggle on={config.security.stealthMode} onToggle={() => upd('security', { stealthMode: !config.security.stealthMode })} />
                    </Row>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-6 space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">Auto-Save</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-black/40">
                      <span>Save interval</span>
                      <span className="text-[#D97757] font-bold">{config.security.autoSaveInterval}s</span>
                    </div>
                    <input type="range" min="10" max="300" step="10"
                      value={config.security.autoSaveInterval}
                      onChange={e => upd('security', { autoSaveInterval: parseInt(e.target.value) })}
                      className="w-full accent-[#D97757]"
                    />
                    <div className="flex justify-between text-[10px] text-black/25">
                      <span>10s</span><span>5 min</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Interface ── */}
            {tab === 'interface' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-6 space-y-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">Appearance</p>

                  {/* Light / Dark toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-black/70">Color mode</p>
                      <p className="text-xs text-black/40 mt-0.5">{theme === 'dark' ? 'Dark mode active' : 'Light mode active'}</p>
                    </div>
                    <button
                      onClick={onToggleTheme}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all"
                      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                    >
                      {theme === 'dark' ? '☀ Light' : '☾ Dark'}
                    </button>
                  </div>

                </div>

                <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-6 space-y-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">UI Theme</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['modern', 'classic', 'brutalist'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => upd('ui', { theme: t })}
                        className={cn(
                          "py-3 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all",
                          config.ui.theme === t ? "bg-[#141414] text-white border-[#141414]" : "border-black/[0.06] text-black/40 hover:border-black/20 hover:text-black/70"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-6 space-y-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">Typography</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-black/40">
                      <span>Font Size</span>
                      <span className="text-[#D97757] font-bold">{config.ui.fontSize}px</span>
                    </div>
                    <input type="range" min="12" max="24"
                      value={config.ui.fontSize}
                      onChange={e => upd('ui', { fontSize: parseInt(e.target.value) })}
                      className="w-full accent-[#D97757]"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-black/40">
                      <span>Line Height</span>
                      <span className="text-[#D97757] font-bold">{config.ui.lineHeight}</span>
                    </div>
                    <input type="range" min="1" max="2.5" step="0.1"
                      value={config.ui.lineHeight}
                      onChange={e => upd('ui', { lineHeight: parseFloat(e.target.value) })}
                      className="w-full accent-[#D97757]"
                    />
                  </div>
                </div>

                {userProfile?.activeThemeId && (
                  <div className="bg-[#D97757]/5 border border-[#D97757]/20 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <Palette size={18} className="text-[#D97757]" />
                      <p className="text-sm font-bold">Active Custom Theme</p>
                    </div>
                    <p className="text-xs text-black/40 leading-relaxed">You're using a custom marketplace theme. It may override some settings above.</p>
                    <button onClick={handleResetTheme}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-red-300/40 text-red-500 rounded-xl text-xs font-bold hover:bg-red-50 transition-all">
                      <Trash2 size={13} /> Reset to Default
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Accessibility ── */}
            {tab === 'accessibility' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
                  <div className="px-6 pt-6 pb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/30 mb-1">Visual</p>
                  </div>
                  <div className="px-6 pb-4">
                    <Row label="High Contrast" description="Sharper color differences for better readability">
                      <Toggle on={!!config.accessibility?.highContrast} onToggle={() => upd('accessibility', { highContrast: !config.accessibility?.highContrast })} />
                    </Row>
                    <Row label="Dyslexic Font" description="Switch body text to OpenDyslexic">
                      <Toggle on={!!config.accessibility?.dyslexicFont} onToggle={() => upd('accessibility', { dyslexicFont: !config.accessibility?.dyslexicFont })} />
                    </Row>
                    <Row label="Simplified Syntax" description="Reduce complex formatting in the editor">
                      <Toggle on={!!config.accessibility?.simplifiedSyntaxMode} onToggle={() => upd('accessibility', { simplifiedSyntaxMode: !config.accessibility?.simplifiedSyntaxMode })} />
                    </Row>
                  </div>
                </div>
              </div>
            )}

            {/* ── Subscription ── */}
            {tab === 'subscription' && (
              <div className="space-y-6">
                <div className="relative overflow-hidden bg-[#141414] rounded-2xl p-8 shadow-2xl">
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full" style={{ background: 'radial-gradient(circle, rgba(217,119,87,0.15) 0%, transparent 70%)' }} />
                    <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full" style={{ background: 'radial-gradient(circle, rgba(217,119,87,0.08) 0%, transparent 70%)' }} />
                  </div>
                  <div className="relative">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#D97757]/60 mb-3">Redeem</p>
                    <h3 className="text-2xl font-semibold text-white mb-2">Access Code</h3>
                    <p className="text-sm text-white/40 mb-6 leading-relaxed">
                      Have a 12-character code? Enter it to unlock a subscription tier instantly.
                    </p>
                    <button
                      onClick={() => { if (onRedeem) onRedeem(); else toast.info("Use the REDEEM button in your profile."); }}
                      className="flex items-center gap-2.5 px-6 py-3.5 bg-[#D97757] text-[#1a1a1a] rounded-xl font-bold text-sm hover:bg-white transition-all shadow-lg shadow-[#D97757]/20"
                    >
                      <Zap size={16} className="fill-night" />
                      Redeem Code
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm p-6 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">Plan Tiers</p>
                  {[
                    { tier: 'Free',     tokens: '0',   price: 'Free',  color: 'text-black/40' },
                    { tier: 'Standard', tokens: '20',  price: '$5/mo', color: 'text-blue-500' },
                    { tier: 'Premium',  tokens: '100', price: '$10/mo',color: 'text-[#D97757]' },
                    { tier: 'Ultimate', tokens: '500', price: '$20/mo',color: 'text-purple-500' },
                  ].map(({ tier, tokens, price, color }) => (
                    <div key={tier} className="flex items-center justify-between py-3 border-b border-black/[0.05] last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-2 h-2 rounded-full bg-current", color)} />
                        <span className="text-sm font-semibold">{tier}</span>
                      </div>
                      <div className="flex items-center gap-6 text-xs text-black/40">
                        <span><span className="font-bold text-black/60">{tokens}</span> tokens/mo</span>
                        <span className={cn("font-bold", color)}>{price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
