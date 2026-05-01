import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useInView, useMotionValue, useTransform, useSpring } from 'motion/react';
import {
  Sparkles, BookOpen, Wand2, ArrowRight, Check, Feather,
  Palette, Globe, Star, ChevronRight, Zap, Languages, Edit3,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import CountUp from 'react-countup';

// ─── Atelier Theme Tokens ──────────────────────────────────────
const A = {
  bg:           '#0B1120',
  surface:      '#0F1929',
  card:         'rgba(15,23,42,0.85)',
  cardSolid:    '#0d1f3c',
  amber:        '#FBBF24',
  amberGlow:    'rgba(251,191,36,0.12)',
  amberRing:    'rgba(251,191,36,0.35)',
  teal:         '#2DD4BF',
  tealGlow:     'rgba(45,212,191,0.10)',
  text:         '#F1F5F9',
  textMuted:    '#94A3B8',
  textSubtle:   '#475569',
  border:       'rgba(255,255,255,0.06)',
  borderStrong: 'rgba(255,255,255,0.11)',
};

const FS = '"Crimson Text","Cormorant Garamond",Georgia,serif';
const FSans = '"Inter",system-ui,sans-serif';

interface LandingProps { globalSettings?: any; }

// ─── Reduced Motion helper ──────────────────────────────────────
function usePrefersReducedMotion() {
  return typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

// ═══════════════════════════════════════════════════════════════
// HERO BOOK MOCKUP
// ═══════════════════════════════════════════════════════════════
const STORY_WORDS = [
  'The','lantern','flickered','once,','twice—','then','held','steady','as',
  'Mira','descended','the','spiral','stair.','Below,','the','ink-black','sea',
  'exhaled','its','ancient','breath,','salt-sweet','and','heavy','with','forgotten','names.',
];

function HeroBookMockup() {
  const reduced = usePrefersReducedMotion();
  const [revealedWords, setRevealedWords] = useState(reduced ? STORY_WORDS.length : 0);
  const [showIllustration, setShowIllustration] = useState(reduced);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotX = useSpring(useTransform(mouseY, [-0.5, 0.5], [4, -4]), { stiffness: 80, damping: 18 });
  const rotY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), { stiffness: 80, damping: 18 });

  useEffect(() => {
    if (reduced) return;
    const startTimer = setTimeout(() => {
      let i = 0;
      const tick = setInterval(() => {
        i++;
        setRevealedWords(i);
        if (i >= STORY_WORDS.length) {
          clearInterval(tick);
          setTimeout(() => setShowIllustration(true), 400);
        }
      }, 85);
      return () => clearInterval(tick);
    }, 1500);
    return () => clearTimeout(startTimer);
  }, [reduced]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - r.left) / r.width - 0.5);
    mouseY.set((e.clientY - r.top) / r.height - 0.5);
  }, [mouseX, mouseY, reduced]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0); mouseY.set(0);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      style={{ perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative"
      aria-label="Interactive book preview animation"
    >
      {/* Ambient glow under book */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 50% 80%, ${A.amber}18 0%, transparent 65%)`,
        filter: 'blur(24px)',
        transform: 'translateY(12px) scaleX(0.9)',
      }} />

      <motion.div style={{ rotateX: rotX, rotateY: rotY, transformStyle: 'preserve-3d' }}>
        {/* Open book container */}
        <div className="relative flex rounded-xl overflow-hidden" style={{
          background: '#0d1f3c',
          border: `1px solid ${A.borderStrong}`,
          boxShadow: `0 32px 64px -12px rgba(0,0,0,0.65), 0 0 0 1px ${A.border}`,
          minHeight: 320,
        }}>
          {/* Left page — illustration */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden"
            style={{ borderRight: '2px solid rgba(0,0,0,0.35)' }}>
            {/* Illustration reveal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: showIllustration ? 1 : 0, scale: showIllustration ? 1 : 0.96 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="absolute inset-0"
            >
              <div className="absolute inset-0" style={{
                background: `
                  radial-gradient(ellipse 85% 65% at 50% 35%, ${A.teal}18 0%, transparent 60%),
                  radial-gradient(ellipse 55% 75% at 25% 70%, ${A.amber}0A 0%, transparent 55%),
                  radial-gradient(ellipse 100% 100% at 65% 25%, rgba(99,102,241,0.10) 0%, transparent 55%),
                  linear-gradient(160deg, #0d1f3c 0%, #152540 100%)
                `,
              }} />
              {/* Forest SVG scene */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 220 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                <defs>
                  <radialGradient id="foxGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={A.amber} stopOpacity="0.6" />
                    <stop offset="100%" stopColor={A.amber} stopOpacity="0" />
                  </radialGradient>
                </defs>
                {/* Back tree layer */}
                <path d="M 0 200 L 18 148 L 36 178 L 55 118 L 74 155 L 92 98 L 112 138 L 132 108 L 152 142 L 172 118 L 192 135 L 220 122 L 220 200 Z"
                  fill="rgba(13,28,55,0.9)" />
                {/* Front tree layer */}
                <path d="M 0 200 L 25 158 L 48 188 L 68 130 L 88 172 L 108 115 L 128 156 L 148 122 L 168 150 L 188 132 L 210 148 L 220 200 Z"
                  fill="rgba(9,18,38,0.95)" />
                {/* Fox body */}
                <ellipse cx="110" cy="148" rx="14" ry="9" fill="rgba(251,191,36,0.40)" />
                <path d="M 99 143 L 93 130 L 102 138 Z" fill="rgba(251,191,36,0.40)" />
                <path d="M 121 143 L 127 130 L 118 138 Z" fill="rgba(251,191,36,0.40)" />
                <ellipse cx="110" cy="148" rx="6" ry="4" fill="url(#foxGlow)" />
                {/* Magic particles */}
                {[...Array(16)].map((_, i) => (
                  <circle key={i}
                    cx={12 + (i * 14) % 198}
                    cy={10 + (i * 19) % 100}
                    r={0.8 + (i % 3) * 0.6}
                    fill={i % 2 === 0 ? A.teal : A.amber}
                    opacity={0.3 + (i % 4) * 0.15}
                  />
                ))}
                {/* Moon */}
                <circle cx="180" cy="28" r="12" fill="rgba(251,191,36,0.12)" stroke="rgba(251,191,36,0.20)" strokeWidth="0.5" />
              </svg>
              <div className="absolute bottom-2 left-0 right-0 text-center">
                <span style={{ fontSize: '9px', color: A.teal, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.18em' }}>
                  Enchanted Forest · Watercolor
                </span>
              </div>
            </motion.div>

            {!showIllustration && (
              <div className="relative z-10 text-center">
                <div className="w-7 h-7 rounded-full border-2 border-t-transparent mx-auto mb-2"
                  style={{ borderColor: `${A.teal} transparent ${A.teal} ${A.teal}`, animation: 'spin 1s linear infinite' }} />
                <p style={{ fontSize: '10px', color: A.textSubtle }}>Generating illustration…</p>
              </div>
            )}
          </div>

          {/* Book gutter */}
          <div className="w-2.5 flex-shrink-0" style={{
            background: 'linear-gradient(to right,rgba(0,0,0,0.45),rgba(0,0,0,0.12),rgba(0,0,0,0.22))',
          }} />

          {/* Right page — text */}
          <div className="flex-1 p-5 overflow-hidden" style={{ background: 'linear-gradient(to right,rgba(255,255,255,0.015),transparent)' }}>
            <p style={{ fontSize: '9px', color: A.textSubtle, textTransform: 'uppercase', letterSpacing: '0.18em', textAlign: 'center', marginBottom: '1rem' }}>
              Chapter One · Page 1
            </p>
            <p style={{ fontFamily: FS, fontSize: '13px', lineHeight: 1.8, color: '#cdd8e8' }}>
              {STORY_WORDS.slice(0, revealedWords).map((word, i) => (
                <motion.span key={i}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="inline-block mr-[3px]"
                >
                  {word}
                </motion.span>
              ))}
              {revealedWords < STORY_WORDS.length && (
                <span className="inline-block w-[2px] h-[14px] ml-[2px] align-middle"
                  style={{ background: A.amber, animation: 'pulse 1s ease-in-out infinite' }} />
              )}
            </p>
          </div>
        </div>

        {/* Decorative page-curl hint */}
        <div className="absolute -bottom-0.5 right-10 pointer-events-none" style={{ width: 40, height: 40 }}>
          <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <path d="M 40 40 Q 24 40 16 28 Q 8 16 10 2" stroke={`${A.amber}50`} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FEATURE DEMO 1 — AI Co-Writer
// ═══════════════════════════════════════════════════════════════
const AI_CONT = [
  'Halfway','down,','she','heard','it—','a','whisper','that','wasn\'t','wind,',
  'a','sound','like','pages','turning','in','a','drowned','library.','Her','lantern','went','cold.',
];

function AICoWriterDemo() {
  const [typedWords, setTypedWords] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [done, setDone] = useState(false);

  const start = () => {
    if (isTyping || done) return;
    setIsTyping(true);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTypedWords(i);
      if (i >= AI_CONT.length) { clearInterval(id); setIsTyping(false); setDone(true); }
    }, 95);
  };

  return (
    <div className="rounded-2xl overflow-hidden h-full" style={{ background: A.card, border: `1px solid ${A.border}`, backdropFilter: 'blur(10px)' }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${A.border}`, background: 'rgba(0,0,0,0.25)' }}>
        <Edit3 size={13} style={{ color: A.amber }} aria-hidden="true" />
        <span style={{ fontSize: '11px', fontWeight: 700, color: A.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>AI Co-Writer</span>
      </div>
      <div className="p-4">
        <div className="rounded-xl p-4 mb-3" style={{
          background: 'rgba(0,0,0,0.28)', border: `1px solid ${A.borderStrong}`,
          fontFamily: FS, fontSize: '13px', color: A.text, lineHeight: 1.8, minHeight: 90,
        }}>
          <span>It was a dark and stormy night when the library spoke its first word in three centuries. </span>
          {typedWords > 0 && (
            <span style={{ color: done ? A.text : A.teal, transition: 'color 0.8s ease' }}>
              {AI_CONT.slice(0, typedWords).map((w, i) => (
                <motion.span key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mr-[3px]">{w}</motion.span>
              ))}
            </span>
          )}
          {isTyping && <span style={{ display: 'inline-block', width: 2, height: 14, marginLeft: 2, verticalAlign: 'middle', background: A.teal, animation: 'pulse 1s ease infinite' }} />}
        </div>
        <button onClick={start} disabled={isTyping || done} aria-label="Continue writing with AI"
          className="w-full py-2.5 rounded-xl text-xs font-bold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            background: done ? `${A.tealGlow}` : `rgba(45,212,191,0.10)`,
            border: `1px solid ${done ? A.teal + '40' : A.teal + '55'}`,
            color: A.teal, cursor: (isTyping || done) ? 'default' : 'pointer',
            outline: 'none',
          }}>
          {done ? '✓ AI continuation woven in' : isTyping ? 'Writing…' : 'Continue writing with AI'}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FEATURE DEMO 2 — AI Illustrator
// ═══════════════════════════════════════════════════════════════
const ART_STYLES = [
  { id: 'watercolor', label: 'Watercolor', bg: 'linear-gradient(135deg,#60a5fa28,#34d39928,#a78bfa28)', accent: '#93c5fd', emoji: '🎨' },
  { id: 'anime',      label: 'Anime',      bg: 'linear-gradient(135deg,#f472b628,#fb923c28,#facc1528)', accent: '#f9a8d4', emoji: '✨' },
  { id: 'sketch',     label: 'Sketch',     bg: 'linear-gradient(135deg,#94a3b828,#cbd5e128,#e2e8f028)', accent: '#cbd5e1', emoji: '✏️' },
  { id: 'oilpaint',   label: 'Oil Paint',  bg: 'linear-gradient(135deg,#a3e63528,#fbbf2428,#f9731628)', accent: '#bef264', emoji: '🖼️' },
];

function AIIllustratorDemo() {
  const [sel, setSel] = useState('watercolor');
  const style = ART_STYLES.find(s => s.id === sel)!;

  return (
    <div className="rounded-2xl overflow-hidden h-full" style={{ background: A.card, border: `1px solid ${A.border}`, backdropFilter: 'blur(10px)' }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${A.border}`, background: 'rgba(0,0,0,0.25)' }}>
        <Palette size={13} style={{ color: A.amber }} aria-hidden="true" />
        <span style={{ fontSize: '11px', fontWeight: 700, color: A.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>AI Illustrator</span>
      </div>
      <div className="p-4">
        <p style={{ fontSize: '12px', color: A.textMuted, fontFamily: FS, fontStyle: 'italic', marginBottom: '0.75rem' }}>
          "A fox in an enchanted forest, {style.label.toLowerCase()} style"
        </p>
        <AnimatePresence mode="wait">
          <motion.div key={sel}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl mb-3 flex items-center justify-center"
            style={{ background: style.bg, aspectRatio: '3/2', border: `1px solid ${style.accent}30` }}
          >
            <div className="text-center">
              <div style={{ fontSize: '2.5rem', marginBottom: 4 }}>{style.emoji}</div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: style.accent }}>{style.label}</span>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Art styles">
          {ART_STYLES.map(s => (
            <button key={s.id} onClick={() => setSel(s.id)}
              aria-pressed={sel === s.id} aria-label={`${s.label} style`}
              style={{
                padding: '0.4rem 0', borderRadius: 8, fontSize: 10, fontWeight: 700,
                background: sel === s.id ? A.amberGlow : 'rgba(0,0,0,0.28)',
                border: `1px solid ${sel === s.id ? A.amber : A.border}`,
                color: sel === s.id ? A.amber : A.textMuted,
                cursor: 'pointer', transition: 'all 0.2s',
                outline: 'none',
              }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FEATURE DEMO 3 — Multi-Language
// ═══════════════════════════════════════════════════════════════
const LANG_MAP = {
  en: { text: 'Once upon a time, in a forest woven from starlight and shadow, a fox discovered a library no map had ever named…', dir: 'ltr' as const, label: 'English',  font: FS },
  ja: { text: '星明かりと影で織られた森の中に、いつか地図にも載っていない図書館を見つけた…',                                                    dir: 'ltr' as const, label: '日本語', font: '"Noto Serif JP",serif' },
  ar: { text: 'في سالف العصر والأوان، في غابة منسوجة من ضوء النجوم والظلال، اكتشف ثعلب مكتبة لم يسمع بها أحد…',                           dir: 'rtl' as const, label: 'العربية', font: '"Noto Naskh Arabic",serif' },
};
type LangKey = keyof typeof LANG_MAP;

function MultiLanguageDemo() {
  const [lang, setLang] = useState<LangKey>('en');
  const s = LANG_MAP[lang];

  return (
    <div className="rounded-2xl overflow-hidden h-full" style={{ background: A.card, border: `1px solid ${A.border}`, backdropFilter: 'blur(10px)' }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${A.border}`, background: 'rgba(0,0,0,0.25)' }}>
        <Languages size={13} style={{ color: A.amber }} aria-hidden="true" />
        <span style={{ fontSize: '11px', fontWeight: 700, color: A.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Multi-Language Publishing</span>
      </div>
      <div className="p-4">
        <div className="flex gap-2 mb-4" role="group" aria-label="Language selector">
          {(Object.keys(LANG_MAP) as LangKey[]).map(l => (
            <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l}
              style={{
                padding: '0.3rem 0.8rem', borderRadius: 9999, fontSize: 11, fontWeight: 700,
                background: lang === l ? A.amberGlow : 'rgba(0,0,0,0.28)',
                border: `1px solid ${lang === l ? A.amber : A.border}`,
                color: lang === l ? A.amber : A.textMuted,
                cursor: 'pointer', transition: 'all 0.2s',
                outline: 'none',
              }}>
              {LANG_MAP[l].label}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={lang}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            style={{
              padding: '1rem', borderRadius: 12,
              background: 'rgba(0,0,0,0.32)', border: `1px solid ${A.borderStrong}`,
              direction: s.dir, textAlign: s.dir === 'rtl' ? 'right' : 'left',
            }}
          >
            <p style={{ fontFamily: s.font, fontSize: '14px', color: A.text, lineHeight: 1.85, margin: 0 }}>
              {s.text}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FEATURE DEMO 4 — Ready-to-Publish Formats
// ═══════════════════════════════════════════════════════════════
const FMTS = ['Paperback', 'Hardcover', 'Web Edition'] as const;
const FMT_STYLE: Record<string, { cover: string; spine: string; pages: string }> = {
  'Paperback':   { cover: 'linear-gradient(160deg,#1e3a5f,#0d2341)', spine: '#0b1b30', pages: '#f5f0e8' },
  'Hardcover':   { cover: 'linear-gradient(160deg,#1a1a2e,#16213e)', spine: '#0f0f1e', pages: '#fffdf7' },
  'Web Edition': { cover: 'linear-gradient(160deg,#064e3b,#022c22)', spine: '#013a2c', pages: '#e6fff9' },
};

function FormatToggleDemo() {
  const [fmt, setFmt] = useState<typeof FMTS[number]>('Paperback');
  const fs = FMT_STYLE[fmt];

  return (
    <div className="rounded-2xl overflow-hidden h-full" style={{ background: A.card, border: `1px solid ${A.border}`, backdropFilter: 'blur(10px)' }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid ${A.border}`, background: 'rgba(0,0,0,0.25)' }}>
        <BookOpen size={13} style={{ color: A.amber }} aria-hidden="true" />
        <span style={{ fontSize: '11px', fontWeight: 700, color: A.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Ready-to-Publish Formats</span>
      </div>
      <div className="p-4">
        <div className="flex gap-1.5 mb-4" role="group" aria-label="Format selector">
          {FMTS.map(f => (
            <button key={f} onClick={() => setFmt(f)} aria-pressed={fmt === f}
              style={{
                flex: 1, padding: '0.35rem 0', borderRadius: 8, fontSize: 10, fontWeight: 700,
                background: fmt === f ? A.amberGlow : 'rgba(0,0,0,0.28)',
                border: `1px solid ${fmt === f ? A.amber : A.border}`,
                color: fmt === f ? A.amber : A.textMuted,
                cursor: 'pointer', transition: 'all 0.2s',
                outline: 'none',
              }}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-center py-3">
          <AnimatePresence mode="wait">
            <motion.div key={fmt}
              initial={{ opacity: 0, rotateY: -25 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 25 }}
              transition={{ duration: 0.35 }}
              style={{ transformStyle: 'preserve-3d', perspective: 500 }}
            >
              <div style={{ display: 'flex', transform: 'perspective(500px) rotateY(-10deg)' }}>
                <div style={{ width: 14, borderRadius: '3px 0 0 3px', background: fs.spine }} />
                <div style={{
                  width: 88, height: 120, borderRadius: '0 4px 4px 0',
                  background: fs.cover, boxShadow: '10px 10px 28px rgba(0,0,0,0.55)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'flex-end', padding: '0 8px 10px',
                }}>
                  <div style={{ height: 1, width: 44, borderRadius: 1, background: `${A.amber}90`, marginBottom: 4 }} />
                  <p style={{ fontFamily: FS, fontSize: 9, fontWeight: 700, color: A.amber, textAlign: 'center', margin: 0 }}>Your Story</p>
                </div>
                <div style={{
                  width: 7, alignSelf: 'stretch', borderRadius: '0 3px 3px 0',
                  background: `repeating-linear-gradient(to bottom,${fs.pages} 0,${fs.pages} 2px,${fs.pages}66 2px,${fs.pages}66 3px)`,
                }} />
              </div>
              <p style={{ textAlign: 'center', marginTop: 8, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: A.textSubtle }}>
                {fmt}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BOOK WIZARD SECTION
// ═══════════════════════════════════════════════════════════════
const WIZ_FORMATS = [
  { id: 'story', label: 'Story', emoji: '📖' },
  { id: 'comic', label: 'Comic', emoji: '💥' },
  { id: 'novel', label: 'Novel', emoji: '📚' },
  { id: 'manga', label: 'Manga', emoji: '✨' },
];
const MOODS = [
  { id: 'whimsical',   label: 'Whimsical',    emoji: '🧚', bg: 'linear-gradient(135deg,#fbcfe8,#c4b5fd)', cover: 'linear-gradient(160deg,#a78bfa,#ec4899,#f9a8d4)' },
  { id: 'darkfantasy', label: 'Dark Fantasy', emoji: '🐉', bg: 'linear-gradient(135deg,#1e1b4b,#312e81)', cover: 'linear-gradient(160deg,#1e1b4b,#312e81,#4c1d95)' },
  { id: 'scifi',       label: 'Sci-Fi',        emoji: '🚀', bg: 'linear-gradient(135deg,#0c4a6e,#164e63)', cover: 'linear-gradient(160deg,#0c4a6e,#0e7490,#164e63)' },
  { id: 'romance',     label: 'Romance',       emoji: '💕', bg: 'linear-gradient(135deg,#831843,#9f1239)', cover: 'linear-gradient(160deg,#831843,#be185d,#9f1239)' },
  { id: 'mystery',     label: 'Mystery',       emoji: '🔍', bg: 'linear-gradient(135deg,#1c1917,#292524)', cover: 'linear-gradient(160deg,#1c1917,#44403c,#292524)' },
];

function deriveTitle(idea: string, char: string) {
  const words = idea.split(' ').filter(w => w.length > 4);
  const kw = words[0] || idea.split(' ')[1] || 'Journey';
  return `The ${kw.charAt(0).toUpperCase()}${kw.slice(1).toLowerCase()} of ${char || 'Elena'}`;
}

function BookWizardSection() {
  const [step, setStep] = useState(1);
  const [format, setFormat] = useState('');
  const [mood, setMood] = useState('');
  const [character, setCharacter] = useState('');
  const [idea, setIdea] = useState('');
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState(false);

  const moodObj = MOODS.find(m => m.id === mood) || MOODS[1];
  const title = deriveTitle(idea || 'enchanted botanist', character || 'Elena');

  const generate = () => {
    if (!character.trim()) return;
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setPreview(true); }, 2200);
  };

  const reset = () => { setStep(1); setFormat(''); setMood(''); setCharacter(''); setIdea(''); setPreview(false); };

  const cardStyle: React.CSSProperties = {
    background: A.card,
    border: `1px solid ${A.borderStrong}`,
    backdropFilter: 'blur(14px)',
    borderRadius: 20,
    padding: '2rem',
  };

  return (
    <section id="wizard" className="py-24 px-6"
      style={{ background: `linear-gradient(to bottom,${A.bg},#0d1a2e)` }}>
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
              style={{ background: A.amberGlow, border: `1px solid ${A.amber}40` }}>
              <Wand2 size={13} style={{ color: A.amber }} aria-hidden="true" />
              <span style={{ fontSize: 11, fontWeight: 700, color: A.amber, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Quick Start</span>
            </div>
            <h2 style={{ fontFamily: FS, fontSize: 'clamp(36px,5vw,56px)', fontWeight: 400, color: A.text, lineHeight: 1.1, marginBottom: '0.75rem' }}>
              See Your Story.<br />In 30 Seconds.
            </h2>
            <p style={{ color: A.textMuted, fontSize: 15 }}>No signup required — just your imagination.</p>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">

          {/* ── Wizard steps ── */}
          {!preview && !generating && (
            <motion.div key="wizard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Step indicators */}
              <div className="flex items-center justify-center gap-3 mb-8" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3} aria-label="Wizard progress">
                {[1, 2, 3].map(s => (
                  <React.Fragment key={s}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700,
                      background: step >= s ? A.amber : 'rgba(255,255,255,0.05)',
                      border: `1.5px solid ${step >= s ? A.amber : A.border}`,
                      color: step >= s ? '#000' : A.textSubtle,
                      transition: 'all 0.3s',
                    }}>{s}</div>
                    {s < 3 && (
                      <div style={{ width: 48, height: 1.5, borderRadius: 1, background: step > s ? A.amber : A.border, transition: 'background 0.3s' }} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div style={cardStyle}>
                <AnimatePresence mode="wait">

                  {/* Step 1 */}
                  {step === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h3 style={{ fontFamily: FS, fontSize: 22, fontWeight: 600, color: A.text, marginBottom: '1.25rem' }}>Choose your format</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        {WIZ_FORMATS.map(f => (
                          <button key={f.id} onClick={() => setFormat(f.id)} aria-pressed={format === f.id}
                            style={{
                              padding: '1.25rem 0.5rem', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                              background: format === f.id ? A.amberGlow : 'rgba(0,0,0,0.28)',
                              border: `2px solid ${format === f.id ? A.amber : A.border}`,
                              cursor: 'pointer', transition: 'all 0.2s', outline: 'none',
                            }}>
                            <span style={{ fontSize: '1.75rem' }}>{f.emoji}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: format === f.id ? A.amber : A.textMuted }}>{f.label}</span>
                          </button>
                        ))}
                      </div>
                      <button onClick={() => format && setStep(2)} disabled={!format}
                        style={{
                          width: '100%', padding: '0.875rem', borderRadius: 12, fontSize: 14, fontWeight: 700,
                          background: format ? `linear-gradient(135deg,${A.amber},#f59e0b)` : 'rgba(255,255,255,0.05)',
                          color: format ? '#000' : A.textSubtle, border: 'none',
                          cursor: format ? 'pointer' : 'default', transition: 'all 0.25s',
                          boxShadow: format ? `0 0 24px ${A.amber}40` : 'none',
                        }}>
                        Next → Choose Mood
                      </button>
                    </motion.div>
                  )}

                  {/* Step 2 */}
                  {step === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h3 style={{ fontFamily: FS, fontSize: 22, fontWeight: 600, color: A.text, marginBottom: '1.25rem' }}>Choose your vibe</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                        {MOODS.map(m => (
                          <button key={m.id} onClick={() => setMood(m.id)} aria-pressed={mood === m.id}
                            style={{
                              padding: '1.4rem 0.5rem', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                              background: mood === m.id ? m.bg : 'rgba(0,0,0,0.32)',
                              border: `2px solid ${mood === m.id ? A.amber : A.border}`,
                              cursor: 'pointer', transition: 'all 0.22s', outline: 'none',
                            }}>
                            <span style={{ fontSize: '1.75rem' }}>{m.emoji}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: mood === m.id ? '#fff' : A.textMuted }}>{m.label}</span>
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setStep(1)} style={{
                          padding: '0.875rem 1.25rem', borderRadius: 12, fontSize: 13, fontWeight: 700,
                          background: 'rgba(255,255,255,0.05)', border: `1px solid ${A.border}`, color: A.textMuted, cursor: 'pointer',
                        }}>← Back</button>
                        <button onClick={() => mood && setStep(3)} disabled={!mood} style={{
                          flex: 1, padding: '0.875rem', borderRadius: 12, fontSize: 14, fontWeight: 700,
                          background: mood ? `linear-gradient(135deg,${A.amber},#f59e0b)` : 'rgba(255,255,255,0.05)',
                          color: mood ? '#000' : A.textSubtle, border: 'none',
                          cursor: mood ? 'pointer' : 'default', transition: 'all 0.25s',
                          boxShadow: mood ? `0 0 24px ${A.amber}40` : 'none',
                        }}>Next → Your Character</button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3 */}
                  {step === 3 && (
                    <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h3 style={{ fontFamily: FS, fontSize: 22, fontWeight: 600, color: A.text, marginBottom: '1.25rem' }}>Name your hero</h3>
                      <div className="space-y-4 mb-6">
                        {[
                          { label: 'Character Name', val: character, set: setCharacter, ph: 'e.g. Elena' },
                          { label: 'One-Line Idea', val: idea, set: setIdea, ph: 'e.g. a time-traveling botanist discovers an ancient forest' },
                        ].map(({ label, val, set, ph }) => (
                          <div key={label}>
                            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: A.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
                              {label}
                            </label>
                            <input type="text" value={val} onChange={e => set(e.target.value)} placeholder={ph}
                              aria-label={label}
                              style={{
                                width: '100%', padding: '0.625rem 1rem', borderRadius: 10, fontSize: 14,
                                background: 'rgba(0,0,0,0.38)', border: `1px solid ${A.borderStrong}`,
                                color: A.text, outline: 'none', boxSizing: 'border-box',
                              }} />
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setStep(2)} style={{
                          padding: '0.875rem 1.25rem', borderRadius: 12, fontSize: 13, fontWeight: 700,
                          background: 'rgba(255,255,255,0.05)', border: `1px solid ${A.border}`, color: A.textMuted, cursor: 'pointer',
                        }}>← Back</button>
                        <button onClick={generate} disabled={!character.trim()} style={{
                          flex: 1, padding: '0.875rem', borderRadius: 12, fontSize: 14, fontWeight: 700,
                          background: character ? `linear-gradient(135deg,${A.amber},#f59e0b)` : 'rgba(255,255,255,0.05)',
                          color: character ? '#000' : A.textSubtle, border: 'none',
                          cursor: character ? 'pointer' : 'default', transition: 'all 0.25s',
                          boxShadow: character ? `0 0 32px ${A.amber}50` : 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}>
                          <Sparkles size={14} aria-hidden="true" /> Generate Preview
                        </button>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ── Loading ── */}
          {generating && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-20" aria-live="polite" aria-label="Generating your book preview">
              <div className="relative inline-block mb-6">
                <motion.div
                  animate={{ rotate: [-12, 10, -12], y: [0, -10, 0] }}
                  transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ fontSize: '3.5rem', display: 'block' }}
                  aria-hidden="true"
                >🪶</motion.div>
                <motion.div
                  animate={{ width: ['0%', '100%'] }}
                  transition={{ duration: 2.1, ease: 'linear' }}
                  style={{ position: 'absolute', bottom: -4, left: 0, height: 2, borderRadius: 1, background: A.amber }}
                />
              </div>
              <p style={{ fontFamily: FS, fontSize: 18, color: A.text, marginBottom: 6 }}>Crafting your story…</p>
              <p style={{ fontSize: 13, color: A.textMuted }}>Weaving title · generating cover · setting the scene</p>
            </motion.div>
          )}

          {/* ── Preview ── */}
          {preview && (
            <motion.div key="preview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${A.amber}28` }}>
                <div className="px-6 py-3 flex items-center gap-2" style={{
                  background: `linear-gradient(to right,${A.amberGlow},transparent)`,
                  borderBottom: `1px solid ${A.amber}18`,
                }}>
                  <Sparkles size={13} style={{ color: A.amber }} aria-hidden="true" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: A.amber, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Your Book Preview</span>
                </div>

                <div className="grid md:grid-cols-2">
                  {/* Cover */}
                  <div className="p-8 flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.42)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ transform: 'perspective(600px) rotateY(-8deg)', position: 'relative' }}>
                      <div style={{
                        width: 136, height: 192, borderRadius: '2px 8px 8px 2px',
                        background: moodObj.cover, boxShadow: '14px 14px 36px rgba(0,0,0,0.65)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        justifyContent: 'space-between', padding: '1.25rem 0.75rem',
                        position: 'relative', overflow: 'hidden',
                      }}>
                        <div className="absolute inset-0 flex items-center justify-center" style={{ opacity: 0.18 }}>
                          <span style={{ fontSize: '5rem' }}>{moodObj.emoji}</span>
                        </div>
                        <div className="relative text-center">
                          <div style={{ height: 1, width: 56, background: 'rgba(255,255,255,0.45)', borderRadius: 1, margin: '0 auto 6px' }} />
                          <p style={{ fontFamily: FS, fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.35, margin: 0 }}>{title}</p>
                          <div style={{ height: 1, width: 56, background: 'rgba(255,255,255,0.45)', borderRadius: 1, margin: '6px auto 0' }} />
                        </div>
                        <p style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.55)', margin: 0 }}>
                          {character}
                        </p>
                      </div>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 10, borderRadius: '4px 0 0 4px', background: 'rgba(0,0,0,0.55)', boxShadow: 'inset -2px 0 5px rgba(0,0,0,0.4)' }} />
                    </div>
                  </div>

                  {/* Spread preview */}
                  <div className="p-6" style={{ background: 'rgba(0,0,0,0.30)' }}>
                    <p style={{ fontSize: 9, color: A.textSubtle, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 10 }}>Opening Pages</p>
                    <div className="rounded-xl p-4 mb-3" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${A.border}` }}>
                      <p style={{ fontFamily: FS, fontSize: 13, color: A.text, lineHeight: 1.85, fontStyle: 'italic', margin: 0 }}>
                        "{character} had always known the world held secrets — but never imagined one would take root in her own garden. The morning she found the blue-petaled flower that glowed at midnight, everything changed…"
                      </p>
                    </div>
                    <div className="rounded-xl flex items-center justify-center" style={{
                      aspectRatio: '16/9', background: moodObj.cover, opacity: 0.75,
                    }}>
                      <div className="text-center">
                        <div style={{ fontSize: '1.75rem', marginBottom: 4 }}>{moodObj.emoji}</div>
                        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>AI Illustration</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 text-center" style={{ borderTop: `1px solid ${A.border}`, background: 'rgba(0,0,0,0.22)' }}>
                  <Link to="/login"
                    className="inline-flex items-center gap-2.5 no-underline"
                    style={{
                      padding: '0.875rem 2rem', borderRadius: 12, fontSize: 14, fontWeight: 700,
                      background: `linear-gradient(135deg,${A.amber},#f59e0b)`,
                      color: '#000', boxShadow: `0 0 36px ${A.amber}45`,
                    }}>
                    <BookOpen size={15} aria-hidden="true" />
                    Save This Book &amp; Start Writing Free
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                  <button onClick={reset} style={{
                    display: 'block', margin: '12px auto 0', fontSize: 12, color: A.textSubtle,
                    background: 'none', border: 'none', cursor: 'pointer',
                  }}>
                    Start over ↩
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMMUNITY BOOKSHELF
// ═══════════════════════════════════════════════════════════════
const BOOKS = [
  { title: 'The Ember Cartographer',     author: 'Sofia K.',  bg: 'linear-gradient(160deg,#7c3aed,#4f46e5)', quote: 'Plotcore made my character feel alive on every page.', emoji: '🗺️' },
  { title: 'Neon Samurai Chronicles',    author: 'Kenji M.',  bg: 'linear-gradient(160deg,#0891b2,#0e7490)', quote: 'I published my first manga in a week. Unbelievable.', emoji: '⚔️' },
  { title: 'Letters to the Moon',        author: 'Amara J.',  bg: 'linear-gradient(160deg,#be185d,#9f1239)', quote: 'The AI felt like a real co-writer, not just a tool.', emoji: '🌙' },
  { title: 'The Glass Taxonomy',         author: 'Dr. R. Patel', bg: 'linear-gradient(160deg,#065f46,#047857)', quote: 'I never thought I could finish my novel until Plotcore.', emoji: '🔬' },
  { title: 'Whispers in Binary',         author: 'Alex T.',   bg: 'linear-gradient(160deg,#1e1b4b,#312e81)', quote: 'Every art style option blew my mind — watercolor is stunning.', emoji: '💻' },
  { title: 'Desert Oracle',              author: 'Layla H.',  bg: 'linear-gradient(160deg,#78350f,#92400e)', quote: 'I wrote in Arabic and the script looked gorgeous.', emoji: '🏜️' },
  { title: 'Foxfire Journals',           author: 'Mia B.',    bg: 'linear-gradient(160deg,#064e3b,#065f46)', quote: 'The pages look like they came from a real publisher.', emoji: '🦊' },
  { title: 'Starfall Protocol',          author: 'Chen W.',   bg: 'linear-gradient(160deg,#0c4a6e,#1e40af)', quote: 'My kids couldn\'t believe I made it myself.', emoji: '🌠' },
];

function BookCard({ book }: { book: typeof BOOKS[0] }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      role="article"
      aria-label={`${book.title} by ${book.author}`}
      className="flex-shrink-0 mx-2.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2"
      style={{ width: 160, perspective: 800 }}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onFocus={() => setFlipped(true)}
      onBlur={() => setFlipped(false)}
      tabIndex={0}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.48, ease: 'easeInOut' }}
        style={{ transformStyle: 'preserve-3d', position: 'relative', height: 230 }}
      >
        {/* Front */}
        <div className="absolute inset-0 rounded-xl overflow-hidden flex flex-col"
          style={{ background: book.bg, backfaceVisibility: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,0.52)' }}>
          <div className="flex-1 flex items-center justify-center">
            <span style={{ fontSize: '3rem' }}>{book.emoji}</span>
          </div>
          <div className="p-3" style={{ background: 'rgba(0,0,0,0.42)' }}>
            <p style={{ fontFamily: FS, fontSize: 11, fontWeight: 700, color: '#fff', lineHeight: 1.35, margin: '0 0 3px' }}>{book.title}</p>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', margin: 0 }}>by {book.author}</p>
          </div>
        </div>
        {/* Back */}
        <div className="absolute inset-0 rounded-xl p-4 flex flex-col justify-center"
          style={{
            background: '#0d1f3c', border: `1px solid ${A.borderStrong}`,
            backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
          }}>
          <Star size={13} style={{ color: A.amber, marginBottom: 8 }} aria-hidden="true" />
          <p style={{ fontFamily: FS, fontSize: 11, fontStyle: 'italic', color: A.text, lineHeight: 1.6, margin: '0 0 10px' }}>
            "{book.quote}"
          </p>
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: A.amber, margin: 0 }}>
            — {book.author}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function BookshelfSection() {
  const [emblaRef] = useEmblaCarousel({ loop: true, dragFree: true, align: 'start' });
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true });

  return (
    <section id="community" className="py-24 overflow-hidden"
      style={{ background: `linear-gradient(to bottom,#0d1a2e,${A.bg})` }}>
      {/* Header */}
      <div className="container mx-auto max-w-6xl px-6 mb-10 text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
            style={{ background: A.tealGlow, border: `1px solid ${A.teal}40` }}>
            <Star size={13} style={{ color: A.teal }} aria-hidden="true" />
            <span style={{ fontSize: 11, fontWeight: 700, color: A.teal, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Community</span>
          </div>
          <h2 style={{ fontFamily: FS, fontSize: 'clamp(34px,5vw,54px)', fontWeight: 400, color: A.text, lineHeight: 1.1 }}>
            Stories Brought to Life<br />with Plotcore
          </h2>
        </motion.div>
      </div>

      {/* Draggable carousel */}
      <div ref={emblaRef} className="overflow-hidden select-none" style={{ cursor: 'grab', touchAction: 'pan-y' }}
        aria-label="Community book carousel — drag to scroll">
        <div className="flex py-4 px-6">
          {[...BOOKS, ...BOOKS].map((book, i) => (
            <BookCard key={i} book={book} />
          ))}
        </div>
      </div>

      {/* Animated stats */}
      <div ref={statsRef} className="container mx-auto max-w-4xl px-6 mt-14">
        <div className="grid grid-cols-3 gap-4">
          {[
            { end: 15000, suffix: '+', label: 'Stories Created', decimals: 0, icon: '📖' },
            { end: 62,    suffix: '',  label: 'Art Styles',      decimals: 0, icon: '🎨' },
            { end: 4.9,   suffix: '★', label: 'from Authors',   decimals: 1, icon: '⭐' },
          ].map((stat, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={statsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1 }}
              className="text-center p-6 rounded-2xl"
              style={{ background: A.card, border: `1px solid ${A.borderStrong}`, backdropFilter: 'blur(10px)' }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: 6 }} aria-hidden="true">{stat.icon}</div>
              <div style={{ fontFamily: FS, fontSize: '2.2rem', fontWeight: 700, color: A.amber, lineHeight: 1, marginBottom: 4 }}>
                <CountUp end={stat.end} suffix={stat.suffix} duration={2.5} decimals={stat.decimals} enableScrollSpy scrollSpyOnce />
              </div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: A.textMuted, margin: 0 }}>
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          {BOOKS.slice(0, 3).map((book, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-5 rounded-xl"
              style={{ background: A.card, border: `1px solid ${A.border}`, backdropFilter: 'blur(10px)' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ width: 36, height: 36, background: book.bg, flexShrink: 0, color: '#fff' }}>
                  {book.author.charAt(0)}
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: A.text, margin: 0 }}>{book.author}</p>
                  <p style={{ fontSize: 9, color: A.textSubtle, margin: 0 }}>Author of "{book.title}"</p>
                </div>
              </div>
              <div className="flex gap-0.5 mb-2" aria-label="5 stars">
                {[...Array(5)].map((_, j) => <Star key={j} size={10} className="fill-current" style={{ color: A.amber }} aria-hidden="true" />)}
              </div>
              <p style={{ fontFamily: FS, fontSize: 12, fontStyle: 'italic', color: A.textMuted, lineHeight: 1.65, margin: 0 }}>
                "{book.quote}"
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// PRICING SECTION
// ═══════════════════════════════════════════════════════════════
const PLANS = [
  { name: 'The Explorer',      price: 0,  tokens: 5,   booksBase: 1, features: ['1 story total','5 pages per story','3 art styles','Manual editing'],               cta: 'Start Free'   },
  { name: 'The Author',        price: 18, tokens: 60,  booksBase: 2, features: ['10 stories/month','30 pages per story','AI generation','Collaboration'],            cta: 'Start Writing' },
  { name: 'The Professional',  price: 48, tokens: 200, booksBase: 6, features: ['Unlimited stories','100 pages/story','All 62 art styles','Marketplace publishing'], cta: 'Go Pro'       },
];

function PricingSection() {
  const [books, setBooks] = useState(3);
  const recommended = books <= 1 ? 0 : books <= 5 ? 1 : 2;

  return (
    <section id="pricing" className="py-24 px-6" style={{ background: `linear-gradient(to bottom,${A.bg},#060d1a)` }}>
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
              style={{ background: A.amberGlow, border: `1px solid ${A.amber}40` }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: A.amber, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Pricing</span>
            </div>
            <h2 style={{ fontFamily: FS, fontSize: 'clamp(34px,5vw,54px)', fontWeight: 400, color: A.text, lineHeight: 1.1 }}>
              Invest in Your Stories
            </h2>
          </motion.div>
        </div>

        {/* Book estimator */}
        <div className="rounded-2xl p-6 mb-8"
          style={{ background: A.card, border: `1px solid ${A.borderStrong}`, backdropFilter: 'blur(14px)' }}>
          <div className="flex items-center justify-between mb-3">
            <label htmlFor="book-slider" style={{ fontSize: 14, fontWeight: 600, color: A.text }}>
              How many 30-page illustrated books per month?
            </label>
            <span style={{ fontFamily: FS, fontSize: '1.75rem', fontWeight: 700, color: A.amber }}>{books}</span>
          </div>
          <input id="book-slider" type="range" min={1} max={20} value={books}
            onChange={e => setBooks(Number(e.target.value))}
            className="w-full" style={{ accentColor: A.amber }}
            aria-valuemin={1} aria-valuemax={20} aria-valuenow={books}
          />
          <div className="flex justify-between mt-1" style={{ fontSize: 11, color: A.textSubtle }}>
            <span>1 book</span><span>20 books</span>
          </div>
          <p style={{ fontSize: 12, color: A.textMuted, marginTop: 10 }}>
            Recommended: <span style={{ color: A.amber, fontWeight: 700 }}>{PLANS[recommended].name}</span>
            {' '}· covers ~{PLANS[recommended].booksBase}+ books/mo (~{PLANS[recommended].tokens} tokens/mo)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan, i) => {
            const isRec = i === recommended;
            return (
              <motion.div key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative flex flex-col p-6 rounded-2xl"
                style={{
                  background: A.card,
                  border: `${isRec ? 2 : 1}px solid ${isRec ? A.amber : A.borderStrong}`,
                  backdropFilter: 'blur(12px)',
                  transform: isRec ? 'scale(1.03)' : 'scale(1)',
                  boxShadow: isRec ? `0 0 48px ${A.amber}20, 0 20px 52px rgba(0,0,0,0.45)` : '0 8px 32px rgba(0,0,0,0.3)',
                  transition: 'all 0.35s ease',
                  zIndex: isRec ? 2 : 1,
                }}
                aria-label={`${plan.name} plan`}
              >
                {isRec && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: `linear-gradient(135deg,${A.amber},#f59e0b)`, color: '#000', whiteSpace: 'nowrap' }}>
                    Recommended
                  </div>
                )}
                <div className="mb-5">
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: A.textSubtle, marginBottom: 6 }}>{plan.name}</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span style={{ fontFamily: FS, fontSize: '2.4rem', fontWeight: 700, color: isRec ? A.amber : A.text }}>${plan.price}</span>
                    <span style={{ fontSize: 12, color: A.textSubtle }}>/month</span>
                  </div>
                  <p style={{ fontSize: 11, color: A.textSubtle, margin: 0 }}>{plan.tokens} tokens/mo</p>
                </div>
                <ul className="space-y-2.5 mb-6 flex-1" role="list">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2" style={{ fontSize: 13, color: A.textMuted }}>
                      <Check size={12} className="flex-shrink-0" style={{ color: isRec ? A.amber : A.teal }} aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/login"
                  className="flex items-center justify-center gap-2 no-underline transition-all"
                  style={{
                    padding: '0.75rem', borderRadius: 12, fontSize: 13, fontWeight: 700,
                    ...(isRec ? {
                      background: `linear-gradient(135deg,${A.amber},#f59e0b)`,
                      color: '#000', boxShadow: `0 0 20px ${A.amber}40`,
                    } : {
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${A.borderStrong}`,
                      color: A.textMuted,
                    }),
                  }}>
                  {plan.cta}
                  <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN LANDING COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Landing({ globalSettings }: LandingProps) {
  const appName = globalSettings?.appName || 'Plotcore';
  const appIcon = globalSettings?.appIcon || '';

  return (
    <div style={{ background: A.bg, color: A.text, fontFamily: FSans, minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}>

      {/* Background noise texture */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0, opacity: 0.028 }} aria-hidden="true">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
      </div>

      {/* Ambient background gradient */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} aria-hidden="true">
        <div style={{
          position: 'absolute', top: '-20%', left: '-10%', width: '50%', height: '60%',
          borderRadius: '50%', opacity: 0.07,
          background: `radial-gradient(circle, ${A.amber} 0%, transparent 70%)`,
          filter: 'blur(80px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '5%', right: '-5%', width: '40%', height: '50%',
          borderRadius: '50%', opacity: 0.05,
          background: `radial-gradient(circle, ${A.teal} 0%, transparent 70%)`,
          filter: 'blur(80px)',
        }} />
      </div>

      {/* ── Sticky Nav ── */}
      <nav role="navigation" aria-label="Main navigation"
        className="sticky top-0 z-50 px-5 md:px-8 py-3 flex items-center justify-between"
        style={{
          background: 'rgba(11,17,32,0.88)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          borderBottom: `1px solid ${A.borderStrong}`,
        }}>
        <a href="#" className="flex items-center gap-2.5 no-underline" aria-label={`${appName} home`}>
          <div className="rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
            style={{ width: 28, height: 28, background: `linear-gradient(135deg,${A.amber},#f59e0b)`, color: '#000' }}>
            {appIcon?.startsWith('http')
              ? <img src={appIcon} alt="" className="w-full h-full object-cover" />
              : <Sparkles size={13} aria-hidden="true" />
            }
          </div>
          <span style={{ fontFamily: FS, fontSize: 16, fontWeight: 600, color: A.text }}>{appName}</span>
        </a>

        <div className="hidden md:flex items-center gap-7">
          {[['Features','#features'],['Wizard','#wizard'],['Community','#community'],['Pricing','#pricing']].map(([label, href]) => (
            <a key={label} href={href}
              className="no-underline transition-colors text-xs font-semibold uppercase tracking-wider"
              style={{ color: A.textSubtle, letterSpacing: '0.08em' }}
              onMouseEnter={e => (e.currentTarget.style.color = A.text)}
              onMouseLeave={e => (e.currentTarget.style.color = A.textSubtle)}>
              {label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link to="/login"
            className="no-underline px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ color: A.textMuted, border: `1px solid ${A.border}` }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = A.borderStrong; (e.currentTarget as HTMLElement).style.color = A.text; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = A.border; (e.currentTarget as HTMLElement).style.color = A.textMuted; }}>
            Sign in
          </Link>
          <Link to="/login"
            className="no-underline px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{ background: `linear-gradient(135deg,${A.amber},#f59e0b)`, color: '#000', boxShadow: `0 0 14px ${A.amber}40` }}>
            Start Free
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section aria-label="Hero" className="relative px-6 pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden" style={{ zIndex: 1 }}>
        {/* Hero ambient glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div style={{ position: 'absolute', top: -80, left: -60, width: 360, height: 360, borderRadius: '50%', opacity: 0.22, background: `radial-gradient(circle,${A.amber} 0%,transparent 70%)`, filter: 'blur(70px)' }} />
          <div style={{ position: 'absolute', top: 60, right: -40, width: 280, height: 280, borderRadius: '50%', opacity: 0.14, background: `radial-gradient(circle,${A.teal} 0%,transparent 70%)`, filter: 'blur(70px)' }} />
        </div>

        <div className="container mx-auto max-w-6xl relative" style={{ zIndex: 2 }}>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left copy */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
                style={{ background: A.amberGlow, border: `1px solid ${A.amber}40` }}>
                <Sparkles size={12} style={{ color: A.amber }} aria-hidden="true" />
                <span style={{ fontSize: 11, fontWeight: 700, color: A.amber, textTransform: 'uppercase', letterSpacing: '0.15em' }}>AI Creative Studio</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
                style={{ fontFamily: FS, fontSize: 'clamp(40px,5.5vw,70px)', fontWeight: 400, lineHeight: 1.05, color: A.text, marginBottom: '1.2rem' }}>
                From Blank Page<br />
                to Beautiful Book—<br />
                <em style={{ color: A.amber, fontStyle: 'italic' }}>in One Creative Flow</em>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                style={{ color: A.textMuted, fontSize: 16, lineHeight: 1.72, maxWidth: 460, marginBottom: '2rem' }}>
                {appName} is the AI studio where authors write, illustrate, and publish without ever leaving the page.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3">
                <Link to="/login"
                  className="inline-flex items-center justify-center gap-2.5 no-underline rounded-xl text-sm font-bold"
                  style={{
                    padding: '0.875rem 1.75rem',
                    background: `linear-gradient(135deg,${A.amber},#f59e0b)`,
                    color: '#000',
                    animation: 'amber-pulse 3s ease-in-out infinite',
                  }}
                  aria-label="Start your book for free">
                  <BookOpen size={15} aria-hidden="true" />
                  Start Your Book — Free
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
                <Link to="/marketplace"
                  className="inline-flex items-center justify-center gap-2 no-underline rounded-xl text-sm font-medium transition-all"
                  style={{ padding: '0.875rem 1.5rem', background: 'rgba(255,255,255,0.05)', border: `1px solid ${A.borderStrong}`, color: A.textMuted }}>
                  <BookOpen size={14} aria-hidden="true" />
                  Browse Stories
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
                className="flex items-center gap-8 mt-10 pt-8"
                style={{ borderTop: `1px solid ${A.border}` }}
                role="list" aria-label="Platform statistics">
                {[
                  { val: '15k+', label: 'Stories Created' },
                  { val: '62',   label: 'Art Styles'      },
                  { val: '4.9★', label: 'Rating'          },
                ].map(s => (
                  <div key={s.label} role="listitem">
                    <div style={{ fontFamily: FS, fontSize: 22, fontWeight: 600, color: A.amber }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: A.textSubtle, marginTop: 2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — book mockup */}
            <motion.div
              initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              className="hidden lg:block">
              <HeroBookMockup />
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── Ticker ── */}
      <div className="py-3 overflow-hidden" style={{ borderTop: `1px solid ${A.border}`, borderBottom: `1px solid ${A.border}`, background: 'rgba(0,0,0,0.32)' }} aria-hidden="true">
        <div className="flex whitespace-nowrap" style={{ animation: 'ticker 28s linear infinite', gap: '3.5rem' }}>
          {[...Array(3)].map((_, rep) => (
            <div key={rep} className="flex items-center flex-shrink-0" style={{ gap: '3.5rem' }}>
              {['Manual Editing','AI Script Generation','AI Illustrations','62 Art Styles','Multi-Language','Collaboration','Marketplace','Series Support','Manga Mode'].map(item => (
                <span key={item} className="flex items-center gap-3"
                  style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.28em', color: A.textSubtle }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: `${A.amber}55`, flexShrink: 0 }} />
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Interactive Feature Demos ── */}
      <section id="features" className="py-24 px-6"
        style={{ background: `linear-gradient(to bottom,${A.bg},#0d1a2e)`, position: 'relative', zIndex: 1 }}>
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
                style={{ background: A.tealGlow, border: `1px solid ${A.teal}40` }}>
                <Zap size={12} style={{ color: A.teal }} aria-hidden="true" />
                <span style={{ fontSize: 11, fontWeight: 700, color: A.teal, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Live Demos</span>
              </div>
              <h2 style={{ fontFamily: FS, fontSize: 'clamp(34px,5vw,54px)', fontWeight: 400, color: A.text, lineHeight: 1.1, marginBottom: '0.75rem' }}>
                See It. Feel It. Make It.
              </h2>
              <p style={{ color: A.textMuted, maxWidth: 460, margin: '0 auto', fontSize: 15 }}>
                These aren't screenshots — try them right now.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[<AICoWriterDemo />, <AIIllustratorDemo />, <MultiLanguageDemo />, <FormatToggleDemo />].map((Demo, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}>
                {Demo}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Book Wizard ── */}
      <BookWizardSection />

      {/* ── Community Bookshelf ── */}
      <BookshelfSection />

      {/* ── Pricing ── */}
      <PricingSection />

      {/* ── Final CTA ── */}
      <section aria-label="Call to action" className="py-24 px-6" style={{ background: '#060d1a' }}>
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl p-12 relative overflow-hidden"
            style={{
              background: `linear-gradient(160deg,rgba(251,191,36,0.07) 0%,rgba(45,212,191,0.04) 100%)`,
              border: `1px solid ${A.amber}28`,
            }}
          >
            <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full pointer-events-none" aria-hidden="true"
              style={{ background: `radial-gradient(circle,${A.amber} 0%,transparent 70%)`, filter: 'blur(48px)', opacity: 0.18 }} />
            <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full pointer-events-none" aria-hidden="true"
              style={{ background: `radial-gradient(circle,${A.teal} 0%,transparent 70%)`, filter: 'blur(48px)', opacity: 0.13 }} />

            <div className="relative" style={{ zIndex: 2 }}>
              <div className="flex justify-center gap-0.5 mb-6" aria-label="5 star rating">
                {[...Array(5)].map((_, i) => <Star key={i} size={17} className="fill-current" style={{ color: A.amber }} aria-hidden="true" />)}
              </div>
              <h2 style={{ fontFamily: FS, fontSize: 'clamp(28px,4vw,46px)', fontWeight: 400, color: A.text, lineHeight: 1.1, marginBottom: '1rem' }}>
                Your Story Deserves to Exist.
              </h2>
              <p style={{ color: A.textMuted, fontSize: 16, lineHeight: 1.72, maxWidth: 400, margin: '0 auto 2rem' }}>
                Join thousands of authors who found their creative flow with {appName}.
              </p>
              <Link to="/login"
                className="inline-flex items-center gap-3 no-underline rounded-xl text-sm font-bold transition-all"
                style={{ padding: '1rem 2.25rem', background: `linear-gradient(135deg,${A.amber},#f59e0b)`, color: '#000', boxShadow: `0 0 44px ${A.amber}50` }}>
                <BookOpen size={16} aria-hidden="true" />
                Start Your Book — Free
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <p style={{ marginTop: 14, fontSize: 11, color: A.textSubtle }}>No credit card required · 5 free tokens on signup</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6" style={{ borderTop: `1px solid ${A.border}`, background: '#060d1a' }}>
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <div className="rounded-md flex items-center justify-center" style={{ width: 24, height: 24, background: `linear-gradient(135deg,${A.amber},#f59e0b)`, color: '#000' }}>
              <Sparkles size={11} aria-hidden="true" />
            </div>
            <span style={{ fontFamily: FS, fontSize: 15, fontWeight: 600, color: A.text }}>{appName}</span>
          </div>

          <nav aria-label="Footer navigation" className="flex items-center gap-6">
            {['Twitter', 'Discord', 'GitHub'].map(s => (
              <a key={s} href="#" className="text-xs font-medium no-underline transition-colors"
                style={{ color: A.textSubtle }}
                onMouseEnter={e => (e.currentTarget.style.color = A.text)}
                onMouseLeave={e => (e.currentTarget.style.color = A.textSubtle)}>
                {s}
              </a>
            ))}
          </nav>

          <p style={{ fontSize: 11, color: A.textSubtle, margin: 0 }}>&copy; 2026 {appName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
