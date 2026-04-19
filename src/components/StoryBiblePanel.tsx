import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, Wand2, Loader2, Save, Sparkles, Globe, Scroll,
  Sword, Crown, Map, Shield, StickyNote, Plus, Trash2, ChevronDown, ChevronUp, X, Copy, Check
} from 'lucide-react';
import { StoryBible } from '../types';
import { AIService, AIProviderSettings, DEFAULT_AI_SETTINGS } from '../services/AIService';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

interface StoryBiblePanelProps {
  storyId?: string;
  onBibleContext?: (context: string) => void; // Callback so StoryCreator can inject bible into prompts
}

type BibleSection = {
  key: keyof Omit<StoryBible, 'id' | 'userId' | 'storyId' | 'title' | 'createdAt' | 'updatedAt'>;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  rows: number;
  aiHint: string;
};

const SECTIONS: BibleSection[] = [
  { key: 'overview',     label: 'World Overview',    icon: <Globe size={14} />,    placeholder: 'The essence of this world in 2–3 sentences…', rows: 3, aiHint: 'overview' },
  { key: 'history',      label: 'History & Timeline', icon: <Scroll size={14} />,  placeholder: 'Key historical events, wars, ages, turning points…', rows: 4, aiHint: 'history' },
  { key: 'magicSystem',  label: 'Magic / Powers',     icon: <Sparkles size={14} />, placeholder: 'How magic works, its rules, costs, limits, who can use it…', rows: 4, aiHint: 'magic system' },
  { key: 'politics',     label: 'Politics & Factions', icon: <Crown size={14} />,  placeholder: 'Who holds power, rival factions, ongoing conflicts…', rows: 4, aiHint: 'political factions' },
  { key: 'geography',    label: 'Geography & Locations', icon: <Map size={14} />, placeholder: 'Key locations, their atmosphere and what happens there…', rows: 4, aiHint: 'geography' },
  { key: 'rules',        label: 'World Rules (Plot-Hole Prevention)', icon: <Shield size={14} />, placeholder: 'Laws of this world that must NEVER be broken for consistency…', rows: 3, aiHint: 'world rules' },
  { key: 'notes',        label: 'Lore Notes',          icon: <StickyNote size={14} />, placeholder: 'Free-form lore dump — anything else the AI should know…', rows: 5, aiHint: 'lore notes' },
];

const BLANK_BIBLE: Omit<StoryBible, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  title: '',
  overview: '',
  history: '',
  magicSystem: '',
  politics: '',
  geography: '',
  rules: '',
  notes: '',
};

