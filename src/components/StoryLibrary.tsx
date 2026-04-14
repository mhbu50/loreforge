import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'motion/react';
import { LayoutGrid, List, Heart, Star, DollarSign, Trash2, BookOpen, Sparkles, Globe, Layers, UserPlus, Pencil } from 'lucide-react';
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
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-black/25 mb-2">Your Archive</p>
          <h2 className="text-5xl font-serif font-light mb-2 tracking-tight">Your <span className="italic text-gold">Library</span></h2>
          <p className="text-black/35 text-xs font-medium">
            {stories.length > 0 ? `${stories.length} masterpiece${stories.length !== 1 ? 's' : ''} in your archive` : 'Your collection awaits'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-sm border border-black/5 min-w-[260px] focus-within:border-gold/30 focus-within:shadow-md transition-all">
            <Sparkles className="text-black/25 flex-shrink-0" size={16} />
            <input
              type="text"
              placeholder="Search stories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent outline-none text-sm font-medium placeholder:text-black/20"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-black/20 hover:text-black/50 transition-colors flex-shrink-0">
                <span className="text-xs font-bold">✕</span>
              </button>
            )}
          </div>

          {/* View toggles */}
          <div className="flex items-center gap-1 p-1 bg-white rounded-2xl shadow-sm border border-black/5">
            <button
              onClick={() => setViewMode('grid')}
              className={cn("p-2.5 rounded-xl transition-all", viewMode === 'grid' ? "bg-black text-white shadow-sm" : "text-black/25 hover:text-black/60")}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn("p-2.5 rounded-xl transition-all", viewMode === 'list' ? "bg-black text-white shadow-sm" : "text-black/25 hover:text-black/60")}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className={cn(
          "grid gap-10",
          viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-[2.5rem] h-96 animate-pulse border border-black/5 flex flex-col overflow-hidden">
              <div className="flex-1 bg-black/5" />
              <div className="p-10 space-y-4">
                <div className="h-4 bg-black/5 rounded w-1/4" />
                <div className="h-8 bg-black/5 rounded w-3/4" />
                <div className="h-4 bg-black/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : stories.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-28 bg-white rounded-[3rem] border border-dashed border-black/10 relative overflow-hidden"
        >
          {/* Background radial glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full" style={{background: 'radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 65%)'}} />
          </div>

          {/* Decorative floating elements */}
          <div className="absolute top-10 left-10 w-3 h-3 rounded-full bg-gold/20 animate-pulse" />
          <div className="absolute top-16 right-16 w-2 h-2 rounded-full bg-gold/30" />
          <div className="absolute bottom-12 left-20 w-4 h-4 rounded-full bg-gold/15 animate-pulse" style={{animationDelay: '0.5s'}} />
          <div className="absolute bottom-8 right-12 w-2 h-2 rounded-full bg-gold/25" />

          {/* Icon container */}
          <div className="relative mb-8 inline-block">
            <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-black/5 via-black/8 to-black/12 flex items-center justify-center mx-auto shadow-inner border border-black/5">
              <BookOpen className="text-black/15" size={48} />
            </div>
            <div className="absolute -top-2 -right-3 w-6 h-6 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center">
              <Sparkles size={10} className="text-gold/60" />
            </div>
            <div className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-gold/25 border border-gold/30" />
          </div>

          <h3 className="text-4xl font-serif font-light text-black/30 mb-3">Your archives are empty.</h3>
          <p className="text-sm text-black/35 mb-10 max-w-sm mx-auto leading-relaxed">
            Every great storyteller starts with a single tale.<br />Yours begins now.
          </p>

          <button
            onClick={onCreate}
            className="px-12 py-5 bg-night text-white rounded-2xl font-bold hover:bg-gold hover:text-night transition-all inline-flex flex-col items-center gap-1.5 group mx-auto shadow-xl shadow-black/10 hover:shadow-gold/20"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
              <span>Forge Your First Tale</span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-[0.25em] opacity-30 group-hover:opacity-80 transition-opacity">Cost: 1 Token</span>
          </button>
        </motion.div>
      ) : (
        <div className={cn(
          "grid gap-10",
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
      transition={{ delay: index * 0.1 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: viewMode === 'grid' ? rotateX : 0,
        rotateY: viewMode === 'grid' ? rotateY : 0,
        transformStyle: "preserve-3d",
      }}
      onClick={() => onSelect(story)}
      className={cn(
        "group bg-white rounded-[2.5rem] overflow-hidden border border-black/5 cursor-pointer hover:shadow-2xl transition-all duration-500",
        viewMode === 'list' ? "flex h-64" : "flex flex-col"
      )}
    >
      <div className={cn(
        "relative overflow-hidden",
        viewMode === 'list' ? "w-64 h-full" : "aspect-[4/5]"
      )} style={{ transform: "translateZ(50px)" }}>
        {/* Progress Circle */}
        <div className="absolute top-6 right-6 z-10">
          <svg className="w-10 h-10 transform -rotate-90">
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              className="text-white/10"
            />
            <motion.circle
              cx="20"
              cy="20"
              r="16"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              strokeDasharray="100"
              initial={{ strokeDashoffset: 100 }}
              animate={{ strokeDashoffset: 100 - (Math.min(story.pages.length, 10) * 10) }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="text-gold"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">{story.pages.length}</span>
          </div>
        </div>

        {(story.coverImage || story.pages[0]?.imageUrl) ? (
          <img
            src={story.coverImage || story.pages[0].imageUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
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
          <div className="w-full h-full bg-gradient-to-br from-black/10 to-black/20 flex items-center justify-center">
            <BookOpen className="text-white/20" size={48} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Read Now Slide-in */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
          <div className="bg-gold text-night px-8 py-3 rounded-full font-bold flex items-center gap-3 transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500 shadow-2xl">
            <BookOpen size={20} />
            <span className="small-caps tracking-widest">Read Now</span>
          </div>
        </div>

        {/* Watermark */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none">
          <span className="text-[8px] font-bold uppercase tracking-widest text-white">StoryCraft</span>
        </div>

        {/* Language & Series Badges */}
        <div className="absolute top-6 left-6 flex flex-col gap-2">
          {story.language && (
            <div className="bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 border border-white/10">
              <Globe size={10} className="text-gold" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-white">{story.language}</span>
            </div>
          )}
          {story.seriesId && (
            <div className="bg-gold/30 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 border border-gold/20">
              <Layers size={10} className="text-white" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-white">Series</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-8 flex flex-col flex-1" style={{ transform: "translateZ(30px)" }}>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-[8px] font-bold uppercase tracking-widest bg-black/5 px-2.5 py-1 rounded-full">{story.style}</span>
          <span className="text-[8px] font-bold uppercase tracking-widest bg-black/5 px-2.5 py-1 rounded-full">{story.pages.length} Pages</span>
          {story.isPublished && (
            <span className="text-[8px] font-bold uppercase tracking-widest bg-gold/10 text-gold px-2.5 py-1 rounded-full border border-gold/20">Published</span>
          )}
        </div>
        <h3 className="text-2xl font-serif font-bold mb-2 group-hover:text-gold transition-colors leading-snug">{story.title}</h3>

        <div className="mt-auto pt-4 border-t border-black/5 flex items-center justify-between">
          <div className="flex items-center gap-4 text-black/25 text-xs">
            <div className="flex items-center gap-1.5"><Heart size={13} /> <span>{story.likes || 0}</span></div>
            <div className="flex items-center gap-1.5"><Star size={13} /> <span>4.9</span></div>
          </div>

          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
            {/* Edit button — direct access without opening viewer */}
            <button
              onClick={(e) => onEdit(story, e)}
              className="p-2.5 bg-night/10 text-night rounded-xl hover:bg-night hover:text-white transition-all"
              title="Edit Story"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={(e) => onAddPartner(story, e)}
              className="p-2.5 bg-gold/10 text-gold rounded-xl hover:bg-gold hover:text-night transition-all"
              title="Add Partner"
            >
              <UserPlus size={16} />
            </button>
            {!story.isPublished && (
              <button
                onClick={(e) => onPublish(story.id, e)}
                className="p-2.5 bg-gold/10 text-gold rounded-xl hover:bg-gold hover:text-night transition-all"
                title="Publish"
              >
                <DollarSign size={16} />
              </button>
            )}
            <button
              onClick={(e) => onDelete(story.id, e)}
              className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
