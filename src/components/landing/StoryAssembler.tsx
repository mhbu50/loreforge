import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  useDraggable,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core';
import { Link } from 'react-router-dom';

// ─── Palette items ────────────────────────────────────────────
const PALETTE_ITEMS = [
  { id: 'character', label: 'Character',  emoji: '👤', color: '#FF4D6D', desc: 'The hero of your story' },
  { id: 'location',  label: 'Location',   emoji: '🏔️',  color: '#00F5FF', desc: 'Where it all unfolds' },
  { id: 'genre',     label: 'Genre',      emoji: '📚', color: '#B347EA', desc: 'The world\'s rules' },
  { id: 'mood',      label: 'Mood',       emoji: '🌙', color: '#FFB347', desc: 'The emotional tone' },
];

const SAMPLE_STORIES: Record<string, Record<string, string>> = {
  'character+location+genre+mood': {
    title: 'The Cartographer\'s Last Map',
    snippet: 'In the ruins of a starlit observatory, the last cartographer draws the only map the universe has never seen — a path to the place where stories begin. Every line she traces is a memory. Every memory, a door.',
  },
  'character+location+genre': {
    title: 'The Observatory\'s Secret',
    snippet: 'She came looking for answers. What she found instead was a map drawn in starlight — and a warning written in a language older than time itself.',
  },
  'character+location': {
    title: 'The Wanderer\'s Observatory',
    snippet: 'The observatory had stood empty for three centuries before she arrived. Now the stars were moving again.',
  },
  'character': {
    title: 'The Last Cartographer',
    snippet: 'She was the only one left who could read the star-charts. Now everything depended on her remembering.',
  },
};

function getStory(dropped: string[]) {
  const key = [...dropped].sort().join('+');
  return SAMPLE_STORIES[key] || SAMPLE_STORIES[dropped.sort().join('+').split('+').slice(0, 2).join('+')];
}

// ─── Draggable palette item ───────────────────────────────────
function DraggableItem({ item, alreadyDropped }: {
  item: typeof PALETTE_ITEMS[0];
  alreadyDropped: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0.75rem 1rem', borderRadius: 12, cursor: alreadyDropped ? 'default' : 'grab',
        background: alreadyDropped
          ? `${item.color}08`
          : isDragging ? `${item.color}20` : 'rgba(255,255,255,0.04)',
        border: alreadyDropped
          ? `1px solid ${item.color}25`
          : `1px solid ${isDragging ? item.color : 'rgba(165,180,252,0.10)'}`,
        opacity: isDragging ? 0.4 : alreadyDropped ? 0.45 : 1,
        transition: 'all 0.2s ease',
        userSelect: 'none',
        touchAction: 'none',
      }}
      aria-label={`Drag ${item.label} element`}
      aria-disabled={alreadyDropped}
    >
      <span style={{ fontSize: '1.3rem' }}>{item.emoji}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: alreadyDropped ? '#6472a4' : item.color,
          fontFamily: "'Cabinet Grotesk','Space Grotesk',sans-serif" }}>
          {item.label}
        </div>
        <div style={{ fontSize: 10, color: '#6472a4' }}>{item.desc}</div>
      </div>
      {alreadyDropped && (
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#22c55e' }}>✓</span>
      )}
      {!alreadyDropped && !isDragging && (
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#6472a4' }}>⠿ drag</span>
      )}
    </div>
  );
}

// ─── Droppable book zone ──────────────────────────────────────
function BookDropZone({ children, isOver, dropped }: {
  children: React.ReactNode;
  isOver: boolean;
  dropped: string[];
}) {
  const { setNodeRef } = useDroppable({ id: 'book' });

  return (
    <div
      ref={setNodeRef}
      className={isOver ? 'drop-active' : ''}
      aria-label="Drop story elements here to build your book"
      style={{
        minHeight: 280, borderRadius: 18, position: 'relative',
        background: isOver
          ? 'rgba(0,245,255,0.06)'
          : dropped.length > 0 ? 'rgba(19,24,50,0.7)' : 'rgba(0,0,0,0.3)',
        border: `2px dashed ${isOver ? '#00F5FF' : dropped.length > 0 ? 'rgba(165,180,252,0.25)' : 'rgba(165,180,252,0.12)'}`,
        transition: 'all 0.25s ease',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem', overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

// ─── Overlay item (what you see while dragging) ───────────────
function DragOverlayItem({ item }: { item: typeof PALETTE_ITEMS[0] | null }) {
  if (!item) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '0.75rem 1rem', borderRadius: 12,
      background: `${item.color}25`, border: `1px solid ${item.color}`,
      boxShadow: `0 0 24px ${item.color}50`, backdropFilter: 'blur(12px)',
      cursor: 'grabbing', userSelect: 'none', pointerEvents: 'none',
    }}>
      <span style={{ fontSize: '1.3rem' }}>{item.emoji}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: item.color,
        fontFamily: "'Cabinet Grotesk','Space Grotesk',sans-serif" }}>
        {item.label}
      </span>
    </div>
  );
}

