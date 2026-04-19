import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, FileText, Loader2, ImageIcon, Plus, Trash2, Wand2, ChevronLeft, ChevronRight, X, Edit3, Mic, MicOff, Languages, Layout, Zap, Type, Image as ImageIconLucide, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, Settings, Sliders, Brain, Upload, Grid, GitBranch, BookOpen, Map, Sword, Users } from 'lucide-react';
import { AIService, GenerationMode, AIProgress, getEffectiveModel } from '../services/AIService';
import { StoryStyle, StoryPage, SubscriptionTier, ImageAdjustments, NarrativeStructure, BranchChoice } from '../types';
import ImageEditor from './ImageEditor';
import PhotoPicker from './PhotoPicker';
import { getSubscriptionLimits, STORY_STYLES, STORY_CATEGORIES, FONTS } from '../constants';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import confetti from 'canvas-confetti';

interface StoryCreatorProps {
  onComplete: (title: string, pages: StoryPage[], style: StoryStyle, category: string, language: string, ageGroup: string, bookType: 'story' | 'comic' | 'anime' | 'novel' | 'manga' | 'biography' | 'other', authorName: string, coverImage: string, coverImageAdjustments?: ImageAdjustments, narrativeStructure?: NarrativeStructure, isBranching?: boolean) => void;
  onCancel: () => void;
  userDisplayName: string;
  userSubscriptionTier: SubscriptionTier;
  subscriptionLimits: any;
  userId: string;
  userTokens: number;
  onConsumeTokens?: (amount: number, reason: string) => Promise<boolean>;
  bookType: 'story' | 'comic' | 'anime' | 'novel' | 'manga' | 'biography' | 'other';
  config?: any;
  initialStory?: any;
  userPreferredAI?: { text?: string; image?: string; enhance?: string; title?: string; };
  storyBibleContext?: string; // Injected world-lore context from StoryBiblePanel
}

// Removed NarratorVoice type as AI narration is disabled

const TEMPLATES = [
  { id: 'birthday', name: 'Birthday Surprise', idea: 'A magical birthday party where the presents come to life.' },
  { id: 'space', name: 'Space Explorer', idea: 'A young astronaut discovers a planet made of candy.' },
  { id: 'forest', name: 'Secret Forest', idea: 'A hidden door in a tree leads to a kingdom of talking animals.' },
  { id: 'ocean', name: 'Deep Sea Quest', idea: 'A brave submarine pilot finds a lost city of gold.' }
];

const LANGUAGES = [
  { code: 'English', name: 'English' },
  { code: 'Spanish', name: 'Español' },
  { code: 'French', name: 'Français' },
  { code: 'Arabic', name: 'العربية' },
  { code: 'Japanese', name: '日本語' },
  { code: 'German', name: 'Deutsch' }
];

const AGE_GROUPS = [
  { id: '0-3', name: '0-3 (Picture Books)' },
  { id: '3-5', name: '3-5 (Early Reader)' },
  { id: '6-8', name: '6-8 (Chapter Books)' },
  { id: '9-12', name: '9-12 (Middle Grade)' },
  { id: 'YA', name: 'Young Adult' },
  { id: 'Adult', name: 'Adult' }
];

