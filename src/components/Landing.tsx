import React, {
  useState, useEffect, useRef, useCallback, lazy, Suspense
} from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Check, Star, BookOpen, ChevronRight } from 'lucide-react';
import CountUp from 'react-countup';

// ─── Lazy-load heavy components ───────────────────────────────
const HeroCanvas    = lazy(() => import('./landing/HeroCanvas'));
const ScrollNebula  = lazy(() => import('./landing/ScrollNebula'));
const BentoSection  = lazy(() => import('./landing/BentoSection'));
const StoryAssembler= lazy(() => import('./landing/StoryAssembler'));

// ─── Global font/theme constants ─────────────────────────────
const FD   = "'Cabinet Grotesk','Space Grotesk',system-ui,sans-serif";
const FB   = "'Satoshi','Inter',system-ui,sans-serif";
const C = {
  bg:     '#0B0E1A', bg2:    '#131832',
  coral:  '#FF4D6D', gold:   '#FFB347',
  cyan:   '#00F5FF', purple: '#B347EA',
  text:   '#FFFFFF', muted:  '#A5B4FC', subtle: '#6472a4',
  card:   'rgba(19,24,50,0.78)',
  border: 'rgba(165,180,252,0.11)',
  grad1:  'linear-gradient(135deg,#FF4D6D,#FFB347)',
  grad2:  'linear-gradient(135deg,#00F5FF,#B347EA)',
};

interface LandingProps { globalSettings?: any }

// ═══════════════════════════════════════════════════════════════
// PAGE LOADER
// ═══════════════════════════════════════════════════════════════
function PageLoader({ onDone }: { onDone: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), 1800);
    const t2 = setTimeout(() => onDone(), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div className={`cosmic-loader${exiting ? ' loader-exiting' : ''}`}
      aria-live="polite" aria-label="Loading Plotcore">
      {/* Animated quill SVG */}
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
        <path className="quill-path"
          d="M 60 8 Q 48 16 36 28 Q 24 40 18 56 Q 26 48 36 44 Q 46 40 50 36 Q 56 28 60 8 Z"
          stroke="url(#qGrad)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path className="quill-path"
          d="M 36 44 L 24 64" stroke="#6472a4" strokeWidth="1.5" strokeLinecap="round"
          style={{ animationDelay: '0.8s' }} />
        <defs>
          <linearGradient id="qGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#FF4D6D" />
            <stop offset="50%"  stopColor="#FFB347" />
            <stop offset="100%" stopColor="#00F5FF" />
          </linearGradient>
        </defs>
      </svg>

      {/* Logo text */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        style={{ fontFamily: FD, fontSize: 28, fontWeight: 800, color: '#fff',
          letterSpacing: '-0.02em' }}>
        Plotcore
        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
          background: C.coral, marginLeft: 4, verticalAlign: 'super', fontSize: 12,
          boxShadow: `0 0 12px ${C.coral}` }} />
      </motion.div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
        style={{ fontSize: 12, color: C.subtle, fontFamily: FB,
          textTransform: 'uppercase', letterSpacing: '0.2em' }}>
        The Creative Universe
      </motion.p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CUSTOM CURSOR
