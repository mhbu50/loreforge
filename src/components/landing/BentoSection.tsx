import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ─── 3D Tilt card wrapper ─────────────────────────────────────
function TiltCard({
  children, className = '', style = {}, glowColor = 'rgba(255,77,109,0.4)',
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  glowColor?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientY - rect.top)  / rect.height - 0.5) * -14;
    const y = ((e.clientX - rect.left) / rect.width  - 0.5) *  14;
    setTilt({ x, y });
  }, []);

  const reset = useCallback(() => { setTilt({ x: 0, y: 0 }); setHovered(false); }, []);

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={reset}
      className="card-3d"
      style={{
        transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hovered ? 1.025 : 1})`,
        boxShadow: hovered
          ? `0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px ${glowColor}`
          : '0 8px 32px rgba(0,0,0,0.4)',
        background: 'rgba(19,24,50,0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: hovered ? `1px solid ${glowColor}` : '1px solid rgba(165,180,252,0.10)',
        borderRadius: 20,
        overflow: 'hidden',
        transition: 'box-shadow 0.25s ease, border-color 0.25s ease, transform 0.1s ease',
        position: 'relative',
        ...style,
      }}>
      {/* Subtle gradient sheen on hover */}
      {hovered && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: `radial-gradient(circle at ${50 + tilt.y * 3}% ${50 - tilt.x * 3}%, ${glowColor} 0%, transparent 65%)`,
          opacity: 0.08,
        }} />
      )}
      <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>{children}</div>
    </div>
  );
}

// ─── Card 1: Command Palette ──────────────────────────────────
const CMD_ITEMS = [
  { icon: '📖', label: 'New Chapter',         shortcut: '⌘N' },
  { icon: '🎨', label: 'Generate Illustration', shortcut: '⌘G' },
  { icon: '🤖', label: 'AI Continue Writing',  shortcut: '⌘↵' },
  { icon: '🌍', label: 'Translate Page',        shortcut: '⌘T' },
  { icon: '📤', label: 'Publish to Marketplace', shortcut: '⌘P' },
];

function CommandPaletteCard() {
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, []);

  const filtered = CMD_ITEMS.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <TiltCard style={{ padding: '1.5rem' }} glowColor="rgba(0,245,255,0.4)">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '1rem' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00F5FF',
          boxShadow: '0 0 8px #00F5FF' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#00F5FF',
          textTransform: 'uppercase', letterSpacing: '0.14em' }}>Command Palette</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#6472a4',
          background: 'rgba(165,180,252,0.08)', padding: '2px 6px', borderRadius: 4,
          fontFamily: "'JetBrains Mono',monospace" }}>⌘K</span>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}>
            {/* Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 0.75rem',
              background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,245,255,0.25)',
              borderRadius: 10, marginBottom: '0.6rem' }}>
              <span style={{ fontSize: 12, color: '#6472a4' }}>🔍</span>
              <input
                value={query}
                onChange={e => { setQuery(e.target.value); setActive(0); }}
                placeholder="Search commands…"
                style={{ background: 'transparent', border: 'none', outline: 'none',
                  color: '#A5B4FC', fontSize: 13, width: '100%', fontFamily: "'Satoshi','Inter',sans-serif" }}
              />
            </div>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filtered.map((item, i) => (
                <div key={item.label}
                  onMouseEnter={() => setActive(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '0.55rem 0.75rem',
                    borderRadius: 8, cursor: 'pointer',
                    background: active === i ? 'rgba(0,245,255,0.10)' : 'transparent',
                    border: active === i ? '1px solid rgba(0,245,255,0.22)' : '1px solid transparent',
                    transition: 'all 0.18s',
                  }}>
                  <span style={{ fontSize: 14 }}>{item.icon}</span>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: active === i ? '#fff' : '#A5B4FC' }}>
                    {item.label}
                  </span>
                  <span style={{ fontSize: 10, color: '#6472a4',
                    fontFamily: "'JetBrains Mono',monospace",
                    background: 'rgba(165,180,252,0.06)', padding: '2px 6px', borderRadius: 4 }}>
                    {item.shortcut}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!open && (
        <div style={{ textAlign: 'center', padding: '1rem 0', color: '#6472a4', fontSize: 13 }}>
          Press <kbd style={{ background: 'rgba(165,180,252,0.08)', padding: '2px 6px', borderRadius: 4,
            fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>⌘K</kbd> to open
        </div>
      )}
    </TiltCard>
  );
}

// ─── Card 2: AI Style Switcher ────────────────────────────────
const ART_STYLES = [
  { id: 'anime',     label: 'Anime',     emoji: '✨', filter: 'saturate(1.8) contrast(1.1)', overlay: 'rgba(244,114,182,0.15)' },
  { id: 'watercolor',label: 'Watercolor',emoji: '🎨', filter: 'saturate(0.8) blur(0.5px)',   overlay: 'rgba(96,165,250,0.15)'  },
  { id: 'oil',       label: 'Oil Paint', emoji: '🖼️',  filter: 'contrast(1.2) saturate(1.4)', overlay: 'rgba(251,191,36,0.12)'  },
];

function AIStyleCard() {
  const [sel, setSel] = useState('anime');
  const style = ART_STYLES.find(s => s.id === sel)!;
  const [shimmer, setShimmer] = useState(false);

  const switchStyle = (id: string) => {
    setShimmer(true);
    setTimeout(() => { setSel(id); setShimmer(false); }, 350);
  };

  return (
    <TiltCard style={{ padding: '1.5rem' }} glowColor="rgba(255,179,71,0.4)">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '1rem' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFB347',
          boxShadow: '0 0 8px #FFB347' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#FFB347',
          textTransform: 'uppercase', letterSpacing: '0.14em' }}>AI Illustrator</span>
      </div>

      {/* Preview */}
      <div style={{ position: 'relative', aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', marginBottom: '1rem' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg,#1e3a5f,#065f46,#1e1b4b)',
          filter: shimmer ? 'brightness(2)' : style.filter,
          transition: 'filter 0.4s ease',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: style.overlay,
            transition: 'background 0.4s ease' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.5))' }}>🦊</span>
          </div>
        </div>
        {shimmer && (
          <div style={{ position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
            animation: 'shimmer 0.4s ease forwards', backgroundSize: '200% 100%' }} />
        )}
        <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.6)',
          borderRadius: 6, padding: '3px 8px', fontSize: 10, color: '#fff',
          fontFamily: "'JetBrains Mono',monospace" }}>
          {style.emoji} {style.label}
        </div>
      </div>

      {/* Swatches */}
      <div style={{ display: 'flex', gap: 8 }}>
        {ART_STYLES.map(s => (
          <button key={s.id} onClick={() => switchStyle(s.id)}
            style={{
              flex: 1, padding: '0.5rem', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: sel === s.id ? 'rgba(255,179,71,0.18)' : 'rgba(255,255,255,0.04)',
              outline: sel === s.id ? `1.5px solid #FFB347` : '1px solid rgba(255,255,255,0.06)',
              color: sel === s.id ? '#FFB347' : '#6472a4',
              fontSize: 11, fontWeight: 700, transition: 'all 0.2s',
              fontFamily: "'Satoshi','Inter',sans-serif",
            }}>
            {s.emoji} {s.label}
          </button>
        ))}
      </div>
    </TiltCard>
  );
}

