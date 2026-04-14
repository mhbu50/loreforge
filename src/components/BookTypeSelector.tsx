import React from 'react';
import { motion } from 'motion/react';
import { Book, Image as ImageIcon, Play, X, Sparkles, ScrollText, PenTool, User, PlusCircle } from 'lucide-react';
import { BookType } from '../types';

interface BookTypeSelectorProps {
  onSelect: (type: BookType) => void;
  onCancel: () => void;
}

export default function BookTypeSelector({ onSelect, onCancel }: BookTypeSelectorProps) {
  const types: {
    id: BookType;
    title: string;
    description: string;
    icon: React.ReactNode;
    gradient: string;
    glow: string;
  }[] = [
    {
      id: 'story',
      title: 'Story Book',
      description: 'Classic narrative with rich descriptions and illustrations.',
      icon: <Book size={32} />,
      gradient: 'from-blue-500 to-blue-700',
      glow: 'rgba(59,130,246,0.25)',
    },
    {
      id: 'comic',
      title: 'Comic Book',
      description: 'Visual storytelling with panels, speech bubbles, and dynamic art.',
      icon: <ImageIcon size={32} />,
      gradient: 'from-orange-500 to-orange-700',
      glow: 'rgba(249,115,22,0.25)',
    },
    {
      id: 'anime',
      title: 'Anime Book',
      description: 'Cinematic experience with motion, sound, and vibrant aesthetics.',
      icon: <Play size={32} />,
      gradient: 'from-purple-500 to-purple-800',
      glow: 'rgba(168,85,247,0.25)',
    },
    {
      id: 'novel',
      title: 'Novel',
      description: 'Deep narrative focus with extensive chapters and character development.',
      icon: <ScrollText size={32} />,
      gradient: 'from-emerald-500 to-emerald-700',
      glow: 'rgba(16,185,129,0.25)',
    },
    {
      id: 'manga',
      title: 'Manga',
      description: 'Japanese-style visual storytelling with unique paneling and aesthetics.',
      icon: <PenTool size={32} />,
      gradient: 'from-rose-500 to-rose-700',
      glow: 'rgba(244,63,94,0.25)',
    },
    {
      id: 'biography',
      title: 'Biography',
      description: 'Documenting a real or fictional life story with historical precision.',
      icon: <User size={32} />,
      gradient: 'from-amber-500 to-amber-700',
      glow: 'rgba(245,158,11,0.25)',
    },
    {
      id: 'other',
      title: 'Other',
      description: 'A blank canvas for experimental formats and unconventional storytelling.',
      icon: <PlusCircle size={32} />,
      gradient: 'from-slate-500 to-slate-700',
      glow: 'rgba(100,116,139,0.25)',
    },
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-night/80 backdrop-blur-md"
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 24, stiffness: 200 }}
        className="relative w-full max-w-5xl bg-[#0d0d0d] border border-white/8 rounded-[2.5rem] p-12 shadow-2xl overflow-hidden"
      >
        {/* Gold top accent line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-gold/0 via-gold to-gold/0" />

        {/* Header */}
        <div className="flex items-start justify-between mb-12">
          <div>
            <h2 className="text-5xl font-serif font-bold text-gold leading-none mb-3">
              Choose Your <span className="italic">Medium</span>
            </h2>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/30">
              Select the type of masterpiece you want to create
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-3 hover:bg-white/8 rounded-2xl transition-all text-white/40 hover:text-white mt-1"
          >
            <X size={22} />
          </button>
        </div>

        {/* Type Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {types.map((type) => (
            <motion.button
              key={type.id}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(type.id)}
              className="group relative flex flex-col items-start text-left p-8 rounded-[2rem] border-2 border-white/8 bg-white/5 hover:border-gold/40 hover:bg-gold/5 transition-all cursor-pointer overflow-hidden"
            >
              {/* Radial glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${type.glow} 0%, transparent 70%)`,
                }}
              />

              {/* Gold top accent on hover */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-gold/0 via-gold/60 to-gold/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

              {/* Icon area */}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg bg-gradient-to-br ${type.gradient}`}>
                {type.icon}
              </div>

              {/* Type name */}
              <h3 className="text-2xl font-serif font-bold text-gold mb-2 leading-none">{type.title}</h3>

              {/* Description */}
              <p className="text-sm text-white/40 leading-relaxed flex-1">{type.description}</p>

              {/* CTA hint */}
              <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/20 group-hover:text-gold transition-colors duration-300">
                <span>Start Creating</span>
                <Sparkles size={12} className="group-hover:animate-pulse" />
              </div>
            </motion.button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-10 pt-8 border-t border-white/8 text-center">
          <p className="text-xs text-white/25 italic">
            Each medium offers unique customization tools tailored to its format.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
