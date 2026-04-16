import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface AIProvider {
  name: string;
  apiKey: string;
  model: string;
  enabled: boolean;
  usedFor: ('text' | 'image')[];
  description: string;
  isFree?: boolean;   // true = free-tier / no cost variant
}

export interface TierProviderAssignment {
  text: string;
  image: string;
  enhance: string;
  title: string;
}

export interface AIProviderSettings {
  activeTextProvider: string;      // story script generation
  activeImageProvider: string;     // image generation
  activeEnhanceProvider: string;   // text enhancement / editing
  activeTitleProvider: string;     // title generation
  providers: {
    // ── Paid / Full ──────────────────────────────
    gemini: AIProvider;
    openai: AIProvider;
    anthropic: AIProvider;
    stability: AIProvider;
    mistral: AIProvider;
    // ── Free / Lite ──────────────────────────────
    geminiFree: AIProvider;   // Gemini Flash-Lite (Google AI free tier)
    gemma: AIProvider;        // Gemma open-weight (Google AI free tier)
    openaiMini: AIProvider;   // GPT-4o Mini (cheapest OpenAI)
    claudeHaiku: AIProvider;  // Claude Haiku (cheapest Anthropic)
    mistralFree: AIProvider;  // Open-Mistral 7B (Mistral free tier)
    groq: AIProvider;         // Groq — genuinely free API (Llama, Gemma, Mixtral)
    togetherFree: AIProvider; // Together AI free tier (Llama, Mistral open models)
  };
  // Per-tier AI assignments (admin configures which AI each tier uses)
  tierAssignments?: Record<string, TierProviderAssignment>;
  // Whether ultimate users can override their AI in AccountPanel
  ultimateUserChoice?: boolean;
}

export const DEFAULT_TIER_ASSIGNMENTS: Record<string, TierProviderAssignment> = {
  free:     { text: 'geminiFree', image: 'stability',  enhance: 'geminiFree', title: 'geminiFree' },
  standard: { text: 'gemini',    image: 'stability',  enhance: 'gemini',     title: 'gemini'     },
  premium:  { text: 'gemini',    image: 'gemini',     enhance: 'anthropic',  title: 'gemini'     },
  ultimate: { text: 'gemini',    image: 'gemini',     enhance: 'anthropic',  title: 'anthropic'  },
};

/**
 * Resolve which providers to actually use for a given user tier.
 * For ultimate users with personal AI preferences, those override the tier default.
 */
export function getEffectiveSettings(
  settings: AIProviderSettings,
  userTier: string,
  userPreferences?: Partial<TierProviderAssignment>
): AIProviderSettings {
  const assignments = settings.tierAssignments ?? DEFAULT_TIER_ASSIGNMENTS;
  const tierAssign = assignments[userTier] ?? DEFAULT_TIER_ASSIGNMENTS[userTier];
  if (!tierAssign) return settings;

  const isUltimate = userTier === 'ultimate';
  const canChoose = isUltimate && (settings.ultimateUserChoice !== false);

  const effective: TierProviderAssignment = canChoose && userPreferences
    ? {
        text:    userPreferences.text    ?? tierAssign.text,
        image:   userPreferences.image   ?? tierAssign.image,
        enhance: userPreferences.enhance ?? tierAssign.enhance,
        title:   userPreferences.title   ?? tierAssign.title,
      }
    : tierAssign;

  return {
    ...settings,
    activeTextProvider:    effective.text,
    activeImageProvider:   effective.image,
    activeEnhanceProvider: effective.enhance,
    activeTitleProvider:   effective.title,
  };
}

export type GenerationMode = 'script' | 'images' | 'both' | 'surprise';

export interface AIProgress {
  step: string;
  current: number;
  total: number;
}

