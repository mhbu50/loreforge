import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, LogIn, UserPlus, Loader2, X, FileText, Eye, EyeOff, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

interface AuthProps {
  globalSettings?: any;
}

export default function Auth({ globalSettings }: AuthProps) {
  const appName = globalSettings?.appName || 'StoryCraft';
  const appIcon = globalSettings?.appIcon || '';

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLegal, setShowLegal] = useState<{ show: boolean, type: 'terms' | 'privacy' }>({ show: false, type: 'terms' });
  const [legalContent, setLegalContent] = useState({ terms: '', privacy: '' });

  useEffect(() => {
    const fetchLegal = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setLegalContent({
            terms: data.termsOfConditions || 'Welcome to StoryCraft. By using our service, you agree to craft responsibly.',
            privacy: data.privacyPolicy || 'Your privacy is important to us. We protect your data with cinematic precision.'
          });
        } else {
          setLegalContent({
            terms: 'Welcome to StoryCraft. By using our service, you agree to craft responsibly and respect the creative rights of others.',
            privacy: 'Your privacy is important to us. We protect your data with cinematic precision.'
          });
        }
      } catch {
        setLegalContent({
          terms: 'Welcome to StoryCraft. By using our service, you agree to craft responsibly.',
          privacy: 'Your privacy is important to us.'
        });
      }
    };
    fetchLegal();
  }, []);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // Best-effort — App.tsx self-heals if this write fails
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
            role: user.email === 'alaa.abukhamseen@gmail.com' ? 'headadmin' : 'user',
            subscriptionTier: 'free',
            subscriptionStatus: 'active',
            subscriptionCycle: 'none',
            streak: 0,
            tokens: 5,
            createdAt: Date.now(),
          });
        }
      } catch (err) {
        console.warn('Profile write failed in Auth (will be retried):', err);
      }
      toast.success('Welcome to ' + appName + '!');
    } catch (error: any) {
      const friendlyMessages: Record<string, string> = {
        'auth/popup-closed-by-user': 'Sign-in was cancelled.',
        'auth/cancelled-popup-request': 'Sign-in was cancelled.',
        'auth/popup-blocked': 'Popup was blocked. Please allow popups for this site.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
        'auth/user-disabled': 'This account has been disabled.',
      };
      toast.error(friendlyMessages[error?.code] ?? 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');
    try {
      setLoading(true);
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Welcome back!');
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: email.split('@')[0],
            role: email === 'alaa.abukhamseen@gmail.com' ? 'headadmin' : 'user',
            subscriptionTier: 'free',
            subscriptionStatus: 'active',
            subscriptionCycle: 'none',
            streak: 0,
            tokens: 5,
            createdAt: Date.now(),
          });
        } catch (err) {
          console.warn('Profile write failed in Auth (will be retried):', err);
        }
        toast.success('Account created! Setting up your studio...');
      }
    } catch (error: any) {
      const friendlyMessages: Record<string, string> = {
        'auth/email-already-in-use': 'This email is already registered. Try signing in.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-credential': 'Incorrect email or password.',
        'auth/too-many-requests': 'Too many attempts. Please wait a moment.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/user-disabled': 'This account has been disabled.',
      };
      toast.error(friendlyMessages[error?.code] ?? 'Something went wrong. Please try again.');
      if (error?.code === 'auth/email-already-in-use') setIsLogin(true);
    } finally {
      setLoading(false);
    }
  };

  const floatingCards = [
    { title: 'The Obsidian Citadel', genre: 'Fantasy', pages: 12, color: 'from-purple-900/60 to-indigo-900/40' },
    { title: 'Neon Horizons', genre: 'Sci-Fi', pages: 8, color: 'from-cyan-900/60 to-blue-900/40' },
    { title: 'The Silver Fox', genre: 'Mystery', pages: 15, color: 'from-amber-900/60 to-orange-900/40' },
  ];

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 luxury-bg overflow-hidden">

      {/* ── Left Pane: Branding ── */}
      <div className="hidden lg:flex flex-col justify-between p-14 relative border-r border-white/5 overflow-hidden bg-[#060606]">
        <div className="atmosphere" />

        {/* Background layers */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.015]" style={{backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '60px 60px'}} />
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full" style={{background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)'}} />
          <div className="absolute bottom-0 right-0 w-96 h-96" style={{background: 'radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)'}} />
        </div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-gold rounded-2xl flex items-center justify-center text-night shadow-lg shadow-gold/30 overflow-hidden">
            {appIcon?.startsWith('http') ? (
              <img src={appIcon} className="w-full h-full object-cover" alt="icon" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : appIcon ? (
              <span className="text-xl">{appIcon}</span>
            ) : (
              <Sparkles size={22} />
            )}
          </div>
          <div>
            <span className="block font-serif text-lg font-bold text-white">{appName}</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-gold/50">Creative Studio</span>
          </div>
        </motion.div>

        {/* Center content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="relative z-10 flex-1 flex flex-col justify-center py-12"
        >
          <h1 className="text-[4.5rem] font-serif font-light leading-[0.95] mb-6 tracking-tighter">
            Craft <br />
            <span className="italic font-bold text-gradient-gold">Eternal</span> <br />
            Tales.
          </h1>
          <p className="text-white/30 max-w-sm text-sm leading-relaxed font-light mb-12">
            The world's most immersive story studio. Write, illustrate, and publish your masterpieces with AI.
          </p>

          {/* Floating story cards */}
          <div className="relative h-48">
            {floatingCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, x: -20 + i * 10, y: 20 }}
                animate={{ opacity: 1, x: i * 24, y: i * 16 }}
                transition={{ duration: 0.8, delay: 0.3 + i * 0.15 }}
                className={`absolute bg-gradient-to-br ${card.color} border border-white/10 rounded-2xl px-5 py-4 shadow-2xl backdrop-blur-sm`}
                style={{ width: 220, zIndex: 3 - i }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gold/70">{card.genre}</span>
                  <span className="text-[9px] text-white/30">{card.pages} pages</span>
                </div>
                <div className="text-white font-serif font-bold text-sm leading-snug">{card.title}</div>
                <div className="mt-3 flex gap-1">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gold/60 rounded-full" style={{width: `${[80, 60, 40][j]}%`}} />
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative z-10 flex gap-8 pt-6 border-t border-white/5"
        >
          {[{ val: '10k+', label: 'Stories Crafted' }, { val: '50+', label: 'Art Styles' }, { val: '4.9★', label: 'Rating' }].map(s => (
            <div key={s.label}>
              <div className="text-xl font-serif font-bold text-gold">{s.val}</div>
              <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/20 mt-0.5">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Right Pane: Form ── */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-night relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.03) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 right-0 w-96 h-96 translate-x-1/2 translate-y-1/2 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%)' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Card */}
          <div className="relative bg-white/[0.03] rounded-[2rem] p-8 lg:p-10 shadow-2xl overflow-hidden"
            style={{ boxShadow: '0 0 0 1px rgba(212,175,55,0.12), 0 32px 64px -16px rgba(0,0,0,0.7)' }}>
            {/* Gold top accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1.5px] bg-gradient-to-r from-transparent via-gold/60 to-transparent rounded-full" />

            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
              <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center text-night overflow-hidden">
                {appIcon?.startsWith('http') ? (
                  <img src={appIcon} className="w-full h-full object-cover" alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : appIcon ? <span className="text-lg">{appIcon}</span> : <Sparkles size={18} />}
              </div>
              <span className="font-serif text-lg font-bold text-gold">{appName}</span>
            </div>

            {/* Tab toggle */}
            <div className="flex bg-white/[0.04] border border-white/[0.06] rounded-2xl p-1 mb-8">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${isLogin ? 'bg-gold text-night shadow-lg shadow-gold/20' : 'text-white/35 hover:text-white/60'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${!isLogin ? 'bg-gold text-night shadow-lg shadow-gold/20' : 'text-white/35 hover:text-white/60'}`}
              >
                Sign Up
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login' : 'signup'}
                initial={{ opacity: 0, x: isLogin ? -12 : 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isLogin ? 12 : -12 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-serif font-bold text-white">
                    {isLogin ? 'Welcome back' : 'Create account'}
                  </h2>
                  <p className="text-white/30 text-xs mt-1.5">
                    {isLogin ? 'Enter your credentials to continue your journey' : 'Start crafting your tales today · 5 free tokens'}
                  </p>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3.5 outline-none focus:border-gold/40 focus:bg-gold/[0.04] transition-all text-sm text-white placeholder:text-white/15 shadow-sm"
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3.5 pr-12 outline-none focus:border-gold/40 focus:bg-gold/[0.04] transition-all text-sm text-white placeholder:text-white/15 shadow-sm"
                        placeholder="••••••••"
                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all mt-2 shadow-lg shadow-gold/25 hover:shadow-gold/40"
                    style={{ background: 'linear-gradient(135deg, #d4af37, #b8860b)', color: '#0a0a0a' }}
                  >
                    {loading
                      ? <Loader2 className="animate-spin" size={18} />
                      : isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  </button>
                </form>
              </motion.div>
            </AnimatePresence>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-[10px] uppercase tracking-widest text-white/15 bg-night">or</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 hover:text-white font-medium py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 text-sm"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              <span>Continue with Google</span>
            </button>

            <p className="text-center text-[10px] text-white/12 mt-6 leading-relaxed uppercase tracking-wider">
              By continuing you accept our{' '}
              <button onClick={() => setShowLegal({ show: true, type: 'terms' })} className="text-gold/40 hover:text-gold transition-colors underline underline-offset-2">
                Terms
              </button>
              {' & '}
              <button onClick={() => setShowLegal({ show: true, type: 'privacy' })} className="text-gold/40 hover:text-gold transition-colors underline underline-offset-2">
                Privacy
              </button>
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Legal Modal ── */}
      <AnimatePresence>
        {showLegal.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowLegal({ ...showLegal, show: false })}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-night border border-white/10 rounded-[2.5rem] p-10 shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gold/10 text-gold flex items-center justify-center">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-white">
                      {showLegal.type === 'terms' ? 'Terms of Conditions' : 'Privacy Policy'}
                    </h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Please read carefully</p>
                  </div>
                </div>
                <button onClick={() => setShowLegal({ ...showLegal, show: false })} className="p-2 hover:bg-white/5 rounded-xl transition-all text-white/40 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap font-light">
                  {showLegal.type === 'terms' ? legalContent.terms : legalContent.privacy}
                </div>
              </div>
              <button
                onClick={() => setShowLegal({ ...showLegal, show: false })}
                className="mt-8 w-full py-4 bg-gold text-night font-bold rounded-xl hover:bg-gold/90 transition-all"
              >
                I Understand
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
