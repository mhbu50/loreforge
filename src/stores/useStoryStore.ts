import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type StoryStatus = 'draft' | 'in_progress' | 'complete' | 'archived';
export type StoryGenre = 'fantasy' | 'sci-fi' | 'romance' | 'thriller' | 'mystery' | 'literary' | 'horror' | 'other';

export interface Character {
  id: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  description: string;
  traits: string[];
  backstory: string;
  arc: string;
  imageUrl?: string;
}

export interface Beat {
  id: string;
  title: string;
  description: string;
  order: number;
  actNumber: 1 | 2 | 3;
  completed: boolean;
}

export interface OutlineNode {
  id: string;
  title: string;
  type: 'act' | 'chapter' | 'scene';
  content: string;
  order: number;
  parentId?: string;
  children: string[];
  wordCount?: number;
}

export interface Story {
  id: string;
  title: string;
  subtitle?: string;
  genre: StoryGenre;
  status: StoryStatus;
  synopsis: string;
  content: string;
  wordCount: number;
  targetWordCount: number;
  characters: Character[];
  beats: Beat[];
  outline: OutlineNode[];
  tags: string[];
  coverImage?: string;
  createdAt: number;
  updatedAt: number;
}

interface StoryStore {
  stories: Story[];
  activeStoryId: string | null;
  activeCharacterId: string | null;
  activePanelId: string | null;

  // Story CRUD
  createStory: (data: Partial<Story>) => Story;
  updateStory: (id: string, data: Partial<Story>) => void;
  deleteStory: (id: string) => void;
  setActiveStory: (id: string | null) => void;

  // Character CRUD
  addCharacter: (storyId: string, char: Partial<Character>) => void;
  updateCharacter: (storyId: string, charId: string, data: Partial<Character>) => void;
  deleteCharacter: (storyId: string, charId: string) => void;

  // Beat CRUD
  addBeat: (storyId: string, beat: Partial<Beat>) => void;
  updateBeat: (storyId: string, beatId: string, data: Partial<Beat>) => void;
  deleteBeat: (storyId: string, beatId: string) => void;
  reorderBeats: (storyId: string, beats: Beat[]) => void;

  // Outline CRUD
  addOutlineNode: (storyId: string, node: Partial<OutlineNode>) => void;
  updateOutlineNode: (storyId: string, nodeId: string, data: Partial<OutlineNode>) => void;
  deleteOutlineNode: (storyId: string, nodeId: string) => void;

  // UI state
  setActiveCharacter: (id: string | null) => void;
  setActivePanel: (id: string | null) => void;

  // Computed helpers
  getActiveStory: () => Story | null;
  getStoryProgress: (id: string) => number;
}

const makeId = () => Math.random().toString(36).slice(2, 11);

