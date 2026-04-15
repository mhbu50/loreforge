import React from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'motion/react';
import { LayoutGrid, List, Heart, Star, DollarSign, Trash2, BookOpen, Sparkles, Globe, Layers, UserPlus, Pencil, Plus } from 'lucide-react';
import { Story } from '../types';
import { cn } from '../lib/utils';

interface StoryLibraryProps {
  stories: Story[];
  isLoading?: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  onSelect: (story: Story) => void;
  onEdit: (story: Story, e: React.MouseEvent) => void;
  onPublish: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onAddPartner: (story: Story, e: React.MouseEvent) => void;
  onCreate: () => void;
}

export default function StoryLibrary({
  stories,
  isLoading,
  searchTerm,
  setSearchTerm,
  viewMode,
  setViewMode,
  onSelect,
  onEdit,
  onPublish,
  onDelete,
  onAddPartner,
  onCreate
}: StoryLibraryProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/20 mb-1">Archive</p>
          <h2 className="text-3xl font-serif font-bold text-white">Your <span className="text-gold italic">Library</span></h2>
          <p className="text-white/30 text-xs mt-1">{stories.length > 0 ? `${stories.length} stor${stories.length !== 1 ? 'ies' : 'y'}` : 'No stories yet'}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.05] border border-white/[0.09] rounded-xl min-w-[220px] focus-within:border-gold/30 transition-colors">
            <Sparkles size={13} className="text-white/20 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/20 outline-none"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-white/20 hover:text-white/60 text-xs">✕</button>
            )}
          </div>
          {/* View toggle */}
          <div className="flex items-center p-1 bg-white/[0.05] border border-white/[0.08] rounded-xl gap-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-gold/20 text-gold" : "text-white/25 hover:text-white/60")}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-gold/20 text-gold" : "text-white/25 hover:text-white/60")}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className={cn(
          "grid gap-5",
          viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-[#111] border border-white/[0.07] rounded-2xl h-72 animate-pulse" />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-24 bg-[#111] border border-dashed border-white/[0.08] rounded-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none" style={{background:'radial-gradient(circle at 50% 40%, rgba(212,175,55,0.05) 0%, transparent 60%)'}} />
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
              <BookOpen size={28} className="text-gold/60" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-white mb-2">No Stories Yet</h3>
            <p className="text-white/30 text-sm mb-6">Every great storyteller starts with a single tale.</p>
            <button
              onClick={onCreate}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-[#080808] rounded-xl font-bold text-sm hover:bg-white transition-all shadow-lg shadow-gold/20"
            >
              <Plus size={16} /> Create Your First Story
            </button>
          </div>
        </motion.div>
      ) : (
        <div className={cn(
          "grid gap-5",
          viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {stories.map((story, i) => (
            <StoryCard
              key={story.id}
              story={story}
              index={i}
              viewMode={viewMode}
              onSelect={onSelect}
              onEdit={onEdit}
              onPublish={onPublish}
              onDelete={onDelete}
              onAddPartner={onAddPartner}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function StoryCard({ story, index, viewMode, onSelect, onEdit, onPublish, onDelete, onAddPartner }: {
  story: Story,
  index: number,
  viewMode: 'grid' | 'list',
  onSelect: (s: Story) => void,
  onEdit: (s: Story, e: React.MouseEvent) => void,
  onPublish: (id: string, e: React.MouseEvent) => void,
  onDelete: (id: string, e: React.MouseEvent) => void,
  onAddPartner: (story: Story, e: React.MouseEvent) => void
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: viewMode === 'grid' ? rotateX : 0,
        rotateY: viewMode === 'grid' ? rotateY : 0,
        transformStyle: "preserve-3d",
      }}
      onClick={() => onSelect(story)}
      className={cn(
        "group bg-[#111] border border-white/[0.07] rounded-2xl overflow-hidden cursor-pointer hover:border-gold/20 transition-all duration-300 hover:shadow-2xl hover:shadow-gold/5",
        viewMode === 'list' ? "flex h-52" : "flex flex-col"
      )}
    >
      {/* Image area */}
      <div className={cn(
        "relative overflow-hidden",
        viewMode === 'list' ? "w-48 h-full flex-shrink-0" : "aspect-[4/5]"
      )} style={{ transform: "translateZ(50px)" }}>
        {/* Progress circle */}
        <div className="absolute top-4 right-4 z-10">
          <svg className="w-9 h-9 transform -rotate-90">
            <circle cx="18" cy="18" r="14" stroke="currentColor" strokeWidth="2.5" fill="transparent" className="text-white/[0.08]" />
            <motion.circle
              cx="18" cy="18" r="14"
              stroke="currentColor" strokeWidth="2.5" fill="transparent"
              strokeDasharray="88"
              initial={{ strokeDashoffset: 88 }}
              animate={{ strokeDashoffset: 88 - (Math.min(story.pages.length, 10) * 8.8) }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="text-gold"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[8px] font-bold text-white/70">{story.pages.length}</span>
          </div>
        </div>

        {(story.coverImage || story.pages[0]?.imageUrl) ? (
          <img
            src={story.coverImage || story.pages[0].imageUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            style={{
              filter: story.coverImageAdjustments ?
                `brightness(${story.coverImageAdjustments.brightness}%) contrast(${story.coverImageAdjustments.contrast}%) saturate(${story.coverImageAdjustments.saturation}%) sepia(${story.coverImageAdjustments.sepia}%) grayscale(${story.coverImageAdjustments.grayscale}%) blur(${story.coverImageAdjustments.blur}px) hue-rotate(${story.coverImageAdjustments.hueRotate}deg)` : 'none',
              transform: story.coverImageAdjustments ?
                `rotate(${story.coverImageAdjustments.rotate}deg) scaleX(${story.coverImageAdjustments.flipX ? -1 : 1}) scaleY(${story.coverImageAdjustments.flipY ? -1 : 1})` : 'none'
            }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#111] flex items-center justify-center">
            <BookOpen className="text-white/[0.08]" size={40} />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Read Now hover CTA */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-400 pointer-events-none">
          <div className="bg-gold text-[#080808] px-6 py-2.5 rounded-full font-bold flex items-center gap-2 transform translate-y-6 group-hover:translate-y-0 transition-transform duration-400 shadow-2xl text-sm">
            <BookOpen size={16} />
            <span>Read Now</span>
          </div>
        </div>

        {/* Language & Series badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5">
          {story.language && (
            <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 border border-white/10">
              <Globe size={9} className="text-gold" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-white/80">{story.language}</span>
            </div>
          )}
          {story.seriesId && (
            <div className="bg-gold/20 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 border border-gold/20">
              <Layers size={9} className="text-gold" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-white/80">Series</span>
            </div>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="p-5 flex flex-col flex-1" style={{ transform: "translateZ(30px)" }}>
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          <span className="bg-white/[0.06] text-white/40 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md">{story.style}</span>
          <span className="bg-white/[0.06] text-white/40 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md">{story.pages.length} Pages</span>
          {story.isPublished && (
            <span className="bg-gold/10 text-gold border border-gold/15 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md">Published</span>
          )}
        </div>
        <h3 className="text-lg font-serif font-bold text-white/90 group-hover:text-gold transition-colors leading-snug mb-auto">{story.title}</h3>

        <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3 text-white/20 text-xs">
            <div className="flex items-center gap-1.5"><Heart size={12} /><span>{story.likes || 0}</span></div>
            <div className="flex items-center gap-1.5"><Star size={12} /><span>4.9</span></div>
          </div>

          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-3 group-hover:translate-x-0">
            <button
              onClick={(e) => onEdit(story, e)}
              className="bg-white/[0.08] text-white/50 rounded-lg p-2 hover:bg-gold/10 hover:text-gold transition-all"
              title="Edit Story"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={(e) => onAddPartner(story, e)}
              className="bg-white/[0.08] text-white/50 rounded-lg p-2 hover:bg-gold/10 hover:text-gold transition-all"
              title="Add Partner"
            >
              <UserPlus size={14} />
            </button>
            {!story.isPublished && (
              <button
                onClick={(e) => onPublish(story.id, e)}
                className="bg-white/[0.08] text-white/50 rounded-lg p-2 hover:bg-gold/10 hover:text-gold transition-all"
                title="Publish"
              >
                <DollarSign size={14} />
              </button>
            )}
            <button
              onClick={(e) => onDelete(story.id, e)}
              className="bg-white/[0.06] text-white/30 rounded-lg p-2 hover:bg-red-500/10 hover:text-red-400 transition-all"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
