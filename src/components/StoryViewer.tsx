import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Mic2,
  FileText,
  ShoppingBag,
  Star,
  LayoutGrid,
  Volume2,
  Maximize2,
  Minimize2,
  Share2,
  Download,
  Type,
  Globe,
  Sparkles,
  Edit3,
  Scroll,
  GitBranch,
  BookOpen,
} from 'lucide-react';
import { Story, StoryPage, BranchChoice } from '../types';
import { FONTS } from '../constants';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

interface StoryViewerProps {
  story: Story;
  onClose: () => void;
  onEdit?: (story: Story) => void;
  narrator: string;
}

export default function StoryViewer({ story, onClose, onEdit, narrator }: StoryViewerProps) {
  const [currentPage, setCurrentPage] = useState(story.coverImage ? -1 : 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isCinemaMode, setIsCinemaMode] = useState(true);
  const [isDyslexicFont, setIsDyslexicFont] = useState(false);
  const [isBedtimeMode, setIsBedtimeMode] = useState(false);
  // Immersive reader mode — vertical scroll with image reveals
  const [isImmersiveMode, setIsImmersiveMode] = useState(false);
  // Branching: track which branch path is active per page (pageIndex → choiceId)
  const [activeBranches, setActiveBranches] = useState<Record<number, string>>({});
  // Branching: which branch pages we're reading (pageIndex → pages)
  const [branchPageStack, setBranchPageStack] = useState<{ choiceText: string; pages: { text: string; imageUrl?: string }[] } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Intersection observer for immersive image reveals
  const imageObserverRef = useRef<IntersectionObserver | null>(null);

  const handleShare = () => {
    const url = `${window.location.origin}/story/${story.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Story link copied to clipboard!");
  };

  const handleExport = (format: 'epub' | 'mobi') => {
    toast.info(`Preparing ${format.toUpperCase()} export...`);
    setTimeout(() => {
      toast.success(`${format.toUpperCase()} file ready for download!`);
    }, 2000);
  };

  const currentPageStyle = story.pages[currentPage]?.style || story.style;
  const styleClass = currentPageStyle ? `style-${currentPageStyle}` : '';

  const totalPages = story.pages.length;
  const hasCovers = !!story.coverImage;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 z-[100] flex flex-col",
        "bg-[#050505] text-white",
        isBedtimeMode && "sepia-[0.4] brightness-[0.85]",
        styleClass
      )}
    >
      {/* Atmosphere */}
      <div className="atmosphere opacity-15 pointer-events-none" />

      {/* ── Header ── */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-5">
        {/* Left: close + title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-3 bg-white/8 border border-white/10 rounded-2xl hover:bg-[#D97757]/10 hover:border-[#D97757]/20 text-white/60 hover:text-[#D97757] transition-all"
          >
            <X size={20} />
          </button>
          <div>
            <h2 className="text-xl font-semibold leading-none text-white">{story.title}</h2>
            <p className="text-[10px] small-caps tracking-widest text-white/30 mt-0.5">By {story.authorName}</p>
          </div>
        </div>

        {/* Right: toolbar */}
        <div className="flex items-center gap-2">
          {/* Immersive Reader toggle */}
          <button
            onClick={() => setIsImmersiveMode(!isImmersiveMode)}
            className={cn(
              "p-3 rounded-2xl border transition-all",
              isImmersiveMode
                ? "bg-[#D97757]/20 border-[#D97757]/40 text-[#D97757]"
                : "bg-white/8 border-white/10 text-white/60 hover:bg-[#D97757]/10 hover:border-[#D97757]/20 hover:text-[#D97757]"
            )}
            title="Immersive Reader Mode (scroll)"
          >
            <Scroll size={18} />
          </button>

          <button
            onClick={() => setIsDyslexicFont(!isDyslexicFont)}
            className={cn(
              "p-3 rounded-2xl border transition-all",
              isDyslexicFont
                ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                : "bg-white/8 border-white/10 text-white/60 hover:bg-[#D97757]/10 hover:border-[#D97757]/20 hover:text-[#D97757]"
            )}
            title="Dyslexia Friendly Font"
          >
            <Type size={18} />
          </button>

          <button
            onClick={handleShare}
            className="p-3 bg-white/8 border border-white/10 rounded-2xl hover:bg-[#D97757]/10 hover:border-[#D97757]/20 text-white/60 hover:text-[#D97757] transition-all"
            title="Share Story"
          >
            <Share2 size={18} />
          </button>

          <div className="relative group">
            <button className="p-3 bg-white/8 border border-white/10 rounded-2xl hover:bg-[#D97757]/10 hover:border-[#D97757]/20 text-white/60 hover:text-[#D97757] transition-all">
              <Download size={18} />
            </button>
            <div className="absolute right-0 top-full mt-2 hidden group-hover:block bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 min-w-[120px]">
              <button
                onClick={() => handleExport('epub')}
                className="w-full px-5 py-3 text-left hover:bg-white/8 text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition-all"
              >
                EPUB
              </button>
              <button
                onClick={() => handleExport('mobi')}
                className="w-full px-5 py-3 text-left hover:bg-white/8 text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition-all"
              >
                MOBI
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsBedtimeMode(!isBedtimeMode)}
            className={cn(
              "p-3 rounded-2xl border transition-all",
              isBedtimeMode
                ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
                : "bg-white/8 border-white/10 text-white/60 hover:bg-[#D97757]/10 hover:border-[#D97757]/20 hover:text-[#D97757]"
            )}
            title="Bedtime Mode (Warm Colors)"
          >
            <Star size={18} />
          </button>

          <button
            onClick={() => setIsCinemaMode(!isCinemaMode)}
            className={cn(
              "p-3 rounded-2xl border transition-all",
              isCinemaMode
                ? "bg-[#D97757]/20 border-[#D97757]/40 text-[#D97757]"
                : "bg-white/8 border-white/10 text-white/60 hover:bg-[#D97757]/10 hover:border-[#D97757]/20 hover:text-[#D97757]"
            )}
            title="Cinema Mode"
          >
            <Maximize2 size={18} />
          </button>

          {onEdit && (
            <button
              onClick={() => onEdit(story)}
              className="p-3 bg-white/8 border border-white/10 rounded-2xl hover:bg-[#D97757]/10 hover:border-[#D97757]/20 text-white/60 hover:text-[#D97757] transition-all"
              title="Edit Story"
            >
              <Edit3 size={18} />
            </button>
          )}

          <button
            onClick={() => setShowScript(!showScript)}
            className={cn(
              "p-3 rounded-2xl border transition-all",
              showScript
                ? "bg-white/15 border-white/20 text-white"
                : "bg-white/8 border-white/10 text-white/60 hover:bg-[#D97757]/10 hover:border-[#D97757]/20 hover:text-[#D97757]"
            )}
          >
            <FileText size={18} />
          </button>
        </div>
      </nav>

      {/* Progress bar */}
      <div className="h-px bg-white/5 relative z-20">
        <motion.div
          className="h-full bg-[#D97757] shadow-[0_0_8px_rgba(217,119,87,0.6)]"
          initial={{ width: 0 }}
          animate={{ width: `${currentPage === -1 ? 0 : ((currentPage + 1) / totalPages) * 100}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
        />
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-6 relative z-10">
        <div className="w-full max-w-2xl relative">
          {/* Prev button */}
          <button
            onClick={() => setCurrentPage(p => Math.max(hasCovers ? -1 : 0, p - 1))}
            disabled={currentPage === (hasCovers ? -1 : 0)}
            className="absolute -left-16 top-1/2 -translate-y-1/2 p-4 bg-white/8 border border-white/10 rounded-2xl hover:bg-[#D97757]/10 hover:border-[#D97757]/20 text-white/60 hover:text-[#D97757] transition-all disabled:opacity-0"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Next button */}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            className="absolute -right-16 top-1/2 -translate-y-1/2 p-4 bg-white/8 border border-white/10 rounded-2xl hover:bg-[#D97757]/10 hover:border-[#D97757]/20 text-white/60 hover:text-[#D97757] transition-all disabled:opacity-0"
          >
            <ChevronRight size={24} />
          </button>

          {/* Page content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="w-full"
            >
              {currentPage === -1 ? (
                /* Cover page */
                <div className="flex flex-col items-center text-center space-y-8 py-16">
                  {story.coverImage && (
                    <div className="w-full max-w-sm">
                      <img
                        src={story.coverImage}
                        alt={story.title}
                        className="w-full rounded-2xl shadow-2xl shadow-black/60 object-cover"
                        style={{
                          filter: story.coverImageAdjustments
                            ? `brightness(${story.coverImageAdjustments.brightness}%) contrast(${story.coverImageAdjustments.contrast}%) saturate(${story.coverImageAdjustments.saturation}%) sepia(${story.coverImageAdjustments.sepia}%) grayscale(${story.coverImageAdjustments.grayscale}%) blur(${story.coverImageAdjustments.blur}px) hue-rotate(${story.coverImageAdjustments.hueRotate}deg)`
                            : undefined,
                          transform: story.coverImageAdjustments
                            ? `rotate(${story.coverImageAdjustments.rotate}deg) scaleX(${story.coverImageAdjustments.flipX ? -1 : 1}) scaleY(${story.coverImageAdjustments.flipY ? -1 : 1})`
                            : undefined,
                        }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <div>
                    <h1 className="text-5xl font-semibold text-white mb-4">{story.title}</h1>
                    <div className="w-12 h-0.5 bg-[#D97757]/50 mx-auto mb-4" />
                    <p className="text-white/50 font-sans italic text-xl">by {story.authorName}</p>
                  </div>
                  <p className="text-[10px] small-caps tracking-[0.3em] text-white/20 font-bold">
                    A StoryCraft Masterpiece
                  </p>
                </div>
              ) : (
                /* Story page */
                <div className="space-y-6">
                  {/* Image */}
                  {story.pages[currentPage]?.imageUrl && (
                    <div className="w-full">
                      <img
                        src={story.pages[currentPage].imageUrl}
                        alt=""
                        className="w-full rounded-2xl shadow-2xl shadow-black/60 object-cover max-h-72"
                        style={{
                          filter: story.pages[currentPage].imageAdjustments
                            ? `brightness(${story.pages[currentPage].imageAdjustments.brightness}%) contrast(${story.pages[currentPage].imageAdjustments.contrast}%) saturate(${story.pages[currentPage].imageAdjustments.saturation}%) sepia(${story.pages[currentPage].imageAdjustments.sepia}%) grayscale(${story.pages[currentPage].imageAdjustments.grayscale}%) blur(${story.pages[currentPage].imageAdjustments.blur}px) hue-rotate(${story.pages[currentPage].imageAdjustments.hueRotate}deg)`
                            : undefined,
                          transform: story.pages[currentPage].imageAdjustments
                            ? `rotate(${story.pages[currentPage].imageAdjustments.rotate}deg) scaleX(${story.pages[currentPage].imageAdjustments.flipX ? -1 : 1}) scaleY(${story.pages[currentPage].imageAdjustments.flipY ? -1 : 1})`
                            : undefined,
                        }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Chapter label */}
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-px bg-[#D97757]/40" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#D97757]">
                      Chapter {currentPage + 1}
                    </span>
                  </div>

                  {/* Text */}
                  <div
                    className={cn(
                      "font-sans leading-relaxed text-white/90 text-xl",
                      story.pages[currentPage].fontSize,
                      story.pages[currentPage].alignment === 'center'
                        ? 'text-center'
                        : story.pages[currentPage].alignment === 'right'
                        ? 'text-right'
                        : 'text-left',
                      isDyslexicFont && "font-dyslexic"
                    )}
                    style={{
                      color: story.pages[currentPage].color || undefined,
                      fontFamily:
                        FONTS.find(f => f.id === (story.pages[currentPage].font || 'serif'))?.family ||
                        'inherit',
                    }}
                  >
                    <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                      {story.pages[currentPage].text || story.pages[currentPage].content || ''}
                    </ReactMarkdown>
                  </div>

                  {/* Language tag */}
                  {story.language && (
                    <div className="inline-flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                      <Globe size={12} className="text-[#D97757]" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                        {story.language}
                      </span>
                    </div>
                  )}

                  {/* Branching choices */}
                  {story.isBranching && story.pages[currentPage]?.choices?.length ? (
                    <div className="pt-4 border-t border-white/[0.07] space-y-3">
                      {branchPageStack ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-purple-400/70 uppercase tracking-widest">
                            <GitBranch size={10} /> Branch: {branchPageStack.choiceText}
                          </div>
                          {branchPageStack.pages.map((bp, bi) => (
                            <div key={bi} className="space-y-3 pl-4 border-l-2 border-purple-500/20">
                              {bp.imageUrl && <img src={bp.imageUrl} alt="" className="w-full rounded-xl object-cover max-h-48" />}
                              <p className="text-white/80 text-base leading-relaxed font-sans">{bp.text}</p>
                            </div>
                          ))}
                          <button
                            onClick={() => setBranchPageStack(null)}
                            className="flex items-center gap-1.5 text-[10px] text-white/30 hover:text-white/60 transition-colors"
                          >
                            <ChevronLeft size={11} /> Return to main path
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 flex items-center gap-1.5">
                            <GitBranch size={10} /> Your choice shapes the story
                          </p>
                          <div className="grid gap-2">
                            {story.pages[currentPage].choices!.map((choice) => (
                              <button
                                key={choice.id}
                                onClick={() => {
                                  if (choice.branchPages?.length) {
                                    setBranchPageStack({ choiceText: choice.text, pages: choice.branchPages });
                                  } else if (choice.nextPageIndex !== undefined) {
                                    setCurrentPage(choice.nextPageIndex);
                                  }
                                }}
                                className="w-full text-left px-5 py-4 bg-white/[0.05] border border-white/[0.08] rounded-2xl hover:bg-[#D97757]/10 hover:border-[#D97757]/20 transition-all group"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-white/75 text-sm font-medium leading-snug group-hover:text-white transition-colors">{choice.text}</span>
                                  <ChevronRight size={14} className="text-white/25 group-hover:text-[#D97757] flex-shrink-0 transition-colors" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Page dot navigation */}
        <div className="mt-10 flex items-center gap-2">
          {hasCovers && (
            <button
              onClick={() => setCurrentPage(-1)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                currentPage === -1 ? "bg-[#D97757] w-10" : "bg-white/15 w-4 hover:bg-white/30"
              )}
            />
          )}
          {story.pages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === currentPage ? "bg-[#D97757] w-10" : "bg-white/15 w-4 hover:bg-white/30"
              )}
            />
          ))}
        </div>
      </div>

      {/* ── Immersive Reader Mode (full-scroll with image reveals) ── */}
      <AnimatePresence>
        {isImmersiveMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-[#030303] overflow-y-auto"
          >
            {/* Close bar */}
            <div className="sticky top-0 z-20 flex items-center justify-between px-8 py-4 bg-[#030303]/95 backdrop-blur border-b border-white/[0.05]">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#D97757]/50">Immersive Reader</p>
                <h3 className="text-lg font-semibold text-white">{story.title}</h3>
              </div>
              <button
                onClick={() => setIsImmersiveMode(false)}
                className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-[#D97757]/10 hover:border-[#D97757]/20 text-white/50 hover:text-[#D97757] transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-w-2xl mx-auto px-8 pb-24">
              {/* Cover */}
              {story.coverImage && (
                <div className="py-16 text-center space-y-8">
                  <img
                    src={story.coverImage}
                    alt={story.title}
                    className="w-64 mx-auto rounded-2xl shadow-2xl shadow-black/80"
                  />
                  <div>
                    <h1 className="text-5xl font-semibold text-white mb-4">{story.title}</h1>
                    <div className="w-12 h-px bg-[#D97757]/50 mx-auto mb-4" />
                    <p className="text-white/40 italic font-sans">by {story.authorName}</p>
                  </div>
                </div>
              )}

              {/* All pages in scroll */}
              {story.pages.map((page, i) => (
                <div key={i} className="py-12 border-t border-white/[0.05] space-y-8">
                  {/* Chapter marker */}
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-px bg-[#D97757]/30" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.5em] text-[#D97757]/40">
                      {story.narrativeStructure === 'hero-journey' && i === 0 ? 'Ordinary World'
                       : story.narrativeStructure === 'hero-journey' && i === Math.floor(story.pages.length * 0.15) ? 'The Call'
                       : `Chapter ${i + 1}`}
                    </span>
                  </div>

                  {/* Image reveal on scroll */}
                  {page.imageUrl && (
                    <ImmersiveImage src={page.imageUrl} adjustments={page.imageAdjustments} />
                  )}

                  {/* Text */}
                  <div
                    className={cn(
                      "font-sans leading-[1.9] text-white/80 text-xl",
                      page.fontSize,
                      isDyslexicFont && 'font-dyslexic'
                    )}
                    style={{
                      color: page.color || undefined,
                      fontFamily: FONTS.find(f => f.id === (page.font || 'serif'))?.family || 'inherit',
                    }}
                  >
                    <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                      {page.text || page.content || ''}
                    </ReactMarkdown>
                  </div>

                  {/* Branch choices in immersive mode */}
                  {story.isBranching && page.choices?.length && (
                    <div className="pt-4 border-t border-white/[0.05] space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 flex items-center gap-2">
                        <GitBranch size={10} /> Choose your path
                      </p>
                      <div className="grid gap-2">
                        {page.choices.map(c => (
                          <div key={c.id} className="px-5 py-4 bg-white/[0.04] border border-white/[0.06] rounded-2xl">
                            <p className="text-white/70 text-sm font-medium mb-3">{c.text}</p>
                            {c.branchPages?.map((bp, bi) => (
                              <p key={bi} className="text-white/45 text-sm leading-relaxed font-sans italic border-l-2 border-[#D97757]/20 pl-4 mt-2">{bp.text}</p>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* End card */}
              <div className="py-16 text-center space-y-4">
                <div className="w-12 h-px bg-[#D97757]/30 mx-auto" />
                <p className="text-white/20 text-sm font-sans italic">~ The End ~</p>
                <p className="text-[10px] text-white/10 uppercase tracking-[0.4em]">A StoryCraft Verse</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Immersive image component with scroll-reveal ─────────────────────────────
function ImmersiveImage({ src, adjustments }: { src: string; adjustments?: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className="w-full overflow-hidden rounded-2xl">
      <motion.img
        src={src}
        alt=""
        initial={{ opacity: 0, scale: 1.04, y: 16 }}
        animate={visible ? { opacity: 1, scale: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full object-cover max-h-[420px] shadow-2xl shadow-black/70"
        style={{
          filter: adjustments
            ? `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) sepia(${adjustments.sepia}%) grayscale(${adjustments.grayscale}%)`
            : undefined,
        }}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
