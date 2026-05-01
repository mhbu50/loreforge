import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';

// ─── Scene data ──────────────────────────────────────────────
const SCENES = [
  {
    id: 'coauthor',
    badge: 'AI Co-Author',
    badgeColor: '#00F5FF',
    headline: 'Your story writes itself.',
    sub: 'An AI partner that understands narrative arc, tone, and character voice. It doesn\'t just autocomplete — it co-creates.',
    visual: 'manuscript',
  },
  {
    id: 'storybible',
    badge: 'Story Bible',
    badgeColor: '#B347EA',
    headline: 'Every world, mapped and alive.',
    sub: 'Characters, lore, locations — all linked in a living knowledge graph. Change one fact and your whole universe updates.',
    visual: 'mindmap',
  },
  {
    id: 'design',
    badge: 'Design Studio',
    badgeColor: '#FFB347',
    headline: '62 art styles. Infinite worlds.',
    sub: 'From manga panels to oil painting, watercolor to cyberpunk neon — AI-illustrated pages that look like a real publisher made them.',
    visual: 'covers',
  },
  {
    id: 'community',
    badge: 'Community',
    badgeColor: '#FF4D6D',
    headline: 'A universe of creators.',
    sub: 'Publish to the marketplace. Collaborate with writers across the globe. Your readers are already waiting.',
    visual: 'constellation',
  },
];

// ─── Manuscript visual ────────────────────────────────────────
const MANUSCRIPT_LINES = [
  'The observatory had been dark for three centuries',
  'until the night Lyra pressed her palm to the brass door.',
  'Inside, the star charts moved — not by wind,',
  'but by something older. Something that remembered her.',
  '',
  'She traced a constellation no textbook had named.',
  'It pulsed once. Twice. Then wrote back.',
];

function ManuscriptVisual({ progress }: { progress: number }) {
  const revealedChars = Math.floor(progress * MANUSCRIPT_LINES.join('\n').length * 1.1);
  let count = 0;

  return (
    <div style={{
      background: 'rgba(13,18,48,0.92)',
      border: '1px solid rgba(0,245,255,0.18)',
      borderRadius: 16,
      padding: '2rem',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 13,
      lineHeight: 1.9,
      color: '#A5B4FC',
      position: 'relative',
      overflow: 'hidden',
      minHeight: 280,
    }}>
      {/* Header bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', alignItems: 'center' }}>
        {['#FF5F57','#FEBC2E','#28C840'].map((c, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
        ))}
        <span style={{ marginLeft: 8, fontSize: 10, color: '#6472a4', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          chapter_01.story
        </span>
      </div>

      {MANUSCRIPT_LINES.map((line, li) => {
        const rendered: React.ReactNode[] = [];
        for (let ci = 0; ci < line.length; ci++) {
          const charIdx = count;
          const visible = charIdx < revealedChars;
          const isAI = li >= 4;
          rendered.push(
            <span key={ci} style={{
              color: visible ? (isAI ? '#00F5FF' : '#A5B4FC') : 'transparent',
              transition: 'color 0.08s',
            }}>{line[ci]}</span>
          );
          count++;
        }
        count++; // newline
        return (
          <div key={li} style={{ minHeight: '1.9em' }}>
            {rendered}
            {li === 3 && count <= revealedChars + 5 && (
              <span style={{ display: 'inline-block', width: 2, height: 13, background: '#00F5FF', marginLeft: 2, verticalAlign: 'middle' }} className="type-cursor" />
            )}
          </div>
        );
      })}

      {/* Glowing quill icon */}
      <div style={{
        position: 'absolute', bottom: '1.2rem', right: '1.2rem',
        fontSize: '1.5rem', opacity: 0.6,
        filter: 'drop-shadow(0 0 8px rgba(0,245,255,0.8))',
      }}>🪶</div>
    </div>
  );
}

// ─── Mind-map visual ──────────────────────────────────────────
const NODES = [
  { id: 'center', label: 'Your Story', x: 50, y: 50, r: 28, color: '#B347EA', glow: true },
  { id: 'char',   label: 'Characters', x: 20, y: 22, r: 22, color: '#FF4D6D', glow: false },
  { id: 'loc',    label: 'Locations',  x: 78, y: 20, r: 22, color: '#FFB347', glow: false },
  { id: 'plot',   label: 'Plot Arcs',  x: 78, y: 75, r: 22, color: '#00F5FF', glow: false },
  { id: 'lore',   label: 'World Lore', x: 22, y: 75, r: 22, color: '#A5B4FC', glow: false },
];
const EDGES = [
  ['center','char'], ['center','loc'], ['center','plot'], ['center','lore'],
  ['char','lore'], ['plot','lore'],
];

