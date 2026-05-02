import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, BookOpen, Search, Sparkles, Clock, PenLine } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import Starfield from '../components/Starfield';
import ParticleField from '../components/ParticleField';
import BookTypeSelector from '../components/BookTypeSelector';
import StoryCreator from '../components/StoryCreator';
import StoryViewer from '../components/StoryViewer';
import { Story, BookType } from '../types';
import { auth, db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

export default function CosmicDashboard({ userProfile, globalSettings, theme, onToggleTheme }: {
  userProfile?: any; globalSettings?: any; theme?: string; onToggleTheme?: () => void;
}) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [selectedBookType, setSelectedBookType] = useState<BookType | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'stories'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setStories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Story)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = stories.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateStory = (type: BookType) => {
    setSelectedBookType(type);
    setShowTypeSelector(false);
    setIsCreating(true);
  };

  const totalWords = stories.reduce((sum, s) => sum + ((s as any).wordCount || 0), 0);
  const rawDate = (stories[0] as any)?.updatedAt ?? (stories[0] as any)?.createdAt;
  const lastEdit = rawDate
    ? rawDate.toDate
      ? new Date(rawDate.toDate()).toLocaleDateString()
      : new Date(rawDate).toLocaleDateString()
    : '—';

  return (
    <MainLayout>
      {/* Cosmic atmosphere */}
      <Starfield />
      <ParticleField />

      <div className="space-y-10 relative max-w-[1200px] mx-auto">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div>
            <h1 className="text-5xl font-serif text-starlight leading-tight">Your library</h1>
            <p className="text-nebula mt-2 text-lg">Stories written among the stars.</p>
          </div>
          <Button size="lg" onClick={() => setShowTypeSelector(true)}>
            <Plus className="w-5 h-5" />
            New story
          </Button>
        </motion.div>

        {/* Quick stats */}
        <div className="flex gap-4 flex-wrap">
          {[
            { icon: BookOpen, label: 'Stories',   value: stories.length },
            { icon: PenLine,  label: 'Words',     value: totalWords >= 1000 ? `${(totalWords / 1000).toFixed(1)}K` : totalWords || '—' },
            { icon: Clock,    label: 'Last edit',  value: lastEdit },
          ].map(stat => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 px-4 py-2 bg-surface-glass border border-white/[0.06] rounded-xl backdrop-blur-md"
            >
              <stat.icon className="w-5 h-5 text-gold/70" />
              <span className="text-sm text-nebula">{stat.label}</span>
              <span className="font-semibold text-starlight">{stat.value}</span>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="max-w-md">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-nebula pointer-events-none" />
            <Input
              placeholder="Search stories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11"
            />
          </div>
        </div>

        {/* Stories grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-[4/5] w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-28 bg-surface-glass border border-dashed border-gold/30 rounded-3xl backdrop-blur-xl"
          >
            <BookOpen className="w-12 h-12 text-nebula mx-auto mb-4" />
            <h3 className="font-serif text-2xl text-starlight mb-1">No stories yet</h3>
            <p className="text-nebula mb-6">Your first masterpiece awaits.</p>
            <Button onClick={() => setShowTypeSelector(true)}>
              <Sparkles className="w-4 h-4" />
              Start writing
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((story) => (
              <motion.div
                key={story.id}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
              >
                <Card tilt3D padding="none" className="h-full flex flex-col overflow-hidden cursor-pointer" onClick={() => setCurrentStory(story)}>
                  {/* Cover */}
                  <div className="relative aspect-[4/5] bg-gradient-to-br from-void via-surface to-surface overflow-hidden rounded-t-2xl">
                    {story.coverImage ? (
                      <img src={story.coverImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <BookOpen className="w-10 h-10 text-gold/20 mb-2" />
                        <span className="text-xs uppercase tracking-[0.2em] text-gold/30">empty cover</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-glass via-transparent to-transparent" />
                  </div>
                  {/* Info */}
                  <div className="flex flex-col flex-1 p-5">
                    <h3 className="font-serif font-semibold text-xl text-starlight line-clamp-1">{story.title}</h3>
                    <p className="text-sm text-nebula mt-1 flex-1">
                      {story.pages?.length || 0} pages · {(story as any).wordCount || 0} words
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <Badge variant={story.category === 'fantasy' ? 'gold' : 'default'}>
                        {story.category || 'Story'}
                      </Badge>
                      <span className="text-xs text-nebula/60">
                        {(() => {
                          const d = (story as any).updatedAt ?? story.createdAt;
                          return d ? (d.toDate ? new Date(d.toDate()) : new Date(d)).toLocaleDateString() : '';
                        })()}
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showTypeSelector && (
          <BookTypeSelector
            onSelect={handleCreateStory}
            onCancel={() => setShowTypeSelector(false)}
          />
        )}
        {isCreating && selectedBookType && (
          <StoryCreator
            bookType={selectedBookType}
            onComplete={() => { setIsCreating(false); setSelectedBookType(null); }}
            onCancel={() => { setIsCreating(false); setSelectedBookType(null); }}
            userDisplayName={userProfile?.displayName || 'Author'}
            userSubscriptionTier={userProfile?.subscriptionTier || 'free'}
            subscriptionLimits={null}
            userId={auth.currentUser?.uid || ''}
            userTokens={userProfile?.tokens || 0}
          />
        )}
        {currentStory && (
          <StoryViewer
            story={currentStory}
            onClose={() => setCurrentStory(null)}
            narrator={null}
          />
        )}
      </AnimatePresence>
    </MainLayout>
  );
}
