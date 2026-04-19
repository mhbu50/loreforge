export type StoryStyle = 
  | 'watercolor-dream' | 'midnight-tales' | 'vintage-storybook' | 'whimsical-play' 
  | 'minimalist-parchment' | 'enchanted-forest' | 'galactic-odyssey' | 'fairy-dust' 
  | 'steampunk-chronicle' | 'nordic-simplicity' | 'neon-noir' | 'paper-cut' 
  | 'botanical-sketch' | 'retro-pixel' | 'gilded-age' | 'misty-highlands' 
  | 'kawaii-cute' | 'art-nouveau' | 'scandinavian-folk' | 'monochrome-ink' 
  | 'cloud-nine' | 'crystal-cavern' | 'rustic-cabin' | 'celestial-map' | 'toy-block'
  | 'watercolor' | 'cartoon' | 'anime' | 'oil-painting' | 'sketch' | 'cinematic' | 'cyberpunk' | 'comic';

export interface ImageAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  sepia: number;
  grayscale: number;
  blur: number;
  hueRotate: number;
  rotate: number;
  flipX: boolean;
  flipY: boolean;
}

export interface BranchChoice {
  id: string;
  text: string;           // Shown to reader as a choice button
  label?: string;         // Short internal label for the author
  nextPageIndex?: number; // Jump to existing page index
  branchPages?: { text: string; imageUrl?: string }[]; // AI-generated branch pages
}

export interface StoryPage {
  text: string;
  content?: string; // Alias for text used in some parts of the app
  imageUrl?: string;
  imageAdjustments?: ImageAdjustments;
  style?: StoryStyle;
  font?: string;
  alignment?: 'left' | 'center' | 'right';
  fontSize?: string;
  color?: string;
  choices?: BranchChoice[]; // Branching narrative choices shown at end of this page
}
export type StoryCategory = 'adventure' | 'fantasy' | 'mystery' | 'sci-fi' | 'educational' | 'drama' | 'comedy' | 'horror' | 'romance' | 'thriller' | 'biography' | 'historical' | 'other';

export type NarrativeStructure = 'freeform' | 'hero-journey' | '3-act' | '5-act' | 'in-medias-res';

export interface Story {
  id: string;
  userId: string;
  bookId?: string;
  authorName?: string;
  coverImage?: string;
  coverImageAdjustments?: ImageAdjustments;
  title: string;
  pages: StoryPage[];
  style: StoryStyle;
  category: StoryCategory;
  language: string;
  ageGroup?: string;
  seriesId?: string;
  isPublished?: boolean;
  price?: number;
  likes?: number;
  collaborators?: string[]; // Array of UIDs
  createdAt: number;
  // Narrative intelligence
  narrativeStructure?: NarrativeStructure;
  isBranching?: boolean;
  storyBibleId?: string; // Reference to linked StoryBible
}

// ── Character Architect ──────────────────────────────────────────────────────

export type CharacterRole = 'protagonist' | 'antagonist' | 'supporting' | 'npc' | 'mentor' | 'trickster';

export interface Character {
  id: string;
  userId: string;
  storyId?: string;      // Optional — characters can be global or story-specific
  name: string;
  role: CharacterRole;
  age?: string;
  // Face-lock: visual consistency descriptor used in every image generation prompt
  appearance: string;
  // Personality & depth
  personality: string;
  backstory: string;
  motivations: string;
  flaws: string;
  voiceStyle: string;    // Dialogue style description (e.g. "sardonic, short sentences")
  arc?: string;          // Character arc summary
  // Visuals
  portraitUrl?: string;
  portraitStyle?: string; // Visual style locked for this character
  createdAt: number;
  updatedAt: number;
}

// ── Story Bible ──────────────────────────────────────────────────────────────

export interface StoryBible {
  id: string;
  userId: string;
  storyId?: string;    // Optional — bibles can be global world-builds
  title: string;       // World/series name
  overview: string;    // Quick world summary
  history: string;     // Timeline of major events
  magicSystem: string; // Powers, rules, limits
  politics: string;    // Factions, power structures, conflicts
  geography: string;   // Locations, maps, regions
  rules: string;       // World-logic rules that must never be broken
  notes: string;       // Free-form lore dump
  createdAt: number;
  updatedAt: number;
}

export interface Feedback {
  id: string;
  userId: string;
  userEmail: string;
  type: 'bug' | 'suggestion';
  content: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: number;
}

export type SubscriptionTier = 'free' | 'standard' | 'premium' | 'ultimate';
export type SubscriptionCycle = 'monthly' | 'yearly' | 'none';

export type BookType = 'story' | 'comic' | 'anime' | 'novel' | 'manga' | 'biography' | 'other';

export interface Book {
  id: string;
  userId: string;
  title: string;
  type: BookType;
  description?: string;
  coverImage?: string;
  status: 'draft' | 'completed' | 'published';
  metadata: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface Chapter {
  id: string;
  bookId: string;
  title: string;
  content: string;
  order: number;
  wordCount: number;
  isLocked: boolean;
  isGhost?: boolean;
  parentId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Theme {
  id: string;
  userId: string;
  authorName?: string;
  name: string;
  description?: string;
  isPublic: boolean;
  css: string;
  config: Record<string, any>;
  likes?: number;
  downloads?: number;
  previewImage?: string;
  createdAt: number;
}

export interface SubscriptionCode {
  id: string;
  code: string;
  tier: SubscriptionTier;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: number;
  createdAt: number;
  createdBy: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'headadmin' | 'admin' | 'user';
  subscriptionTier: SubscriptionTier;
  subscriptionStatus?: 'active' | 'expired' | 'cancelled';
  subscriptionCycle?: 'monthly' | 'yearly' | 'none';
  subscriptionExpiresAt?: number;
  customSettings: Record<string, any>;
  workspaceLayout: Record<string, any>;
  activeThemeId?: string;
  streak?: number;
  badges?: string[];
  tokens: number;
  lastTokenRefill?: number;
  // Usage system (replaces token spending — tracks AI operations this month)
  usageThisMonth?: number;
  lastUsageReset?: number;
  lastActive?: number;
  createdAt: number;
  // Profile customization
  bio?: string;
  avatarEmoji?: string;
  avatarColor?: string;
  authProvider?: 'google' | 'email';
  // AI preferences (ultimate tier only)
  preferredAI?: {
    text?: string;
    image?: string;
    enhance?: string;
    title?: string;
  };
  // Preferences
  notificationsEnabled?: boolean;
  emailNotifications?: boolean;
}

export interface UserGoal {
  id: string;
  userId: string;
  type: 'daily-word-count' | 'chapter-completion';
  target: number;
  current: number;
  deadline?: number;
}

export interface AppConfig {
  writing: {
    distractionFree: boolean; // Feature 31
    typewriterScrolling?: boolean; // Feature 34
    typewriterMode: boolean; // Alias for typewriterScrolling
    ambientSound: string; // Feature 32
    ambientVolume: number;
    theme?: string; // Feature 38
    pomodoroEnabled: boolean; // Feature 39
    pomodoroWorkTime: number;
    pomodoroBreakTime: number;
  };
  ui: {
    theme: 'modern' | 'classic' | 'brutalist';
    fontSize: number;
    lineHeight: number;
    maxWidth: number;
  };
  security: {
    appLockEnabled: boolean; // Feature 92
    masterPassword?: string;
    stealthMode: boolean; // Feature 94
    autoSaveInterval: number; // Feature 95
  };
  accessibility: {
    simplifiedSyntaxMode: boolean;
    highContrast: boolean;
    dyslexicFont: boolean;
  };
}