export const useStoryStore = create<StoryStore>()(
  persist(
    (set, get) => ({
      stories: [],
      activeStoryId: null,
      activeCharacterId: null,
      activePanelId: 'editor',

      createStory: (data) => {
        const story: Story = {
          id: makeId(),
          title: 'Untitled Story',
          genre: 'other',
          status: 'draft',
          synopsis: '',
          content: '',
          wordCount: 0,
          targetWordCount: 80000,
          characters: [],
          beats: [],
          outline: [],
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          ...data,
        };
        set((s) => ({ stories: [story, ...s.stories] }));
        return story;
      },

      updateStory: (id, data) =>
        set((s) => ({
          stories: s.stories.map((st) =>
            st.id === id ? { ...st, ...data, updatedAt: Date.now() } : st
          ),
        })),

      deleteStory: (id) =>
        set((s) => ({
          stories: s.stories.filter((st) => st.id !== id),
          activeStoryId: s.activeStoryId === id ? null : s.activeStoryId,
        })),

      setActiveStory: (id) => set({ activeStoryId: id }),

      addCharacter: (storyId, char) => {
        const newChar: Character = {
          id: makeId(),
          name: 'New Character',
          role: 'supporting',
          description: '',
          traits: [],
          backstory: '',
          arc: '',
          ...char,
        };
        set((s) => ({
          stories: s.stories.map((st) =>
            st.id === storyId ? { ...st, characters: [...st.characters, newChar], updatedAt: Date.now() } : st
          ),
        }));
      },

      updateCharacter: (storyId, charId, data) =>
        set((s) => ({
          stories: s.stories.map((st) =>
            st.id === storyId
              ? { ...st, characters: st.characters.map((c) => (c.id === charId ? { ...c, ...data } : c)), updatedAt: Date.now() }
              : st
          ),
        })),

      deleteCharacter: (storyId, charId) =>
        set((s) => ({
          stories: s.stories.map((st) =>
            st.id === storyId
              ? { ...st, characters: st.characters.filter((c) => c.id !== charId), updatedAt: Date.now() }
              : st
          ),
        })),

      addBeat: (storyId, beat) => {
        const story = get().stories.find((s) => s.id === storyId);
        const newBeat: Beat = {
          id: makeId(),
          title: 'New Beat',
          description: '',
          order: (story?.beats.length ?? 0) + 1,
          actNumber: 1,
          completed: false,
          ...beat,
        };
        set((s) => ({
          stories: s.stories.map((st) =>
            st.id === storyId ? { ...st, beats: [...st.beats, newBeat], updatedAt: Date.now() } : st
          ),
        }));
      },

      updateBeat: (storyId, beatId, data) =>
        set((s) => ({
          stories: s.stories.map((st) =>
            st.id === storyId
              ? { ...st, beats: st.beats.map((b) => (b.id === beatId ? { ...b, ...data } : b)), updatedAt: Date.now() }
              : st
          ),
        })),

      deleteBeat: (storyId, beatId) =>
        set((s) => ({
          stories: s.stories.map((st) =>
            st.id === storyId
              ? { ...st, beats: st.beats.filter((b) => b.id !== beatId), updatedAt: Date.now() }
              : st
          ),
        })),

      reorderBeats: (storyId, beats) =>
        set((s) => ({
          stories: s.stories.map((st) =>
            st.id === storyId ? { ...st, beats, updatedAt: Date.now() } : st
          ),
        })),

      addOutlineNode: (storyId, node) => {
        const story = get().stories.find((s) => s.id === storyId);
        const newNode: OutlineNode = {
          id: makeId(),
          title: 'New Scene',
          type: 'scene',
          content: '',
          order: (story?.outline.length ?? 0) + 1,
          children: [],
          ...node,
        };
        set((s) => ({
          stories: s.stories.map((st) =>
            st.id === storyId ? { ...st, outline: [...st.outline, newNode], updatedAt: Date.now() } : st
          ),
        }));
      },

      updateOutlineNode: (storyId, nodeId, data) =>
        set((s) => ({
          stories: s.stories.map((st) =>
            st.id === storyId
              ? { ...st, outline: st.outline.map((n) => (n.id === nodeId ? { ...n, ...data } : n)), updatedAt: Date.now() }
              : st
          ),
        })),

      deleteOutlineNode: (storyId, nodeId) =>
        set((s) => ({
          stories: s.stories.map((st) =>
            st.id === storyId
              ? { ...st, outline: st.outline.filter((n) => n.id !== nodeId), updatedAt: Date.now() }
              : st
          ),
        })),

      setActiveCharacter: (id) => set({ activeCharacterId: id }),
      setActivePanel: (id) => set({ activePanelId: id }),

      getActiveStory: () => {
        const { stories, activeStoryId } = get();
        return stories.find((s) => s.id === activeStoryId) ?? null;
      },

      getStoryProgress: (id) => {
        const story = get().stories.find((s) => s.id === id);
        if (!story || !story.targetWordCount) return 0;
        return Math.min(100, Math.round((story.wordCount / story.targetWordCount) * 100));
      },
    }),
    { name: 'storycraft-store', version: 1 }
  )
);