// ═══════════════════════════════════════════════════════════════
function CustomCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef  = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const expanded = useRef(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };
    const onEnter = (e: MouseEvent) => {
      const el = e.target as Element;
      const interactive = el.closest('a,button,[role="button"],input,textarea,select,[tabindex]');
      if (interactive && !expanded.current) {
        expanded.current = true;
        ringRef.current?.classList.add('expanded');
      }
    };
    const onLeave = () => {
      expanded.current = false;
      ringRef.current?.classList.remove('expanded');
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onEnter);
    document.addEventListener('mouseout', onLeave);

    let rafId: number;
    const tick = () => {
      // Dot follows immediately
      if (dotRef.current) {
        dotRef.current.style.left = `${pos.current.x}px`;
        dotRef.current.style.top  = `${pos.current.y}px`;
      }
      // Ring follows with lerp
      ring.current.x += (pos.current.x - ring.current.x) * 0.12;
      ring.current.y += (pos.current.y - ring.current.y) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.left = `${ring.current.x}px`;
        ringRef.current.style.top  = `${ring.current.y}px`;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onEnter);
      document.removeEventListener('mouseout', onLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Hide on mobile/touch
  if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) return null;

  return (
    <>
      <div ref={ringRef} className="cosmic-cursor" aria-hidden="true" />
      <div ref={dotRef}  className="cosmic-cursor-dot" aria-hidden="true" />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// STICKY NAV
// ═══════════════════════════════════════════════════════════════
function Nav({ appName, appIcon }: { appName: string; appIcon: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav role="navigation" aria-label="Main navigation"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0.75rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(11,14,26,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent',
        transition: 'all 0.35s ease',
      }}>
      {/* Logo */}
      <a href="#" className="no-underline" aria-label={`${appName} home`}
        style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: C.grad1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 16px rgba(255,77,109,0.5)`, color: '#000',
          overflow: 'hidden', flexShrink: 0,
        }}>
          {appIcon?.startsWith('http')
            ? <img src={appIcon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Sparkles size={14} aria-hidden="true" />
          }
        </div>
        <span style={{ fontFamily: FD, fontSize: 17, fontWeight: 800, color: '#fff',
          letterSpacing: '-0.01em' }}>
          {appName}
        </span>
      </a>

      {/* Links */}
      <div className="hidden md:flex" style={{ gap: '2rem', alignItems: 'center' }}>
        {[['Story','#features'],['Design','#design'],['Forge','#forge'],['Pricing','#pricing']].map(([label, href]) => (
          <a key={label} href={href} className="no-underline"
            style={{ fontSize: 13, fontWeight: 600, color: C.subtle, transition: 'color 0.2s',
              textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: FB }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = C.subtle)}>
            {label}
          </a>
        ))}
      </div>

      {/* CTAs */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Link to="/login" className="no-underline"
          style={{
            padding: '0.45rem 1rem', borderRadius: 8, fontSize: 12, fontWeight: 700,
            color: C.muted, border: `1px solid ${C.border}`, transition: 'all 0.2s',
            fontFamily: FB,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border.replace('0.11', '0.35'); (e.currentTarget as HTMLElement).style.color = '#fff'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.muted; }}>
          Sign in
        </Link>
        <Link to="/login" className="no-underline btn-cosmic"
          style={{
            padding: '0.5rem 1.1rem', borderRadius: 8, fontSize: 12, fontWeight: 800,
            fontFamily: FB, display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
          <Sparkles size={12} aria-hidden="true" />
          Launch Free
        </Link>
      </div>
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════
// HERO SECTION
// ═══════════════════════════════════════════════════════════════
function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const textY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const textOp= useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const canvasOp = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} aria-label="Hero"
      style={{ position: 'relative', height: '100vh', minHeight: 640, overflow: 'hidden' }}>

      {/* R3F Canvas — full hero */}
      <motion.div style={{ opacity: canvasOp, position: 'absolute', inset: 0, zIndex: 0 }}>
        <Suspense fallback={
          <div style={{ width: '100%', height: '100%',
            background: 'radial-gradient(ellipse at 50% 40%,#1a1f40 0%,#0B0E1A 70%)' }} />
        }>
          <HeroCanvas style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />
        </Suspense>
      </motion.div>

      {/* Gradient vignette bottom */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%',
        background: `linear-gradient(to top,${C.bg},transparent)`, zIndex: 1, pointerEvents: 'none' }} aria-hidden="true" />

      {/* Text overlay */}
      <motion.div style={{ y: textY, opacity: textOp,
        position: 'absolute', inset: 0, zIndex: 2,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '2rem', pointerEvents: 'none' }}>

        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '0.4rem 1.25rem', borderRadius: 999,
            background: 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.32)',
            marginBottom: '1.75rem',
          }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.coral,
            boxShadow: `0 0 10px ${C.coral}`, animation: 'comet-pulse 2s ease infinite' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.coral,
            textTransform: 'uppercase', letterSpacing: '0.18em', fontFamily: FB }}>
            The Creative Universe Awaits
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 32, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: FD, fontSize: 'clamp(46px,8vw,104px)',
            fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.04em',
            color: '#fff', marginBottom: '1.4rem', maxWidth: 900,
          }}>
          <span style={{ display: 'block' }}>Plotcore.</span>
          <span style={{
            display: 'block',
            background: C.grad1,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Write.</span>
          <span style={{
            display: 'block',
            background: C.grad2,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Design. Publish.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ fontSize: 'clamp(15px,2vw,19px)', color: C.muted, lineHeight: 1.68,
            maxWidth: 520, marginBottom: '2.5rem', fontFamily: FB }}>
          The AI studio where authors write, illustrate, and publish
          extraordinary books — without ever leaving the page.
        </motion.p>

        {/* CTAs — pointer-events back on */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center',
            pointerEvents: 'auto' }}>
          <Link to="/login" className="btn-cosmic no-underline"
            aria-label="Launch your universe for free"
            style={{
              padding: '0.9rem 2.2rem', borderRadius: 12, fontSize: 15, fontWeight: 800,
              fontFamily: FD, display: 'inline-flex', alignItems: 'center', gap: 10,
            }}>
            <BookOpen size={16} aria-hidden="true" />
            Launch Your Universe — Free
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <Link to="/marketplace" className="btn-cosmic-ghost no-underline"
            style={{
              padding: '0.9rem 2rem', borderRadius: 12, fontSize: 14, fontWeight: 700,
              fontFamily: FD, display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
            <BookOpen size={14} aria-hidden="true" />
            Explore Stories
          </Link>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}
          style={{
            display: 'flex', gap: '2.5rem', marginTop: '2.5rem',
            borderTop: `1px solid ${C.border}`, paddingTop: '1.5rem',
            pointerEvents: 'none',
          }}
          role="list" aria-label="Key statistics">
          {[
            { val: '15k+', label: 'Stories' },
            { val: '62',   label: 'Art Styles' },
            { val: '4.9★', label: 'Rating' },
          ].map(s => (
            <div key={s.label} role="listitem" style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: FD, fontSize: 22, fontWeight: 800, color: C.coral,
                textShadow: `0 0 16px ${C.coral}80` }}>{s.val}</div>
              <div style={{ fontSize: 10, color: C.subtle, textTransform: 'uppercase',
                letterSpacing: '0.12em', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
        style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          zIndex: 3, textAlign: 'center', color: C.subtle, fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '0.18em', fontFamily: FB }}>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
          ↓ Scroll to explore
        </motion.div>
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// SOCIAL PROOF — 3D flip stat counters + testimonials
// ═══════════════════════════════════════════════════════════════
const TESTIMONIALS = [
  { name: 'Sofia K.',    role: 'Fantasy Author',   text: 'I never thought I could finish my novel until I found Plotcore. The AI feels like a real co-writer — it knows my characters better than I do after chapter three.', avatar: 'S', color: '#FF4D6D' },
  { name: 'Kenji M.',    role: 'Manga Creator',    text: 'Published my first manga series in a week. The anime art style is insanely good. My readers genuinely thought I had hired an illustrator.', avatar: 'K', color: '#00F5FF' },
  { name: 'Dr. R. Patel',role: 'Non-Fiction Author', text: 'I wrote a 90-page illustrated science book for kids. The watercolor illustrations matched my descriptions perfectly. Plotcore is the future of publishing.', avatar: 'R', color: '#B347EA' },
];

function SocialProof() {
  const statsRef = useRef<HTMLDivElement>(null);

  return (
    <section id="community-proof" style={{ padding: '7rem 2rem', background: `linear-gradient(to bottom,${C.bg2},${C.bg})` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Heading */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '0.4rem 1.25rem', borderRadius: 999,
            background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.25)',
            marginBottom: '1.25rem' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.coral,
              textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: FB }}>
              Social Proof
            </span>
          </div>
          <h2 style={{ fontFamily: FD, fontSize: 'clamp(32px,4.5vw,52px)', fontWeight: 800,
            color: '#fff', lineHeight: 1.06, letterSpacing: '-0.025em' }}>
            Creators who{' '}
            <span style={{ background: C.grad1, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              already launched
            </span>
          </h2>
        </motion.div>

        {/* 3D flip stats */}
        <div ref={statsRef}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: '4rem' }}>
          {[
            { end: 15000, suffix: '+', label: 'Stories Created',  dec: 0, color: C.coral  },
            { end: 62,    suffix: '',  label: 'Art Styles',        dec: 0, color: C.cyan   },
            { end: 4.9,   suffix: '★', label: 'Average Rating',   dec: 1, color: C.gold   },
            { end: 128,   suffix: '+', label: 'Countries',         dec: 0, color: C.purple },
          ].map((stat, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              style={{
                padding: '1.75rem 1rem', borderRadius: 20, textAlign: 'center',
                background: C.card, border: `1px solid ${C.border}`,
                backdropFilter: 'blur(16px)',
              }}>
              <div className="stat-flip" style={{
                fontFamily: FD, fontSize: 'clamp(28px,3vw,42px)', fontWeight: 800,
                color: stat.color, lineHeight: 1,
                textShadow: `0 0 24px ${stat.color}60`,
                animationDelay: `${i * 0.12}s`,
              }}>
                <CountUp end={stat.end} suffix={stat.suffix} duration={2.2}
                  decimals={stat.dec} enableScrollSpy scrollSpyOnce />
              </div>
              <div style={{ fontSize: 11, color: C.subtle, textTransform: 'uppercase',
                letterSpacing: '0.12em', marginTop: 8, fontFamily: FB }}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Testimonials with spotlight */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={i} testimonial={t} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial: t, delay }: {
  testimonial: typeof TESTIMONIALS[0]; delay: number
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [spotPos, setSpotPos] = useState({ x: 50, y: 50 });

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setSpotPos({
      x: ((e.clientX - rect.left) / rect.width)  * 100,
      y: ((e.clientY - rect.top)  / rect.height) * 100,
    });
  }, []);

  return (
    <motion.div ref={ref} onMouseMove={onMove}
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ delay, duration: 0.6 }}
      style={{
        padding: '1.75rem', borderRadius: 20, position: 'relative', overflow: 'hidden',
        background: C.card, border: `1px solid ${C.border}`,
        backdropFilter: 'blur(16px)',
      }}>
      {/* Spotlight */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(circle at ${spotPos.x}% ${spotPos.y}%, ${t.color}12 0%, transparent 55%)`,
        transition: 'background 0.15s ease',
      }} aria-hidden="true" />

      {/* 5 stars */}
      <div style={{ display: 'flex', gap: 3, marginBottom: '1rem' }} aria-label="5 stars">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={13} style={{ color: C.gold, fill: C.gold }} aria-hidden="true" />
        ))}
      </div>

      <p style={{ fontFamily: FB, fontSize: 14, color: C.muted, lineHeight: 1.72,
        marginBottom: '1.25rem', fontStyle: 'italic', position: 'relative' }}>
        "{t.text}"
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%',
          background: `${t.color}20`, border: `1.5px solid ${t.color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 800, color: t.color, fontFamily: FD }}>
          {t.avatar}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: FD }}>{t.name}</div>
          <div style={{ fontSize: 10, color: C.subtle, textTransform: 'uppercase',
            letterSpacing: '0.1em' }}>{t.role}</div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PRICING — Aurora border + token ring
// ═══════════════════════════════════════════════════════════════
const PLANS = [
  {
    name: 'The Explorer', price: 0, tokens: 5, booksBase: 1,
    color: C.muted,
    features: ['1 story total','5 pages per story','3 art styles','Manual editing only'],
    cta: 'Start Free',
  },
  {
    name: 'The Author', price: 18, tokens: 60, booksBase: 2,
    color: C.gold, aurora: true,
    features: ['10 stories / month','30 pages per story','Full AI generation','Collaboration'],
    cta: 'Start Writing',
  },
  {
    name: 'The Professional', price: 48, tokens: 200, booksBase: 6,
    color: C.purple,
    features: ['Unlimited stories','100 pages / story','All 62 art styles','Marketplace publishing'],
    cta: 'Go Pro',
  },
];

function TokenRing({ filled }: { filled: number }) {
  const r = 42, circ = 2 * Math.PI * r;
  const offset = circ * (1 - filled);
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(165,180,252,0.08)" strokeWidth="8" />
      <circle cx="50" cy="50" r={r} fill="none"
        stroke="url(#ringGrad)" strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        className="token-ring"
        transform="rotate(-90 50 50)" />
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#FF4D6D" />
          <stop offset="100%" stopColor="#FFB347" />
        </linearGradient>
      </defs>
      <text x="50" y="46" textAnchor="middle" dominantBaseline="middle"
        fill="#fff" fontSize="14" fontWeight="800" fontFamily={FD}>{Math.round(filled * 100)}%</text>
      <text x="50" y="60" textAnchor="middle" fill={C.subtle} fontSize="7"
        fontFamily={FB}>Used</text>
    </svg>
  );
}

function PricingSection() {
  const [books, setBooks] = useState(3);
  const recommended = books <= 1 ? 0 : books <= 5 ? 1 : 2;
  const ringFill = Math.min((books / 20) * 0.92 + 0.08, 0.95);

  return (
    <section id="pricing" style={{ padding: '7rem 2rem', background: C.bg2 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Heading */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '0.4rem 1.25rem', borderRadius: 999,
            background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.25)',
            marginBottom: '1.25rem' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.cyan,
              textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: FB }}>
              Pricing
            </span>
          </div>
          <h2 style={{ fontFamily: FD, fontSize: 'clamp(32px,4.5vw,52px)', fontWeight: 800,
            color: '#fff', lineHeight: 1.06, letterSpacing: '-0.025em' }}>
            Choose Your{' '}
            <span style={{ background: C.grad2, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Constellation
            </span>
          </h2>
        </motion.div>

        {/* Book estimator */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'center',
          padding: '2rem', borderRadius: 20, marginBottom: '2.5rem',
          background: C.card, border: `1px solid ${C.border}`, backdropFilter: 'blur(16px)',
        }}>
          <div>
            <label htmlFor="book-estimator"
              style={{ display: 'block', fontSize: 15, fontWeight: 700, color: '#fff',
                fontFamily: FD, marginBottom: '0.75rem' }}>
              How many illustrated books per month?
            </label>
            <input id="book-estimator" type="range" min={1} max={20} value={books}
              onChange={e => setBooks(Number(e.target.value))}
              aria-valuemin={1} aria-valuemax={20} aria-valuenow={books}
              style={{ width: '100%', accentColor: C.coral, marginBottom: '0.5rem' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.subtle, fontFamily: FB }}>
              <span>1 book</span>
              <span>{books} {books === 1 ? 'book' : 'books'} / month</span>
              <span>20 books</span>
            </div>
            <p style={{ fontSize: 12, color: C.muted, marginTop: '0.75rem', fontFamily: FB }}>
              Recommended:&nbsp;
              <span style={{ color: C.gold, fontWeight: 700 }}>{PLANS[recommended].name}</span>
              &nbsp;· ~{PLANS[recommended].tokens} tokens/mo
            </p>
          </div>
          <TokenRing filled={ringFill} />
        </div>

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {PLANS.map((plan, i) => {
            const isRec = i === recommended;
            const cardContent = (
              <div style={{
                padding: '2rem', display: 'flex', flexDirection: 'column', height: '100%',
                ...(plan.aurora ? {} : {
                  background: C.card,
                  border: isRec ? `1px solid ${plan.color}40` : `1px solid ${C.border}`,
                  borderRadius: 20,
                  backdropFilter: 'blur(16px)',
                }),
              }}>
                {isRec && (
                  <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '0.3rem 0.85rem', borderRadius: 999, fontSize: 10, fontWeight: 800,
                      background: C.grad1, color: '#000', fontFamily: FD,
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                    }}>
                      ✦ Constellation
                    </span>
                  </div>
                )}

                <p style={{ fontSize: 11, fontWeight: 700, color: C.subtle,
                  textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8, fontFamily: FB }}>
                  {plan.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontFamily: FD, fontSize: 44, fontWeight: 800,
                    color: isRec ? plan.color : '#fff', lineHeight: 1,
                    textShadow: isRec ? `0 0 28px ${plan.color}60` : 'none' }}>
                    ${plan.price}
                  </span>
                  <span style={{ fontSize: 13, color: C.subtle, fontFamily: FB }}>/month</span>
                </div>
                <p style={{ fontSize: 11, color: C.subtle, marginBottom: '1.5rem', fontFamily: FB }}>
                  {plan.tokens} tokens/mo
                </p>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', gap: 8, alignItems: 'center',
                      fontSize: 13, color: C.muted, fontFamily: FB }}>
                      <Check size={12} style={{ color: isRec ? plan.color : C.cyan, flexShrink: 0 }}
                        aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link to="/login" className={isRec ? 'btn-cosmic no-underline' : 'btn-cosmic-ghost no-underline'}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '0.8rem', borderRadius: 12, fontSize: 13, fontWeight: 800,
                    fontFamily: FD, textAlign: 'center',
                  }}>
                  {plan.cta}
                  <ChevronRight size={14} aria-hidden="true" />
                </Link>
              </div>
            );

            return (
              <motion.div key={i}
                initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.09 }}
                style={{ transform: isRec ? 'scale(1.04)' : 'scale(1)', zIndex: isRec ? 2 : 1 }}>
                {plan.aurora ? (
                  <div className="aurora-border-wrap" style={{ height: '100%' }}>
                    <div className="aurora-border-inner">{cardContent}</div>
                  </div>
                ) : cardContent}
              </motion.div>
            );
          })}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: C.subtle, marginTop: '1.5rem', fontFamily: FB }}>
          No credit card required · Cancel anytime · 5 free tokens on signup
        </p>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// FINAL CTA SECTION
// ═══════════════════════════════════════════════════════════════
function FinalCTA({ appName }: { appName: string }) {
  return (
    <section aria-label="Call to action"
      style={{ padding: '8rem 2rem', background: `radial-gradient(ellipse at 50% 40%, #1a1040 0%, ${C.bg} 70%)` }}>
      <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.8 }}>

          {/* Stars */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: '1.5rem' }}
            aria-label="5 star rating">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={20} style={{ color: C.gold, fill: C.gold }} aria-hidden="true" />
            ))}
          </div>

          <h2 style={{ fontFamily: FD, fontSize: 'clamp(38px,7vw,80px)', fontWeight: 800,
            lineHeight: 0.96, letterSpacing: '-0.04em', color: '#fff', marginBottom: '1.25rem' }}>
            Your Universe
            <br />
            <span style={{ background: C.grad1, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Awaits.
            </span>
          </h2>

          <p style={{ fontSize: 18, color: C.muted, lineHeight: 1.68, maxWidth: 480,
            margin: '0 auto 2.5rem', fontFamily: FB }}>
            Join thousands of authors who already call {appName} home.
            Your first story is free. Forever.
          </p>

          <Link to="/login" className="btn-cosmic no-underline"
            style={{
              padding: '1.1rem 3rem', borderRadius: 16, fontSize: 17, fontWeight: 800,
              fontFamily: FD, display: 'inline-flex', alignItems: 'center', gap: 12,
            }}>
            <Sparkles size={18} aria-hidden="true" />
            Launch Your Universe — Free
          </Link>

          <p style={{ fontSize: 12, color: C.subtle, marginTop: '1rem', fontFamily: FB }}>
            No credit card · Instant access · Cancel whenever
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════════════════════
function Footer({ appName }: { appName: string }) {
  return (
    <footer style={{ padding: '3rem 2rem', background: '#060810',
      borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1100, margin: '0 auto',
        display: 'flex', flexWrap: 'wrap', gap: '1.5rem',
        alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7,
            background: C.grad1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
            <Sparkles size={12} aria-hidden="true" />
          </div>
          <span style={{ fontFamily: FD, fontSize: 16, fontWeight: 800, color: '#fff' }}>{appName}</span>
        </div>

        {/* Footer nav */}
        <nav aria-label="Footer navigation" style={{ display: 'flex', gap: '1.75rem', flexWrap: 'wrap' }}>
          {['Twitter', 'Discord', 'GitHub', 'Blog'].map(s => (
            <a key={s} href="#" className="no-underline"
              style={{ fontSize: 12, fontWeight: 600, color: C.subtle,
                transition: 'color 0.2s', fontFamily: FB }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = C.subtle)}>
              {s}
            </a>
          ))}
        </nav>

        <p style={{ fontSize: 12, color: C.subtle, margin: 0, fontFamily: FB }}>
          &copy; 2026 {appName}. Made for storytellers.
        </p>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════
// ROOT LANDING COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Landing({ globalSettings }: LandingProps) {
  const appName = globalSettings?.appName || 'Plotcore';
  const appIcon = globalSettings?.appIcon || '';
  const [loaded, setLoaded] = useState(false);

  const handleLoaded = useCallback(() => setLoaded(true), []);

  return (
    <div className="cosmic-page" style={{ cursor: 'none' }}>
      {/* Custom cursor (desktop only) */}
      <CustomCursor />

      {/* Page loader */}
      <AnimatePresence>
        {!loaded && <PageLoader onDone={handleLoaded} />}
      </AnimatePresence>

      {/* Main page */}
      <AnimatePresence>
        {loaded && (
          <motion.div key="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}>

            <Nav appName={appName} appIcon={appIcon} />

            <main>
              {/* 1. Hero + R3F canvas */}
              <HeroSection />

              {/* 2. Scroll-driven story journey */}
              <Suspense fallback={
                <div style={{ height: '60vh', background: C.bg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: C.subtle }}>
                  Loading Story Journey…
                </div>
              }>
                <ScrollNebula />
              </Suspense>

              {/* 3. Bento grid */}
              <Suspense fallback={<div style={{ height: '40vh', background: C.bg }} />}>
                <BentoSection />
              </Suspense>

              {/* 4. Story Assembler DnD */}
              <Suspense fallback={<div style={{ height: '40vh', background: C.bg2 }} />}>
                <StoryAssembler />
              </Suspense>

              {/* 5. Social proof */}
              <SocialProof />

              {/* 6. Pricing */}
              <PricingSection />

              {/* 7. Final CTA */}
              <FinalCTA appName={appName} />
            </main>

            <Footer appName={appName} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
