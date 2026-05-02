import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { BookOpen, BarChart3, TrendingUp, Sparkles, Plus, Clock, Search, Eye, Trash2, MoreHorizontal } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useStoryStore, Story } from '@/src/stores/useStoryStore';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { MainLayout } from './layout/MainLayout';

function StatCard({ label, value, icon, color, delta }: {
  label: string; value: string | number; icon: React.ReactNode; color: string; delta?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/[0.06] bg-surface-glass backdrop-blur-xl p-5 shadow-card hover:shadow-card-hover hover:border-gold/20 transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-nebula mb-1">{label}</p>
          <p className="text-2xl font-bold text-starlight">{value}</p>
          {delta && <p className="text-xs text-emerald-400 mt-1">{delta}</p>}
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', color)}>{icon}</div>
      </div>
    </motion.div>
  );
}

function StoryCard({ story, onOpen, onDelete }: { story: Story; onOpen: () => void; onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const progress = story.targetWordCount
    ? Math.min(100, Math.round((story.wordCount / story.targetWordCount) * 100)) : 0;

  return (
    <div
      className="group relative rounded-2xl border border-white/[0.06] bg-surface-glass backdrop-blur-xl shadow-card hover:shadow-card-hover hover:border-gold/20 transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={onOpen}
    >
      <div className="h-1 w-full bg-gradient-to-r from-gold/60 to-cyan/30" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-starlight line-clamp-1 flex-1">{story.title}</h3>
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-nebula hover:text-starlight hover:bg-white/[0.06] transition-colors"
            >
              <MoreHorizontal size={14} />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-6 z-10 w-36 rounded-xl border border-white/[0.08] bg-surface backdrop-blur-2xl shadow-card-hover py-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button onClick={() => { onOpen(); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-nebula hover:text-starlight hover:bg-white/[0.04]">
                  <Eye size={12} /> Open editor
                </button>
                <button onClick={() => { onDelete(); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-magenta hover:bg-white/[0.04]">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
        {story.synopsis && <p className="text-xs text-nebula line-clamp-2 mb-3">{story.synopsis}</p>}
        <div className="flex items-center justify-between mb-3">
          <Badge variant={story.status === 'complete' ? 'success' : story.status === 'in_progress' ? 'gold' : 'default'} className="capitalize">
            {story.status.replace('_', ' ')}
          </Badge>
          <span className="text-xs text-nebula/60 capitalize">{story.genre}</span>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs text-nebula">{story.wordCount.toLocaleString()} words</span>
            <span className="text-xs text-gold">{progress}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full bg-gold transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-1 mt-3 text-xs text-nebula/60">
          <Clock size={11} />
          <span>{new Date(story.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

const TEMPLATES = [
  { name: "Hero's Journey", icon: '⚔️', genre: 'fantasy' as const },
  { name: 'Enemies to Lovers', icon: '💘', genre: 'romance' as const },
  { name: 'Murder Mystery', icon: '🔍', genre: 'mystery' as const },
  { name: 'Isekai Adventure', icon: '🌀', genre: 'fantasy' as const },
  { name: 'Slice of Life', icon: '🌿', genre: 'literary' as const },
  { name: 'Sci-Fi Thriller', icon: '🚀', genre: 'sci-fi' as const },
];

export default function AppDashboard() {
  const navigate = useNavigate();
  const stories = useStoryStore((s) => s.stories);
  const createStory = useStoryStore((s) => s.createStory);
  const deleteStory = useStoryStore((s) => s.deleteStory);
  const setActiveStory = useStoryStore((s) => s.setActiveStory);
  const [search, setSearch] = useState('');

  const filtered = stories.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.synopsis.toLowerCase().includes(search.toLowerCase())
  );

  const totalWords = stories.reduce((sum, s) => sum + s.wordCount, 0);
  const totalCharacters = stories.reduce((sum, s) => sum + s.characters.length, 0);

  const openStory = (story: Story) => { setActiveStory(story.id); navigate('/editor'); };
  const createFromTemplate = (tpl: typeof TEMPLATES[0]) => {
    const story = createStory({ title: tpl.name, genre: tpl.genre, status: 'draft' });
    setActiveStory(story.id); navigate('/editor');
  };
  const newBlankStory = () => { const story = createStory({}); setActiveStory(story.id); navigate('/editor'); };

  return (
    <MainLayout title="Dashboard" subtitle="Your story universe" actions={
      <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={newBlankStory}>New Story</Button>
    }>
      <div className="space-y-8 max-w-[1200px] mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Stories" value={stories.length} icon={<BookOpen size={20} className="text-gold" />} color="bg-gold/15" delta={stories.length > 0 ? `${stories.filter(s => s.status === 'in_progress').length} in progress` : undefined} />
          <StatCard label="Characters" value={totalCharacters} icon={<BarChart3 size={20} className="text-cyan" />} color="bg-cyan/15" />
          <StatCard label="Words Written" value={totalWords >= 1000 ? `${(totalWords / 1000).toFixed(1)}K` : totalWords} icon={<TrendingUp size={20} className="text-emerald-400" />} color="bg-emerald-500/15" />
          <StatCard label="Completed" value={stories.filter(s => s.status === 'complete').length} icon={<Sparkles size={20} className="text-magenta" />} color="bg-magenta/15" />
        </div>

        {/* Quick Start Templates */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg text-starlight">Quick Start Templates</h2>
            <span className="text-xs text-nebula">Choose a story structure to begin</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {TEMPLATES.map((tpl) => (
              <button key={tpl.name} onClick={() => createFromTemplate(tpl)}
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/[0.06] bg-surface-glass backdrop-blur-xl p-4 text-center hover:border-gold/30 hover:bg-gold/5 transition-all duration-200 group">
                <span className="text-2xl">{tpl.icon}</span>
                <span className="text-xs font-medium text-nebula group-hover:text-starlight transition-colors">{tpl.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stories Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg text-starlight">Your Stories</h2>
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-nebula pointer-events-none" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search stories…"
                className="w-52 rounded-full border border-white/[0.08] bg-void/80 pl-9 pr-4 py-1.5 text-xs text-starlight placeholder:text-nebula/60 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/10 backdrop-blur-sm" />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gold/20 bg-surface-glass backdrop-blur-xl py-16 text-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                <BookOpen size={24} className="text-gold/60" />
              </div>
              <div>
                <p className="font-serif text-lg text-starlight mb-1">No stories yet</p>
                <p className="text-sm text-nebula">Start with a template or create a blank story</p>
              </div>
              <Button variant="primary" leftIcon={<Plus size={14} />} onClick={newBlankStory}>Create your first story</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((story) => (
                <StoryCard key={story.id} story={story} onOpen={() => openStory(story)} onDelete={() => deleteStory(story.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
