import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutGrid, List, Heart, Trash2, BookOpen, Globe, Layers, UserPlus, Pencil, Plus, Search, X, DollarSign, Clock, Feather } from 'lucide-react';
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
  stories, isLoading, searchTerm, setSearchTerm,
  viewMode, setViewMode, onSelect, onEdit, onPublish, onDelete, onAddPartner, onCreate
}: StoryLibraryProps) {
  return (
    <div className="h-full flex flex-col">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif font-normal tracking-tight text-app">Library</h1>
          <p className="text-sm text-app-subtle mt-1">
            {stories.length > 0
              ? `${stories.length} stor${stories.length !== 1 ? 'ies' : 'y'}`
              : 'No stories yet'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-lg min-w-[240px] border transition-all bg-app-card border-app-default hover:border-app-strong"
          >
            <Search size={14} className="flex-shrink-0 text-app-subtle" />
            <input
              type="text"
              placeholder="Search stories..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none text-app"
              style={{ color: 'var(--text-primary)' }}
            />
            <AnimatePresence>
              {searchTerm && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearchTerm('')}
                  className="text-app-subtle hover:text-app transition-colors"
                >
                  <X size={14} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* View toggle */}
          <div className="flex items-center p-1 rounded-lg gap-1 bg-app-secondary border border-app-light">
            <button
              onClick={() => setViewMode('grid')}
              className="p-2 rounded-md transition-all"
              style={viewMode === 'grid'
                ? { background: 'var(--bg-card)', color: 'var(--accent)', boxShadow: 'var(--shadow-xs)' }
                : { color: 'var(--text-tertiary)' }}
              title="Grid view"
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="p-2 rounded-md transition-all"
              style={viewMode === 'list'
                ? { background: 'var(--bg-card)', color: 'var(--accent)', boxShadow: 'var(--shadow-xs)' }
                : { color: 'var(--text-tertiary)' }}
              title="List view"
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <SkeletonGrid viewMode={viewMode} />
      ) : stories.length === 0 ? (
        <EmptyState onCreate={onCreate} hasSearch={!!searchTerm} />
      ) : (
        <motion.div
          layout
          className={cn(
            "grid gap-3",
            viewMode === 'grid'
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1"
          )}
        >
          <AnimatePresence>
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
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Story Card                                                 */
/* ─────────────────────────────────────────────────────────── */
function StoryCard({ story, index, viewMode, onSelect, onEdit, onPublish, onDelete, onAddPartner }: {
  story: Story; index: number; viewMode: 'grid' | 'list';
  onSelect: (s: Story) => void; onEdit: (s: Story, e: React.MouseEvent) => void;
  onPublish: (id: string, e: React.MouseEvent) => void; onDelete: (id: string, e: React.MouseEvent) => void;
  onAddPartner: (story: Story, e: React.MouseEvent) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const hasCover = !!(story.coverImage || story.pages[0]?.imageUrl);
  const coverSrc = story.coverImage || story.pages[0]?.imageUrl || '';
  const adj = story.coverImageAdjustments;
  const imgStyle = adj ? {
    filter: `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%) sepia(${adj.sepia}%) grayscale(${adj.grayscale}%) blur(${adj.blur}px) hue-rotate(${adj.hueRotate}deg)`,
    transform: `rotate(${adj.rotate}deg) scaleX(${adj.flipX ? -1 : 1}) scaleY(${adj.flipY ? -1 : 1})`,
  } : undefined;

  const pageCount = story.pages.length;
  const dateStr = story.createdAt
    ? new Date(story.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ delay: index * 0.04 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onSelect(story)}
        className="group flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all"
        style={{
          background: hovered ? 'var(--bg-secondary)' : 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          boxShadow: hovered ? 'var(--shadow-sm)' : 'var(--shadow-card)',
        }}
      >
        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--bg-tertiary)' }}>
          {hasCover ? (
            <img src={coverSrc} alt="" className="w-full h-full object-cover" style={imgStyle} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Feather size={20} style={{ color: 'var(--text-tertiary)' }} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[15px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{story.title}</h3>
            {story.isPublished && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-ring)' }}>
                Published
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
            <span className="truncate capitalize">{story.style?.replace(/-/g, ' ')}</span>
            <span>·</span>
            <span>{pageCount} page{pageCount !== 1 ? 's' : ''}</span>
            {dateStr && <><span>·</span><span>{dateStr}</span></>}
            {story.language && (
              <><span>·</span><span className="flex items-center gap-1"><Globe size={10} />{story.language}</span></>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className={cn("flex items-center gap-1.5 transition-all", hovered ? "opacity-100" : "opacity-0")}>
          <ActionBtn icon={<Pencil size={13} />} title="Edit" onClick={e => onEdit(story, e)} />
          <ActionBtn icon={<UserPlus size={13} />} title="Add partner" onClick={e => onAddPartner(story, e)} />
          {!story.isPublished && <ActionBtn icon={<DollarSign size={13} />} title="Publish" onClick={e => onPublish(story.id, e)} />}
          <ActionBtn icon={<Trash2 size={13} />} title="Delete" onClick={e => onDelete(story.id, e)} danger />
        </div>

        <div className="flex-shrink-0 transition-colors" style={{ color: hovered ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
          <BookOpen size={15} />
        </div>
      </motion.div>
    );
  }

  /* Grid card */
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ delay: index * 0.05 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(story)}
      className="group rounded-2xl overflow-hidden cursor-pointer transition-all flex flex-col"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        boxShadow: hovered ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      {/* Cover */}
      <div className="relative aspect-[3/4] overflow-hidden flex-shrink-0" style={{ background: 'var(--bg-tertiary)' }}>
        {hasCover ? (
          <img
            src={coverSrc} alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            style={imgStyle}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <Feather size={32} style={{ color: 'var(--border-strong)' }} />
            <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>No cover</span>
          </div>
        )}

        {/* Soft gradient overlay */}
        {hasCover && <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />}

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {story.language && (
            <div className="px-2 py-1 rounded-lg flex items-center gap-1" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}>
              <Globe size={9} className="text-white/70" />
              <span className="text-[9px] font-semibold text-white/80 uppercase tracking-wide">{story.language}</span>
            </div>
          )}
          {story.seriesId && (
            <div className="px-2 py-1 rounded-lg flex items-center gap-1" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}>
              <Layers size={9} className="text-white/70" />
              <span className="text-[9px] font-semibold text-white/80 uppercase tracking-wide">Series</span>
            </div>
          )}
        </div>

        {/* Published badge */}
        {story.isPublished && (
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-lg" style={{ background: 'var(--accent)' }}>
            <span className="text-[9px] font-bold text-white uppercase tracking-wide">Live</span>
          </div>
        )}

        {/* Hover read overlay */}
        <motion.div
          animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 6 }}
          transition={{ duration: 0.18 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="bg-white/90 backdrop-blur-sm border border-black/10 px-5 py-2 rounded-full flex items-center gap-2 text-[13px] font-semibold shadow-xl" style={{ color: 'var(--text-primary)' }}>
            <BookOpen size={14} />
            Open
          </div>
        </motion.div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="text-[14px] font-semibold line-clamp-2 leading-snug" style={{ color: 'var(--text-primary)' }}>{story.title}</h3>

        <div className="flex items-center gap-1.5 flex-wrap mt-auto">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md capitalize" style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}>
            {story.style?.replace(/-/g, ' ') || 'story'}
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md" style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)' }}>
            {pageCount}p
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2.5 mt-1" style={{ borderTop: '1px solid var(--border-light)' }}>
          <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
            <Heart size={11} />
            <span>{story.likes || 0}</span>
          </div>

          <motion.div
            animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : 4 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1"
            onClick={e => e.stopPropagation()}
          >
            <ActionBtn icon={<Pencil size={12} />} title="Edit" onClick={e => onEdit(story, e)} small />
            <ActionBtn icon={<UserPlus size={12} />} title="Collaborate" onClick={e => onAddPartner(story, e)} small />
            {!story.isPublished && <ActionBtn icon={<DollarSign size={12} />} title="Publish" onClick={e => onPublish(story.id, e)} small />}
            <ActionBtn icon={<Trash2 size={12} />} title="Delete" onClick={e => onDelete(story.id, e)} small danger />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Action button                                              */
/* ─────────────────────────────────────────────────────────── */
function ActionBtn({ icon, title, onClick, danger, small }: {
  icon: React.ReactNode; title: string; onClick: (e: React.MouseEvent) => void;
  danger?: boolean; small?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn("rounded-lg transition-all", small ? "p-1.5" : "p-2")}
      style={danger
        ? { color: hovered ? '#ef4444' : 'var(--text-tertiary)', background: hovered ? 'rgba(239,68,68,0.08)' : 'transparent' }
        : { color: hovered ? 'var(--text-primary)' : 'var(--text-tertiary)', background: hovered ? 'var(--bg-secondary)' : 'transparent' }
      }
    >
      {icon}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Skeleton loading                                           */
/* ─────────────────────────────────────────────────────────── */
function SkeletonGrid({ viewMode }: { viewMode: 'grid' | 'list' }) {
  return (
    <div className={cn(
      "grid gap-3",
      viewMode === 'grid'
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        : "grid-cols-1"
    )}>
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className={cn("rounded-2xl overflow-hidden", viewMode === 'list' ? "h-[78px] flex items-center gap-4 p-4" : "")}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}
        >
          {viewMode === 'list' ? (
            <>
              <div className="w-14 h-14 rounded-xl shimmer flex-shrink-0" style={{ background: 'var(--bg-secondary)' }} />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 rounded-full shimmer w-2/3" style={{ background: 'var(--bg-secondary)' }} />
                <div className="h-2.5 rounded-full shimmer w-1/3" style={{ background: 'var(--bg-tertiary)' }} />
              </div>
            </>
          ) : (
            <>
              <div className="aspect-[3/4] shimmer" style={{ background: 'var(--bg-secondary)' }} />
              <div className="p-4 space-y-3">
                <div className="h-3.5 rounded-full shimmer w-3/4" style={{ background: 'var(--bg-secondary)' }} />
                <div className="h-3 rounded-full shimmer w-1/2" style={{ background: 'var(--bg-tertiary)' }} />
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Empty state                                                */
/* ─────────────────────────────────────────────────────────── */
function EmptyState({ onCreate, hasSearch }: { onCreate: () => void; hasSearch: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 flex flex-col items-center justify-center py-24 px-6 text-center"
    >
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}>
        {hasSearch
          ? <Search size={24} style={{ color: 'var(--text-tertiary)' }} />
          : <Feather size={24} style={{ color: 'var(--text-tertiary)' }} />}
      </div>
      <h3 className="text-[18px] font-semibold mb-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', fontWeight: 400 }}>
        {hasSearch ? 'No results found' : 'No stories yet'}
      </h3>
      <p className="text-[13px] mb-7 max-w-[260px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
        {hasSearch
          ? 'Try a different search term or clear the filter.'
          : 'Start writing your first story. Every great author began with a single page.'}
      </p>
      {!hasSearch && (
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-5 py-2.5 font-semibold text-[14px] rounded-xl transition-all btn-gradient-gold"
        >
          <Plus size={16} />
          Create story
        </button>
      )}
    </motion.div>
  );
}