export default function StoryBiblePanel({ storyId, onBibleContext }: StoryBiblePanelProps) {
  const [bibles, setBibles] = useState<StoryBible[]>([]);
  const [activeBible, setActiveBible] = useState<StoryBible | null>(null);
  const [draft, setDraft] = useState<Omit<StoryBible, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>(BLANK_BIBLE);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');
  const [aiSettings, setAiSettings] = useState<AIProviderSettings>(DEFAULT_AI_SETTINGS);
  const [genreHint, setGenreHint] = useState('');
  const [storyIdeaHint, setStoryIdeaHint] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => { AIService.loadSettings().then(setAiSettings); }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'storyBibles'), where('userId', '==', auth.currentUser.uid));
    return onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as StoryBible))
        .sort((a, b) => b.updatedAt - a.updatedAt);
      setBibles(list);
      // Auto-select bible linked to storyId if present
      if (storyId) {
        const linked = list.find(b => b.storyId === storyId);
        if (linked && !activeBible) { setActiveBible(linked); loadDraft(linked); }
      }
    });
  }, [storyId]);

  const loadDraft = (bible: StoryBible) => {
    setDraft({
      title: bible.title, storyId: bible.storyId, overview: bible.overview,
      history: bible.history, magicSystem: bible.magicSystem, politics: bible.politics,
      geography: bible.geography, rules: bible.rules, notes: bible.notes,
    });
  };

  const startNew = () => {
    setDraft({ ...BLANK_BIBLE, storyId });
    setActiveBible(null);
    setIsCreating(true);
  };

  const selectBible = (b: StoryBible) => {
    setActiveBible(b);
    loadDraft(b);
    setIsCreating(false);
  };

  const handleSave = async () => {
    if (!auth.currentUser || !draft.title.trim()) return toast.error('Give your Story Bible a title.');
    setSaving(true);
    try {
      const now = Date.now();
      if (isCreating) {
        const ref = await addDoc(collection(db, 'storyBibles'), {
          ...draft, userId: auth.currentUser.uid, createdAt: now, updatedAt: now,
        });
        toast.success('Story Bible created.');
        setIsCreating(false);
      } else if (activeBible) {
        await updateDoc(doc(db, 'storyBibles', activeBible.id), { ...draft, updatedAt: now });
        toast.success('Story Bible saved.');
      }
      // Notify parent with context string
      emitContext();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'storyBibles', id));
    if (activeBible?.id === id) { setActiveBible(null); setIsCreating(false); }
    toast.success('Story Bible deleted.');
  };

  const handleAIFillSection = async (sectionKey: string, hint: string) => {
    if (!storyIdeaHint && !draft.overview) return toast.error('Add a story idea or world overview first.');
    setAiLoading(sectionKey);
    try {
      const result = await AIService.generateStoryBible(
        storyIdeaHint || draft.overview, genreHint || 'fiction', hint, aiSettings
      );
      const val = (result as any)[sectionKey];
      if (val) setDraft(d => ({ ...d, [sectionKey]: val }));
      toast.success(`${hint} generated.`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAiLoading(null);
    }
  };

  const handleAIFillAll = async () => {
    if (!storyIdeaHint && !draft.title) return toast.error('Enter a story idea below before generating.');
    setAiLoading('all');
    try {
      const result = await AIService.generateStoryBible(
        storyIdeaHint || draft.title, genreHint || 'fiction', genreHint || 'a story', aiSettings
      );
      setDraft(d => ({ ...d, ...result }));
      toast.success('Story Bible auto-filled! Review and edit each section.');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAiLoading(null);
    }
  };

  const emitContext = () => {
    if (!onBibleContext) return;
    const ctx = [
      draft.overview && `World Overview: ${draft.overview}`,
      draft.history && `History: ${draft.history}`,
      draft.magicSystem && `Magic/Powers: ${draft.magicSystem}`,
      draft.politics && `Politics: ${draft.politics}`,
      draft.geography && `Geography: ${draft.geography}`,
      draft.rules && `World Rules (must not be broken): ${draft.rules}`,
      draft.notes && `Additional Lore: ${draft.notes}`,
    ].filter(Boolean).join('\n\n');
    onBibleContext(ctx);
  };

  const copyContext = () => {
    const ctx = SECTIONS.map(s => {
      const val = (draft as any)[s.key];
      return val ? `### ${s.label}\n${val}` : '';
    }).filter(Boolean).join('\n\n');
    navigator.clipboard.writeText(ctx);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Story Bible copied to clipboard.');
  };

  const isEditing = isCreating || !!activeBible;

  return (
    <div className="flex h-full min-h-0 bg-[#080808]">
      {/* ── Left: Bible List ── */}
      <div className="w-64 flex-shrink-0 border-r border-white/[0.07] flex flex-col">
        <div className="p-5 border-b border-white/[0.07]">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30 mb-3">Story Bibles</p>
          <button
            onClick={startNew}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gold/10 border border-gold/20 rounded-xl text-gold text-xs font-bold hover:bg-gold/15 transition-all"
          >
            <Plus size={13} /> New Bible
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {bibles.length === 0 && !isCreating && (
            <div className="text-center py-10">
              <BookOpen size={28} className="text-white/10 mx-auto mb-3" />
              <p className="text-white/20 text-xs">No bibles yet.</p>
            </div>
          )}
          {bibles.map(b => (
            <button
              key={b.id}
              onClick={() => selectBible(b)}
              className={cn(
                'w-full text-left p-3 rounded-xl border transition-all group flex items-center justify-between gap-2',
                activeBible?.id === b.id
                  ? 'bg-gold/10 border-gold/20'
                  : 'bg-white/[0.03] border-white/[0.06] hover:border-white/15 hover:bg-white/[0.05]'
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white/80 truncate">{b.title}</p>
                <p className="text-[10px] text-white/25 mt-0.5">
                  Updated {new Date(b.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); handleDelete(b.id); }}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 rounded-lg text-white/20 hover:text-red-400 transition-all flex-shrink-0"
              >
                <Trash2 size={11} />
              </button>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: Editor ── */}
      <div className="flex-1 overflow-y-auto">
        {!isEditing ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-12">
            <div className="w-20 h-20 rounded-3xl bg-gold/5 border border-gold/10 flex items-center justify-center mb-6">
              <BookOpen size={36} className="text-gold/30" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-white/60 mb-2">Story Bible Engine</h2>
            <p className="text-white/25 text-sm max-w-sm leading-relaxed">
              Your persistent world-building knowledge base. The AI reads this before every scene to prevent plot holes and maintain lore consistency.
            </p>
            <button
              onClick={startNew}
              className="mt-8 flex items-center gap-2 px-6 py-3 bg-gold text-[#080808] rounded-xl font-bold text-sm hover:bg-white transition-all shadow-lg shadow-gold/20"
            >
              <Plus size={16} /> Create Story Bible
            </button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold/60 mb-1">
                  {isCreating ? 'New Story Bible' : 'Edit Bible'}
                </p>
                <h2 className="text-2xl font-serif font-bold text-white">
                  {draft.title || 'Untitled World'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyContext}
                  className="p-2.5 hover:bg-white/5 rounded-xl text-white/30 hover:text-white/60 transition-all"
                  title="Copy bible as text"
                >
                  {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} />}
                </button>
                <button
                  onClick={() => { setActiveBible(null); setIsCreating(false); }}
                  className="p-2 hover:bg-white/5 rounded-xl text-white/30 hover:text-white/70 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Bible / World Title</label>
              <input
                value={draft.title}
                onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                placeholder="e.g. The Shattered Realm, The Far Future Chronicles…"
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold/40 text-white/80 text-sm font-serif placeholder:text-white/20 transition-colors"
              />
            </div>

            {/* AI context inputs */}
            <div className="p-4 bg-gold/[0.04] border border-gold/10 rounded-2xl space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gold/50">AI Generation Context</p>
              <input
                value={storyIdeaHint}
                onChange={e => setStoryIdeaHint(e.target.value)}
                placeholder="Story idea or premise for AI to base the bible on…"
                className="w-full bg-transparent border-b border-white/10 pb-2 text-sm text-white/70 outline-none placeholder:text-white/20"
              />
              <input
                value={genreHint}
                onChange={e => setGenreHint(e.target.value)}
                placeholder="Genre (e.g. dark fantasy, space opera, gothic horror)…"
                className="w-full bg-transparent text-sm text-white/70 outline-none placeholder:text-white/20"
              />
            </div>

            {/* AI Fill All */}
            <button
              onClick={handleAIFillAll}
              disabled={aiLoading === 'all'}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gold/10 border border-gold/20 rounded-2xl text-gold text-sm font-bold hover:bg-gold/15 hover:border-gold/30 transition-all disabled:opacity-40"
            >
              {aiLoading === 'all' ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
              {aiLoading === 'all' ? 'Building World…' : 'AI: Auto-Build Entire Bible'}
            </button>

            {/* Inject into AI notice */}
            {onBibleContext && (
              <div className="flex items-center gap-3 p-3.5 bg-green-500/5 border border-green-500/15 rounded-xl">
                <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0 animate-pulse" />
                <p className="text-xs text-green-400/70">This bible will be injected into every AI generation for this story.</p>
                <button onClick={emitContext} className="ml-auto text-[10px] font-bold text-green-400/60 hover:text-green-400 uppercase tracking-wider">Sync</button>
              </div>
            )}

            {/* Accordion sections */}
            <div className="space-y-2">
              {SECTIONS.map(section => (
                <div
                  key={section.key}
                  className={cn(
                    'border rounded-2xl transition-all overflow-hidden',
                    expandedSection === section.key
                      ? 'border-gold/20 bg-gold/[0.03]'
                      : 'border-white/[0.07] bg-white/[0.02]'
                  )}
                >
                  {/* Section header */}
                  <button
                    onClick={() => setExpandedSection(expandedSection === section.key ? null : section.key)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                  >
                    <span className={cn('flex-shrink-0', expandedSection === section.key ? 'text-gold' : 'text-white/30')}>
                      {section.icon}
                    </span>
                    <span className={cn('text-xs font-bold uppercase tracking-widest flex-1',
                      expandedSection === section.key ? 'text-gold' : 'text-white/40')}>
                      {section.label}
                    </span>
                    {(draft as any)[section.key] && (
                      <span className="w-1.5 h-1.5 bg-gold/60 rounded-full" />
                    )}
                    {expandedSection === section.key
                      ? <ChevronUp size={14} className="text-white/30" />
                      : <ChevronDown size={14} className="text-white/20" />}
                  </button>

                  {/* Section content */}
                  {expandedSection === section.key && (
                    <div className="px-4 pb-4 space-y-2">
                      <textarea
                        value={(draft as any)[section.key] || ''}
                        onChange={e => setDraft(d => ({ ...d, [section.key]: e.target.value }))}
                        placeholder={section.placeholder}
                        rows={section.rows}
                        className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-3 outline-none focus:border-gold/30 text-white/75 text-sm leading-relaxed placeholder:text-white/15 resize-none transition-colors"
                      />
                      <button
                        onClick={() => handleAIFillSection(section.key, section.aiHint)}
                        disabled={!!aiLoading}
                        className="flex items-center gap-1.5 text-[10px] text-white/25 hover:text-gold transition-colors disabled:opacity-30"
                      >
                        {aiLoading === section.key ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                        AI fill this section
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Save */}
            <div className="flex gap-3 pb-8">
              <button
                onClick={() => { setActiveBible(null); setIsCreating(false); }}
                className="px-5 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white/40 hover:text-white/70 font-semibold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !draft.title.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gold text-[#080808] rounded-xl font-bold text-sm hover:bg-white transition-all shadow-lg shadow-gold/20 disabled:opacity-50"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? 'Saving…' : isCreating ? 'Create Bible' : 'Save Bible'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