// ─── Book cover preview ───────────────────────────────────────
const GRADIENT_BY_MOOD = [
  'linear-gradient(160deg,#1e1b4b,#312e81,#4c1d95)',
  'linear-gradient(160deg,#0c4a6e,#0e7490,#164e63)',
  'linear-gradient(160deg,#78350f,#b45309,#92400e)',
  'linear-gradient(160deg,#7c3aed,#be185d,#9f1239)',
];

function BookCoverPreview({ dropped }: { dropped: string[] }) {
  const story = getStory(dropped);
  const gradIdx = dropped.length % GRADIENT_BY_MOOD.length;
  const gradient = GRADIENT_BY_MOOD[gradIdx];
  const ITEMS = PALETTE_ITEMS.filter(p => dropped.includes(p.id));

  return (
    <div style={{ width: '100%' }}>
      {/* Small book cover */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <motion.div
          initial={{ rotateY: -90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 120 }}
          style={{ position: 'relative' }}
        >
          {/* Book spine */}
          <div style={{ position: 'absolute', left: -8, top: 0, bottom: 0, width: 8,
            background: 'rgba(0,0,0,0.55)', borderRadius: '3px 0 0 3px' }} />
          <div style={{
            width: 110, height: 150, borderRadius: '0 8px 8px 0',
            background: gradient, boxShadow: '12px 12px 36px rgba(0,0,0,0.65)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'space-between', padding: '1rem 0.75rem',
            overflow: 'hidden', position: 'relative',
          }}>
            {/* Dropped item emojis as decoration */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
              {ITEMS.map(item => (
                <span key={item.id} style={{ fontSize: '1.1rem', opacity: 0.7 }}>{item.emoji}</span>
              ))}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.35)', marginBottom: 5 }} />
              <p style={{ fontSize: 9, fontWeight: 800, color: '#fff', lineHeight: 1.3,
                fontFamily: "'Cabinet Grotesk','Space Grotesk',sans-serif", margin: 0 }}>
                {story?.title || 'Your Story'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Story snippet */}
      {story && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            padding: '1rem', borderRadius: 12,
            background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(165,180,252,0.1)',
            marginBottom: '0.75rem',
          }}>
          <p style={{ fontFamily: "'Satoshi','Inter',sans-serif",
            fontSize: 12, color: '#A5B4FC', lineHeight: 1.75, margin: 0,
            fontStyle: 'italic' }}>
            "{story.snippet}"
          </p>
        </motion.div>
      )}

      {/* Dropped chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        {ITEMS.map(item => (
          <motion.span key={item.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            style={{
              padding: '3px 10px', borderRadius: 999,
              background: `${item.color}18`, border: `1px solid ${item.color}40`,
              fontSize: 11, color: item.color, fontWeight: 700,
            }}>
            {item.emoji} {item.label}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

// ─── Public Export ────────────────────────────────────────────
export default function StoryAssembler() {
  const [dropped, setDropped]     = useState<string[]>([]);
  const [isOver, setIsOver]       = useState(false);
  const [activeId, setActiveId]   = useState<string | null>(null);

  const activeItem = PALETTE_ITEMS.find(p => p.id === activeId) || null;

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(e.active.id as string);
  }, []);

  const handleDragOver = useCallback((e: DragOverEvent) => {
    setIsOver(e.over?.id === 'book');
  }, []);

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    setActiveId(null);
    setIsOver(false);
    const { over, active } = e;
    if (over?.id === 'book') {
      const id = active.id as string;
      if (!dropped.includes(id)) {
        setDropped(prev => [...prev, id]);
      }
    }
  }, [dropped]);

  const reset = useCallback(() => setDropped([]), []);

  // Mobile tap-to-add fallback
  const tapAdd = useCallback((id: string) => {
    if (!dropped.includes(id)) {
      setDropped(prev => [...prev, id]);
    }
  }, [dropped]);

  return (
    <section style={{ padding: '7rem 2rem', background: 'linear-gradient(to bottom,#131832,#0B0E1A)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Heading */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '0.4rem 1.25rem', borderRadius: 999,
            background: 'rgba(179,71,234,0.08)', border: '1px solid rgba(179,71,234,0.28)',
            marginBottom: '1.25rem' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#B347EA',
              textTransform: 'uppercase', letterSpacing: '0.15em' }}>Story Assembler</span>
          </div>
          <h2 style={{ fontFamily: "'Cabinet Grotesk','Space Grotesk',sans-serif",
            fontSize: 'clamp(32px,4.5vw,54px)', fontWeight: 800,
            color: '#fff', lineHeight: 1.06, letterSpacing: '-0.025em', marginBottom: '0.75rem' }}>
            Drag. Drop.{' '}
            <span style={{ background: 'linear-gradient(135deg,#B347EA,#00F5FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Create.
            </span>
          </h2>
          <p style={{ fontSize: 16, color: '#A5B4FC', maxWidth: 480, margin: '0 auto' }}>
            Drag story elements into the forge. Watch your universe take shape in real time.
          </p>
        </motion.div>

        <DndContext
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>

            {/* Left: Palette */}
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontFamily: "'Cabinet Grotesk','Space Grotesk',sans-serif",
                  fontSize: 16, fontWeight: 700, color: '#A5B4FC', marginBottom: 4 }}>
                  Story Elements
                </h3>
                <p style={{ fontSize: 12, color: '#6472a4' }}>
                  Drag into the forge — or tap on mobile
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {PALETTE_ITEMS.map(item => (
                  <div key={item.id} onClick={() => tapAdd(item.id)}>
                    <DraggableItem item={item} alreadyDropped={dropped.includes(item.id)} />
                  </div>
                ))}
              </div>

              {dropped.length > 0 && (
                <button onClick={reset}
                  style={{
                    marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: 8,
                    background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.25)',
                    color: '#FF4D6D', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    width: '100%', transition: 'all 0.2s',
                  }}>
                  ↺ Reset Forge
                </button>
              )}
            </motion.div>

            {/* Right: Drop zone */}
            <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}>
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontFamily: "'Cabinet Grotesk','Space Grotesk',sans-serif",
                  fontSize: 16, fontWeight: 700, color: '#A5B4FC', marginBottom: 4 }}>
                  Story Forge
                </h3>
                <p style={{ fontSize: 12, color: '#6472a4' }}>
                  {dropped.length === 0 ? 'Drop elements here to begin' :
                   dropped.length < 4 ? `${4 - dropped.length} more element${dropped.length === 3 ? '' : 's'} to complete` :
                   'Your story is ready!'}
                </p>
              </div>

              <BookDropZone isOver={isOver} dropped={dropped}>
                {dropped.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#6472a4' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.75rem', opacity: 0.5 }}>📖</div>
                    <p style={{ fontSize: 13, fontFamily: "'Satoshi','Inter',sans-serif" }}>
                      Drop story elements here
                    </p>
                    <p style={{ fontSize: 11, marginTop: 4 }}>
                      {isOver ? '✨ Release to add!' : 'Drag from the palette'}
                    </p>
                  </div>
                ) : (
                  <BookCoverPreview dropped={dropped} />
                )}
              </BookDropZone>

              <AnimatePresence>
                {dropped.length >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ marginTop: '1.25rem', textAlign: 'center' }}
                  >
                    <Link to="/login"
                      className="no-underline"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 10,
                        padding: '0.875rem 2rem', borderRadius: 12, fontSize: 13, fontWeight: 800,
                        background: 'linear-gradient(135deg,#FF4D6D,#FFB347,#FF4D6D)',
                        backgroundSize: '200% auto', color: '#000', transition: 'all 0.35s ease',
                        boxShadow: '0 0 36px rgba(255,77,109,0.45)',
                        fontFamily: "'Cabinet Grotesk','Space Grotesk',sans-serif",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.backgroundPosition = 'right center';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 60px rgba(255,77,109,0.65)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.backgroundPosition = 'left center';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 36px rgba(255,77,109,0.45)';
                      }}>
                      🚀 Try the Full Version Free
                    </Link>
                    <p style={{ fontSize: 11, color: '#6472a4', marginTop: 8 }}>
                      No credit card · Full AI suite
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            <DragOverlayItem item={activeItem} />
          </DragOverlay>
        </DndContext>
      </div>
    </section>
  );
}
