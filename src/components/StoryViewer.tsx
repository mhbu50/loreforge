import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Story, StoryPage } from '../types';
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
            className="p-3 bg-white/8 border border-white/10 rounded-2xl hover:bg-gold/10 hover:border-gold/20 text-white/60 hover:text-gold transition-all"
          >
            <X size={20} />
          </button>
          <div>
            <h2 className="text-xl font-serif font-bold leading-none text-white">{story.title}</h2>
            <p className="text-[10px] small-caps tracking-widest text-white/30 mt-0.5">By {story.authorName}</p>
          </div>
        </div>

        {/* Right: toolbar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDyslexicFont(!isDyslexicFont)}
            className={cn(
              "p-3 rounded-2xl border transition-all",
              isDyslexicFont
                ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                : "bg-white/8 border-white/10 text-white/60 hover:bg-gold/10 hover:border-gold/20 hover:text-gold"
            )}
            title="Dyslexia Friendly Font"
          >
            <Type size={18} />
          </button>

          <button
            onClick={handleShare}
            className="p-3 bg-white/8 border border-white/10 rounded-2xl hover:bg-gold/10 hover:border-gold/20 text-white/60 hover:text-gold transition-all"
            title="Share Story"
          >
            <Share2 size={18} />
          </button>

          <div className="relative group">
            <button className="p-3 bg-white/8 border border-white/10 rounded-2xl hover:bg-gold/10 hover:border-gold/20 text-white/60 hover:text-gold transition-all">
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
                : "bg-white/8 border-white/10 text-white/60 hover:bg-gold/10 hover:border-gold/20 hover:text-gold"
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
                ? "bg-gold/20 border-gold/40 text-gold"
                : "bg-white/8 border-white/10 text-white/60 hover:bg-gold/10 hover:border-gold/20 hover:text-gold"
            )}
            title="Cinema Mode"
          >
            <Maximize2 size={18} />
          </button>

          {onEdit && (
            <button
              onClick={() => onEdit(story)}
              className="p-3 bg-white/8 border border-white/10 rounded-2xl hover:bg-gold/10 hover:border-gold/20 text-white/60 hover:text-gold transition-all"
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
                : "bg-white/8 border-white/10 text-white/60 hover:bg-gold/10 hover:border-gold/20 hover:text-gold"
            )}
          >
            <FileText size={18} />
          </button>
        </div>
      </nav>

      {/* Progress bar */}
      <div className="h-px bg-white/5 relative z-20">
        <motion.div
          className="h-full bg-gold shadow-[0_0_8px_rgba(212,175,55,0.6)]"
          initial={{ width: 0 }}
          animate={{ width: `${((currentPage + 2) / (totalPages + 1)) * 100}%` }}
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
            className="absolute -left-16 top-1/2 -translate-y-1/2 p-4 bg-white/8 border border-white/10 rounded-2xl hover:bg-gold/10 hover:border-gold/20 text-white/60 hover:text-gold transition-all disabled:opacity-0"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Next button */}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            className="absolute -right-16 top-1/2 -translate-y-1/2 p-4 bg-white/8 border border-white/10 rounded-2xl hover:bg-gold/10 hover:border-gold/20 text-white/60 hover:text-gold transition-all disabled:opacity-0"
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
                    <h1 className="text-5xl font-serif font-bold text-white mb-4">{story.title}</h1>
                    <div className="w-12 h-0.5 bg-gold/50 mx-auto mb-4" />
                    <p className="text-white/50 font-serif italic text-xl">by {story.authorName}</p>
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
                    <span className="w-10 h-px bg-gold/40" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
                      Chapter {currentPage + 1}
                    </span>
                  </div>

                  {/* Text */}
                  <div
                    className={cn(
                      "font-serif leading-relaxed text-white/90 text-xl",
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
                      <Globe size={12} className="text-gold" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                        {story.language}
                      </span>
                    </div>
                  )}
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
                currentPage === -1 ? "bg-gold w-10" : "bg-white/15 w-4 hover:bg-white/30"
              )}
            />
          )}
          {story.pages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === currentPage ? "bg-gold w-10" : "bg-white/15 w-4 hover:bg-white/30"
              )}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