export const AVAILABLE_MODELS: Record<string, string[]> = {
  // ── Paid / Full ─────────────────────────────────────────────────────────────
  gemini: [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
  ],
  openai: [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-3.5-turbo',
  ],
  anthropic: [
    'claude-opus-4-5',
    'claude-sonnet-4-5',
    'claude-haiku-4-5-20251001',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
  ],
  stability: [
    'stable-image-core',
    'stable-image-ultra',
    'sd3-medium',
    'sd3-large',
  ],
  mistral: [
    'mistral-large-latest',
    'mistral-medium-latest',
    'mistral-small-latest',
    'open-mistral-7b',
  ],
  // ── Free / Lite ──────────────────────────────────────────────────────────────
  geminiFree: [
    'gemini-2.0-flash-lite',   // Google AI free tier — fastest
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',     // Smallest/fastest free model
  ],
  gemma: [
    'gemma-4-27b-it',          // Gemma 4 27B (MoE) — latest
    'gemma-3-27b-it',
    'gemma-3-12b-it',
    'gemma-3-4b-it',
    'gemma-2-27b-it',
    'gemma-2-9b-it',
  ],
  openaiMini: [
    'gpt-4o-mini',             // Cheapest OpenAI — ~20× less than GPT-4o
    'gpt-3.5-turbo',
  ],
  claudeHaiku: [
    'claude-haiku-4-5-20251001', // Cheapest & fastest Claude
    'claude-3-5-haiku-20241022',
    'claude-3-haiku-20240307',
  ],
  mistralFree: [
    'open-mistral-7b',         // Mistral free tier open model
    'open-mixtral-8x7b',       // Mixtral MoE free
    'open-mixtral-8x22b',
  ],
  groq: [
    'llama-3.3-70b-versatile', // Groq free API — fastest inference
    'llama-3.1-8b-instant',
    'gemma2-9b-it',
    'mixtral-8x7b-32768',
    'llama-3.1-70b-versatile',
  ],
  togetherFree: [
    'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free', // Together AI free
    'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
    'mistralai/Mixtral-8x7B-Instruct-v0.1',
  ],
};

export const DEFAULT_AI_SETTINGS: AIProviderSettings = {
  activeTextProvider: 'gemini',
  activeImageProvider: 'stability',
  activeEnhanceProvider: 'gemini',
  activeTitleProvider: 'gemini',
  providers: {
    // ── Paid / Full ─────────────────────────────────────────────────────────
    gemini: {
      name: 'Gemini Pro',
      apiKey: '',
      model: 'gemini-2.0-flash',
      enabled: false,
      usedFor: ['text', 'image'],
      description: 'Google Gemini — best quality story generation & Imagen image generation.',
    },
    openai: {
      name: 'OpenAI GPT-4o',
      apiKey: '',
      model: 'gpt-4o',
      enabled: false,
      usedFor: ['text', 'image'],
      description: 'OpenAI GPT-4o — industry-leading narrative quality & DALL·E 3 images.',
    },
    anthropic: {
      name: 'Claude Sonnet',
      apiKey: '',
      model: 'claude-sonnet-4-5',
      enabled: false,
      usedFor: ['text'],
      description: 'Anthropic Claude Sonnet — nuanced, creative, long-form storytelling.',
    },
    stability: {
      name: 'Stability AI',
      apiKey: '',
      model: 'stable-image-core',
      enabled: false,
      usedFor: ['image'],
      description: 'Stability AI — state-of-the-art Stable Diffusion image generation.',
    },
    mistral: {
      name: 'Mistral Large',
      apiKey: '',
      model: 'mistral-large-latest',
      enabled: false,
      usedFor: ['text'],
      description: 'Mistral Large — powerful European LLM for high-quality story writing.',
    },
    // ── Free / Lite ──────────────────────────────────────────────────────────
    geminiFree: {
      name: 'Gemini Free',
      apiKey: '',
      model: 'gemini-2.0-flash-lite',
      enabled: false,
      isFree: true,
      usedFor: ['text', 'image'],
      description: 'Gemini Flash-Lite — Google AI free tier. Same API key as Gemini Pro. Great for free-tier users.',
    },
    gemma: {
      name: 'Gemma (Free)',
      apiKey: '',
      model: 'gemma-4-27b-it',
      enabled: false,
      isFree: true,
      usedFor: ['text'],
      description: 'Gemma 4 27B (MoE) — Google\'s open-weight model. Uses Google AI API key. Free quota available.',
    },
    openaiMini: {
      name: 'GPT-4o Mini (Free)',
      apiKey: '',
      model: 'gpt-4o-mini',
      enabled: false,
      isFree: true,
      usedFor: ['text', 'image'],
      description: 'GPT-4o Mini — OpenAI\'s cheapest model, ~20× less than GPT-4o. Same API key as OpenAI.',
    },
    claudeHaiku: {
      name: 'Claude Haiku (Free)',
      apiKey: '',
      model: 'claude-haiku-4-5-20251001',
      enabled: false,
      isFree: true,
      usedFor: ['text'],
      description: 'Claude Haiku — Anthropic\'s fastest & cheapest model. Same API key as Claude Sonnet.',
    },
    mistralFree: {
      name: 'Mistral Free',
      apiKey: '',
      model: 'open-mistral-7b',
      enabled: false,
      isFree: true,
      usedFor: ['text'],
      description: 'Open-Mistral 7B — Mistral\'s free-tier open model. Same API key as Mistral Large.',
    },
    groq: {
      name: 'Groq (Free)',
      apiKey: '',
      model: 'llama-3.3-70b-versatile',
      enabled: false,
      isFree: true,
      usedFor: ['text'],
      description: 'Groq — genuinely FREE API with blazing-fast inference. Uses Llama, Gemma & Mixtral. Get a free key at console.groq.com.',
    },
    togetherFree: {
      name: 'Together AI (Free)',
      apiKey: '',
      model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
      enabled: false,
      isFree: true,
      usedFor: ['text'],
      description: 'Together AI — free tier with top open-source models (Llama 3.3, Mixtral). Get a free key at api.together.ai.',
    },
  }
};

