import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, linkWithCredential, EmailAuthProvider, User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, LogIn, UserPlus, Loader2, X, FileText, Eye, EyeOff } from 'lucide-react';
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
  const [showLegal, setShowLegal] = useState<{ show: boolean; type: 'terms' | 'privacy' }>({ show: false, type: 'terms' });
  const [pendingGoogleUser, setPendingGoogleUser] = useState<User | null>(null);
  const [googlePassword, setGooglePassword] = useState('');
  const [showGooglePw, setShowGooglePw] = useState(false);
  const [savingGooglePw, setSavingGooglePw] = useState(false);
  const [legalContent, setLegalContent] = useState({ terms: '', privacy: '' });

  useEffect(() => {
    const fetchLegal = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setLegalContent({
            terms: data.termsOfConditions || 'Welcome to StoryCraft. By using our service, you agree to craft responsibly.',
            privacy: data.privacyPolicy || 'Your privacy is important to us. We protect your data with precision.',
          });
        } else {
          setLegalContent({
            terms: 'Welcome to StoryCraft. By using our service, you agree to craft responsibly.',
            privacy: 'Your privacy is important to us. We protect your data with precision.',
          });
        }
      } catch {
        setLegalContent({
          terms: 'Welcome to StoryCraft. By using our service, you agree to craft responsibly.',
          privacy: 'Your privacy is important to us.',
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
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid, email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
            role: user.email === 'alaa.abukhamseen@gmail.com' ? 'headadmin' : 'user',
            subscriptionTier: 'free', subscriptionStatus: 'active',
            subscriptionCycle: 'none', streak: 0, tokens: 5,
            authProvider: 'google', createdAt: Date.now(),
          });
          setPendingGoogleUser(user);
        }
      } catch (err) {
        console.warn('Profile write failed in Auth (will be retried):', err);
      }
      toast.success('Welcome to ' + appName + '!');
    } catch (error: any) {
      const msgs: Record<string, string> = {
        'auth/popup-closed-by-user': 'Sign-in was cancelled.',
        'auth/cancelled-popup-request': 'Sign-in was cancelled.',
        'auth/popup-blocked': 'Popup was blocked. Please allow popups for this site.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/too-many-requests': 'Too many attempts. Please wait a moment.',
        'auth/user-disabled': 'This account has been disabled.',
      };
      toast.error(msgs[error?.code] ?? 'Google sign-in failed. Please try again.');
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
            uid: user.uid, email: user.email,
            displayName: email.split('@')[0],
            role: email === 'alaa.abukhamseen@gmail.com' ? 'headadmin' : 'user',
            subscriptionTier: 'free', subscriptionStatus: 'active',
            subscriptionCycle: 'none', streak: 0, tokens: 5,
            authProvider: 'email', createdAt: Date.now(),
          });
        } catch (err) {
          console.warn('Profile write failed in Auth:', err);
        }
        toast.success('Account created! Setting up your studio...');
      }
    } catch (error: any) {
      const msgs: Record<string, string> = {
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
      toast.error(msgs[error?.code] ?? 'Something went wrong. Please try again.');
      if (error?.code === 'auth/email-already-in-use') setIsLogin(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSetGooglePassword = async () => {
    if (!pendingGoogleUser || !googlePassword) return;
    if (googlePassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSavingGooglePw(true);
    try {
      const cred = EmailAuthProvider.credential(pendingGoogleUser.email!, googlePassword);
      await linkWithCredential(pendingGoogleUser, cred);
      toast.success('Password set! You can now sign in with email & password too.');
      setPendingGoogleUser(null);
      setGooglePassword('');
    } catch (err: any) {
      if (err?.code === 'auth/provider-already-linked' || err?.code === 'auth/email-already-in-use') {
        setPendingGoogleUser(null);
      } else {
        toast.error(err?.message || 'Failed to set password. You can set it later in Account Settings.');
      }
    } finally {
      setSavingGooglePw(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#1a1a1a] overflow-hidden">

      {/* ── Left Pane: Branding ── */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative border-r border-white/[0.06] overflow-hidden bg-[#111111]">
        {/* Subtle glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(217,119,87,0.08) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 right-0 w-60 h-60 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(217,119,87,0.05) 0%, transparent 70%)' }} />
        </div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex items-center gap-3"
        >
          <div className="w-9 h-9 bg-[#D97757] rounded-xl flex items-center justify-center text-white overflow-hidden shadow-lg shadow-[#D97757]/20">
            {appIcon?.startsWith('http') ? (
              <img src={appIcon} className="w-full h-full object-cover" alt="icon" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : appIcon ? (
              <span className="text-base">{appIcon}</span>
            ) : (
              <Sparkles size={18} />
            )}
          </div>
          <div>
            <span className="block font-semibold text-[15px] text-white">{appName}</span>
            <span className="text-[10px] font-medium text-white/30 tracking-wide">Creative Studio</span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative z-10 flex-1 flex flex-col justify-center py-10"
        >
          <h1 className="text-[52px] font-bold leading-[1.02] tracking-[-0.03em] mb-5 text-white">
            Write stories<br />
            <span className="text-[#D97757]">powered by AI.</span>
          </h1>
          <p className="text-white/35 max-w-[320px] text-[14px] leading-relaxed mb-10">
            The creative studio for authors and storytellers. Write, illustrate, and publish with AI or your own imagination.
          </p>

          {/* Feature list */}
          <div className="space-y-3">
            {[
              'Generate full stories with a single prompt',
              '50+ visual art styles to choose from',
              'Collaborate with co-authors in real time',
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-5 h-5 rounded-full bg-[#D97757]/15 border border-[#D97757]/25 flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D97757]" />
                </div>
                <span className="text-[13px] text-white/50">{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="relative z-10 flex gap-7 pt-6 border-t border-white/[0.06]"
        >
          {[{ val: '10k+', label: 'Stories' }, { val: '50+', label: 'Styles' }, { val: '4.9★', label: 'Rating' }].map(s => (
            <div key={s.label}>
              <div className="text-[18px] font-bold text-white">{s.val}</div>
              <div className="text-[10px] text-white/25 mt-0.5 font-medium">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Right Pane: Form ── */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-[#1a1a1a] relative">
        {/* Subtle accent glow */}
        <div className="absolute top-0 right-0 w-96 h-96 translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(217,119,87,0.04) 0%, transparent 70%)' }} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[400px] relative z-10"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8 justify-center">
            <div className="w-8 h-8 bg-[#D97757] rounded-lg flex items-center justify-center text-white overflow-hidden">
              {appIcon?.startsWith('http') ? (
                <img src={appIcon} className="w-full h-full object-cover" alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : appIcon ? <span>{appIcon}</span> : <Sparkles size={15} />}
            </div>
            <span className="font-semibold text-[15px] text-white">{appName}</span>
          </div>

          {/* Header */}
          <div className="mb-7">
            <h2 className="text-[26px] font-bold text-white tracking-tight">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-white/40 text-[13px] mt-1.5">
              {isLogin ? 'Sign in to continue to your studio' : 'Start crafting — 5 free tokens on signup'}
            </p>
          </div>

          {/* Google sign-in */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#212121] hover:bg-[#252525] border border-white/[0.08] hover:border-white/[0.14] text-white/80 hover:text-white font-medium text-[13px] rounded-xl transition-all mb-5 disabled:opacity-50"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-[11px] text-white/25 bg-[#1a1a1a]">or</span>
            </div>
          </div>

          {/* Tab toggle */}
          <div className="flex bg-white/[0.04] border border-white/[0.07] rounded-xl p-1 mb-5">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${
                isLogin
                  ? 'bg-[#D97757] text-white shadow-md shadow-[#D97757]/20'
                  : 'text-white/40 hover:text-white/65'
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${
                !isLogin
                  ? 'bg-[#D97757] text-white shadow-md shadow-[#D97757]/20'
                  : 'text-white/40 hover:text-white/65'
              }`}
            >
              Sign up
            </button>
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? 'login' : 'signup'}
              initial={{ opacity: 0, x: isLogin ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 10 : -10 }}
              transition={{ duration: 0.18 }}
              onSubmit={handleEmailAuth}
              className="space-y-3.5"
            >
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-white/45 uppercase tracking-widest">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[#212121] border border-white/[0.08] focus:border-[#D97757]/50 focus:bg-[#212121] rounded-xl px-4 py-3 outline-none transition-all text-[14px] text-white placeholder:text-white/20 shadow-sm"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-white/45 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-[#212121] border border-white/[0.08] focus:border-[#D97757]/50 rounded-xl px-4 py-3 pr-11 outline-none transition-all text-[14px] text-white placeholder:text-white/20 shadow-sm"
                    placeholder="••••••••"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#D97757] hover:bg-[#C86A48] text-white font-semibold text-[14px] rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-[#D97757]/20 mt-1"
              >
                {loading
                  ? <Loader2 className="animate-spin" size={17} />
                  : isLogin ? <LogIn size={17} /> : <UserPlus size={17} />}
                <span>{isLogin ? 'Sign in' : 'Create account'}</span>
              </button>
            </motion.form>
          </AnimatePresence>

          <p className="text-center text-[11px] text-white/20 mt-5 leading-relaxed">
            By continuing you accept our{' '}
            <button onClick={() => setShowLegal({ show: true, type: 'terms' })} className="text-[#D97757]/60 hover:text-[#D97757] transition-colors underline underline-offset-2">
              Terms
            </button>
            {' & '}
            <button onClick={() => setShowLegal({ show: true, type: 'privacy' })} className="text-[#D97757]/60 hover:text-[#D97757] transition-colors underline underline-offset-2">
              Privacy
            </button>
          </p>
        </motion.div>
      </div>

      {/* ── Set Password Modal ── */}
      <AnimatePresence>
        {pendingGoogleUser && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-sm bg-[#212121] border border-white/[0.09] rounded-2xl p-7 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-[#D97757]/10 border border-[#D97757]/20 rounded-xl flex items-center justify-center text-[#D97757]">
                  🔐
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-white">Set a password</h3>
                  <p className="text-[11px] text-white/35 mt-0.5">Secure your account with email login too</p>
                </div>
              </div>

              <p className="text-[13px] text-white/45 mb-5 leading-relaxed">
                You signed in with Google. Optionally set a password so you can also sign in with{' '}
                <span className="text-[#D97757]/80">{pendingGoogleUser.email}</span>.
              </p>

              <div className="space-y-3">
                <div className="relative">
                  <input
                    autoFocus
                    type={showGooglePw ? 'text' : 'password'}
                    value={googlePassword}
                    onChange={e => setGooglePassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSetGooglePassword()}
                    className="w-full bg-white/[0.05] border border-white/[0.09] focus:border-[#D97757]/40 rounded-xl px-4 py-3 pr-11 outline-none text-white/90 placeholder:text-white/20 text-[14px] transition-all"
                    placeholder="Choose a password (min. 6 chars)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGooglePw(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                  >
                    {showGooglePw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <button
                  onClick={handleSetGooglePassword}
                  disabled={savingGooglePw || googlePassword.length < 6}
                  className="w-full py-3 bg-[#D97757] hover:bg-[#C86A48] text-white font-semibold text-[13px] rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 transition-colors"
                >
                  {savingGooglePw && <Loader2 size={15} className="animate-spin" />}
                  Set password & continue
                </button>

                <button
                  onClick={() => { setPendingGoogleUser(null); setGooglePassword(''); }}
                  className="w-full py-2.5 rounded-xl text-[12px] font-medium text-white/30 hover:text-white/55 hover:bg-white/[0.04] transition-all"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Legal Modal ── */}
      <AnimatePresence>
        {showLegal.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowLegal({ ...showLegal, show: false })}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-xl bg-[#212121] border border-white/[0.09] rounded-2xl p-8 shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#D97757]/10 text-[#D97757] flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-white">
                      {showLegal.type === 'terms' ? 'Terms of Conditions' : 'Privacy Policy'}
                    </h3>
                    <p className="text-[10px] text-white/35 font-medium uppercase tracking-wide">Please read carefully</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLegal({ ...showLegal, show: false })}
                  className="p-2 hover:bg-white/[0.06] rounded-lg transition-all text-white/35 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="text-white/50 text-[13px] leading-relaxed whitespace-pre-wrap">
                  {showLegal.type === 'terms' ? legalContent.terms : legalContent.privacy}
                </div>
              </div>
              <button
                onClick={() => setShowLegal({ ...showLegal, show: false })}
                className="mt-6 w-full py-3 bg-[#D97757] hover:bg-[#C86A48] text-white font-semibold text-[14px] rounded-xl transition-colors"
              >
                I understand
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
