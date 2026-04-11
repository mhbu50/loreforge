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

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 luxury-bg overflow-hidden">

      {/* ── Left Pane: Branding ── */}
      <div className="hidden lg:flex flex-col justify-between p-16 relative border-r border-white/5 overflow-hidden">
        <div className="atmosphere" />

        {/* Background decorative circles */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full border border-gold/5" />
          <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full border border-gold/10" />
          <div className="absolute bottom-32 right-8 w-80 h-80 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-4 mb-16">
            <div className="w-14 h-14 bg-gold rounded-2xl flex items-center justify-center text-night shadow-lg shadow-gold/30 overflow-hidden">
              {appIcon?.startsWith('http') ? (
                <img src={appIcon} className="w-full h-full object-cover" alt="icon" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : appIcon ? (
                <span className="text-2xl">{appIcon}</span>
              ) : (
                <Sparkles size={28} />
              )}
            </div>
            <div>
              <span className="block font-serif text-xl font-bold text-white">{appName}</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-gold/50">Creative Studio</span>
            </div>
          </div>

          <h1 className="text-6xl font-serif font-light leading-[1.05] mb-8 tracking-tighter">
            Craft <br />
            <span className="italic font-bold" style={{
              background: 'linear-gradient(135deg, #d4af37, #f0d060)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Eternal</span> <br />
            Tales.
          </h1>

          <p className="text-white/35 max-w-xs text-base leading-relaxed font-light">
            The world's most immersive story studio.
            Write, illustrate, and publish your masterpieces.
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative z-10 flex gap-10"
        >
          {[{ val: '10k+', label: 'Stories Crafted' }, { val: '50+', label: 'Art Styles' }, { val: '4.9★', label: 'Rating' }].map(s => (
            <div key={s.label}>
              <div className="text-2xl font-serif font-bold text-gold">{s.val}</div>
              <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/25 mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Right Pane: Form ── */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-night relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 right-0 w-96 h-96 translate-x-1/2 translate-y-1/2 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Card */}
          <div className="bg-white/[0.03] border border-white/8 rounded-[2rem] p-8 lg:p-10 shadow-2xl"
            style={{ boxShadow: '0 0 0 1px rgba(212,175,55,0.08), 0 32px 64px -16px rgba(0,0,0,0.6)' }}>

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
            <div className="flex bg-white/5 rounded-2xl p-1 mb-8">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${isLogin ? 'bg-gold text-night shadow-lg' : 'text-white/40 hover:text-white/70'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${!isLogin ? 'bg-gold text-night shadow-lg' : 'text-white/40 hover:text-white/70'}`}
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
                  <p className="text-white/35 text-xs mt-1">
                    {isLogin ? 'Enter your credentials to continue your journey' : 'Start crafting your tales today'}
                  </p>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3.5 outline-none focus:border-gold/50 focus:bg-gold/5 transition-all text-sm text-white placeholder:text-white/20"
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-3.5 pr-12 outline-none focus:border-gold/50 focus:bg-gold/5 transition-all text-sm text-white placeholder:text-white/20"
                        placeholder="••••••••"
                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all mt-2"
                    style={{ background: 'linear-gradient(135deg, #d4af37, #b8860b)', color: '#0a0a0a', boxShadow: '0 8px 24px -4px rgba(212,175,55,0.35)' }}
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
                <div className="w-full border-t border-white/6" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-transparent text-[10px] uppercase tracking-widest text-white/20">or</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/8 text-white/80 hover:text-white font-medium py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 text-sm"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              <span>Continue with Google</span>
            </button>

            <p className="text-center text-[10px] text-white/15 mt-6 leading-relaxed uppercase tracking-wider">
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
