import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// ─── Provider config ───────────────────────────────────────────────────────────

export interface ProviderConfig {
  name: string;
  apiKey: string;
  model: string;
  enabled: boolean;
  isFree?: boolean;
  description: string;
}

export interface AISettings {
  providers: {
    openrouter: ProviderConfig;
    gemini:     ProviderConfig;
    groq:       ProviderConfig;
    together:   ProviderConfig;
    openai:     ProviderConfig;
    anthropic:  ProviderConfig;
    [key: string]: ProviderConfig;
  };
  /** Which provider key each subscription tier uses */
  tierAssignments: {
    free:     string;
    standard: string;
    premium:  string;
    ultimate: string;
    [key: string]: string;
  };
  /** Allow ultimate users to pick their own provider in Account settings */
  allowUltimateChoice: boolean;
  /** Stability AI key for image generation (optional) */
  imageApiKey: string;
  imageModel: string;
}

/** What a resolved provider looks like — passed to all generate methods */
export interface ResolvedProvider {
  providerKey: string;
  model: string;
  apiKey: string;
}

// ─── Available models per provider ────────────────────────────────────────────

export const PROVIDER_MODELS: Record<string, { id: string; name: string; free?: boolean }[]> = {
  openrouter: [
    { id: 'meta-llama/llama-3.1-8b-instruct:free',         name: 'Llama 3.1 8B (Free)',          free: true },
    { id: 'meta-llama/llama-3.2-11b-vision-instruct:free', name: 'Llama 3.2 11B (Free)',         free: true },
    { id: 'meta-llama/llama-3.3-70b-instruct:free',        name: 'Llama 3.3 70B (Free)',         free: true },
    { id: 'google/gemma-2-9b-it:free',                     name: 'Gemma 2 9B (Free)',            free: true },
    { id: 'google/gemma-3-27b-it:free',                    name: 'Gemma 3 27B (Free)',           free: true },
    { id: 'mistralai/mistral-7b-instruct:free',            name: 'Mistral 7B (Free)',            free: true },
    { id: 'microsoft/phi-3-mini-128k-instruct:free',       name: 'Phi-3 Mini 128k (Free)',       free: true },
    { id: 'nousresearch/hermes-3-llama-3.1-405b:free',     name: 'Hermes 3 405B (Free)',         free: true },
    { id: 'anthropic/claude-3.5-sonnet',                   name: 'Claude 3.5 Sonnet (Paid)' },
    { id: 'openai/gpt-4o',                                 name: 'GPT-4o (Paid)' },
    { id: 'openai/gpt-4o-mini',                            name: 'GPT-4o Mini (Paid)' },
    { id: 'google/gemini-pro-1.5',                         name: 'Gemini 1.5 Pro (Paid)' },
    { id: 'mistralai/mistral-large',                       name: 'Mistral Large (Paid)' },
  ],
  gemini: [
    { id: 'gemini-2.0-flash-lite',  name: 'Gemini 2.0 Flash Lite (Free)', free: true },
    { id: 'gemini-2.0-flash',       name: 'Gemini 2.0 Flash',             free: true },
    { id: 'gemini-1.5-flash',       name: 'Gemini 1.5 Flash (Free)',      free: true },
    { id: 'gemini-1.5-flash-8b',    name: 'Gemini 1.5 Flash-8B (Free)',   free: true },
    { id: 'gemini-1.5-pro',         name: 'Gemini 1.5 Pro' },
    { id: 'gemini-2.0-pro-exp',     name: 'Gemini 2.0 Pro (Exp)' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile',     name: 'Llama 3.3 70B (Free)',    free: true },
    { id: 'llama-3.1-70b-versatile',     name: 'Llama 3.1 70B (Free)',    free: true },
    { id: 'llama-3.1-8b-instant',        name: 'Llama 3.1 8B Fast (Free)', free: true },
    { id: 'gemma2-9b-it',               name: 'Gemma 2 9B (Free)',        free: true },
    { id: 'mixtral-8x7b-32768',         name: 'Mixtral 8x7B (Free)',      free: true },
  ],
  together: [
    { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',           name: 'Llama 3.3 70B (Free)',  free: true },
    { id: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',         name: 'Llama 3.2 11B (Free)',  free: true },
    { id: 'mistralai/Mixtral-8x7B-Instruct-v0.1',                   name: 'Mixtral 8x7B (Free)',   free: true },
    { id: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',          name: 'Llama 3.1 405B (Paid)' },
  ],
  openai: [
    { id: 'gpt-4o',       name: 'GPT-4o' },
    { id: 'gpt-4o-mini',  name: 'GPT-4o Mini' },
    { id: 'gpt-4-turbo',  name: 'GPT-4 Turbo' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  ],
  anthropic: [
    { id: 'claude-opus-4-5',              name: 'Claude Opus 4.5' },
    { id: 'claude-sonnet-4-6',            name: 'Claude Sonnet 4.6' },
    { id: 'claude-3-5-sonnet-20241022',   name: 'Claude 3.5 Sonnet' },
    { id: 'claude-haiku-4-5-20251001',    name: 'Claude Haiku 4.5 (Cheapest)' },
    { id: 'claude-3-5-haiku-20241022',    name: 'Claude 3.5 Haiku' },
  ],
};

export const PROVIDER_INFO: Record<string, { label: string; icon: string; isFree?: boolean; keyHint: string; keyUrl: string }> = {
  openrouter: { label: 'OpenRouter',   icon: '🔀', isFree: true,  keyHint: 'sk-or-v1-...',   keyUrl: 'https://openrouter.ai/keys' },
  gemini:     { label: 'Google Gemini',icon: '✦',  isFree: true,  keyHint: 'AIza...',         keyUrl: 'https://aistudio.google.com/app/apikey' },
  groq:       { label: 'Groq',         icon: '⚡', isFree: true,  keyHint: 'gsk_...',         keyUrl: 'https://console.groq.com/keys' },
  together:   { label: 'Together AI',  icon: '∞',  isFree: true,  keyHint: 'Enter key...',    keyUrl: 'https://api.together.ai/settings/api-keys' },
  openai:     { label: 'OpenAI',       icon: '⊛',  isFree: false, keyHint: 'sk-...',          keyUrl: 'https://platform.openai.com/api-keys' },
  anthropic:  { label: 'Anthropic',    icon: '◎',  isFree: false, keyHint: 'sk-ant-...',      keyUrl: 'https://console.anthropic.com/settings/keys' },
};

export const DEFAULT_AI_SETTINGS: AISettings = {
  providers: {
    openrouter: {
      name: 'OpenRouter',
      apiKey: '',
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      enabled: true,
      isFree: true,
      description: 'Unified API — access hundreds of models including many free ones. Great default choice.',
    },
    gemini: {
      name: 'Google Gemini',
      apiKey: '',
      model: 'gemini-2.0-flash-lite',
      enabled: false,
      isFree: true,
      description: 'Google AI — free tier available with Gemini Flash. Excellent for creative writing.',
    },
    groq: {
      name: 'Groq',
      apiKey: '',
      model: 'llama-3.3-70b-versatile',
      enabled: false,
      isFree: true,
      description: 'Groq — genuinely FREE API with blazing-fast inference. Llama, Gemma & Mixtral.',
    },
    together: {
      name: 'Together AI',
      apiKey: '',
      model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
      enabled: false,
      isFree: true,
      description: 'Together AI — free tier with top open-source models.',
    },
    openai: {
      name: 'OpenAI',
      apiKey: '',
      model: 'gpt-4o-mini',
      enabled: false,
      isFree: false,
      description: 'OpenAI GPT — industry-leading quality. Paid API.',
    },
    anthropic: {
      name: 'Anthropic Claude',
      apiKey: '',
      model: 'claude-3-5-sonnet-20241022',
      enabled: false,
      isFree: false,
      description: 'Claude — nuanced, creative, long-form storytelling. Paid API.',
    },
  },
  tierAssignments: {
    free:     'openrouter',
    standard: 'openrouter',
    premium:  'openrouter',
    ultimate: 'openrouter',
  },
  allowUltimateChoice: true,
  imageApiKey: '',
  imageModel: 'stable-image-core',
};

// ─── Resolve which provider to use for a user ─────────────────────────────────

export function getEffectiveProvider(
  settings: AISettings,
  userTier: string,
  preferredProviderKey?: string
): ResolvedProvider {
  // Ultimate users can override if allowed
  const usePreferred = userTier === 'ultimate' && settings.allowUltimateChoice && preferredProviderKey;
  const providerKey = usePreferred ? preferredProviderKey! : (settings.tierAssignments[userTier] ?? 'openrouter');

  const provider = settings.providers[providerKey] ?? settings.providers.openrouter ?? { model: 'meta-llama/llama-3.1-8b-instruct:free', apiKey: '' };

  return {
    providerKey,
    model: provider.model,
    apiKey: providerKey === 'openrouter'
      ? (provider.apiKey?.trim() || process.env.OPENROUTER_API_KEY || '')
      : provider.apiKey?.trim() || '',
  };
}

export type GenerationMode = 'script' | 'images' | 'both' | 'surprise';

export interface AIProgress {
  step: string;
  current: number;
  total: number;
}

// ─── AIService class ──────────────────────────────────────────────────────────

export class AIService {

  static async loadSettings(): Promise<AISettings> {
    try {
      const snap = await getDoc(doc(db, 'settings', 'ai_providers'));
      if (snap.exists()) {
        const data = snap.data();
        return {
          ...DEFAULT_AI_SETTINGS,
          ...data,
          providers: {
            ...DEFAULT_AI_SETTINGS.providers,
            ...(data.providers ?? {}),
          },
          tierAssignments: {
            ...DEFAULT_AI_SETTINGS.tierAssignments,
            ...(data.tierAssignments ?? {}),
          },
        } as AISettings;
      }
    } catch (e) {
      console.error('Failed to load AI settings:', e);
    }
    return { ...DEFAULT_AI_SETTINGS };
  }

  static async saveSettings(settings: AISettings): Promise<void> {
    await setDoc(doc(db, 'settings', 'ai_providers'), settings);
  }

  // ─── Provider-specific callers ─────────────────────────────────────────────

  private static async callOpenRouter(model: string, prompt: string, apiKey: string): Promise<string> {
    if (!apiKey) throw new Error('OpenRouter API key is not set. Enter it in Admin → AI → OpenRouter.');
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
        'X-Title': 'StoryCraft',
      },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 2048, temperature: 0.9 }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      const msg = err?.error?.message || '';
      const provider = err?.error?.metadata?.provider_name ?? '';
      if (resp.status === 401) throw new Error('Invalid OpenRouter API key.');
      if (resp.status === 429) throw new Error('Rate limited by OpenRouter. Wait a moment and retry.');
      if (resp.status === 402) throw new Error('OpenRouter account out of credits. Switch to a free model.');
      if (resp.status === 502 || msg.includes('Provider returned error')) {
        throw new Error(`Model "${model}" is currently unavailable${provider ? ` (provider: ${provider})` : ''}. Try a different model in Admin → AI.`);
      }
      throw new Error(msg || `OpenRouter error ${resp.status}`);
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || '';
  }

  private static async callGemini(model: string, prompt: string, apiKey: string): Promise<string> {
    if (!apiKey) throw new Error('Gemini API key is not set. Enter it in Admin → AI → Google Gemini.');
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 2048, temperature: 0.9 } }),
      }
    );
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      if (resp.status === 400) throw new Error(`Gemini: Invalid request — ${err?.error?.message ?? 'check model name'}.`);
      if (resp.status === 403) throw new Error('Gemini API key is invalid or API not enabled.');
      if (resp.status === 429) throw new Error('Gemini rate limit hit. Wait and retry, or upgrade your Google AI plan.');
      throw new Error(err?.error?.message || `Gemini error ${resp.status}`);
    }
    const data = await resp.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  private static async callGroq(model: string, prompt: string, apiKey: string): Promise<string> {
    if (!apiKey) throw new Error('Groq API key is not set. Get a free key at console.groq.com, then enter it in Admin → AI → Groq.');
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 2048, temperature: 0.9 }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      if (resp.status === 401) throw new Error('Invalid Groq API key.');
      if (resp.status === 429) throw new Error('Groq rate limit hit. Wait a moment and retry.');
      throw new Error(err?.error?.message || `Groq error ${resp.status}`);
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || '';
  }

  private static async callTogether(model: string, prompt: string, apiKey: string): Promise<string> {
    if (!apiKey) throw new Error('Together AI key is not set. Get a free key at api.together.ai, then enter it in Admin → AI → Together AI.');
    const resp = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 2048, temperature: 0.9 }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      if (resp.status === 401) throw new Error('Invalid Together AI key.');
      if (resp.status === 429) throw new Error('Together AI rate limit hit. Retry in a moment.');
      throw new Error(err?.error?.message || `Together AI error ${resp.status}`);
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || '';
  }

  private static async callOpenAI(model: string, prompt: string, apiKey: string): Promise<string> {
    if (!apiKey) throw new Error('OpenAI API key is not set. Enter it in Admin → AI → OpenAI.');
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 2048, temperature: 0.9 }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      if (resp.status === 401) throw new Error('Invalid OpenAI API key.');
      if (resp.status === 429) throw new Error('OpenAI rate limit or quota exceeded.');
      throw new Error(err?.error?.message || `OpenAI error ${resp.status}`);
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || '';
  }

  private static async callAnthropic(model: string, prompt: string, apiKey: string): Promise<string> {
    if (!apiKey) throw new Error('Anthropic API key is not set. Enter it in Admin → AI → Anthropic Claude.');
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model, max_tokens: 2048, messages: [{ role: 'user', content: prompt }] }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      if (resp.status === 401) throw new Error('Invalid Anthropic API key.');
      if (resp.status === 429) throw new Error('Anthropic rate limit hit. Retry in a moment.');
      throw new Error(err?.error?.message || `Anthropic error ${resp.status}`);
    }
    const data = await resp.json();
    return data.content?.[0]?.text || '';
  }

  // ─── Dispatch ──────────────────────────────────────────────────────────────

  static async generateText(prompt: string, resolved: ResolvedProvider): Promise<string> {
    const { providerKey, model, apiKey } = resolved;
    switch (providerKey) {
      case 'openrouter': return AIService.callOpenRouter(model, prompt, apiKey);
      case 'gemini':     return AIService.callGemini(model, prompt, apiKey);
      case 'groq':       return AIService.callGroq(model, prompt, apiKey);
      case 'together':   return AIService.callTogether(model, prompt, apiKey);
      case 'openai':     return AIService.callOpenAI(model, prompt, apiKey);
      case 'anthropic':  return AIService.callAnthropic(model, prompt, apiKey);
      default: throw new Error(`Unknown AI provider: "${providerKey}". Check Admin → AI settings.`);
    }
  }

  // ─── Image Generation ───────────────────────────────────────────────────────

  static async generateImage(prompt: string, settings: AISettings): Promise<string> {
    if (!settings.imageApiKey?.trim()) {
      throw new Error('Image generation requires a Stability AI key. Add it in Admin → AI → Image Generation.');
    }
    const formData = new FormData();
    formData.append('prompt', prompt.slice(0, 10000));
    formData.append('output_format', 'jpeg');
    const resp = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${settings.imageApiKey}`, 'Accept': 'image/*' },
      body: formData,
    });
    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      throw new Error(`Stability AI error ${resp.status}: ${errText.slice(0, 200)}`);
    }
    const blob = await resp.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // ─── Image prompt helper ───────────────────────────────────────────────────

  static async generateImagePrompt(pageText: string, storyStyle: string, ageGroup: string, resolved: ResolvedProvider): Promise<string> {
    const prompt = `Write a short image-generation prompt (max 120 words) for a children's book illustration.
Art style: ${storyStyle}. Age group: ${ageGroup}.
Scene text: "${pageText}"
Return ONLY the image prompt — no explanation, no quotes.
Focus on: characters, setting, mood, lighting, color palette. Keep it family-friendly and visually rich.`;
    return AIService.generateText(prompt, resolved);
  }

  // ─── Story Script ──────────────────────────────────────────────────────────

  static async generateStoryPages(
    idea: string, pageCount: number, style: string, ageGroup: string, language: string,
    resolved: ResolvedProvider, narrativeStructure?: string, storyBibleContext?: string
  ): Promise<{ title: string; pages: { text: string }[] }> {
    const structureGuide = narrativeStructure === 'hero-journey'
      ? `Structure this as a Hero's Journey: Ordinary World → Call to Adventure → Crossing the Threshold → Tests & Allies → The Ordeal → Road Back → Return Transformed. Distribute beats across ${pageCount} pages.`
      : narrativeStructure === '3-act'
      ? `3-Act structure: Act 1 (25%): setup & inciting incident. Act 2 (50%): rising tension, midpoint twist. Act 3 (25%): climax & resolution.`
      : narrativeStructure === '5-act'
      ? `5-Act (Freytag's Pyramid): Exposition, Rising Action, Climax, Falling Action, Dénouement. ~${Math.ceil(pageCount/5)} pages each.`
      : narrativeStructure === 'in-medias-res'
      ? `Start IN MEDIAS RES — drop the reader into the most thrilling moment first. Reveal the build-up through the middle, then reach a satisfying climax and resolution.`
      : `Clear beginning → middle → end arc.`;

    const bibleSection = storyBibleContext ? `\nWorld/Lore Context (stay consistent with this):\n${storyBibleContext}\n` : '';

    const prompt = `You are a master storyteller. Write a ${pageCount}-page illustrated story in ${language}, for readers aged ${ageGroup}.

Story idea: "${idea}"
Illustration style: ${style}
${bibleSection}
Narrative structure: ${structureGuide}

Return ONLY valid JSON — no markdown, no code fences:
{"title":"Story Title","pages":[{"text":"Page 1 text."},{"text":"Page 2 text."}]}

Rules:
- EXACTLY ${pageCount} items in "pages".
- Each page: 2–4 sentences, ${ageGroup} reading level.
- Ages 0–5: simple words, wonder. Ages 6–12: light adventure. YA/Adult: rich vocabulary.
- Output ONLY the JSON.`;

    const rawText = await AIService.generateText(prompt, resolved);
    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const s = cleaned.indexOf('{'), e = cleaned.lastIndexOf('}');
    if (s === -1 || e === -1) throw new Error('AI returned an unexpected format. Please try again.');
    const parsed = JSON.parse(cleaned.slice(s, e + 1));
    if (!parsed.title || !Array.isArray(parsed.pages) || parsed.pages.length === 0) {
      throw new Error('AI response missing required fields. Please try again.');
    }
    return { title: parsed.title, pages: parsed.pages };
  }

  // ─── Character Architect ───────────────────────────────────────────────────

  static async generateCharacterProfile(
    name: string, role: string, genre: string, storyIdea: string, resolved: ResolvedProvider
  ): Promise<{ appearance: string; personality: string; backstory: string; motivations: string; flaws: string; voiceStyle: string; arc: string }> {
    const prompt = `You are a master character designer. Create a rich character profile for a ${genre} story.
Character name: "${name}", Role: ${role}, Story: "${storyIdea}"
Return ONLY valid JSON:
{"appearance":"...","personality":"...","backstory":"...","motivations":"...","flaws":"...","voiceStyle":"...","arc":"..."}
Output ONLY the JSON.`;
    const rawText = await AIService.generateText(prompt, resolved);
    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const s = cleaned.indexOf('{'), e = cleaned.lastIndexOf('}');
    if (s === -1 || e === -1) throw new Error('AI returned unexpected format for character profile.');
    return JSON.parse(cleaned.slice(s, e + 1));
  }

  // ─── Story Bible Generator ─────────────────────────────────────────────────

  static async generateStoryBible(
    storyIdea: string, genre: string, style: string, resolved: ResolvedProvider
  ): Promise<{ title: string; overview: string; history: string; magicSystem: string; politics: string; geography: string; rules: string }> {
    const prompt = `You are a master world-builder. Create a Story Bible for a ${genre} story.
Concept: "${storyIdea}", Tone: ${style}
Return ONLY valid JSON:
{"title":"...","overview":"...","history":"...","magicSystem":"...","politics":"...","geography":"...","rules":"..."}
Output ONLY the JSON.`;
    const rawText = await AIService.generateText(prompt, resolved);
    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const s = cleaned.indexOf('{'), e = cleaned.lastIndexOf('}');
    if (s === -1 || e === -1) throw new Error('AI returned unexpected format for story bible.');
    return JSON.parse(cleaned.slice(s, e + 1));
  }

  // ─── Branching Path ────────────────────────────────────────────────────────

  static async generateBranchPath(
    currentPageText: string, choiceText: string, pageCount: number,
    style: string, ageGroup: string, language: string, storyTitle: string, resolved: ResolvedProvider
  ): Promise<{ pages: { text: string }[] }> {
    const prompt = `You are writing a branching "Choose Your Own Adventure" story.
Title: "${storyTitle}", Reader chose: "${choiceText}" after reading: "${currentPageText}"
Continue for ${pageCount} page(s) in ${language} (age: ${ageGroup}, style: ${style}).
Return ONLY valid JSON: {"pages":[{"text":"..."}]}`;
    const rawText = await AIService.generateText(prompt, resolved);
    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const s = cleaned.indexOf('{'), e = cleaned.lastIndexOf('}');
    if (s === -1 || e === -1) throw new Error('AI returned unexpected format for branch path.');
    return JSON.parse(cleaned.slice(s, e + 1));
  }

  // ─── RPG Tools ─────────────────────────────────────────────────────────────

  static async generateNPCProfile(
    concept: string, setting: string, resolved: ResolvedProvider
  ): Promise<{ name: string; race?: string; class?: string; appearance: string; personality: string; hook: string; questSeed: string; secretMotivation: string }> {
    const prompt = `Generate a vivid NPC for a tabletop RPG. Concept: "${concept}", Setting: "${setting}"
Return ONLY valid JSON: {"name":"...","race":"...","class":"...","appearance":"...","personality":"...","hook":"...","questSeed":"...","secretMotivation":"..."}`;
    const rawText = await AIService.generateText(prompt, resolved);
    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const s = cleaned.indexOf('{'), e = cleaned.lastIndexOf('}');
    if (s === -1 || e === -1) throw new Error('AI returned unexpected format for NPC.');
    return JSON.parse(cleaned.slice(s, e + 1));
  }

  static async generateQuestLore(
    premise: string, setting: string, resolved: ResolvedProvider
  ): Promise<{ title: string; hook: string; backstory: string; objectives: string[]; twists: string[]; rewards: string }> {
    const prompt = `Create detailed quest lore for a tabletop RPG. Premise: "${premise}", Setting: "${setting}"
Return ONLY valid JSON: {"title":"...","hook":"...","backstory":"...","objectives":["..."],"twists":["..."],"rewards":"..."}`;
    const rawText = await AIService.generateText(prompt, resolved);
    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const s = cleaned.indexOf('{'), e = cleaned.lastIndexOf('}');
    if (s === -1 || e === -1) throw new Error('AI returned unexpected format for quest lore.');
    return JSON.parse(cleaned.slice(s, e + 1));
  }

  // ─── Images Only ───────────────────────────────────────────────────────────

  static async generateImagesOnly(
    idea: string, pageCount: number, style: string, ageGroup: string,
    resolved: ResolvedProvider, settings: AISettings, onProgress?: (p: AIProgress) => void
  ): Promise<{ title: string; pages: { text: string; imageUrl?: string }[] }> {
    onProgress?.({ step: 'Planning scenes...', current: 0, total: pageCount + 1 });
    const scenesPrompt = `Break a children's story into ${pageCount} illustrated scenes.
Story: "${idea}", Style: ${style}, Age: ${ageGroup}
Return ONLY JSON: {"title":"...","scenes":[{"caption":"...","imagePrompt":"..."}]}`;
    const rawText = await AIService.generateText(scenesPrompt, resolved);
    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const s = cleaned.indexOf('{'), e = cleaned.lastIndexOf('}');
    if (s === -1 || e === -1) throw new Error('AI returned unexpected format.');
    const parsed = JSON.parse(cleaned.slice(s, e + 1));
    const pages: { text: string; imageUrl?: string }[] = [];
    for (let i = 0; i < parsed.scenes.length; i++) {
      const scene = parsed.scenes[i];
      onProgress?.({ step: `Illustrating scene ${i + 1}/${parsed.scenes.length}...`, current: i + 1, total: pageCount + 1 });
      try {
        const imageUrl = await AIService.generateImage(`${scene.imagePrompt}, ${style} art style, children's book illustration`, settings);
        pages.push({ text: scene.caption || '', imageUrl });
      } catch { pages.push({ text: scene.caption || '' }); }
    }
    return { title: parsed.title, pages };
  }

  // ─── Full Story ────────────────────────────────────────────────────────────

  static async generateFullStory(
    idea: string, pageCount: number, style: string, ageGroup: string, language: string,
    resolved: ResolvedProvider, settings: AISettings, onProgress?: (p: AIProgress) => void
  ): Promise<{ title: string; pages: { text: string; imageUrl?: string }[] }> {
    onProgress?.({ step: 'Writing story script...', current: 0, total: pageCount + 1 });
    const storyResult = await AIService.generateStoryPages(idea, pageCount, style, ageGroup, language, resolved);
    const pagesWithImages: { text: string; imageUrl?: string }[] = [];
    for (let i = 0; i < storyResult.pages.length; i++) {
      const page = storyResult.pages[i];
      onProgress?.({ step: `Illustrating page ${i + 1}/${storyResult.pages.length}...`, current: i + 1, total: pageCount + 1 });
      try {
        const imgPrompt = await AIService.generateImagePrompt(page.text, style, ageGroup, resolved);
        const imageUrl = await AIService.generateImage(`${imgPrompt}, ${style} art style, children's book illustration`, settings);
        pagesWithImages.push({ text: page.text, imageUrl });
      } catch { pagesWithImages.push({ text: page.text }); }
    }
    return { title: storyResult.title, pages: pagesWithImages };
  }

  // ─── Utilities ─────────────────────────────────────────────────────────────

  static async enhanceText(text: string, resolved: ResolvedProvider): Promise<string> {
    const prompt = `Improve the following story page text. Make it more vivid and engaging. Keep roughly the same length. Return ONLY the improved text.\n\nOriginal:\n${text}`;
    return AIService.generateText(prompt, resolved);
  }

  static async generateTitle(idea: string, resolved: ResolvedProvider): Promise<string> {
    const prompt = `Create a single creative, catchy title for a story about: "${idea}". Return ONLY the title, no quotes, no explanation.`;
    const result = await AIService.generateText(prompt, resolved);
    return result.trim().replace(/^["']|["']$/g, '');
  }
}