function MindMapVisual({ progress }: { progress: number }) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: 16, overflow: 'hidden',
      background: 'rgba(13,18,48,0.92)', border: '1px solid rgba(179,71,234,0.2)' }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0 }}>
        {/* Edges */}
        {EDGES.map(([a, b], i) => {
          const na = NODES.find(n => n.id === a)!;
          const nb = NODES.find(n => n.id === b)!;
          const visible = progress > i * 0.12;
          return (
            <line key={i}
              x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
              stroke={visible ? `${na.color}60` : 'transparent'}
              strokeWidth={0.6}
              strokeDasharray={visible ? 'none' : '2 2'}
              style={{ transition: 'stroke 0.4s ease' }}
            />
          );
        })}
        {/* Nodes */}
        {NODES.map((node, i) => {
          const visible = progress > i * 0.15;
          const isHov = hovered === node.id;
          return (
            <g key={node.id}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}>
              {node.glow && (
                <circle cx={node.x} cy={node.y} r={node.r + 6}
                  fill={`${node.color}15`}
                  style={{ animation: 'comet-pulse 2.5s ease-in-out infinite' }}
                />
              )}
              <circle cx={node.x} cy={node.y} r={visible ? node.r * (isHov ? 1.15 : 1) : 0}
                fill={`${node.color}22`}
                stroke={visible ? node.color : 'transparent'}
                strokeWidth={isHov ? 1 : 0.7}
                style={{ transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)', filter: isHov ? `drop-shadow(0 0 6px ${node.color})` : 'none' }}
              />
              {visible && (
                <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="middle"
                  fill={node.color} fontSize={node.id === 'center' ? 4.5 : 3.8} fontWeight="700"
                  fontFamily="Inter,system-ui,sans-serif">
                  {node.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hovered && hovered !== 'center' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(19,24,50,0.95)', border: '1px solid rgba(165,180,252,0.2)',
              borderRadius: 10, padding: '0.6rem 1rem', fontSize: 12, color: '#A5B4FC',
              backdropFilter: 'blur(12px)', whiteSpace: 'nowrap', pointerEvents: 'none',
            }}>
            {hovered === 'char' && '👤 Lyra Voss — Cartographer, 28'}
            {hovered === 'loc'  && '🏔️ The Obsidian Observatory, Northern Reach'}
            {hovered === 'plot' && '📈 Act II: The Star Chart Awakens'}
            {hovered === 'lore' && '📚 Star-script is a lost language of the Ancients'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Book covers carousel ─────────────────────────────────────
const COVERS = [
  { title: 'Neon Samurai',       style: 'Anime',      gradient: 'linear-gradient(160deg,#0891b2,#1e40af)', emoji: '⚔️' },
  { title: 'Ember Cartographer', style: 'Watercolor',  gradient: 'linear-gradient(160deg,#7c3aed,#be185d)', emoji: '🗺️' },
  { title: 'Desert Oracle',      style: 'Oil Paint',   gradient: 'linear-gradient(160deg,#78350f,#b45309)', emoji: '🏜️' },
  { title: 'Starfall Protocol',  style: 'Cyberpunk',   gradient: 'linear-gradient(160deg,#064e3b,#0f172a)', emoji: '🌠' },
  { title: 'Foxfire Journals',   style: 'Sketch',      gradient: 'linear-gradient(160deg,#1e3a5f,#065f46)', emoji: '🦊' },
];

function CoversCarousel({ progress }: { progress: number }) {
  const active = Math.min(Math.floor(progress * COVERS.length), COVERS.length - 1);

  return (
    <div style={{ position: 'relative', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', perspective: 900 }}>
        {COVERS.map((cover, i) => {
          const offset = i - active;
          const absOff = Math.abs(offset);
          return (
            <div key={i} style={{
              width: absOff === 0 ? 130 : 80,
              height: absOff === 0 ? 185 : 115,
              borderRadius: 10,
              background: cover.gradient,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
              padding: '0.6rem',
              transform: `perspective(900px) rotateY(${offset * 24}deg) translateX(${offset * 8}px) scale(${absOff === 0 ? 1 : 0.78})`,
              transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
              zIndex: 5 - absOff,
              boxShadow: absOff === 0
                ? '0 24px 60px rgba(0,0,0,0.65), 0 0 40px rgba(255,179,71,0.25)'
                : '0 8px 24px rgba(0,0,0,0.5)',
              opacity: absOff > 2 ? 0 : 1 - absOff * 0.28,
              flexShrink: 0,
              overflow: 'hidden',
            }}>
              <div style={{ fontSize: absOff === 0 ? '2.5rem' : '1.5rem', marginBottom: 4, opacity: 0.7 }}>{cover.emoji}</div>
              {absOff === 0 && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: '#fff', marginBottom: 2, fontFamily: "'Cabinet Grotesk','Space Grotesk',sans-serif" }}>{cover.title}</p>
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{cover.style}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Particle burst for active */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
        {[...Array(8)].map((_, i) => {
          const angle = (i / 8) * 360;
          return (
            <div key={i} style={{
              position: 'absolute',
              width: 4, height: 4,
              borderRadius: '50%',
              background: COVERS[active].gradient,
              transform: `rotate(${angle}deg) translateX(70px)`,
              animation: 'comet-pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.12}s`,
              filter: 'blur(1px)',
            }} />
          );
        })}
      </div>
      <p style={{ textAlign: 'center', fontSize: 12, color: '#6472a4', marginTop: '1.5rem', fontFamily: "'JetBrains Mono',monospace" }}>
        AI style: <span style={{ color: COVERS[active].gradient.includes('#0891') ? '#00F5FF' : '#FFB347' }}>{COVERS[active].style}</span>
      </p>
    </div>
  );
}

// ─── Constellation (community) visual ────────────────────────
function ConstellationVisual({ progress }: { progress: number }) {
  const stars = useMemo_stars();

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: 16, overflow: 'hidden',
      background: 'radial-gradient(ellipse at center, #131832 0%, #0B0E1A 80%)' }}>
      <svg width="100%" height="100%" viewBox="0 0 400 300">
        {/* Connection lines */}
        {stars.slice(0, Math.floor(progress * stars.length * 1.5)).map((_, i) => {
          if (i === 0) return null;
          const a = stars[i % stars.length];
          const b = stars[(i + 3) % stars.length];
          return (
            <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="rgba(165,180,252,0.12)" strokeWidth={0.5} />
          );
        })}
        {/* Stars */}
        {stars.map((star, i) => {
          const visible = i / stars.length < progress * 1.4;
          return (
            <g key={i}>
              <circle cx={star.x} cy={star.y} r={visible ? star.r + 2 : 0}
                fill={`${star.color}20`} style={{ transition: 'r 0.3s ease' }} />
              <circle cx={star.x} cy={star.y} r={visible ? star.r : 0}
                fill={star.color}
                style={{ transition: 'r 0.3s ease', filter: `drop-shadow(0 0 4px ${star.color})` }} />
            </g>
          );
        })}
      </svg>
      {/* Stat beacons */}
      {[
        { label: '15k+', sub: 'Stories',   x: '15%', y: '18%', color: '#FF4D6D' },
        { label: '62',   sub: 'Art Styles', x: '78%', y: '15%', color: '#00F5FF' },
        { label: '4.9★', sub: 'Rating',    x: '80%', y: '74%', color: '#FFB347' },
        { label: '128',  sub: 'Countries', x: '12%', y: '75%', color: '#B347EA' },
      ].map((beacon, i) => (
        <motion.div key={i}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={progress > 0.3 + i * 0.15 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
          style={{
            position: 'absolute', left: beacon.x, top: beacon.y,
            transform: 'translate(-50%,-50%)',
            textAlign: 'center',
          }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: beacon.color,
            fontFamily: "'Cabinet Grotesk','Space Grotesk',sans-serif",
            textShadow: `0 0 16px ${beacon.color}` }}>
            {beacon.label}
          </div>
          <div style={{ fontSize: 9, color: '#6472a4', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            {beacon.sub}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// helper
function useMemo_stars() {
  return React.useMemo(() => {
    const palette = ['#A5B4FC','#B347EA','#00F5FF','#FF4D6D','#FFB347'];
    return Array.from({ length: 40 }, (_, i) => ({
      x: 15 + Math.sin(i * 1.7 + 0.3) * 170 + 185,
      y: 15 + Math.cos(i * 2.3 + 0.8) * 120 + 150,
      r: 1.5 + (i % 4) * 0.8,
      color: palette[i % palette.length],
    }));
  }, []);
}

// ─── Single sticky scene ──────────────────────────────────────
function NebulaScene({ scene, index, totalScenes }: {
  scene: typeof SCENES[0]; index: number; totalScenes: number
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end start'] });

  const progress = useTransform(scrollYProgress, [0.1, 0.65], [0, 1]);
  const [prog, setProg] = React.useState(0);
  useEffect(() => {
    const unsub = progress.on('change', v => setProg(v));
    return unsub;
  }, [progress]);

  const textY   = useTransform(scrollYProgress, [0.05, 0.5], [48, 0]);
  const textOp  = useTransform(scrollYProgress, [0.08, 0.38], [0, 1]);
  const vizOp   = useTransform(scrollYProgress, [0.15, 0.45], [0, 1]);
  const vizScale= useTransform(scrollYProgress, [0.15, 0.45], [0.92, 1]);

  return (
    <div ref={containerRef} style={{ minHeight: '120vh', display: 'flex', alignItems: 'center', padding: '8vh 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '0 2rem',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>

        {/* Left: Text */}
        <motion.div style={{ y: textY, opacity: textOp }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '0.35rem 1rem', borderRadius: 999,
            background: `${scene.badgeColor}15`,
            border: `1px solid ${scene.badgeColor}40`,
            marginBottom: '1.25rem',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: scene.badgeColor,
              boxShadow: `0 0 8px ${scene.badgeColor}` }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: scene.badgeColor,
              textTransform: 'uppercase', letterSpacing: '0.14em' }}>{scene.badge}</span>
          </div>

          <h2 style={{
            fontFamily: "'Cabinet Grotesk','Space Grotesk',system-ui,sans-serif",
            fontSize: 'clamp(32px, 4.5vw, 52px)',
            fontWeight: 800, lineHeight: 1.08,
            color: '#fff', marginBottom: '1.1rem',
            letterSpacing: '-0.02em',
          }}>
            {scene.headline}
          </h2>
          <p style={{ fontSize: 16, color: '#A5B4FC', lineHeight: 1.7, maxWidth: 400 }}>
            {scene.sub}
          </p>
        </motion.div>

        {/* Right: Visual */}
        <motion.div style={{ opacity: vizOp, scale: vizScale }}>
          {scene.visual === 'manuscript' && <ManuscriptVisual progress={prog} />}
          {scene.visual === 'mindmap'    && <MindMapVisual progress={prog} />}
          {scene.visual === 'covers'     && <CoversCarousel progress={prog} />}
          {scene.visual === 'constellation' && <ConstellationVisual progress={prog} />}
        </motion.div>
      </div>
    </div>
  );
}

// ─── Public Export ────────────────────────────────────────────
export default function ScrollNebula() {
  return (
    <section style={{ background: 'linear-gradient(to bottom, #0B0E1A, #131832, #0B0E1A)' }}>
      {/* Section heading */}
      <div style={{ textAlign: 'center', padding: '7rem 2rem 3rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '0.4rem 1.25rem', borderRadius: 999,
            background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.22)',
            marginBottom: '1.5rem' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#00F5FF',
              textTransform: 'uppercase', letterSpacing: '0.15em' }}>Story Journey</span>
          </div>
          <h2 style={{
            fontFamily: "'Cabinet Grotesk','Space Grotesk',sans-serif",
            fontSize: 'clamp(36px,5vw,62px)', fontWeight: 800,
            color: '#fff', lineHeight: 1.06, letterSpacing: '-0.025em',
          }}>
            The Creative Universe<br />
            <span style={{ background: 'linear-gradient(135deg,#00F5FF,#B347EA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Unfolds as You Scroll
            </span>
          </h2>
        </motion.div>
      </div>

      {SCENES.map((scene, i) => (
        <NebulaScene key={scene.id} scene={scene} index={i} totalScenes={SCENES.length} />
      ))}
    </section>
  );
}
