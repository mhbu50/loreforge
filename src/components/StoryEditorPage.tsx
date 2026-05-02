import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import {
  BookOpen, ChevronLeft, Maximize2, Minimize2,
  SidebarOpen, SidebarClose, Sparkles, List, Target, Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useStoryStore } from '@/src/stores/useStoryStore';
import { TipTapEditor } from './editor/TipTapEditor';
import { AIPanel } from './editor/AIPanel';
import { OutlineTree } from './editor/OutlineTree';
import { BeatSheet } from './editor/BeatSheet';
import { CharacterBible } from './editor/CharacterBible';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';
import { Badge } from './ui/Badge';

type SidePanel = 'outline' | 'beats' | 'characters';

export default function StoryEditorPage() {
  const navigate = useNavigate();
  const story = useStoryStore((s) => s.getActiveStory());
  const updateStory = useStoryStore((s) => s.updateStory);
  const [showAI, setShowAI] = useState(true);
  const [showLeft, setShowLeft] = useState(true);
  const [zenMode, setZenMode] = useState(false);
  const [leftTab, setLeftTab] = useState<SidePanel>('outline');
  const [wordCount, setWordCount] = useState(story?.wordCount ?? 0);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Apply editor dark theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'editor');
    return () => {
      document.documentElement.setAttribute('data-theme',
        localStorage.getItem('storycraft-theme') ?? 'light'
      );
    };
  }, []);

  // Auto-save every 10 seconds
  useEffect(() => {
    if (!story) return;
    const interval = setInterval(() => {
      if (saveState === 'unsaved') {
        updateStory(story.id, {});
        setSaveState('saved');
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [story, saveState, updateStory]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 's') { e.preventDefault(); setSaveState('saved'); }
      if (ctrl && e.shiftKey && e.key === 'A') { e.preventDefault(); setShowAI((v) => !v); }
      if (e.key === 'Escape' && zenMode) setZenMode(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zenMode]);

  const handleContentChange = useCallback((html: string, _text: string, words: number) => {
    if (!story) return;
    setSaveState('unsaved');
    setWordCount(words);
    const timeout = setTimeout(() => {
      updateStory(story.id, { content: html, wordCount: words });
      setSaveState('saved');
    }, 1200);
    return () => clearTimeout(timeout);
  }, [story, updateStory]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!story) return;
    updateStory(story.id, { title: e.target.value });
  }, [story, updateStory]);

  if (!story) {
    return (
      <div className="flex h-screen items-center justify-center bg-void">
        <div className="text-center space-y-4">
          <BookOpen size={40} className="mx-auto text-nebula/60" />
          <p className="text-nebula">No story selected</p>
          <Button onClick={() => navigate('/')} variant="primary">Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const progress = story.targetWordCount ? Math.min(100, Math.round((wordCount / story.targetWordCount) * 100)) : 0;

  return (
    <div className="flex h-screen flex-col bg-void overflow-hidden">
      {/* Top bar */}
      <AnimatePresence>
        {!zenMode && (
          <motion.header
            initial={{ y: -48 }}
            animate={{ y: 0 }}
            exit={{ y: -48 }}
            transition={{ duration: 0.2 }}
            className="flex h-12 flex-shrink-0 items-center justify-between border-b border-white/[0.06] bg-surface-glass/60 backdrop-blur-xl px-4 z-20"
          >
            <div className="flex items-center gap-2">
              <IconButton label="Back" size="sm" onClick={() => navigate('/')}>
                <ChevronLeft size={16} />
              </IconButton>
              <div className="h-4 w-px bg-white/[0.06]" />
              <IconButton
                label={showLeft ? 'Hide outline' : 'Show outline'}
                size="sm"
                onClick={() => setShowLeft((v) => !v)}
                className={cn(showLeft && 'bg-gold/15 text-gold')}
              >
                {showLeft ? <SidebarClose size={16} /> : <SidebarOpen size={16} />}
              </IconButton>

              <input
                value={story.title}
                onChange={handleTitleChange}
                className="ml-2 bg-transparent text-sm font-medium text-starlight outline-none border-b border-transparent focus:border-gold transition-colors px-1 min-w-0 max-w-xs"
                placeholder="Story title…"
              />

              <Badge variant={story.status === 'complete' ? 'success' : story.status === 'in_progress' ? 'primary' : 'default'} className="ml-1">
                {story.status.replace('_', ' ')}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              {/* Word count */}
              <div className="hidden sm:flex items-center gap-2 text-xs text-nebula/60">
                <span>{wordCount.toLocaleString()} / {story.targetWordCount.toLocaleString()} words</span>
                <div className="h-1 w-20 rounded-full bg-void/60 overflow-hidden">
                  <div
                    className="h-full bg-gold rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-gold">{progress}%</span>
              </div>

              <div className="h-4 w-px bg-white/[0.06]" />

              <div className="flex items-center gap-1">
                <span className={cn('text-xs transition-colors', saveState === 'saved' ? 'text-emerald-400' : saveState === 'saving' ? 'text-amber-400' : 'text-nebula/60')}>
                  {saveState === 'saved' ? 'Saved' : saveState === 'saving' ? 'Saving…' : '● Unsaved'}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <IconButton
                  label="Toggle AI panel"
                  size="sm"
                  onClick={() => setShowAI((v) => !v)}
                  className={cn(showAI && 'bg-gold/15 text-gold')}
                >
                  <Sparkles size={15} />
                </IconButton>
                <IconButton
                  label={zenMode ? 'Exit zen mode' : 'Zen mode'}
                  size="sm"
                  onClick={() => setZenMode((v) => !v)}
                >
                  {zenMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </IconButton>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Zen mode exit */}
      {zenMode && (
        <button
          onClick={() => setZenMode(false)}
          className="fixed top-4 right-4 z-50 rounded-lg bg-surface-glass/60 backdrop-blur-xl border border-white/[0.06] px-3 py-1.5 text-xs text-nebula hover:text-starlight transition-colors shadow-lg"
        >
          Exit zen mode
        </button>
      )}

      {/* Main panels */}
      <PanelGroup orientation="horizontal" className="flex-1 overflow-hidden">
        {/* Left panel — outline / beats / characters */}
        {showLeft && !zenMode && (
          <>
            <Panel defaultSize={18} minSize={14} maxSize={28}>
              <div className="flex h-full flex-col border-r border-white/[0.06]">
                <div className="flex border-b border-white/[0.06] bg-surface-glass/60 backdrop-blur-xl">
                  <button
                    onClick={() => setLeftTab('outline')}
                    className={cn('flex flex-1 items-center justify-center gap-1.5 py-2 text-xs transition-colors', leftTab === 'outline' ? 'text-gold border-b-2 border-gold' : 'text-nebula/60 hover:text-starlight')}
                  >
                    <List size={12} /> Outline
                  </button>
                  <button
                    onClick={() => setLeftTab('beats')}
                    className={cn('flex flex-1 items-center justify-center gap-1.5 py-2 text-xs transition-colors', leftTab === 'beats' ? 'text-gold border-b-2 border-gold' : 'text-nebula/60 hover:text-starlight')}
                  >
                    <Target size={12} /> Beats
                  </button>
                  <button
                    onClick={() => setLeftTab('characters')}
                    className={cn('flex flex-1 items-center justify-center gap-1.5 py-2 text-xs transition-colors', leftTab === 'characters' ? 'text-gold border-b-2 border-gold' : 'text-nebula/60 hover:text-starlight')}
                  >
                    <Users size={12} /> Cast
                  </button>
                </div>

                {leftTab === 'outline' && <OutlineTree storyId={story.id} className="flex-1" />}
                {leftTab === 'beats' && <BeatSheet storyId={story.id} className="flex-1" />}
                {leftTab === 'characters' && (
                  <CharacterBible storyId={story.id} className="flex-1" />
                )}
              </div>
            </Panel>
            <PanelResizeHandle className="w-0.5 bg-white/[0.06] hover:bg-gold/40 transition-colors cursor-col-resize" />
          </>
        )}

        {/* Editor */}
        <Panel defaultSize={showAI ? 52 : 82} minSize={30}>
          <div className="flex h-full flex-col bg-void">
            <TipTapEditor
              content={story.content}
              onChange={handleContentChange}
              placeholder={`Start writing "${story.title}"…`}
              className="flex-1"
            />
          </div>
        </Panel>

        {/* AI Panel */}
        {showAI && !zenMode && (
          <>
            <PanelResizeHandle className="w-0.5 bg-white/[0.06] hover:bg-gold/40 transition-colors cursor-col-resize" />
            <Panel defaultSize={28} minSize={20} maxSize={40}>
              <AIPanel
                storyContext={story.synopsis + '\n\n' + (story.content ? story.content.replace(/<[^>]*>/g, '') : '')}
                onInsert={(text) => {
                  // Insert at cursor via a custom event the editor can listen to
                }}
                className="h-full"
              />
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
}
