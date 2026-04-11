import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type PhotoSource = 'unsplash' | 'pexels' | 'pixabay';

export interface PhotoResult {
  id: string;
  /** Full-resolution URL suitable for storing in the story */
  url: string;
  /** Small thumbnail for the grid */
  thumb: string;
  /** Medium preview for hover */
  preview: string;
  photographer: string;
  photographerUrl?: string;
  source: PhotoSource;
  altText?: string;
}

export interface PhotoServiceConfig {
  apiKey: string;
  enabled: boolean;
}

export interface PhotoServiceSettings {
  unsplash: PhotoServiceConfig;
  pexels: PhotoServiceConfig;
  pixabay: PhotoServiceConfig;
}

export const DEFAULT_PHOTO_SETTINGS: PhotoServiceSettings = {
  unsplash: { apiKey: '', enabled: false },
  pexels:   { apiKey: '', enabled: false },
  pixabay:  { apiKey: '', enabled: false },
};

// ─── Service ───────────────────────────────────────────────────────────────────

export class PhotoPickerService {
  // ── Firestore persistence ──────────────────────────────────────────────────

  static async loadSettings(): Promise<PhotoServiceSettings> {
    try {
      const snap = await getDoc(doc(db, 'settings', 'photo_services'));
      if (snap.exists()) {
        const d = snap.data();
        return {
          unsplash: { ...DEFAULT_PHOTO_SETTINGS.unsplash, ...(d.unsplash || {}) },
          pexels:   { ...DEFAULT_PHOTO_SETTINGS.pexels,   ...(d.pexels   || {}) },
          pixabay:  { ...DEFAULT_PHOTO_SETTINGS.pixabay,  ...(d.pixabay  || {}) },
        };
      }
    } catch (e) {
      console.error('Failed to load photo settings:', e);
    }
    return { ...DEFAULT_PHOTO_SETTINGS };
  }

  static async saveSettings(settings: PhotoServiceSettings): Promise<void> {
    await setDoc(doc(db, 'settings', 'photo_services'), settings);
  }

  // ── Unsplash ───────────────────────────────────────────────────────────────

  static async searchUnsplash(query: string, apiKey: string, page = 1): Promise<PhotoResult[]> {
    const resp = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=20&page=${page}&client_id=${apiKey}`
    );
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err?.errors?.[0] || `Unsplash error ${resp.status}`);
    }
    const data = await resp.json();
    return (data.results || []).map((p: any): PhotoResult => ({
      id: p.id,
      url: p.urls.regular,
      thumb: p.urls.thumb,
      preview: p.urls.small,
      photographer: p.user?.name || 'Unknown',
      photographerUrl: p.user?.links?.html,
      source: 'unsplash',
      altText: p.alt_description || p.description || query,
    }));
  }

  // ── Pexels ─────────────────────────────────────────────────────────────────

  static async searchPexels(query: string, apiKey: string, page = 1): Promise<PhotoResult[]> {
    const resp = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=20&page=${page}`,
      { headers: { Authorization: apiKey } }
    );
    if (!resp.ok) throw new Error(`Pexels error ${resp.status}`);
    const data = await resp.json();
    return (data.photos || []).map((p: any): PhotoResult => ({
      id: String(p.id),
      url: p.src.large2x || p.src.large,
      thumb: p.src.tiny,
      preview: p.src.medium,
      photographer: p.photographer,
      photographerUrl: p.photographer_url,
      source: 'pexels',
      altText: p.alt || query,
    }));
  }

  // ── Pixabay ────────────────────────────────────────────────────────────────

  static async searchPixabay(query: string, apiKey: string, page = 1): Promise<PhotoResult[]> {
    const resp = await fetch(
      `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&per_page=20&page=${page}&image_type=photo&safesearch=true`
    );
    if (!resp.ok) throw new Error(`Pixabay error ${resp.status}`);
    const data = await resp.json();
    return (data.hits || []).map((p: any): PhotoResult => ({
      id: String(p.id),
      url: p.largeImageURL,
      thumb: p.previewURL,
      preview: p.webformatURL,
      photographer: p.user,
      source: 'pixabay',
      altText: p.tags || query,
    }));
  }

  // ── External search URLs (no API required) ─────────────────────────────────

  static getVecteezyUrl(query: string): string {
    return `https://www.vecteezy.com/free-photos/${encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'))}`;
  }

  static getPinterestUrl(query: string): string {
    return `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;
  }

  static getPixabayUrl(query: string): string {
    return `https://pixabay.com/images/search/${encodeURIComponent(query)}/`;
  }
}
