import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface AISettings {
  /** OpenRouter API key. If empty the env var OPENROUTER_API_KEY is used. */
  apiKey: string;
  /** Which OpenRouter model to use for each subscription tier */
  tierModels: {
    free: string;
    standard: string;
    premium: string;
    ultimate: string;
    [key: string]: string;
  };
  /** Allow ultimate-tier users to pick their own model in Account settings */
  allowUltimateChoice: boolean;
  /** Stability AI key for image generation (optional — images disabled when empty) */
  imageApiKey: string;
  /** Stability AI model */
  imageModel: string;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  free: boolean;
  description?: string;
}

export const OPENROUTER_MODELS: OpenRouterModel[] = [
  // ── Free models ──────────────────────────────────────────────────────────────
  { id: 'google/gemma-4-26b-a4b-it:free',                          name: 'Gemma 4 26B MoE (Free)',          free: true,  description: 'Google\'s latest Gemma MoE — fast, free, great story writing.' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',                  name: 'Llama 3.3 70B (Free)',            free: true,  description: 'Meta Llama 3.3 — strong instruction-following & creativity.' },
  { id: 'mistralai/mistral-7b-instruct:free',                      name: 'Mistral 7B (Free)',               free: true,  description: 'Mistral 7B — lightweight and reliable for story generation.' },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free',               name: 'Hermes 3 405B (Free)',            free: true,  description: 'Hermes 3 on Llama 405B — highest-quality free model.' },
  { id: 'microsoft/phi-3-mini-128k-instruct:free',                  name: 'Phi-3 Mini 128k (Free)',         free: true,  description: 'Microsoft Phi-3 Mini — efficient, long context window.' },
  { id: 'google/gemma-3-27b-it:free',                              name: 'Gemma 3 27B (Free)',              free: true,  description: 'Google Gemma 3 27B — great for creative writing.' },
  // ── Paid models (require OpenRouter credits) ─────────────────────────────────
  { id: 'anthropic/claude-3.5-sonnet',                             name: 'Claude 3.5 Sonnet',               free: false, description: 'Anthropic — best narrative quality & nuanced storytelling.' },
  { id: 'anthropic/claude-3.5-haiku',                              name: 'Claude 3.5 Haiku',                free: false, description: 'Anthropic — fast Claude at lower cost.' },
  { id: 'openai/gpt-4o',                                           name: 'GPT-4o',                          free: false, description: 'OpenAI — top-tier creativity and instruction following.' },
  { id: 'openai/gpt-4o-mini',                                      name: 'GPT-4o Mini',                     free: false, description: 'OpenAI — cheaper GPT-4o with good quality.' },
  { id: 'google/gemini-pro-1.5',                                   name: 'Gemini 1.5 Pro',                  free: false, description: 'Google Gemini — excellent long-context story generation.' },
  { id: 'google/gemini-flash-1.5',                                 name: 'Gemini 1.5 Flash',                free: false, description: 'Google Gemini Flash — fast and affordable.' },
  { id: 'mistralai/mistral-large',                                 name: 'Mistral Large',                   free: false, description: 'Mistral — powerful European LLM for long-form writing.' },
  { id: 'meta-llama/llama-3.1-405b-instruct',                      name: 'Llama 3.1 405B',                  free: false, description: 'Meta — largest Llama for highest quality outputs.' },
];

export const DEFAULT_AI_SETTINGS: AISettings = {
  apiKey: '',
  tierModels: {
    free:     'google/gemma-4-26b-a4b-it:free',
    standard: 'meta-llama/llama-3.3-70b-instruct:free',
    premium:  'nousresearch/hermes-3-llama-3.1-405b:free',
    ultimate: 'nousresearch/hermes-3-llama-3.1-405b:free',
  },
  allowUltimateChoice: true,
  imageApiKey: '',
  imageModel: 'stable-image-core',
};

/**
 * Resolve which OpenRouter model to use for a given user.
 * Ultimate users with a saved preferred model use that if `allowUltimateChoice` is on.
 */
export function getEffectiveModel(
  settings: AISettings,
  userTier: string,
  userPreferredModel?: string
): string {
  if (userTier === 'ultimate' && settings.allowUltimateChoice && userPreferredModel) {
    return userPreferredModel;
  }
  return settings.tierModels[userTier] ?? settings.tierModels.free ?? 'google/gemma-4-26b-a4b-it:free';
}

export type GenerationMode = 'script' | 'images' | 'both' | 'surprise';

export interface AIProgress {
  step: string;
  current: number;
  total: number;
}

// ─── Config ────────────────────────────────────────────────────────────────────

export class AIService {

  static async loadSettings(): Promise<AISettings> {
    try {
      const snap = await getDoc(doc(db, 'settings', 'ai_providers'));
      if (snap.exists()) {
        const data = snap.data();
        return {
          ...DEFAULT_AI_SETTINGS,
          ...data,
          tierModels: { ...DEFAULT_AI_SETTINGS.tierModels, ...(data.tierModels || {}) },
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

  // ─── Core OpenRouter call ───────────────────────────────────────────────────

  private static async callOpenRouter(model: string, prompt: string, apiKey?: string): Promise<string> {
    const key = apiKey?.trim() || process.env.OPENROUTER_API_KEY || '';
    if (!key) throw new Error('OpenRouter API key is not configured. Add OPENROUTER_API_KEY to your .env file or enter it in Admin → AI.');

    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://storycraft.app',
        'X-Title': 'StoryCraft',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2048,
        temperature: 0.9,
      }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err?.error?.message || `OpenRouter error ${resp.status}`);
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || '';
  }

  // ─── Text Generation ────────────────────────────────────────────────────────

  /** Generate text using the OpenRouter model resolved for this user. */
  static async generateText(prompt: string, model: string, apiKey?: string): Promise<string> {
    return AIService.callOpenRouter(model, prompt, apiKey);
  }

  // ─── Image Generation ───────────────────────────────────────────────────────

  static async generateImage(prompt: string, settings: AISettings): Promise<string> {
    if (!settings.imageApiKey?.trim()) {
      throw new Error('Image generation requires a Stability AI API key. Add it in Admin → AI.');
    }

    const formData = new FormData();
    formData.append('prompt', prompt.slice(0, 10000));
    formData.append('output_format', 'jpeg');
    const resp = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.imageApiKey}`,
        'Accept': 'image/*',
      },
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

  static async generateImagePrompt(
    pageText: string,
    storyStyle: string,
    ageGroup: string,
    model: string,
    apiKey?: string
  ): Promise<string> {
    const prompt = `Write a short image-generation prompt (max 120 words) for a children's book illustration.
Art style: ${storyStyle}. Age group: ${ageGroup}.
Scene text: "${pageText}"
Return ONLY the image prompt — no explanation, no quotes.
Focus on: characters, setting, mood, lighting, color palette.
Keep it family-friendly and visually rich.`;
    return AIService.generateText(prompt, model, apiKey);
  }

  // ─── Story Script ──────────────────────────────────────────────────────────

  static async generateStoryPages(
    idea: string,
    pageCount: number,
    style: string,
    ageGroup: string,
    language: string,
    model: string,
    narrativeStructure?: string,
    storyBibleContext?: string,
    apiKey?: string
  ): Promise<{ title: string; pages: { text: string }[] }> {
    const structureGuide = narrativeStructure === 'hero-journey'
      ? `Structure this as a Hero's Journey (monomyth):
- Ordinary World → Call to Adventure → Crossing the Threshold → Tests & Allies → The Ordeal → Road Back → Return Transformed.
Distribute these beats proportionally across the ${pageCount} pages.`
      : narrativeStructure === '3-act'
      ? `Use a 3-Act structure:
- Act 1 (first ~25% of pages): Establish hero, world, and inciting incident.
- Act 2 (middle ~50%): Rising tension, obstacles, midpoint twist, dark night of the soul.
- Act 3 (last ~25%): Climax, resolution, final image that mirrors the opening.`
      : narrativeStructure === '5-act'
      ? `Use a 5-Act structure (Freytag's Pyramid):
- Act 1 Exposition, Act 2 Rising Action, Act 3 Climax, Act 4 Falling Action, Act 5 Dénouement.
Each act should roughly span ${Math.ceil(pageCount / 5)} pages.`
      : narrativeStructure === 'in-medias-res'
      ? `Start IN MEDIAS RES — drop the reader into the most thrilling moment first. Then reveal the build-up through the middle pages before reaching a satisfying climax and resolution.`
      : `Use a clear beginning → middle → end arc.`;

    const bibleSection = storyBibleContext
      ? `\nWorld/Lore Context (the AI must stay consistent with this):\n${storyBibleContext}\n`
      : '';

    const prompt = `You are a master storyteller and author. Write a ${pageCount}-page illustrated story in ${language}, for readers aged ${ageGroup}.

Story idea: "${idea}"
Illustration style: ${style}
${bibleSection}
Narrative structure: ${structureGuide}

Return ONLY a valid JSON object — no markdown, no code fences. Exact shape:
{
  "title": "Story Title",
  "pages": [
    { "text": "Page 1 text." },
    { "text": "Page 2 text." }
  ]
}

Rules:
- EXACTLY ${pageCount} items in "pages".
- Each page: 2–4 sentences, ${ageGroup} reading level.
- Ages 0–5: simple words, wonder, repetition.
- Ages 6–12: light adventure, curiosity, lessons.
- YA/Adult: rich vocabulary, deeper themes.
- Follow the specified narrative structure beat by beat.
- Output ONLY the JSON object, nothing else.`;

    const rawText = await AIService.generateText(prompt, model, apiKey);
    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const s = cleaned.indexOf('{');
    const e = cleaned.lastIndexOf('}');
    if (s === -1 || e === -1) throw new Error('AI returned unexpected format. Please try again.');
    const parsed = JSON.parse(cleaned.slice(s, e + 1));
    if (!parsed.title || !Array.isArray(parsed.pages) || parsed.pages.length === 0) {
      throw new Error('AI response missing required fields. Please try again.');
    }
    return { title: parsed.title, pages: parsed.pages };
  }

  // ─── Character Architect ───────────────────────────────────────────────────

  static async generateCharacterProfile(
    name: string,
    role: string,
    genre: string,
    storyIdea: string,
    model: string,
    apiKey?: string
  ): Promise<{ appearance: string; personality: string; backstory: string; motivations: string; flaws: string; voiceStyle: string; arc: string }> {
    const prompt = `You are a master character designer. Create a rich, complex character profile for a ${genre} story.

Character name: "${name}"
Role: ${role}
Story concept: "${storyIdea}"

Return ONLY a valid JSON object with this exact shape:
{
  "appearance": "Detailed physical description — face, build, distinguishing marks, typical clothing. Be specific enough to use as an image generation prompt (face-lock).",
  "personality": "Core personality traits — 3 to 5 defining characteristics.",
  "backstory": "2–3 sentences of formative backstory that explains WHY this character is who they are.",
  "motivations": "Their deepest want and deepest need (these should be different).",
  "flaws": "2–3 genuine flaws that create conflict and feel earned, not cosmetic.",
  "voiceStyle": "How they speak — sentence length, vocabulary level, verbal tics, tone.",
  "arc": "The transformation this character undergoes across the story."
}

Output ONLY the JSON. No markdown, no explanation.`;

    const rawText = await AIService.generateText(prompt, model, apiKey);
    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const s = cleaned.indexOf('{'); const e = cleaned.lastIndexOf('}');
    if (s === -1 || e === -1) throw new Error('AI returned unexpected format for character profile.');
    return JSON.parse(cleaned.slice(s, e + 1));
  }

  // ─── Story Bible Generator ─────────────────────────────────────────────────

  static async generateStoryBible(
    storyIdea: string,
    genre: string,
    style: string,
    model: string,
    apiKey?: string
  ): Promise<{ title: string; overview: string; history: string; magicSystem: string; politics: string; geography: string; rules: string }> {
    const prompt = `You are a master world-builder. Create a deep, consistent Story Bible for a ${genre} story.

Story concept: "${storyIdea}"
Visual tone: ${style}

Return ONLY a valid JSON object:
{
  "title": "Name of this world or story universe",
  "overview": "2–3 sentence quick summary of this world — what makes it unique and compelling.",
  "history": "Key historical events that shaped this world — the wars, discoveries, or turning points that authors must know.",
  "magicSystem": "If applicable: how powers/magic work, their rules, costs, limits, and who can use them. If no magic, describe the world's governing technology or unusual physics instead.",
  "politics": "The factions, power structures, governments, and ongoing conflicts. Who holds power? Who wants it?",
  "geography": "The key locations — 3–5 places authors will set scenes. What makes each unique and atmospheric?",
  "rules": "The 5–7 iron laws of this world that must NEVER be violated for consistency. These are the plot-hole prevention rules."
}

Output ONLY the JSON. No markdown, no explanation.`;

    const rawText = await AIService.generateText(prompt, model, apiKey);
    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const s = cleaned.indexOf('{'); const e = cleaned.lastIndexOf('}');
    if (s === -1 || e === -1) throw new Error('AI returned unexpected format for story bible.');
    return JSON.parse(cleaned.slice(s, e + 1));
  }

  // ─── Branching Path Generator ──────────────────────────────────────────────

  static async generateBranchPath(
    currentPageText: string,
    choiceText: string,
    pageCount: number,
    style: string,
    ageGroup: string,
    language: string,
    storyTitle: string,
    model: string,
    apiKey?: string
  ): Promise<{ pages: { text: string }[] }> {
    const prompt = `You are writing a branching "Choose Your Own Adventure" story.

Story title: "${storyTitle}"
The reader just read: "${currentPageText}"
They chose: "${choiceText}"

Continue this story branch for ${pageCount} more page(s) in ${language} (age group: ${ageGroup}, style: ${style}).
This branch should feel like a distinct, satisfying path with its own mini-arc: a consequence of the choice, escalation, and resolution.

Return ONLY a valid JSON object:
{
  "pages": [
    { "text": "Branch page 1 text." }
  ]
}

Rules:
- EXACTLY ${pageCount} items in "pages".
- Each page: 2–4 sentences.
- The branch must feel meaningfully different from choosing otherwise.
- Output ONLY the JSON object.`;

    const rawText = await AIService.generateText(prompt, model, apiKey);
    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const s = cleaned.indexOf('{'); const e = cleaned.lastIndexOf('}');
    if (s === -1 || e === -1) throw new Error('AI returned unexpected format for branch path.');
    return JSON.parse(cleaned.slice(s, e + 1));
  }

  // ─── RPG Tools ─────────────────────────────────────────────────────────────

  static async generateNPCProfile(
    concept: string,
    setting: string,
    model: string,
    apiKey?: string
  ): Promise<{ name: string; race?: string; class?: string; appearance: string; personality: string; hook: string; questSeed: string; secretMotivation: string }> {
    const prompt = `You are a Game Master assistant. Generate a vivid, usable NPC for a tabletop RPG session.

NPC concept: "${concept}"
Setting/world: "${setting}"

Return ONLY a valid JSON object:
{
  "name": "Full name",
  "race": "Species/race if applicable",
  "class": "Occupation or class if applicable",
  "appearance": "Vivid 2-sentence physical description a GM can read aloud instantly.",
  "personality": "3 words that capture their vibe, plus one memorable quirk or habit.",
  "hook": "One-sentence reason a player would want to talk to them.",
  "questSeed": "A plot hook this NPC can kick off — one sentence.",
  "secretMotivation": "What they really want, hidden from the players."
}

Output ONLY the JSON.`;

    const rawText = await AIService.generateText(prompt, model, apiKey);
    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const s = cleaned.indexOf('{'); const e = cleaned.lastIndexOf('}');
    if (s === -1 || e === -1) throw new Error('AI returned unexpected format for NPC.');
    return JSON.parse(cleaned.slice(s, e + 1));
  }

  static async generateQuestLore(
    premise: string,
    setting: string,
    model: string,
    apiKey?: string
  ): Promise<{ title: string; hook: string; backstory: string; objectives: string[]; twists: string[]; rewards: string }> {
    const prompt = `You are a Game Master assistant. Create detailed quest lore for a tabletop RPG.

Quest premise: "${premise}"
Setting: "${setting}"

Return ONLY a valid JSON object:
{
  "title": "Quest name",
  "hook": "The inciting event or rumor that draws players in (2 sentences).",
  "backstory": "The full lore of why this quest exists — the history behind it (3–4 sentences).",
  "objectives": ["Primary objective", "Optional secondary objective", "Hidden objective"],
  "twists": ["Mid-quest reveal", "Final revelation that recontextualizes everything"],
  "rewards": "What players gain — tangible and intangible."
}

Output ONLY the JSON.`;

    const rawText = await AIService.generateText(prompt, model, apiKey);
    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const s = cleaned.indexOf('{'); const e = cleaned.lastIndexOf('}');
    if (s === -1 || e === -1) throw new Error('AI returned unexpected format for quest lore.');
    return JSON.parse(cleaned.slice(s, e + 1));
  }

  // ─── Images Only ───────────────────────────────────────────────────────────

  static async generateImagesOnly(
    idea: string,
    pageCount: number,
    style: string,
    ageGroup: string,
    model: string,
    settings: AISettings,
    onProgress?: (p: AIProgress) => void
  ): Promise<{ title: string; pages: { text: string; imageUrl?: string }[] }> {
    onProgress?.({ step: 'Planning scenes...', current: 0, total: pageCount + 1 });

    const scenesPrompt = `Break a children's story into ${pageCount} illustrated scenes.
Story idea: "${idea}"
Art style: ${style}, age group ${ageGroup}.

Return ONLY a JSON object:
{
  "title": "Story Title",
  "scenes": [
    { "caption": "Short 1-sentence caption.", "imagePrompt": "Detailed illustration prompt for this scene." }
  ]
}

Rules:
- EXACTLY ${pageCount} scenes.
- Each imagePrompt: vivid, detailed, ${style} art style, family-friendly, max 100 words.
- Output ONLY the JSON.`;

    const rawText = await AIService.generateText(scenesPrompt, model, settings.apiKey);
    const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const s = cleaned.indexOf('{');
    const e = cleaned.lastIndexOf('}');
    if (s === -1 || e === -1) throw new Error('AI returned unexpected format.');
    const parsed = JSON.parse(cleaned.slice(s, e + 1));

    const pages: { text: string; imageUrl?: string }[] = [];
    for (let i = 0; i < parsed.scenes.length; i++) {
      const scene = parsed.scenes[i];
      onProgress?.({ step: `Illustrating scene ${i + 1} of ${parsed.scenes.length}...`, current: i + 1, total: pageCount + 1 });
      try {
        const imageUrl = await AIService.generateImage(
          `${scene.imagePrompt}, ${style} art style, children's book illustration, high quality, vibrant`,
          settings
        );
        pages.push({ text: scene.caption || '', imageUrl });
      } catch {
        pages.push({ text: scene.caption || '' });
      }
    }

    return { title: parsed.title, pages };
  }

  // ─── Full Story (Script + Images) ──────────────────────────────────────────

  static async generateFullStory(
    idea: string,
    pageCount: number,
    style: string,
    ageGroup: string,
    language: string,
    model: string,
    settings: AISettings,
    onProgress?: (p: AIProgress) => void
  ): Promise<{ title: string; pages: { text: string; imageUrl?: string }[] }> {
    onProgress?.({ step: 'Writing story script...', current: 0, total: pageCount + 1 });
    const storyResult = await AIService.generateStoryPages(idea, pageCount, style, ageGroup, language, model, undefined, undefined, settings.apiKey);

    const pagesWithImages: { text: string; imageUrl?: string }[] = [];
    for (let i = 0; i < storyResult.pages.length; i++) {
      const page = storyResult.pages[i];
      onProgress?.({ step: `Illustrating page ${i + 1} of ${storyResult.pages.length}...`, current: i + 1, total: pageCount + 1 });
      try {
        const imgPrompt = await AIService.generateImagePrompt(page.text, style, ageGroup, model, settings.apiKey);
        const imageUrl = await AIService.generateImage(
          `${imgPrompt}, ${style} art style, children's book illustration, high quality, vibrant`,
          settings
        );
        pagesWithImages.push({ text: page.text, imageUrl });
      } catch {
        pagesWithImages.push({ text: page.text });
      }
    }

    return { title: storyResult.title, pages: pagesWithImages };
  }

  // ─── Utilities ─────────────────────────────────────────────────────────────

  static async enhanceText(text: string, model: string, apiKey?: string): Promise<string> {
    const prompt = `Improve the following children's story page text. Make it more vivid, engaging, and age-appropriate. Keep roughly the same length. Return ONLY the improved text, nothing else.\n\nOriginal:\n${text}`;
    return AIService.generateText(prompt, model, apiKey);
  }

  static async generateTitle(idea: string, model: string, apiKey?: string): Promise<string> {
    const prompt = `Create a single creative, catchy title for a children's story about: "${idea}". Return ONLY the title, no quotes, no explanation.`;
    const result = await AIService.generateText(prompt, model, apiKey);
    return result.trim().replace(/^["']|["']$/g, '');
  }
}