// ─── Card 3: Multi-User Collaboration ────────────────────────
function CollabCard() {
  const [count, setCount] = useState(3);
  const [pulseIdx, setPulseIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setPulseIdx(i => (i + 1) % 3);
      if (Math.random() > 0.7) setCount(c => Math.min(c + 1, 12));
    }, 1800);
    return () => clearInterval(id);
  }, []);

  const users = [
    { name: 'Sofia K.', color: '#FF4D6D', avatar: 'S' },
    { name: 'Kenji M.', color: '#00F5FF', avatar: 'K' },
    { name: 'Amara J.', color: '#B347EA', avatar: 'A' },
  ];

  return (
    <TiltCard style={{ padding: '1.5rem' }} glowColor="rgba(179,71,234,0.4)">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '1.2rem' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#B347EA',
          boxShadow: '0 0 8px #B347EA' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#B347EA',
          textTransform: 'uppercase', letterSpacing: '0.14em' }}>Co-authoring</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e',
            animation: 'comet-pulse 1.5s ease infinite' }} />
          <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>{count} online</span>
        </div>
      </div>

      {/* Avatar + pulse line */}
      <div style={{ position: 'relative', padding: '1rem 0', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, position: 'relative' }}>
          {users.map((user, i) => (
            <div key={i} style={{ position: 'relative', zIndex: 3 - i }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: `${user.color}25`,
                border: `2px solid ${user.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 800, color: user.color,
                marginLeft: i > 0 ? -12 : 0,
                transition: 'transform 0.2s',
                transform: pulseIdx === i ? 'scale(1.15)' : 'scale(1)',
                boxShadow: pulseIdx === i ? `0 0 16px ${user.color}80` : 'none',
                fontFamily: "'Cabinet Grotesk','Space Grotesk',sans-serif",
              }}>{user.avatar}</div>
              {/* Pulsing energy dot */}
              {pulseIdx === i && (
                <div style={{
                  position: 'absolute', bottom: -2, right: -2,
                  width: 10, height: 10, borderRadius: '50%', background: user.color,
                  animation: 'comet-pulse 0.8s ease infinite',
                  boxShadow: `0 0 8px ${user.color}`,
                }} />
              )}
            </div>
          ))}

          {/* Energy beam */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <line x1="20%" y1="50%" x2="80%" y2="50%"
              stroke={`${users[pulseIdx].color}60`} strokeWidth={1.5} strokeDasharray="4 3" />
          </svg>
        </div>
      </div>

      {/* Live edits feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {users.map((user, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8,
            padding: '0.4rem 0.7rem', borderRadius: 8,
            background: pulseIdx === i ? `${user.color}10` : 'rgba(255,255,255,0.03)',
            transition: 'background 0.3s' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: user.color,
              flexShrink: 0, boxShadow: `0 0 6px ${user.color}` }} />
            <span style={{ fontSize: 11, color: '#A5B4FC', flex: 1 }}>
              {user.name} {pulseIdx === i ? 'is typing…' : 'edited Chapter 3'}
            </span>
            <span style={{ fontSize: 9, color: '#6472a4' }}>now</span>
          </div>
        ))}
      </div>
    </TiltCard>
  );
}

// ─── Card 4: Publish Rocket ───────────────────────────────────
function PublishRocketCard() {
  const [launched, setLaunched] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; color: string }[]>([]);

  const launch = () => {
    if (launched) return;
    setLaunched(true);
    const cols = ['#FF4D6D','#FFB347','#00F5FF','#B347EA','#A5B4FC'];
    setParticles(Array.from({ length: 12 }, (_, i) => ({
      id: i, x: -30 + (i * 5), color: cols[i % cols.length],
    })));
    setTimeout(() => { setLaunched(false); setParticles([]); }, 2200);
  };

  return (
    <TiltCard style={{ padding: '1.5rem' }} glowColor="rgba(255,77,109,0.4)">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '1.2rem' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF4D6D',
          boxShadow: '0 0 8px #FF4D6D' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#FF4D6D',
          textTransform: 'uppercase', letterSpacing: '0.14em' }}>Publishing</span>
      </div>

      <div style={{ textAlign: 'center', padding: '1.5rem 0 1rem', position: 'relative' }} onClick={launch}>
        <motion.div
          animate={launched ? { y: -80, opacity: 0, scale: 0.5 } : { y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeIn' }}
          style={{ fontSize: '3rem', cursor: 'pointer', display: 'inline-block',
            filter: 'drop-shadow(0 0 16px rgba(255,77,109,0.6))',
            userSelect: 'none' }}>
          🚀
        </motion.div>

        {/* Particle trail */}
        {particles.map(p => (
          <motion.div key={p.id}
            initial={{ y: 0, x: p.x, opacity: 1, scale: 1 }}
            animate={{ y: 60, opacity: 0, scale: 0 }}
            transition={{ duration: 0.8, delay: p.id * 0.04, ease: 'easeOut' }}
            style={{ position: 'absolute', bottom: '1rem', left: '50%',
              width: 6, height: 6, borderRadius: '50%', background: p.color,
              pointerEvents: 'none', boxShadow: `0 0 8px ${p.color}` }}
          />
        ))}

        {!launched && (
          <p style={{ fontSize: 12, color: '#6472a4', marginTop: 4 }}>Hover to launch</p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { label: 'PDF (Print-ready)', done: true },
          { label: 'EPUB (eReader)',    done: true },
          { label: 'Web Preview',       done: true },
          { label: 'Marketplace Listing', done: false },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12, color: item.done ? '#A5B4FC' : '#6472a4' }}>
            <span style={{ color: item.done ? '#22c55e' : '#6472a4', fontSize: 12 }}>
              {item.done ? '✓' : '○'}
            </span>
            {item.label}
          </div>
        ))}
      </div>
    </TiltCard>
  );
}

// ─── Card 5: Writing stats ────────────────────────────────────
function WritingStatsCard() {
  const [wpm] = useState(Math.floor(42 + Math.random() * 18));

  return (
    <TiltCard style={{ padding: '1.5rem' }} glowColor="rgba(165,180,252,0.35)">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '1.25rem' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#A5B4FC',
          boxShadow: '0 0 8px #A5B4FC' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#A5B4FC',
          textTransform: 'uppercase', letterSpacing: '0.14em' }}>Writing Session</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: '1rem' }}>
        {[
          { val: '1,847', label: 'Words today', color: '#A5B4FC' },
          { val: `${wpm}`, label: 'WPM',          color: '#00F5FF' },
          { val: '94%',   label: 'Focus score',  color: '#FFB347' },
          { val: '3h 12m',label: 'Session time', color: '#B347EA' },
        ].map(stat => (
          <div key={stat.label} style={{ padding: '0.75rem', borderRadius: 10,
            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(165,180,252,0.08)' }}>
            <div style={{ fontFamily: "'Cabinet Grotesk','Space Grotesk',sans-serif",
              fontSize: 22, fontWeight: 800, color: stat.color, lineHeight: 1, marginBottom: 3 }}>
              {stat.val}
            </div>
            <div style={{ fontSize: 10, color: '#6472a4', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10,
          color: '#6472a4', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          <span>Daily goal</span>
          <span style={{ color: '#A5B4FC' }}>1,847 / 2,000</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'rgba(165,180,252,0.12)', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: '92%' }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
            style={{ height: '100%', background: 'linear-gradient(90deg,#A5B4FC,#B347EA)', borderRadius: 3 }}
          />
        </div>
      </div>
    </TiltCard>
  );
}

// ─── Card 6: Multi-language ───────────────────────────────────
const LANG_SHOWCASE = [
  { lang: 'العربية',   text: 'في مكتبة النجوم، وجدت خريطة الكون.', dir: 'rtl' as const, color: '#FFB347' },
  { lang: '日本語',      text: '星の図書館で、宇宙の地図を見つけた。',              dir: 'ltr' as const, color: '#FF4D6D' },
  { lang: 'English',   text: 'In the star library, I found the map of the universe.', dir: 'ltr' as const, color: '#00F5FF' },
];

function LanguageCard() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % LANG_SHOWCASE.length), 3200);
    return () => clearInterval(id);
  }, []);

  const current = LANG_SHOWCASE[idx];

  return (
    <TiltCard style={{ padding: '1.5rem' }} glowColor={`${current.color}60`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '1.2rem' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFB347',
          boxShadow: '0 0 8px #FFB347' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#FFB347',
          textTransform: 'uppercase', letterSpacing: '0.14em' }}>62 Languages</span>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', flexWrap: 'wrap' }}>
        {LANG_SHOWCASE.map((l, i) => (
          <button key={i} onClick={() => setIdx(i)}
            style={{
              padding: '0.3rem 0.7rem', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: idx === i ? `${l.color}20` : 'rgba(255,255,255,0.04)',
              outline: idx === i ? `1.5px solid ${l.color}` : '1px solid rgba(255,255,255,0.06)',
              color: idx === i ? l.color : '#6472a4',
              fontSize: 11, fontWeight: 700, transition: 'all 0.2s',
            }}>
            {l.lang}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={idx}
          initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28 }}
          style={{
            padding: '1.1rem', borderRadius: 12,
            background: 'rgba(0,0,0,0.35)', border: `1px solid ${current.color}25`,
            direction: current.dir, textAlign: current.dir === 'rtl' ? 'right' : 'left',
          }}>
          <p style={{ fontFamily: "'Satoshi','Inter',sans-serif", fontSize: 14,
            color: '#F1F5F9', lineHeight: 1.75, margin: 0 }}>
            {current.text}
          </p>
          <p style={{ fontSize: 10, color: current.color, marginTop: 6, marginBottom: 0,
            textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            {current.lang}
          </p>
        </motion.div>
      </AnimatePresence>
    </TiltCard>
  );
}

// ─── Public Export ────────────────────────────────────────────
export default function BentoSection() {
  return (
    <section style={{ padding: '7rem 2rem', background: '#0B0E1A', position: 'relative' }}>
      {/* Background nebula glow */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }} aria-hidden="true">
        <div style={{
          position: 'absolute', top: '20%', left: '-10%', width: 500, height: 500,
          borderRadius: '50%', opacity: 0.06,
          background: 'radial-gradient(circle,#B347EA 0%,transparent 70%)',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '-5%', width: 400, height: 400,
          borderRadius: '50%', opacity: 0.05,
          background: 'radial-gradient(circle,#00F5FF 0%,transparent 70%)',
          filter: 'blur(60px)',
        }} />
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Heading */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '0.4rem 1.25rem', borderRadius: 999,
            background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.25)',
            marginBottom: '1.25rem' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#FF4D6D',
              textTransform: 'uppercase', letterSpacing: '0.15em' }}>Platform Features</span>
          </div>
          <h2 style={{ fontFamily: "'Cabinet Grotesk','Space Grotesk',sans-serif",
            fontSize: 'clamp(34px,5vw,56px)', fontWeight: 800,
            color: '#fff', lineHeight: 1.06, letterSpacing: '-0.025em' }}>
            Everything, Alive with{' '}
            <span style={{ background: 'linear-gradient(135deg,#FF4D6D,#FFB347)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Motion
            </span>
          </h2>
        </motion.div>

        {/* Bento grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'auto auto',
          gap: 16,
        }}>
          {/* Row 1: CMD palette (wide) + AI style + collab */}
          <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.05 }}
            style={{ gridColumn: 'span 1' }}>
            <CommandPaletteCard />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.10 }}>
            <AIStyleCard />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.15 }}>
            <CollabCard />
          </motion.div>

          {/* Row 2: stats (wide) + publish + language */}
          <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.20 }}>
            <WritingStatsCard />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.25 }}>
            <PublishRocketCard />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.30 }}>
            <LanguageCard />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
