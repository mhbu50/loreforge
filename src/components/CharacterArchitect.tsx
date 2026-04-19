import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, X, Wand2, Loader2, Save, Trash2, User, Sparkles,
  Lock, Unlock, Image as ImageIcon, ChevronRight, Shield,
  Sword, Heart, Star, Users, BookOpen, Zap, Eye
} from 'lucide-react';
import { Character, CharacterRole } from '../types';
import { AIService, AIProviderSettings, DEFAULT_AI_SETTINGS } from '../services/AIService';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

interface CharacterArchitectProps {
  storyId?: string;
  userSubscriptionTier?: string;
}

const ROLE_CONFIG: Record<CharacterRole, { label: string; icon: React.ReactNode; color: string }> = {
  protagonist: { label: 'Protagonist', icon: <Star size={14} />, color: 'text-gold bg-gold/10 border-gold/20' },
  antagonist:  { label: 'Antagonist', icon: <Sword size={14} />, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  supporting:  { label: 'Supporting', icon: <Heart size={14} />, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  npc:         { label: 'NPC',         icon: <Users size={14} />, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  mentor:      { label: 'Mentor',      icon: <BookOpen size={14} />, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  trickster:   { label: 'Trickster',  icon: <Zap size={14} />, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
};

const BLANK_CHARACTER: Omit<Character, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  name: '',
  role: 'protagonist',
  age: '',
  appearance: '',
  personality: '',
  backstory: '',
  motivations: '',
  flaws: '',
  voiceStyle: '',
  arc: '',
  portraitUrl: '',
  portraitStyle: '',
};

const FIELD_LABELS: { key: keyof typeof BLANK_CHARACTER; label: string; placeholder: string; rows?: number }[] = [
  { key: 'appearance', label: 'Appearance (Face-Lock)', placeholder: 'Detailed physical description used for image consistency across every scene…', rows: 3 },
  { key: 'personality', label: 'Personality', placeholder: 'Core traits that define how they see the world…', rows: 2 },
  { key: 'backstory', label: 'Backstory', placeholder: 'The formative experiences that made them who they are…', rows: 3 },
  { key: 'motivations', label: 'Motivations', placeholder: 'What they want (surface) vs. what they need (deep)…', rows: 2 },
  { key: 'flaws', label: 'Flaws', placeholder: 'Genuine weaknesses that drive conflict…', rows: 2 },
  { key: 'voiceStyle', label: 'Voice Style', placeholder: 'How they speak — tone, vocabulary, verbal tics…', rows: 2 },
  { key: 'arc', label: 'Character Arc', placeholder: 'The transformation they undergo across the story…', rows: 2 },
];

export default function CharacterArchitect({ storyId, userSubscriptionTier }: CharacterArchitectProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selected, setSelected] = useState<Character | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState<Omit<Character, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>(BLANK_CHARACTER);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);  // which field is generating
  const [portraitLoading, setPortraitLoading] = useState(false);
  const [appearanceLocked, setAppearanceLocked] = useState(false);
  const [aiSettings, setAiSettings] = useState<AIProviderSettings>(DEFAULT_AI_SETTINGS);
  const [genreContext, setGenreContext] = useState('');

  useEffect(() => {
    AIService.loadSettings().then(setAiSettings);
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = storyId
      ? query(collection(db, 'characters'), where('userId', '==', auth.currentUser.uid), where('storyId', '==', storyId))
      : query(collection(db, 'characters'), where('userId', '==', auth.currentUser.uid));
    return onSnapshot(q, snap => {
      setCharacters(snap.docs.map(d => ({ id: d.id, ...d.data() } as Character))
        .sort((a, b) => b.createdAt - a.createdAt));
    });
  }, [storyId]);

  const startNew = () => {
    setDraft({ ...BLANK_CHARACTER, storyId });
    setIsCreating(true);
    setSelected(null);
    setAppearanceLocked(false);
  };

  const selectCharacter = (c: Character) => {
    setSelected(c);
    setDraft({
      name: c.name, role: c.role, age: c.age, storyId: c.storyId,
      appearance: c.appearance, personality: c.personality, backstory: c.backstory,
      motivations: c.motivations, flaws: c.flaws, voiceStyle: c.voiceStyle,
      arc: c.arc, portraitUrl: c.portraitUrl, portraitStyle: c.portraitStyle,
    });
    setIsCreating(false);
    setAppearanceLocked(!!c.portraitUrl);
  };

  const handleSave = async () => {
    if (!auth.currentUser || !draft.name.trim()) return toast.error('Character needs a name.');
    setSaving(true);
    try {
      const now = Date.now();
      if (isCreating) {
        await addDoc(collection(db, 'characters'), {
          ...draft, userId: auth.currentUser.uid, createdAt: now, updatedAt: now,
        });
        toast.success(`${draft.name} added to your cast.`);
      } else if (selected) {
        await updateDoc(doc(db, 'characters', selected.id), { ...draft, updatedAt: now });
        toast.success('Character updated.');
      }
      setIsCreating(false);
      setSelected(null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'characters', id));
    if (selected?.id === id) { setSelected(null); setIsCreating(false); }
    toast.success('Character removed.');
  };

  const handleAIFillField = async (fieldKey: string) => {
    if (!draft.name) return toast.error('Enter a character name first.');
    setAiLoading(fieldKey);
    try {
      const profile = await AIService.generateCharacterProfile(
        draft.name, draft.role, genreContext || 'fiction', genreContext || 'an original story', aiSettings
      );
      const val = (profile as any)[fieldKey];
      if (val) setDraft(d => ({ ...d, [fieldKey]: val }));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAiLoading(null);
    }
  };

  const handleAIFillAll = async () => {
    if (!draft.name) return toast.error('Enter a character name first.');
    setAiLoading('all');
    try {
      const profile = await AIService.generateCharacterProfile(
        draft.name, draft.role, genreContext || 'fiction', genreContext || 'an original story', aiSettings
      );
      setDraft(d => ({ ...d, ...profile }));
      toast.success('Character profile generated!');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAiLoading(null);
    }
  };

  const handleGeneratePortrait = async () => {
    if (!draft.name || !draft.appearance) return toast.error('Fill in Appearance first for visual consistency.');
    setPortraitLoading(true);
    try {
      const imagePrompt = `Character portrait of ${draft.name}. ${draft.appearance}. ${draft.role} archetype. ${draft.portraitStyle || 'cinematic lighting, professional illustration'}. High detail, face-focused.`;
      const url = await AIService.generateImage(imagePrompt, aiSettings);
      setDraft(d => ({ ...d, portraitUrl: url }));
      setAppearanceLocked(true);
      toast.success('Portrait generated! Appearance is now face-locked for consistency.');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPortraitLoading(false);
    }
  };

  const isEditing = isCreating || !!selected;

  return (
    <div className="flex h-full min-h-0 bg-[#080808]">
      {/* ── Left: Character List ── */}
      <div className="w-72 flex-shrink-0 border-r border-white/[0.07] flex flex-col">
        <div className="p-5 border-b border-white/[0.07]">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Cast</p>
            <span className="text-[10px] text-white/20">{characters.length} character{characters.length !== 1 ? 's' : ''}</span>
          </div>
          <button
            onClick={startNew}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 bg-gold/10 border border-gold/20 rounded-xl text-gold text-xs font-bold hover:bg-gold/15 hover:border-gold/30 transition-all"
          >
            <Plus size={14} /> New Character
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {characters.length === 0 && !isCreating && (
            <div className="text-center py-10">
              <User size={28} className="text-white/10 mx-auto mb-3" />
              <p className="text-white/20 text-xs">No characters yet.</p>
              <p className="text-white/10 text-[10px] mt-1">Build your cast above.</p>
            </div>
          )}
          {characters.map(c => {
            const roleConf = ROLE_CONFIG[c.role];
            return (
              <button
                key={c.id}
                onClick={() => selectCharacter(c)}
                className={cn(
                  'w-full text-left p-3 rounded-xl border transition-all group flex items-center gap-3',
                  selected?.id === c.id
                    ? 'bg-gold/10 border-gold/20'
                    : 'bg-white/[0.03] border-white/[0.06] hover:border-white/15 hover:bg-white/[0.05]'
                )}
              >
                {c.portraitUrl ? (
                  <img src={c.portraitUrl} alt={c.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-white/10" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-white/20" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-sm font-semibold text-white/80 truncate">{c.name}</p>
                    {c.portraitUrl && <Lock size={9} className="text-gold/60 flex-shrink-0" />}
                  </div>
                  <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold border', roleConf.color)}>
                    {roleConf.icon} {roleConf.label}
                  </span>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(c.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 rounded-lg text-white/20 hover:text-red-400 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right: Editor ── */}
      <div className="flex-1 overflow-y-auto">
        {!isEditing ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-12">
            <div className="w-20 h-20 rounded-3xl bg-gold/5 border border-gold/10 flex items-center justify-center mb-6">
              <Users size={36} className="text-gold/30" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-white/60 mb-2">Character Architect</h2>
            <p className="text-white/25 text-sm max-w-sm leading-relaxed">
              Build your cast with deep AI-generated profiles — backstories, motivations, flaws, and portrait images that stay visually consistent across every scene.
            </p>
            <button
              onClick={startNew}
              className="mt-8 flex items-center gap-2 px-6 py-3 bg-gold text-[#080808] rounded-xl font-bold text-sm hover:bg-white transition-all shadow-lg shadow-gold/20"
            >
              <Plus size={16} /> Create First Character
            </button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold/60 mb-1">
                  {isCreating ? 'New Character' : 'Edit Character'}
                </p>
                <h2 className="text-2xl font-serif font-bold text-white">
                  {draft.name || 'Unnamed Character'}
                </h2>
              </div>
              <button
                onClick={() => { setIsCreating(false); setSelected(null); }}
                className="p-2 hover:bg-white/5 rounded-xl text-white/30 hover:text-white/70 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Genre context for AI */}
            <div className="p-4 bg-gold/[0.04] border border-gold/10 rounded-2xl">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gold/50 mb-2">AI Context</p>
              <input
                value={genreContext}
                onChange={e => setGenreContext(e.target.value)}
                placeholder="Genre or story context for AI (e.g. 'dark fantasy epic', 'sci-fi noir')…"
                className="w-full bg-transparent text-sm text-white/70 outline-none placeholder:text-white/20"
              />
            </div>

            {/* Name + Role + Age */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Name</label>
                <input
                  value={draft.name}
                  onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                  placeholder="Character name"
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold/40 text-white/80 text-sm font-serif placeholder:text-white/20 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Age</label>
                <input
                  value={draft.age || ''}
                  onChange={e => setDraft(d => ({ ...d, age: e.target.value }))}
                  placeholder="e.g. 34"
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold/40 text-white/80 text-sm placeholder:text-white/20 transition-colors"
                />
              </div>
            </div>

            {/* Role selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Role</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(ROLE_CONFIG) as [CharacterRole, typeof ROLE_CONFIG[CharacterRole]][]).map(([role, conf]) => (
                  <button
                    key={role}
                    onClick={() => setDraft(d => ({ ...d, role }))}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all',
                      draft.role === role ? conf.color : 'bg-white/[0.03] border-white/[0.06] text-white/30 hover:border-white/15'
                    )}
                  >
                    {conf.icon} {conf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Portrait */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Portrait</label>
                {draft.portraitUrl && (
                  <span className="flex items-center gap-1 text-[10px] text-gold/60 font-bold">
                    <Lock size={10} /> Face-Locked — visual consistency enabled
                  </span>
                )}
              </div>
              <div className="flex gap-4 items-start">
                {draft.portraitUrl ? (
                  <div className="relative w-24 h-24 flex-shrink-0 group">
                    <img src={draft.portraitUrl} alt="Portrait" className="w-24 h-24 rounded-2xl object-cover border border-white/10" />
                    <button
                      onClick={() => { setDraft(d => ({ ...d, portraitUrl: '' })); setAppearanceLocked(false); }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center flex-shrink-0">
                    <User size={28} className="text-white/15" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <input
                    value={draft.portraitStyle || ''}
                    onChange={e => setDraft(d => ({ ...d, portraitStyle: e.target.value }))}
                    placeholder="Visual style (e.g. 'oil painting, dramatic lighting, fantasy art')…"
                    className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-gold/40 text-white/70 text-xs placeholder:text-white/20 transition-colors"
                  />
                  <button
                    onClick={handleGeneratePortrait}
                    disabled={portraitLoading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.06] border border-white/10 rounded-xl text-xs font-bold text-white/50 hover:bg-gold/10 hover:border-gold/20 hover:text-gold transition-all disabled:opacity-40"
                  >
                    {portraitLoading ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
                    {portraitLoading ? 'Generating…' : 'Generate Portrait'}
                  </button>
                </div>
              </div>
            </div>

            {/* AI Fill All */}
            <button
              onClick={handleAIFillAll}
              disabled={aiLoading === 'all' || !draft.name}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gold/10 border border-gold/20 rounded-2xl text-gold text-sm font-bold hover:bg-gold/15 hover:border-gold/30 transition-all disabled:opacity-40"
            >
              {aiLoading === 'all' ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
              {aiLoading === 'all' ? 'Generating Full Profile…' : 'AI: Generate Full Profile'}
            </button>

            {/* Individual fields */}
            {FIELD_LABELS.map(({ key, label, placeholder, rows }) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                    {label}
                    {key === 'appearance' && (
                      <span className="ml-2 text-gold/50 normal-case tracking-normal font-normal">
                        — used in every image prompt for face-lock
                      </span>
                    )}
                  </label>
                  <button
                    onClick={() => handleAIFillField(key as string)}
                    disabled={!!aiLoading || !draft.name}
                    className="flex items-center gap-1 text-[10px] text-white/25 hover:text-gold transition-colors disabled:opacity-30"
                  >
                    {aiLoading === key ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                    AI fill
                  </button>
                </div>
                <textarea
                  value={(draft as any)[key] || ''}
                  onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                  placeholder={placeholder}
                  rows={rows || 2}
                  className={cn(
                    'w-full bg-white/[0.05] border rounded-xl px-4 py-3 outline-none text-white/80 text-sm leading-relaxed placeholder:text-white/20 resize-none transition-colors',
                    key === 'appearance' && appearanceLocked
                      ? 'border-gold/30 bg-gold/[0.04]'
                      : 'border-white/10 focus:border-gold/40'
                  )}
                />
                {key === 'appearance' && appearanceLocked && (
                  <p className="text-[10px] text-gold/50 flex items-center gap-1">
                    <Lock size={9} /> Locked — this description is injected into every image generation for visual consistency.
                  </p>
                )}
              </div>
            ))}

            {/* Save */}
            <div className="flex gap-3 pb-8">
              <button
                onClick={() => { setIsCreating(false); setSelected(null); }}
                className="px-5 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white/40 hover:text-white/70 font-semibold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !draft.name.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gold text-[#080808] rounded-xl font-bold text-sm hover:bg-white transition-all shadow-lg shadow-gold/20 disabled:opacity-50"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? 'Saving…' : isCreating ? 'Add to Cast' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