export default function StoryCreator({ onComplete, onCancel, userDisplayName, userSubscriptionTier, subscriptionLimits, userId, userTokens, onConsumeTokens, bookType, config, initialStory, userPreferredAI, storyBibleContext }: StoryCreatorProps) {
  const limits = subscriptionLimits || getSubscriptionLimits(userSubscriptionTier);
  const tokenCost = initialStory ? 0 : (limits.bookTokenCost || 1);
  const [step, setStep] = useState<'setup' | 'manual'>(initialStory ? 'manual' : 'setup');
  const [idea, setIdea] = useState('');
  const [style, setStyle] = useState<StoryStyle>(initialStory?.style || 'watercolor');
  const [category, setCategory] = useState(initialStory?.category || 'adventure');
  const [language, setLanguage] = useState(initialStory?.language || 'English');
  const [ageGroup, setAgeGroup] = useState(initialStory?.ageGroup || '3-5');
  const [pageCount, setPageCount] = useState(initialStory?.pages?.length || 4);
  
  const [draftTitle, setDraftTitle] = useState(initialStory?.title || '');
  const [authorName, setAuthorName] = useState(initialStory?.authorName || userDisplayName);
  const [coverImage, setCoverImage] = useState(initialStory?.coverImage || '');
  const [coverImageAdjustments, setCoverImageAdjustments] = useState<ImageAdjustments | undefined>(initialStory?.coverImageAdjustments);
  const [draftPages, setDraftPages] = useState<StoryPage[]>(initialStory?.pages || []);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const [showMetadataEditor, setShowMetadataEditor] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | 'cover' | null>(null);
  const [showImageSource, setShowImageSource] = useState(false);
  const [imageSourceTarget, setImageSourceTarget] = useState<number | 'cover'>(0);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [isForgingTransition, setIsForgingTransition] = useState(false);
  const [isFinalForging, setIsFinalForging] = useState(false);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [generationMode, setGenerationMode] = useState<GenerationMode | null>(null);
  const [aiProgress, setAiProgress] = useState<AIProgress | null>(null);
  const [narrativeStructure, setNarrativeStructure] = useState<NarrativeStructure>('freeform');
  const [isBranching, setIsBranching] = useState(false);
  const [showRPGTools, setShowRPGTools] = useState(false);
  const [rpgConcept, setRpgConcept] = useState('');
  const [rpgSetting, setRpgSetting] = useState('');
  const [rpgResult, setRpgResult] = useState<any>(null);
  const [rpgMode, setRpgMode] = useState<'npc' | 'quest'>('npc');
  const [rpgLoading, setRpgLoading] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  // Branching: store branch pages per page index
  const [branchLoading, setBranchLoading] = useState<number | null>(null);

  const maxPages = limits.maxPagesPerStory;
  const minPages = 1;

  const handleManualStart = () => {
    setIsForgingTransition(true);
    
    setTimeout(() => {
      if (draftPages.length === 0) {
        const initialPages = Array.from({ length: pageCount }).map(() => ({
          text: '',
          font: 'serif',
          alignment: 'left' as const,
          fontSize: 'text-xl',
          color: '#000000'
        }));
        setDraftPages(initialPages);
      } else if (draftPages.length !== pageCount) {
        // Adjust page count if it changed in setup
        if (draftPages.length < pageCount) {
          const extra = Array.from({ length: pageCount - draftPages.length }).map(() => ({
            text: '',
            font: 'serif',
            alignment: 'left' as const,
            fontSize: 'text-xl',
            color: '#000000'
          }));
          setDraftPages([...draftPages, ...extra]);
        } else {
          setDraftPages(draftPages.slice(0, pageCount));
        }
      }
      setIsForgingTransition(false);
      setStep('manual');
    }, 2000);
  };

  const handleAddPage = () => {
    if (draftPages.length >= maxPages) {
      return toast.error(`You've reached the limit of ${maxPages} pages for this project.`);
    }
    setDraftPages([...draftPages, { text: '', font: 'serif', alignment: 'left', fontSize: 'text-xl', color: '#000000' }]);
    setCurrentPageIndex(draftPages.length);
  };

  const handleRemovePage = (index: number) => {
    if (draftPages.length <= 1) return;
    const newPages = draftPages.filter((_, i) => i !== index);
    setDraftPages(newPages);
    setCurrentPageIndex(Math.max(0, index - 1));
  };

  const handleUpdatePage = (index: number, updates: Partial<typeof draftPages[0]>) => {
    const newPages = [...draftPages];
    newPages[index] = { ...newPages[index], ...updates };
    setDraftPages(newPages);
  };

  const handleSaveImageAdjustments = (adjustments: ImageAdjustments) => {
    if (editingImageIndex === 'cover') {
      setCoverImageAdjustments(adjustments);
      setShowImageEditor(false);
      setEditingImageIndex(null);
    } else if (typeof editingImageIndex === 'number') {
      handleUpdatePage(editingImageIndex, { imageAdjustments: adjustments });
      setShowImageEditor(false);
      setEditingImageIndex(null);
    }
  };

  const handleImageUpload = (index: number | 'cover') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          const url = readerEvent.target?.result as string;
          if (index === 'cover') {
            setCoverImage(url);
            toast.success("Cover image added!");
          } else {
            handleUpdatePage(index, { imageUrl: url });
            toast.success("Image added to page!");
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const openImageSource = (target: number | 'cover') => {
    setImageSourceTarget(target);
    setShowImageSource(true);
  };

  const handlePhotoSelected = (url: string) => {
    if (imageSourceTarget === 'cover') {
      setCoverImage(url);
    } else {
      handleUpdatePage(imageSourceTarget as number, { imageUrl: url });
    }
  };

  const runAIGeneration = async (mode: GenerationMode, overrideIdea?: string) => {
    const finalIdea = overrideIdea || idea;
    if (!finalIdea.trim()) {
      toast.error('Please enter a story idea first!');
      return;
    }

    // Deduct AI token costs before generation
    if (onConsumeTokens) {
      const aiScriptCost = limits.aiScriptCost ?? 1;
      const aiImageCost = limits.aiImageCost ?? 1;
      if (mode === 'script') {
        const ok = await onConsumeTokens(aiScriptCost, 'AI script generation');
        if (!ok) return;
      } else if (mode === 'images') {
        const cost = aiImageCost * pageCount;
        const ok = await onConsumeTokens(cost, `AI image generation (${pageCount} images)`);
        if (!ok) return;
      } else {
        // 'both' or 'surprise' — script + images
        const cost = aiScriptCost + aiImageCost * pageCount;
        const ok = await onConsumeTokens(cost, `AI full story generation`);
        if (!ok) return;
      }
    }

    setIsAIGenerating(true);
    setIsForgingTransition(true);
    setAiProgress({ step: 'Loading AI engines...', current: 0, total: 1 });
    try {
      const aiSettings = await AIService.loadSettings();
      const model = getEffectiveModel(aiSettings, userSubscriptionTier || 'free', userPreferredAI?.text);
      let result: { title: string; pages: { text: string; imageUrl?: string }[] };

      if (mode === 'script') {
        setAiProgress({ step: 'Writing your story...', current: 0, total: 1 });
        result = await AIService.generateStoryPages(finalIdea, pageCount, style, ageGroup, language, model, narrativeStructure, storyBibleContext, aiSettings.apiKey);

      } else if (mode === 'images') {
        result = await AIService.generateImagesOnly(
          finalIdea, pageCount, style, ageGroup, model, aiSettings,
          (p) => setAiProgress(p)
        );

      } else {
        // 'both' or 'surprise'
        result = await AIService.generateFullStory(
          finalIdea, pageCount, style, ageGroup, language, model, aiSettings,
          (p) => setAiProgress(p)
        );
      }

      setDraftTitle(result.title);
      const newPages = result.pages.map((p) => ({
        text: p.text,
        imageUrl: p.imageUrl,
        font: 'serif',
        alignment: 'left' as const,
        fontSize: 'text-xl',
        color: '#000000'
      }));
      setDraftPages(newPages);
      setPageCount(newPages.length);

      const imageCount = newPages.filter(p => p.imageUrl).length;
      const msg = imageCount > 0
        ? `"${result.title}" forged — ${newPages.length} pages with ${imageCount} illustrations!`
        : `"${result.title}" forged — ${newPages.length} pages ready!`;
      toast.success(msg);

      setAiProgress(null);
      setTimeout(() => {
        setIsForgingTransition(false);
        setStep('manual');
      }, 800);
    } catch (err: any) {
      toast.error(err?.message || 'AI generation failed. Check your API keys in Admin Panel → AI.');
      setIsForgingTransition(false);
      setAiProgress(null);
    } finally {
      setIsAIGenerating(false);
    }
  };

  const handleAIGenerate = () => {
    if (!generationMode) {
      toast.error('Select a generation mode first (Script, Images, Both, or Surprise Me).');
      return;
    }
    runAIGeneration(generationMode);
  };

  const SURPRISE_IDEAS = [
    'A tiny dragon who is afraid of fire discovers she can breathe rainbows instead.',
    'A boy finds a library where every book is a door to a different world.',
    'The moon goes missing and a group of children must climb the sky to find it.',
    'A robot learns what friendship means from a stray cat in a junkyard.',
    'A young chef creates a magical recipe that brings back memories of lost loved ones.',
    'An underwater city of mermaids must face the surface world for the first time.',
    'A girl discovers her grandmother was once the greatest pirate who ever sailed.',
    'Every night, the stars come down to play in a meadow watched by a lonely shepherd.',
    'A boy who can talk to clouds helps bring rain back to a drought-stricken village.',
    'A magical paintbrush makes everything it draws come to life.',
  ];

  const handleSurpriseMe = async () => {
    const randomIdea = SURPRISE_IDEAS[Math.floor(Math.random() * SURPRISE_IDEAS.length)];
    const randomStyles = ['watercolor', 'oil-painting', 'cartoon', 'anime', 'cinematic', 'sketch', 'comic', 'watercolor-dream', 'enchanted-forest', 'kawaii-cute'];
    const randomAges = ['3-5', '6-8', '9-12', 'YA'];
    const randomStyle = randomStyles[Math.floor(Math.random() * randomStyles.length)] as any;
    const randomAge = randomAges[Math.floor(Math.random() * randomAges.length)];
    const randomPageCount = Math.floor(Math.random() * 4) + 4; // 4-7 pages

    setIdea(randomIdea);
    setStyle(randomStyle);
    setAgeGroup(randomAge);
    setPageCount(Math.min(randomPageCount, maxPages));
    setGenerationMode('both');

    runAIGeneration('both', randomIdea);
  };

  const wrapSelection = (index: number, prefix: string, suffix: string) => {
    const textarea = document.getElementById(`page-text-${index}`) as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = draftPages[index].text;
    const selected = text.substring(start, end);
    
    if (start === end) return; // No selection
    
    const newText = text.substring(0, start) + prefix + selected + suffix + text.substring(end);
    handleUpdatePage(index, { text: newText });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <AnimatePresence mode="wait">
        {isForgingTransition ? (
          <motion.div
            key="forging-transition"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-[80vh] flex flex-col items-center justify-center text-center space-y-10 px-8"
          >
            {/* Animated ring */}
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-36 h-36 border-2 border-gold/20 rounded-full border-t-gold"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-4 border border-gold/10 rounded-full border-b-gold/40"
              />
              <motion.div
                animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center text-gold"
              >
                {aiProgress ? <Brain size={44} /> : <Sparkles size={44} />}
              </motion.div>
            </div>

            <div className="space-y-4 max-w-sm">
              <h2 className="text-3xl font-serif font-bold text-night">
                {aiProgress ? 'AI Forging in Progress' : 'Preparing the Forge'}
              </h2>

              {aiProgress ? (
                <>
                  {/* Step label */}
                  <motion.p
                    key={aiProgress.step}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-gold font-bold text-sm tracking-wide"
                  >
                    {aiProgress.step}
                  </motion.p>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gold rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${aiProgress.total > 0 ? Math.round((aiProgress.current / aiProgress.total) * 100) : 0}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="text-[10px] text-black/30 uppercase tracking-widest font-bold">
                    Step {aiProgress.current} of {aiProgress.total}
                  </p>
                </>
              ) : (
                <p className="text-black/40 small-caps tracking-widest text-[10px]">
                  Gathering creative essence...
                </p>
              )}
            </div>
          </motion.div>
        ) : step === 'setup' ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-[#080808] flex"
          >
            {/* ── Left: Visual Panel ── */}
            <div className="hidden lg:flex w-[420px] flex-shrink-0 flex-col relative overflow-hidden border-r border-white/[0.05]">
              {/* Ambient glow */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full" style={{background:'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 65%)'}} />
                <div className="absolute bottom-0 right-0 w-60 h-60 rounded-full" style={{background:'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 65%)'}} />
              </div>
              {/* Back button */}
              <div className="relative p-8 flex items-center gap-3">
                <button onClick={onCancel} className="flex items-center gap-2 text-white/30 hover:text-white/70 transition-colors text-sm font-medium">
                  <ChevronLeft size={16} /> Cancel
                </button>
              </div>
              {/* Book preview */}
              <div className="relative flex-1 flex items-center justify-center px-10 pb-10">
                <motion.div
                  initial={{ rotateY: -15, scale: 0.92 }}
                  animate={{ rotateY: -4, scale: 1 }}
                  whileHover={{ rotateY: 0 }}
                  onClick={() => openImageSource('cover')}
                  className="w-full max-w-[260px] aspect-[3/4] rounded-r-[1.5rem] shadow-[0_40px_80px_-12px_rgba(0,0,0,0.8)] relative overflow-hidden border-l-[6px] border-gold/50 cursor-pointer group/cover"
                  style={{transformStyle:'preserve-3d'}}
                >
                  {coverImage ? (
                    <img src={coverImage} alt="Cover"
                      className="absolute inset-0 w-full h-full object-cover group-hover/cover:scale-105 transition-transform duration-700"
                      style={{filter: coverImageAdjustments ? `brightness(${coverImageAdjustments.brightness}%) contrast(${coverImageAdjustments.contrast}%) saturate(${coverImageAdjustments.saturation}%)` : 'none'}}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#141414] to-[#0f0f0f]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  {/* Left spine */}
                  <div className="absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-black/60 to-transparent" />
                  {/* Content overlay */}
                  <div className="absolute inset-x-6 bottom-8 top-8 flex flex-col justify-between">
                    <div className="w-10 h-10 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center">
                      <Sparkles size={18} className="text-gold" />
                    </div>
                    <div>
                      <h3 className="text-white font-serif font-bold text-xl leading-snug mb-2">
                        {draftTitle || idea || "Your Next Masterpiece"}
                      </h3>
                      <div className="h-[1px] w-8 bg-gold/40 mb-2" />
                      <p className="text-white/40 text-[10px] font-medium uppercase tracking-widest">by {authorName || 'You'}</p>
                    </div>
                  </div>
                  {/* Hover to change cover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <div className="bg-white/10 backdrop-blur border border-white/20 rounded-full p-3">
                      <ImageIconLucide size={18} className="text-white" />
                    </div>
                  </div>
                </motion.div>
                {/* Glow under book */}
                <div className="absolute bottom-8 w-48 h-8 blur-3xl rounded-full bg-gold/10" />
              </div>
              {/* Bottom tip */}
              <div className="relative p-8 border-t border-white/[0.05]">
                <p className="text-white/20 text-xs leading-relaxed">Click the cover to set an image. Your story will be forged once you fill in the details →</p>
              </div>
            </div>

            {/* ── Right: Form Panel ── */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-xl mx-auto px-8 py-10 space-y-8">
                {/* Title */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold/60 mb-3">New Project</p>
                  <h2 className="text-4xl font-serif font-bold text-white leading-tight">
                    Forge Your<br /><span className="text-gold">Story</span>
                  </h2>
                  <p className="text-white/35 text-sm mt-2">Fill in the details below to begin crafting.</p>
                </div>

                {/* Story Idea */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Story Idea</label>
                  <textarea
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="Describe your story idea..."
                    rows={3}
                    className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-gold/40 text-white/80 text-sm leading-relaxed placeholder:text-white/20 resize-none transition-colors"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {TEMPLATES.map(t => (
                      <button key={t.id} onClick={() => setIdea(t.idea)}
                        className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-white/5 text-white/30 hover:bg-gold/10 hover:text-gold transition-all border border-white/8 hover:border-gold/20">
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title + Author */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Title</label>
                    <input value={draftTitle} onChange={e => setDraftTitle(e.target.value)} placeholder="Story title"
                      className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold/40 text-white/80 text-sm font-serif placeholder:text-white/20 transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Author</label>
                    <input value={authorName} onChange={e => setAuthorName(e.target.value)} placeholder="Your name"
                      className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold/40 text-white/80 text-sm font-serif placeholder:text-white/20 transition-colors" />
                  </div>
                </div>

                {/* Category + Age */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value)}
                      className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold/40 text-white/70 text-sm transition-colors appearance-none">
                      {STORY_CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Age Group</label>
                    <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)}
                      className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold/40 text-white/70 text-sm transition-colors appearance-none">
                      {AGE_GROUPS.map(age => <option key={age.id} value={age.id}>{age.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Style + Language */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Art Style</label>
                    <select value={style} onChange={e => setStyle(e.target.value as StoryStyle)}
                      className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold/40 text-white/70 text-sm transition-colors appearance-none">
                      {STORY_STYLES.map(s => {
                        const allowed = limits.allowedStyles?.includes(s.id);
                        return <option key={s.id} value={s.id} disabled={!allowed}>{s.name}{!allowed ? ' 🔒' : ''}</option>;
                      })}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Language</label>
                    <select value={language} onChange={e => setLanguage(e.target.value)}
                      className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-gold/40 text-white/70 text-sm transition-colors appearance-none">
                      {LANGUAGES.map(lang => {
                        const allowed = limits.allowedLanguages?.includes(lang.code);
                        return <option key={lang.code} value={lang.code} disabled={!allowed}>{lang.name}{!allowed ? ' 🔒' : ''}</option>;
                      })}
                    </select>
                  </div>
                </div>

                {/* Page Count */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Pages</label>
                    <span className="text-[10px] font-bold text-gold/60 uppercase tracking-widest">Max {maxPages}</span>
                  </div>
                  <div className="flex items-center gap-4 bg-white/[0.04] border border-white/8 rounded-xl p-2">
                    <button onClick={() => setPageCount(Math.max(minPages, pageCount - 1))}
                      className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all text-xl font-light">
                      −
                    </button>
                    <span className="flex-1 text-center font-serif text-2xl font-bold text-white">{pageCount}</span>
                    <button onClick={() => {
                      const next = pageCount + 1;
                      if (next > maxPages) { toast.error(`Upgrade to unlock more than ${maxPages} pages!`); return; }
                      setPageCount(next);
                    }}
                      className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all text-xl font-light">
                      +
                    </button>
                  </div>
                </div>

                {/* AI Mode */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">AI Generation Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { mode: 'script' as GenerationMode,  icon: <FileText size={16} />,        label: 'Script Only',    desc: 'AI writes the story text' },
                      { mode: 'images' as GenerationMode,  icon: <ImageIconLucide size={16} />, label: 'Images Only',    desc: 'AI illustrates each scene' },
                      { mode: 'both' as GenerationMode,    icon: <Sparkles size={16} />,        label: 'Script + Images',desc: 'Full AI story' },
                      { mode: 'surprise' as GenerationMode,icon: <Wand2 size={16} />,           label: 'Surprise Me',    desc: 'AI picks everything' },
                    ]).map(({ mode, icon, label, desc }) => (
                      <button key={mode}
                        onClick={() => mode === 'surprise' ? handleSurpriseMe() : setGenerationMode(prev => prev === mode ? null : mode)}
                        className={cn(
                          "p-4 rounded-2xl border text-left transition-all group",
                          mode === 'surprise'
                            ? "bg-gold/10 border-gold/20 hover:border-gold/40"
                            : generationMode === mode
                              ? "bg-gold/15 border-gold/40 shadow-lg shadow-gold/10"
                              : "bg-white/[0.03] border-white/8 hover:border-white/20 hover:bg-white/[0.06]"
                        )}
                      >
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 transition-all",
                          generationMode === mode || mode === 'surprise' ? "bg-gold/20 text-gold" : "bg-white/8 text-white/30 group-hover:text-white/60")}>
                          {icon}
                        </div>
                        <p className={cn("text-xs font-bold uppercase tracking-widest mb-0.5",
                          generationMode === mode || mode === 'surprise' ? "text-gold" : "text-white/50")}>{label}</p>
                        <p className="text-[10px] text-white/25 leading-relaxed">{desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Narrative Structure */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Narrative Structure</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { id: 'freeform' as NarrativeStructure, label: 'Freeform', desc: 'Classic beginning → middle → end' },
                      { id: 'hero-journey' as NarrativeStructure, label: "Hero's Journey", desc: 'Monomyth — 12 archetypal beats' },
                      { id: '3-act' as NarrativeStructure, label: '3-Act Structure', desc: 'Hollywood pacing formula' },
                      { id: '5-act' as NarrativeStructure, label: "5-Act / Freytag's", desc: 'Classical dramatic pyramid' },
                      { id: 'in-medias-res' as NarrativeStructure, label: 'In Medias Res', desc: 'Start mid-action, reveal backstory' },
                    ] as { id: NarrativeStructure; label: string; desc: string }[]).map(s => (
                      <button key={s.id}
                        onClick={() => setNarrativeStructure(s.id)}
                        className={cn(
                          'p-3 rounded-xl border text-left transition-all',
                          narrativeStructure === s.id
                            ? 'bg-gold/15 border-gold/40 shadow-lg shadow-gold/10'
                            : 'bg-white/[0.03] border-white/8 hover:border-white/20 hover:bg-white/[0.05]'
                        )}
                      >
                        <p className={cn('text-xs font-bold mb-0.5', narrativeStructure === s.id ? 'text-gold' : 'text-white/50')}>{s.label}</p>
                        <p className="text-[10px] text-white/25 leading-relaxed">{s.desc}</p>
                      </button>
                    ))}
                    {/* Branching toggle */}
                    <button
                      onClick={() => setIsBranching(!isBranching)}
                      className={cn(
                        'p-3 rounded-xl border text-left transition-all flex items-start gap-2',
                        isBranching
                          ? 'bg-purple-500/10 border-purple-500/30'
                          : 'bg-white/[0.03] border-white/8 hover:border-white/20 hover:bg-white/[0.05]'
                      )}
                    >
                      <GitBranch size={14} className={isBranching ? 'text-purple-400 mt-0.5' : 'text-white/25 mt-0.5'} />
                      <div>
                        <p className={cn('text-xs font-bold mb-0.5', isBranching ? 'text-purple-400' : 'text-white/50')}>Branching Story</p>
                        <p className="text-[10px] text-white/25 leading-relaxed">Choose Your Own Adventure paths</p>
                      </div>
                    </button>
                  </div>
                  {storyBibleContext && (
                    <div className="flex items-center gap-2 p-2.5 bg-green-500/5 border border-green-500/15 rounded-xl">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                      <p className="text-[10px] text-green-400/70">Story Bible context will be injected into AI generation.</p>
                    </div>
                  )}
                </div>

                {/* RPG Tools */}
                <div className="space-y-3">
                  <button
                    onClick={() => setShowRPGTools(!showRPGTools)}
                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/25 hover:text-white/50 transition-colors"
                  >
                    <Sword size={12} /> RPG Game Master Tools
                    <span className="ml-1 text-[9px] px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-md text-purple-400">GM</span>
                  </button>
                  {showRPGTools && (
                    <div className="p-4 bg-purple-500/[0.04] border border-purple-500/15 rounded-2xl space-y-4">
                      <div className="flex gap-2">
                        {(['npc', 'quest'] as const).map(m => (
                          <button key={m} onClick={() => setRpgMode(m)}
                            className={cn('flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all',
                              rpgMode === m ? 'bg-purple-500/20 border border-purple-500/30 text-purple-400' : 'bg-white/5 border border-white/10 text-white/30 hover:text-white/50')}>
                            {m === 'npc' ? '⚔️ NPC Profile' : '📜 Quest Lore'}
                          </button>
                        ))}
                      </div>
                      <input
                        value={rpgConcept}
                        onChange={e => setRpgConcept(e.target.value)}
                        placeholder={rpgMode === 'npc' ? 'NPC concept (e.g. corrupt city guard)…' : 'Quest premise (e.g. stolen artifact from the museum)…'}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 outline-none focus:border-purple-500/30 placeholder:text-white/15 transition-colors"
                      />
                      <input
                        value={rpgSetting}
                        onChange={e => setRpgSetting(e.target.value)}
                        placeholder="Setting / world context…"
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 outline-none focus:border-purple-500/30 placeholder:text-white/15 transition-colors"
                      />
                      <button
                        onClick={async () => {
                          if (!rpgConcept) return toast.error('Enter a concept first.');
                          setRpgLoading(true);
                          try {
                            const aiSettings = await AIService.loadSettings();
                            const model = getEffectiveModel(aiSettings, userSubscriptionTier || 'free', userPreferredAI?.text);
                            const result = rpgMode === 'npc'
                              ? await AIService.generateNPCProfile(rpgConcept, rpgSetting || 'fantasy', model, aiSettings.apiKey)
                              : await AIService.generateQuestLore(rpgConcept, rpgSetting || 'fantasy', model, aiSettings.apiKey);
                            setRpgResult(result);
                          } catch (e: any) { toast.error(e.message); }
                          finally { setRpgLoading(false); }
                        }}
                        disabled={rpgLoading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-500/15 border border-purple-500/25 rounded-xl text-purple-300 text-xs font-bold hover:bg-purple-500/20 transition-all disabled:opacity-40"
                      >
                        {rpgLoading ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                        {rpgLoading ? 'Generating…' : `Generate ${rpgMode === 'npc' ? 'NPC' : 'Quest'}`}
                      </button>
                      {rpgResult && (
                        <div className="bg-black/30 rounded-xl p-4 text-xs text-white/60 space-y-2 max-h-52 overflow-y-auto">
                          {Object.entries(rpgResult).map(([k, v]) => (
                            <div key={k}>
                              <span className="font-bold text-purple-400/80 capitalize">{k.replace(/([A-Z])/g, ' $1')}: </span>
                              <span>{Array.isArray(v) ? (v as string[]).join(' · ') : String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Token cost */}
                <div className="flex items-center justify-between p-4 bg-gold/[0.08] border border-gold/15 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gold/15 rounded-xl flex items-center justify-center text-gold">
                      <Zap size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gold uppercase tracking-widest">Forge Cost</p>
                      <p className="text-[10px] text-white/30">{tokenCost} usage credit{tokenCost !== 1 ? 's' : ''} will be consumed</p>
                    </div>
                  </div>
                  <div className="text-2xl font-serif font-bold text-gold">{tokenCost}</div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pb-8">
                  <button onClick={onCancel}
                    className="px-5 py-3.5 bg-white/[0.05] border border-white/10 rounded-xl text-white/40 hover:text-white/70 hover:border-white/20 font-semibold text-sm transition-all">
                    Discard
                  </button>
                  <button
                    onClick={handleAIGenerate}
                    disabled={isAIGenerating || !generationMode || generationMode === 'surprise'}
                    className={cn("flex-1 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                      generationMode && generationMode !== 'surprise'
                        ? "bg-gold text-night hover:bg-white shadow-xl shadow-gold/20"
                        : "bg-white/5 text-white/20 cursor-not-allowed border border-white/8"
                    )}
                  >
                    {isAIGenerating ? <><Loader2 size={16} className="animate-spin" /> Forging...</> : <><Brain size={16} /> AI Forge</>}
                  </button>
                  <button
                    onClick={() => { if (userTokens < tokenCost) return toast.error(`Monthly usage limit reached. Check your usage in Account Settings.`); handleManualStart(); }}
                    className="flex-1 py-3.5 bg-white/8 border border-white/10 text-white/70 rounded-xl font-bold text-sm hover:bg-white/12 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Zap size={16} /> Manual
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="manual"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#0f0f0f] rounded-[2rem] shadow-2xl border border-white/[0.07] overflow-hidden flex flex-col h-[80vh]"
          >
            <div className="px-6 py-4 border-b border-white/[0.07] flex items-center justify-between bg-[#111]">
              <div className="flex items-center gap-6">
                <button onClick={() => setStep('setup')} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <ChevronLeft size={24} />
                </button>
                <input 
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="Untitled Masterpiece"
                  className="bg-transparent text-2xl font-serif font-bold outline-none border-b border-transparent focus:border-gold transition-all"
                />
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowMetadataEditor(!showMetadataEditor)}
                  className={cn(
                    "p-3 rounded-xl transition-all",
                    showMetadataEditor ? "bg-gold text-night" : "bg-black/5 text-black/40 hover:text-black"
                  )}
                  title="Book Settings"
                >
                  <Settings size={20} />
                </button>
                <div className="text-[10px] small-caps tracking-widest text-black/30 font-bold">
                  Page {currentPageIndex + 1} of {draftPages.length}
                </div>
                <button 
                  disabled={isFinalForging}
                  onClick={() => {
                    if (!draftTitle.trim()) return toast.error("Please enter a title");
                    
                    setIsFinalForging(true);
                    
                    // Forging effect
                    confetti({
                      particleCount: 150,
                      spread: 70,
                      origin: { y: 0.6 },
                      colors: ['#d4af37', '#ffffff', '#000000']
                    });

                    setTimeout(() => {
                      onComplete(draftTitle, draftPages.map(p => ({
                        text: p.text,
                        imageUrl: p.imageUrl || '',
                        imageAdjustments: p.imageAdjustments,
                        style: p.style || style,
                        choices: p.choices,
                      })), style, category, language, ageGroup, bookType, authorName, coverImage, coverImageAdjustments, narrativeStructure, isBranching);
                      setIsFinalForging(false);
                    }, 2000);
                  }}
                  className="px-10 py-4 bg-night text-white rounded-2xl font-bold uppercase tracking-[0.2em] hover:bg-gold hover:text-night transition-all shadow-2xl flex items-center gap-3 group relative overflow-hidden disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/10 to-gold/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  {isFinalForging ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} className="group-hover:fill-night transition-all" />}
                  <span>{isFinalForging ? 'Forging...' : 'Forge Masterpiece'}</span>
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative luxury-bg">
              <div className="atmosphere opacity-10" />
              
              {/* Metadata Editor Overlay */}
              <AnimatePresence>
                {showMetadataEditor && (
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    className="absolute inset-y-0 right-0 w-80 bg-white border-l border-black/5 z-50 shadow-2xl p-8 overflow-y-auto custom-scrollbar"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-serif font-bold">Book Settings</h3>
                      <button onClick={() => setShowMetadataEditor(false)} className="p-2 hover:bg-black/5 rounded-xl">
                        <X size={20} />
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Author Name</label>
                        <input 
                          type="text"
                          value={authorName}
                          onChange={(e) => setAuthorName(e.target.value)}
                          className="w-full bg-black/5 rounded-xl p-3 outline-none border border-black/5 text-sm font-serif"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Cover Image</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openImageSource('cover')}
                            className="flex-1 py-3 bg-black/5 rounded-xl border border-black/5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                          >
                            <ImageIcon size={16} />
                            {coverImage ? 'Change' : 'Add Image'}
                          </button>
                          {coverImage && (
                            <button 
                              onClick={() => {
                                setEditingImageIndex('cover');
                                setShowImageEditor(true);
                              }}
                              className="p-3 bg-gold/10 text-gold rounded-xl border border-gold/20 hover:bg-gold hover:text-night transition-all"
                              title="Edit Image"
                            >
                              <Sliders size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Category</label>
                        <select 
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full bg-black/5 rounded-xl p-3 outline-none border border-black/5 text-sm"
                        >
                          {STORY_CATEGORIES.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Age Group</label>
                        <select 
                          value={ageGroup}
                          onChange={(e) => setAgeGroup(e.target.value)}
                          className="w-full bg-black/5 rounded-xl p-3 outline-none border border-black/5 text-sm"
                        >
                          {AGE_GROUPS.map(age => (
                            <option key={age.id} value={age.id}>{age.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Artistic Style</label>
                        <select 
                          value={style}
                          onChange={(e) => setStyle(e.target.value as StoryStyle)}
                          className="w-full bg-black/5 rounded-xl p-3 outline-none border border-black/5 text-sm"
                        >
                          {STORY_STYLES.map(s => {
                            const isAllowed = subscriptionLimits.allowedStyles?.includes(s.id);
                            return (
                              <option key={s.id} value={s.id} disabled={!isAllowed}>
                                {s.name} {!isAllowed ? '(Locked)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40">Language</label>
                        <select 
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="w-full bg-black/5 rounded-xl p-3 outline-none border border-black/5 text-sm"
                        >
                          {LANGUAGES.map(lang => {
                            const isAllowed = subscriptionLimits.allowedLanguages?.includes(lang.code);
                            return (
                              <option key={lang.code} value={lang.code} disabled={!isAllowed}>
                                {lang.name} {!isAllowed ? '(Locked)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    <div className="mt-12 p-6 bg-gold/5 rounded-2xl border border-gold/10">
                      <p className="text-[10px] text-gold font-bold uppercase tracking-widest mb-2">Pro Tip</p>
                      <p className="text-xs text-night/60 leading-relaxed italic">Changing these settings will affect how the book is finalized and indexed in the library.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sidebar: Page List */}
              <div className="w-64 border-r border-black/5 bg-silk/50 flex flex-col">
                <div className="p-4 border-b border-black/5">
                  <button 
                    onClick={handleAddPage}
                    className="w-full py-3 bg-white border border-black/5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm"
                  >
                    <Plus size={16} />
                    Add Page
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {draftPages.map((page, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPageIndex(idx)}
                      className={cn(
                        "w-full p-4 rounded-2xl text-left transition-all border group relative",
                        currentPageIndex === idx ? "bg-white border-gold shadow-lg" : "bg-transparent border-transparent hover:bg-white/50"
                      )}
                    >
                      <div className="text-[10px] font-bold text-black/20 mb-1">PAGE {idx + 1}</div>
                      <div className="text-xs font-medium truncate text-black/60">
                        {page.text || <span className="italic opacity-50">Empty page...</span>}
                      </div>
                      {draftPages.length > 1 && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRemovePage(idx); }}
                          className="absolute top-2 right-2 p-1 text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Editor: Book-like Page */}
              <div className="flex-1 bg-night p-12 overflow-y-auto custom-scrollbar flex flex-col items-center justify-center">
                <div className="w-full max-w-5xl flex items-stretch justify-center relative">
                  {/* Left Side: Illustration */}
                  <div className="flex-1">
                    <div
                      onClick={() => openImageSource(currentPageIndex)}
                      className="aspect-[4/5] bg-white rounded-l-2xl shadow-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-silk transition-all group overflow-hidden relative"
                      style={{ 
                        backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")',
                        boxShadow: 'inset -20px 0 30px rgba(0,0,0,0.05)'
                      }}
                    >
                      {draftPages[currentPageIndex].imageUrl ? (
                        <>
                          <img 
                            src={draftPages[currentPageIndex].imageUrl} 
                            alt="Page Illustration" 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            style={{
                              filter: draftPages[currentPageIndex].imageAdjustments ? 
                                `brightness(${draftPages[currentPageIndex].imageAdjustments.brightness}%) contrast(${draftPages[currentPageIndex].imageAdjustments.contrast}%) saturate(${draftPages[currentPageIndex].imageAdjustments.saturation}%) sepia(${draftPages[currentPageIndex].imageAdjustments.sepia}%) grayscale(${draftPages[currentPageIndex].imageAdjustments.grayscale}%) blur(${draftPages[currentPageIndex].imageAdjustments.blur}px) hue-rotate(${draftPages[currentPageIndex].imageAdjustments.hueRotate}deg)` : 'none',
                              transform: draftPages[currentPageIndex].imageAdjustments ? 
                                `rotate(${draftPages[currentPageIndex].imageAdjustments.rotate}deg) scaleX(${draftPages[currentPageIndex].imageAdjustments.flipX ? -1 : 1}) scaleY(${draftPages[currentPageIndex].imageAdjustments.flipY ? -1 : 1})` : 'none'
                            }}
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity gap-4">
                            <div className="flex gap-4">
                              <button
                                onClick={(e) => { e.stopPropagation(); openImageSource(currentPageIndex); }}
                                className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/40 transition-all"
                                title="Change Image"
                              >
                                <ImageIconLucide size={20} />
                              </button>
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setEditingImageIndex(currentPageIndex);
                                  setShowImageEditor(true);
                                }}
                                className="w-12 h-12 rounded-full bg-gold/80 backdrop-blur-md flex items-center justify-center text-night hover:bg-gold transition-all"
                                title="Edit Image (CapCut Style)"
                              >
                                <Sliders size={20} />
                              </button>
                            </div>
                            <span className="text-white font-bold uppercase tracking-widest text-[10px]">Customize Illustration</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-black/5 rounded-2xl flex items-center justify-center text-black/20 group-hover:text-gold transition-colors shadow-sm">
                            <ImageIconLucide size={32} />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-black/40 group-hover:text-black transition-colors">Add Illustration</p>
                            <p className="text-[10px] uppercase tracking-widest text-black/20">Click to upload image</p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); openImageSource(currentPageIndex); }}
                            className="mt-4 px-6 py-2 bg-night text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gold hover:text-night transition-all shadow-lg"
                          >
                            Add Image
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Book Spine */}
                  <div className="w-12 bg-gradient-to-r from-black/20 via-black/10 to-black/20 shadow-inner relative z-10 flex flex-col items-center justify-center">
                    <div className="w-px h-full bg-black/10" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-30" />
                  </div>

                  {/* Right Side: Text Editor */}
                  <div className="flex-1">
                    <div 
                      className="aspect-[4/5] bg-white rounded-r-2xl shadow-2xl p-12 flex flex-col gap-6 relative"
                      style={{ 
                        backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")',
                        boxShadow: 'inset 20px 0 30px rgba(0,0,0,0.05)'
                      }}
                    >
                      {/* Formatting Toolbar */}
                      <div className="flex flex-wrap items-center gap-3 p-3 bg-black/5 rounded-2xl border border-black/5 backdrop-blur-sm">
                        {/* Alignment */}
                        <div className="flex items-center gap-1 bg-white/50 p-1 rounded-xl border border-black/5">
                          <button 
                            onClick={() => handleUpdatePage(currentPageIndex, { alignment: 'left' })}
                            className={cn("p-2 rounded-lg transition-all", draftPages[currentPageIndex].alignment === 'left' ? "bg-black text-white shadow-lg" : "text-black/40 hover:text-black hover:bg-black/5")}
                            title="Align Left"
                          >
                            <AlignLeft size={16} />
                          </button>
                          <button 
                            onClick={() => handleUpdatePage(currentPageIndex, { alignment: 'center' })}
                            className={cn("p-2 rounded-lg transition-all", draftPages[currentPageIndex].alignment === 'center' ? "bg-black text-white shadow-lg" : "text-black/40 hover:text-black hover:bg-black/5")}
                            title="Align Center"
                          >
                            <AlignCenter size={16} />
                          </button>
                          <button 
                            onClick={() => handleUpdatePage(currentPageIndex, { alignment: 'right' })}
                            className={cn("p-2 rounded-lg transition-all", draftPages[currentPageIndex].alignment === 'right' ? "bg-black text-white shadow-lg" : "text-black/40 hover:text-black hover:bg-black/5")}
                            title="Align Right"
                          >
                            <AlignRight size={16} />
                          </button>
                        </div>

                        <div className="w-px h-6 bg-black/10 mx-1" />

                        {/* Formatting */}
                        <div className="flex items-center gap-1 bg-white/50 p-1 rounded-xl border border-black/5">
                          <button 
                            onClick={() => wrapSelection(currentPageIndex, '**', '**')}
                            className="p-2 rounded-lg text-black/40 hover:text-black hover:bg-black/5 transition-all"
                            title="Bold"
                          >
                            <Bold size={16} />
                          </button>
                          <button 
                            onClick={() => wrapSelection(currentPageIndex, '_', '_')}
                            className="p-2 rounded-lg text-black/40 hover:text-black hover:bg-black/5 transition-all"
                            title="Italic"
                          >
                            <Italic size={16} />
                          </button>
                          <button 
                            onClick={() => wrapSelection(currentPageIndex, '<u>', '</u>')}
                            className="p-2 rounded-lg text-black/40 hover:text-black hover:bg-black/5 transition-all"
                            title="Underline"
                          >
                            <Underline size={16} />
                          </button>
                        </div>

                        <div className="w-px h-6 bg-black/10 mx-1" />

                        {/* Font & Size */}
                        <div className="flex items-center gap-3 bg-white/50 px-3 py-1 rounded-xl border border-black/5">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-black/30">Font</span>
                            <select 
                              value={draftPages[currentPageIndex].font || 'serif'}
                              onChange={(e) => handleUpdatePage(currentPageIndex, { font: e.target.value })}
                              className="bg-transparent text-[10px] font-bold outline-none cursor-pointer min-w-[80px]"
                            >
                              {FONTS.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="w-px h-4 bg-black/10" />
                          <div className="flex flex-col">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-black/30">Size</span>
                            <select 
                              value={draftPages[currentPageIndex].fontSize || 'text-xl'}
                              onChange={(e) => handleUpdatePage(currentPageIndex, { fontSize: e.target.value })}
                              className="bg-transparent text-[10px] font-bold outline-none cursor-pointer"
                            >
                              <option value="text-xs">Tiny</option>
                              <option value="text-sm">Small</option>
                              <option value="text-base">Normal</option>
                              <option value="text-lg">Medium</option>
                              <option value="text-xl">Large</option>
                              <option value="text-2xl">X-Large</option>
                              <option value="text-3xl">2X-Large</option>
                              <option value="text-4xl">Huge</option>
                            </select>
                          </div>
                        </div>

                        <div className="w-px h-6 bg-black/10 mx-1" />

                        {/* Color */}
                        <div className="flex items-center gap-2 bg-white/50 p-1 rounded-xl border border-black/5">
                          <div className="flex gap-1">
                            {['#000000', '#4A4A4A', '#D4AF37', '#990000', '#004d40'].map(c => (
                              <button 
                                key={c}
                                onClick={() => handleUpdatePage(currentPageIndex, { color: c })}
                                className={cn(
                                  "w-4 h-4 rounded-full border border-black/5 transition-transform hover:scale-125",
                                  draftPages[currentPageIndex].color === c && "ring-2 ring-gold ring-offset-1"
                                )}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                          <div className="w-px h-4 bg-black/10 mx-1" />
                          <input 
                            type="color" 
                            value={draftPages[currentPageIndex].color || '#000000'}
                            onChange={(e) => handleUpdatePage(currentPageIndex, { color: e.target.value })}
                            className="w-6 h-6 rounded-lg cursor-pointer border-none bg-transparent"
                            title="Custom Color"
                          />
                        </div>
                      </div>

                      {/* AI Enhance Button */}
                      <button
                        onClick={async () => {
                          const currentText = draftPages[currentPageIndex].text;
                          if (!currentText.trim()) return toast.error('Write some text first to enhance it.');
                          // Deduct enhance cost
                          if (onConsumeTokens) {
                            const cost = limits.aiEnhanceCost ?? 0;
                            if (cost > 0) {
                              const ok = await onConsumeTokens(cost, 'AI text enhancement');
                              if (!ok) return;
                            }
                          }
                          setIsAIGenerating(true);
                          try {
                            const aiSettings = await AIService.loadSettings();
                            const model = getEffectiveModel(aiSettings, userSubscriptionTier || 'free', userPreferredAI?.text);
                            const enhanced = await AIService.enhanceText(currentText, model, aiSettings.apiKey);
                            handleUpdatePage(currentPageIndex, { text: enhanced.trim() });
                            toast.success('Page enhanced by AI!');
                          } catch (err: any) {
                            toast.error(err?.message || 'AI enhancement failed.');
                          } finally {
                            setIsAIGenerating(false);
                          }
                        }}
                        disabled={isAIGenerating}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gold/10 text-gold rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gold hover:text-night transition-all border border-gold/20 disabled:opacity-40"
                        title="Enhance this page's text with AI"
                      >
                        {isAIGenerating ? <Loader2 size={12} className="animate-spin" /> : <Brain size={12} />}
                        AI Enhance
                      </button>

                      {/* Branching choices manager */}
                      {isBranching && (
                        <div className="border-t border-black/10 pt-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-black/30 flex items-center gap-1.5">
                              <GitBranch size={10} /> Branch Choices
                            </span>
                            <button
                              onClick={() => {
                                const page = draftPages[currentPageIndex];
                                const existing = page.choices || [];
                                handleUpdatePage(currentPageIndex, {
                                  choices: [...existing, { id: Date.now().toString(), text: '', label: `Choice ${existing.length + 1}` }]
                                });
                              }}
                              className="flex items-center gap-1 text-[10px] text-purple-600/60 hover:text-purple-700 font-bold"
                            >
                              <Plus size={10} /> Add Choice
                            </button>
                          </div>
                          {(draftPages[currentPageIndex].choices || []).map((choice, ci) => (
                            <div key={choice.id} className="flex gap-2 items-start">
                              <input
                                value={choice.text}
                                onChange={e => {
                                  const updated = [...(draftPages[currentPageIndex].choices || [])];
                                  updated[ci] = { ...updated[ci], text: e.target.value };
                                  handleUpdatePage(currentPageIndex, { choices: updated });
                                }}
                                placeholder={`Choice ${ci + 1} text…`}
                                className="flex-1 bg-purple-50 border border-purple-200/60 rounded-lg px-3 py-1.5 text-xs text-black/70 outline-none focus:border-purple-400/60 placeholder:text-black/20"
                              />
                              <button
                                onClick={async () => {
                                  const choiceText = draftPages[currentPageIndex].choices?.[ci]?.text;
                                  if (!choiceText) return toast.error('Enter choice text first.');
                                  setBranchLoading(ci);
                                  try {
                                    const aiSettings = await AIService.loadSettings();
                                    const branchModel = getEffectiveModel(aiSettings, userSubscriptionTier || 'free', userPreferredAI?.text);
                                    const result = await AIService.generateBranchPath(
                                      draftPages[currentPageIndex].text, choiceText, 2, style, ageGroup, language, draftTitle, branchModel, aiSettings.apiKey
                                    );
                                    const updated = [...(draftPages[currentPageIndex].choices || [])];
                                    updated[ci] = { ...updated[ci], branchPages: result.pages };
                                    handleUpdatePage(currentPageIndex, { choices: updated });
                                    toast.success('Branch path generated!');
                                  } catch (e: any) { toast.error(e.message); }
                                  finally { setBranchLoading(null); }
                                }}
                                disabled={branchLoading === ci}
                                className="flex items-center gap-1 px-2 py-1.5 bg-purple-100 border border-purple-200/60 rounded-lg text-[10px] font-bold text-purple-700 hover:bg-purple-200 transition-all disabled:opacity-40"
                                title="AI: generate this branch"
                              >
                                {branchLoading === ci ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />}
                              </button>
                              <button
                                onClick={() => {
                                  const updated = (draftPages[currentPageIndex].choices || []).filter((_, i) => i !== ci);
                                  handleUpdatePage(currentPageIndex, { choices: updated });
                                }}
                                className="p-1.5 hover:bg-red-100 rounded-lg text-red-400/50 hover:text-red-500 transition-all"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                          {(draftPages[currentPageIndex].choices || []).some(c => c.branchPages?.length) && (
                            <p className="text-[10px] text-purple-600/50 flex items-center gap-1">
                              <GitBranch size={9} /> Branch paths generated — readers will see choices here.
                            </p>
                          )}
                        </div>
                      )}

                      <textarea
                        id={`page-text-${currentPageIndex}`}
                        value={draftPages[currentPageIndex].text}
                        onChange={(e) => handleUpdatePage(currentPageIndex, { text: e.target.value })}
                        placeholder="Once upon a time..."
                        className={cn(
                          "flex-1 w-full bg-transparent outline-none resize-none placeholder:text-black/10 leading-relaxed",
                          draftPages[currentPageIndex].fontSize || 'text-xl',
                          draftPages[currentPageIndex].alignment === 'center' ? 'text-center' : draftPages[currentPageIndex].alignment === 'right' ? 'text-right' : 'text-left'
                        )}
                        style={{ 
                          fontFamily: FONTS.find(f => f.id === (draftPages[currentPageIndex].font || 'serif'))?.family || 'inherit',
                          color: draftPages[currentPageIndex].color || '#000000'
                        }}
                      />

                      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                        <div className="text-[10px] font-bold text-black/20 uppercase tracking-widest">
                          {currentPageIndex + 1}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImageEditor && editingImageIndex !== null && (
          <ImageEditor
            imageUrl={editingImageIndex === 'cover' ? coverImage : (draftPages[editingImageIndex as number].imageUrl || '')}
            adjustments={(editingImageIndex === 'cover' ? coverImageAdjustments : draftPages[editingImageIndex as number].imageAdjustments) || {
              brightness: 100, contrast: 100, saturation: 100, sepia: 0, grayscale: 0, blur: 0, hueRotate: 0, rotate: 0, flipX: false, flipY: false
            }}
            onSave={handleSaveImageAdjustments}
            onClose={() => {
              setShowImageEditor(false);
              setEditingImageIndex(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Image Source Chooser ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showImageSource && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(10,10,10,0.75)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowImageSource(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 16 }}
              transition={{ type: 'spring', damping: 24, stiffness: 280 }}
              className="bg-white rounded-[2.5rem] shadow-2xl p-8 w-full max-w-sm space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-serif font-bold text-night">Add Image</h3>
                  <p className="text-xs text-black/35 mt-0.5">
                    {imageSourceTarget === 'cover' ? 'Choose a cover image' : `Page ${(imageSourceTarget as number) + 1} illustration`}
                  </p>
                </div>
                <button
                  onClick={() => setShowImageSource(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-black/5 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                {/* Upload from device */}
                <button
                  onClick={() => {
                    setShowImageSource(false);
                    handleImageUpload(imageSourceTarget);
                  }}
                  className="w-full flex items-center gap-4 p-5 bg-black/5 hover:bg-night hover:text-white rounded-2xl border-2 border-transparent hover:border-gold/30 transition-all group text-left"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white group-hover:bg-gold/20 flex items-center justify-center text-black/50 group-hover:text-gold transition-all shadow-sm flex-shrink-0">
                    <Upload size={22} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Upload from Device</p>
                    <p className="text-[11px] text-black/40 group-hover:text-white/50 mt-0.5">Pick a photo from your computer</p>
                  </div>
                </button>

                {/* Browse stock photos */}
                <button
                  onClick={() => {
                    setShowImageSource(false);
                    setShowPhotoPicker(true);
                  }}
                  className="w-full flex items-center gap-4 p-5 bg-gold/5 hover:bg-gold hover:text-night rounded-2xl border-2 border-gold/20 hover:border-gold transition-all group text-left"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gold/20 group-hover:bg-night/20 flex items-center justify-center text-gold group-hover:text-night transition-all shadow-sm flex-shrink-0">
                    <Grid size={22} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Browse Stock Photos</p>
                    <p className="text-[11px] text-black/40 group-hover:text-night/50 mt-0.5">Unsplash, Pexels, Pixabay, Vecteezy &amp; Pinterest</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Photo Picker Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPhotoPicker && (
          <PhotoPicker
            initialQuery={idea || draftTitle || ''}
            onSelect={(url) => {
              handlePhotoSelected(url);
              setShowPhotoPicker(false);
            }}
            onClose={() => setShowPhotoPicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