export class AIService {
  // ─── Config ────────────────────────────────────────────────────────────────

  static async loadSettings(): Promise<AIProviderSettings> {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'ai_providers'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        return {
          ...DEFAULT_AI_SETTINGS,
          ...data,
          providers: { ...DEFAULT_AI_SETTINGS.providers, ...(data.providers || {}) }
        } as AIProviderSettings;
      }
    } catch (e) {
      console.error('Failed to load AI settings:', e);
    }
    return { ...DEFAULT_AI_SETTINGS };
  }

  static async saveSettings(settings: AIProviderSettings): Promise<void> {
    await setDoc(doc(db, 'settings', 'ai_providers'), settings);
  }

  // ─── Text Generation ───────────────────────────────────────────────────────

  private static async callGemini(apiKey: string, model: string, prompt: string): Promise<string> {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 2048, temperature: 0.9 }
        })
      }
    );
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Gemini error ${resp.status}`);
    }
    const data = await resp.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  private static async callOpenAI(apiKey: string, model: string, prompt: string): Promise<string> {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2048,
        temperature: 0.9
      })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err?.error?.message || `OpenAI error ${resp.status}`);
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || '';
  }

  private static async callAnthropic(apiKey: string, model: string, prompt: string): Promise<string> {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Anthropic error ${resp.status}`);
    }
    const data = await resp.json();
    return data.content?.[0]?.text || '';
  }

  private static async callMistral(apiKey: string, model: string, prompt: string): Promise<string> {
    const resp = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2048,
        temperature: 0.9
      })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Mistral error ${resp.status}`);
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || '';
  }

  // Groq — OpenAI-compatible endpoint, free tier
  private static async callGroq(apiKey: string, model: string, prompt: string): Promise<string> {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2048,
        temperature: 0.9
      })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Groq error ${resp.status}`);
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || '';
  }

  // Together AI — OpenAI-compatible endpoint, free models available
  private static async callTogether(apiKey: string, model: string, prompt: string): Promise<string> {
    const resp = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2048,
        temperature: 0.9
      })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Together AI error ${resp.status}`);
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || '';
  }

  static async generateText(
    prompt: string,
    settings: AIProviderSettings,
    purpose: 'text' | 'enhance' | 'title' = 'text'
  ): Promise<string> {
    const activeKey = purpose === 'enhance'
      ? (settings.activeEnhanceProvider || settings.activeTextProvider)
      : purpose === 'title'
        ? (settings.activeTitleProvider || settings.activeTextProvider)
        : settings.activeTextProvider;

    const providerKey = activeKey as keyof typeof settings.providers;
    const provider = settings.providers[providerKey];

    if (!provider?.enabled) {
      throw new Error(`${purpose === 'enhance' ? 'Enhancement' : purpose === 'title' ? 'Title' : 'Text'} provider "${provider?.name || providerKey}" is disabled. Enable it in Admin Panel → AI.`);
    }
    if (!provider?.apiKey?.trim()) {
      throw new Error(`No API key for "${provider?.name}". Add it in Admin Panel → AI Providers.`);
    }

    switch (providerKey) {
      // ── Paid ──
      case 'gemini':      return AIService.callGemini(provider.apiKey, provider.model, prompt);
      case 'openai':      return AIService.callOpenAI(provider.apiKey, provider.model, prompt);
      case 'anthropic':   return AIService.callAnthropic(provider.apiKey, provider.model, prompt);
      case 'mistral':     return AIService.callMistral(provider.apiKey, provider.model, prompt);
      // ── Free / Lite (same underlying API as their paid counterpart) ──
      case 'geminiFree':  return AIService.callGemini(provider.apiKey, provider.model, prompt);
      case 'gemma':       return AIService.callGemini(provider.apiKey, provider.model, prompt);
      case 'openaiMini':  return AIService.callOpenAI(provider.apiKey, provider.model, prompt);
      case 'claudeHaiku': return AIService.callAnthropic(provider.apiKey, provider.model, prompt);
      case 'mistralFree': return AIService.callMistral(provider.apiKey, provider.model, prompt);
      case 'groq':        return AIService.callGroq(provider.apiKey, provider.model, prompt);
      case 'togetherFree':return AIService.callTogether(provider.apiKey, provider.model, prompt);
      default: throw new Error(`Unknown text provider: ${providerKey}`);
    }
  }

  // ─── Image Generation ──────────────────────────────────────────────────────

  static async generateImage(prompt: string, settings: AIProviderSettings): Promise<string> {
    const providerKey = settings.activeImageProvider as keyof typeof settings.providers;
    const provider = settings.providers[providerKey];

    if (!provider?.enabled) {
      throw new Error(`Image provider "${provider?.name || providerKey}" is disabled. Enable it in Admin Panel → AI.`);
    }
    if (!provider?.apiKey?.trim()) {
      throw new Error(`No API key for image provider "${provider?.name}". Add it in Admin Panel → AI Providers.`);
    }

    switch (providerKey) {
      case 'stability': {
        const formData = new FormData();
        formData.append('prompt', prompt.slice(0, 10000));
        formData.append('output_format', 'jpeg');
        const resp = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Accept': 'image/*'
          },
          body: formData
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

      case 'openai': {
        const resp = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${provider.apiKey}`
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: prompt.slice(0, 4000),
            n: 1,
            size: '1024x1024',
            response_format: 'b64_json'
          })
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err?.error?.message || `OpenAI image error ${resp.status}`);
        }
        const data = await resp.json();
        return `data:image/jpeg;base64,${data.data[0].b64_json}`;
      }

      case 'gemini': {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${provider.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              instances: [{ prompt: prompt.slice(0, 2000) }],
              parameters: { sampleCount: 1, aspectRatio: '1:1' }
            })
          }
        );
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err?.error?.message || `Gemini image error ${resp.status}`);
        }
        const data = await resp.json();
        const b64 = data.predictions?.[0]?.bytesBase64Encoded;
        if (!b64) throw new Error('Gemini returned no image data');
        return `data:image/jpeg;base64,${b64}`;
      }

      default:
        throw new Error(`"${providerKey}" doesn't support image generation. Use Stability AI, OpenAI, or Gemini.`);
    }
  }

  // ─── Helper: image prompt from page text ───────────────────────────────────

  static async generateImagePrompt(
    pageText: string,
    storyStyle: string,
    ageGroup: string,
    settings: AIProviderSettings
  ): Promise<string> {
    const prompt = `Write a short image-generation prompt (max 120 words) for a children's book illustration.
Art style: ${storyStyle}. Age group: ${ageGroup}.
Scene text: "${pageText}"
Return ONLY the image prompt — no explanation, no quotes.
Focus on: characters, setting, mood, lighting, color palette.
Keep it family-friendly and visually rich.`;
    return AIService.generateText(prompt, settings);
  }

  // ─── Script Only ───────────────────────────────────────────────────────────

  static async generateStoryPages(
    idea: string,
    pageCount: number,
    style: string,
    ageGroup: string,
    language: string,
    settings: AIProviderSettings
  ): Promise<{ title: string; pages: { text: string }[] }> {
    const prompt = `You are a master children's book author. Write a ${pageCount}-page illustrated story in ${language}, for readers aged ${ageGroup}.

Story idea: "${idea}"
Illustration style: ${style}

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
- Clear beginning → middle → end arc.
- Output ONLY the JSON object, nothing else.`;

    const rawText = await AIService.generateText(prompt, settings);
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

  // ─── Images Only ───────────────────────────────────────────────────────────

  static async generateImagesOnly(
    idea: string,
    pageCount: number,
    style: string,
    ageGroup: string,
    settings: AIProviderSettings,
    onProgress?: (p: AIProgress) => void
  ): Promise<{ title: string; pages: { text: string; imageUrl?: string }[] }> {
    // Generate a minimal scene breakdown (no full prose)
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

    const rawText = await AIService.generateText(scenesPrompt, settings);
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
    settings: AIProviderSettings,
    onProgress?: (p: AIProgress) => void
  ): Promise<{ title: string; pages: { text: string; imageUrl?: string }[] }> {
    // Step 1: generate script
    onProgress?.({ step: 'Writing story script...', current: 0, total: pageCount + 1 });
    const storyResult = await AIService.generateStoryPages(idea, pageCount, style, ageGroup, language, settings);

    // Step 2: generate image per page sequentially (avoids rate limits)
    const pagesWithImages: { text: string; imageUrl?: string }[] = [];
    for (let i = 0; i < storyResult.pages.length; i++) {
      onProgress?.({ step: `Illustrating page ${i + 1} of ${storyResult.pages.length}...`, current: i + 1, total: storyResult.pages.length + 1 });
      const page = storyResult.pages[i];
      try {
        const imgPrompt = await AIService.generateImagePrompt(page.text, style, ageGroup, settings);
        const imageUrl = await AIService.generateImage(
          `${imgPrompt}, ${style} art style, children's book illustration, vibrant, high quality`,
          settings
        );
        pagesWithImages.push({ text: page.text, imageUrl });
      } catch {
        pagesWithImages.push({ text: page.text }); // keep text even if image fails
      }
    }

    return { title: storyResult.title, pages: pagesWithImages };
  }

  // ─── Utilities ─────────────────────────────────────────────────────────────

  static async enhanceText(text: string, settings: AIProviderSettings): Promise<string> {
    const prompt = `Improve the following children's story page text. Make it more vivid, engaging, and age-appropriate. Keep roughly the same length. Return ONLY the improved text, nothing else.\n\nOriginal:\n${text}`;
    return AIService.generateText(prompt, settings, 'enhance');
  }

  static async generateTitle(idea: string, settings: AIProviderSettings): Promise<string> {
    const prompt = `Create a single creative, catchy title for a children's story about: "${idea}". Return ONLY the title, no quotes, no explanation.`;
    const result = await AIService.generateText(prompt, settings, 'title');
    return result.trim().replace(/^["']|["']$/g, '');
  }
}
