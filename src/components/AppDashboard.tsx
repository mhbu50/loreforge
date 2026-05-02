import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  BookOpen, BarChart3, TrendingUp, Sparkles, Plus, Clock,
  ChevronRight, Wand2, Swords, Search, Eye, Trash2, MoreHorizontal
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useStoryStore, Story } from '@/src/stores/useStoryStore';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { MainLayout } from './layout/MainLayout';
import { TopBar } from './layout/TopBar';

// ─── Stat cards ──────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  delta?: string;
}

function StatCard({ label, value, icon, color, delta }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-md border border-border bg-bg-secondary p-5 shadow-card hover:shadow-elevated hover:border-hover transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-muted mb-1">{label}</p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          {delta && <p className="text-xs text-emerald-400 mt-1">{delta}</p>}
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-md', color)}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Story card ───────────────────────────────────────────────
function StoryCard({ story, onOpen, onDelete }: { story: Story; onOpen: () => void; onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const progress = story.targetWordCount
    ? Math.min(100, Math.round((story.wordCount / story.targetWordCount) * 100))
    : 0;

  const statusVariant = story.status === 'complete' ? 'success' : story.status === 'in_progress' ? 'primary' : story.status === 'archived' ? 'default' : 'outline';

  return (
    <div className="group relative rounded-md border border-border bg-bg-secondary shadow-card hover:shadow-elevated hover:border-hover transition-all duration-200 cursor-pointer" onClick={onOpen}>
      {/* Color bar */}
      <div className="h-1.5 w-full rounded-t-md bg-gradient-to-r from-violet-600/60 to-purple-500/30" />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-text-primary line-clamp-1 flex-1">{story.title}</h3>
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-sm text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors"
            >
              <MoreHorizontal size={14} />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-6 z-10 w-36 rounded-md border border-border bg-bg-secondary shadow-elevated py-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => { onOpen(); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                >
                  <Eye size={12} /> Open editor
                </button>
                <button
                  onClick={() => { onDelete(); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-bg-tertiary"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {story.synopsis && (
          <p className="text-xs text-text-muted line-clamp-2 mb-3">{story.synopsis}</p>
        )}

        <div className="flex items-center justify-between mb-3">
          <Badge variant={statusVariant} className="capitalize">{story.status.replace('_', ' ')}</Badge>
          <span className="text-xs text-text-muted capitalize">{story.genre}</span>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs text-text-muted">{story.wordCount.toLocaleString()} words</span>
            <span className="text-xs text-primary">{progress}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-bg-tertiary overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-1 mt-3 text-xs text-text-muted">
          <Clock size={11} />
          <span>{new Date(story.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Quick start templates ────────────────────────────────────
const TEMPLATES = [
  { name: "Hero's Journey", icon: '⚔️', genre: 'fantasy' as const },
  { name: 'Enemies to Lovers', icon: '💘', genre: 'romance' as const },
  { name: 'Murder Mystery', icon: '🔍', genre: 'mystery' as const },
  { name: 'Isekai Adventure', icon: '🌀', genre: 'fantasy' as const },
  { name: 'Slice of Life', icon: '🌿', genre: 'literary' as const },
  { name: 'Sci-Fi Thriller', icon: '🚀', genre: 'sci-fi' as const },
];

// ─── Main Component ───────────────────────────────────────────
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

  const openStory = (story: Story) => {
    setActiveStory(story.id);
    navigate('/editor');
  };

  const createFromTemplate = (template: typeof TEMPLATES[0]) => {
    const story = createStory({ title: template.name, genre: template.genre, status: 'draft' });
    setActiveStory(story.id);
    navigate('/editor');
  };

  const newBlankStory = () => {
    const story = createStory({});
    setActiveStory(story.id);
    navigate('/editor');
  };

  return (
    <MainLayout>
      <TopBar
        title="Dashboard"
        subtitle="Your story universe"
        actions={
          <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={newBlankStory}>
            New Story
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-bg-primary">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Stories" value={stories.length} icon={<BookOpen size={20} className="text-primary" />} color="bg-primary/20" delta={stories.length > 0 ? `${stories.filter(s => s.status === 'in_progress').length} in progress` : undefined} />
          <StatCard label="Characters" value={totalCharacters} icon={<BarChart3 size={20} className="text-emerald-400" />} color="bg-emerald-500/20" />
          <StatCard label="Words Written" value={totalWords >= 1000 ? `${(totalWords / 1000).toFixed(1)}K` : totalWords} icon={<TrendingUp size={20} className="text-amber-400" />} color="bg-amber-500/20" />
          <StatCard label="Completed" value={stories.filter(s => s.status === 'complete').length} icon={<Sparkles size={20} className="text-cyan-400" />} color="bg-cyan-500/20" />
        </div>

        {/* Quick Start Templates */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary">Quick Start Templates</h2>
            <span className="text-xs text-text-muted">Choose a story structure to begin</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.name}
                onClick={() => createFromTemplate(tpl)}
                className="flex flex-col items-center gap-2 rounded-md border border-border bg-bg-secondary p-4 text-center hover:border-primary hover:bg-bg-tertiary transition-all duration-200 group"
              >
                <span className="text-2xl">{tpl.icon}</span>
                <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary transition-colors">{tpl.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Stories */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary">Your Stories</h2>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search stories…"
                className="w-52 rounded-full border border-border bg-bg-secondary pl-8 pr-4 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-bg-secondary py-16 text-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-bg-tertiary flex items-center justify-center">
                <BookOpen size={24} className="text-text-muted" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary mb-1">No stories yet</p>
                <p className="text-xs text-text-muted">Start with a template or create a blank story</p>
              </div>
              <Button variant="primary" leftIcon={<Plus size={14} />} onClick={newBlankStory}>
                Create your first story
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  onOpen={() => openStory(story)}
                  onDelete={() => deleteStory(story.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
