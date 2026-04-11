import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Loader2, ExternalLink, Image as ImageIcon, ChevronRight } from 'lucide-react';
import { PhotoPickerService, PhotoResult, PhotoServiceSettings, DEFAULT_PHOTO_SETTINGS } from '../services/PhotoPickerService';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'unsplash' | 'pexels' | 'pixabay' | 'vecteezy' | 'pinterest';

interface PhotoPickerProps {
  onSelect: (url: string) => void;
  onClose: () => void;
  /** Pre-fill the search box with something relevant (e.g. story idea or page text) */
  initialQuery?: string;
}

// ─── Tab metadata ─────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; color: string; logo: string; hasApi: boolean }[] = [
  { id: 'unsplash', label: 'Unsplash',  color: '#111111', logo: 'U', hasApi: true  },
  { id: 'pexels',   label: 'Pexels',    color: '#05A081', logo: 'P', hasApi: true  },
  { id: 'pixabay',  label: 'Pixabay',   color: '#2EC66B', logo: 'X', hasApi: true  },
  { id: 'vecteezy', label: 'Vecteezy',  color: '#FF5F5F', logo: 'V', hasApi: false },
  { id: 'pinterest',label: 'Pinterest', color: '#E60023', logo: '📌', hasApi: false },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function PhotoPicker({ onSelect, onClose, initialQuery = '' }: PhotoPickerProps) {
  const [activeTab, setActiveTab]       = useState<Tab>('unsplash');
  const [query, setQuery]               = useState(initialQuery);
  const [photos, setPhotos]             = useState<PhotoResult[]>([]);
  const [loading, setLoading]           = useState(false);
  const [settings, setSettings]         = useState<PhotoServiceSettings>(DEFAULT_PHOTO_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [hoveredId, setHoveredId]       = useState<string | null>(null);
  const searchRef                       = useRef<HTMLInputElement>(null);

  // ── Load API settings once ─────────────────────────────────────────────────
  useEffect(() => {
    PhotoPickerService.loadSettings().then(s => {
      setSettings(s);
      setSettingsLoaded(true);
    });
    searchRef.current?.focus();
  }, []);

  // ── Auto-search when switching tabs (if there's already a query) ───────────
  useEffect(() => {
    if (settingsLoaded && query.trim().length > 1) {
      doSearch(query.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, settingsLoaded]);

  // ── Search ─────────────────────────────────────────────────────────────────
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    const tab = activeTab;

    if (!TABS.find(t => t.id === tab)?.hasApi) return; // external-link tabs don't search

    setLoading(true);
    setPhotos([]);
    try {
      let results: PhotoResult[] = [];

      if (tab === 'unsplash') {
        if (!settings.unsplash.enabled || !settings.unsplash.apiKey.trim()) {
          toast.error('Unsplash is not configured. Add an API key in Admin → Photos.');
          return;
        }
        results = await PhotoPickerService.searchUnsplash(q, settings.unsplash.apiKey);
      } else if (tab === 'pexels') {
        if (!settings.pexels.enabled || !settings.pexels.apiKey.trim()) {
          toast.error('Pexels is not configured. Add an API key in Admin → Photos.');
          return;
        }
        results = await PhotoPickerService.searchPexels(q, settings.pexels.apiKey);
      } else if (tab === 'pixabay') {
        if (!settings.pixabay.enabled || !settings.pixabay.apiKey.trim()) {
          toast.error('Pixabay is not configured. Add an API key in Admin → Photos.');
          return;
        }
        results = await PhotoPickerService.searchPixabay(q, settings.pixabay.apiKey);
      }

      setPhotos(results);
      if (results.length === 0) toast.info('No photos found. Try a different search term.');
    } catch (err: any) {
      toast.error(err?.message || 'Search failed. Check your API key.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, settings]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') doSearch(query);
  };

  const handleSelect = (photo: PhotoResult) => {
    onSelect(photo.url);
    toast.success(`Photo by ${photo.photographer} selected!`);
    onClose();
  };

  const currentTabMeta = TABS.find(t => t.id === activeTab)!;
  const isExternalTab  = !currentTabMeta.hasApi;

  const externalUrl = activeTab === 'vecteezy'
    ? PhotoPickerService.getVecteezyUrl(query || 'nature')
    : activeTab === 'pinterest'
    ? PhotoPickerService.getPinterestUrl(query || 'photography')
    : '';

  // ── Keyboard: close on Escape ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
      style={{ backgroundColor: 'rgba(10,10,10,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 26, stiffness: 260 }}
        className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
      >
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="px-8 pt-8 pb-6 border-b border-black/5 flex items-center gap-4 flex-shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold flex-shrink-0">
            <ImageIcon size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-serif font-bold text-night">Browse Stock Photos</h2>
            <p className="text-[11px] text-black/35 mt-0.5">Search millions of free photos — choose one for your story</p>
          </div>

          {/* Search box */}
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search photos…"
              className="w-full pl-10 pr-4 py-3 bg-black/5 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-gold/40 transition-all placeholder:text-black/25"
            />
          </div>
          <button
            onClick={() => doSearch(query)}
            disabled={loading || isExternalTab}
            className="px-6 py-3 bg-gold text-night rounded-2xl text-sm font-bold hover:bg-night hover:text-gold transition-all shadow-lg shadow-gold/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Search
          </button>

          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-black/5 transition-colors flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Tab Bar ──────────────────────────────────────────────────────── */}
        <div className="px-8 py-4 border-b border-black/5 flex items-center gap-2 flex-shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPhotos([]); }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                activeTab === tab.id
                  ? "text-white shadow-lg"
                  : "bg-black/5 text-black/40 hover:text-black hover:bg-black/10"
              )}
              style={activeTab === tab.id ? { backgroundColor: tab.color } : {}}
            >
              <span className="text-base leading-none">{tab.logo}</span>
              {tab.label}
              {!tab.hasApi && (
                <ExternalLink size={10} className="opacity-60" />
              )}
            </button>
          ))}
        </div>

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">

            {/* External-link tabs: Vecteezy & Pinterest */}
            {isExternalTab && (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-6"
              >
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-xl"
                  style={{ backgroundColor: currentTabMeta.color }}
                >
                  {currentTabMeta.logo}
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif font-bold text-night">{currentTabMeta.label}</h3>
                  <p className="text-black/40 text-sm max-w-sm leading-relaxed">
                    {activeTab === 'vecteezy'
                      ? 'Explore millions of free stock photos, vectors, and illustrations on Vecteezy.'
                      : 'Discover beautiful images and ideas curated by creators worldwide on Pinterest.'}
                  </p>
                </div>

                <div className="flex flex-col items-center gap-3 w-full max-w-sm">
                  <p className="text-[11px] text-black/30 uppercase tracking-widest font-bold">
                    Enter a topic to search
                  </p>
                  <div className="relative w-full">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g. forest, dragon, castle..."
                      className="w-full pl-10 pr-4 py-3 bg-black/5 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-gold/40 transition-all placeholder:text-black/25"
                    />
                  </div>
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-sm shadow-xl hover:opacity-90 transition-all"
                    style={{ backgroundColor: currentTabMeta.color }}
                  >
                    Open {currentTabMeta.label}
                    <ChevronRight size={16} />
                  </a>
                  <p className="text-[10px] text-black/25 leading-relaxed">
                    Opens in a new tab — find your photo, copy its URL, then paste it into your story.
                  </p>
                </div>
              </motion.div>
            )}

            {/* API-based tabs: loading spinner */}
            {!isExternalTab && loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center min-h-[40vh] gap-4"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
                </div>
                <p className="text-sm text-black/40 font-bold uppercase tracking-widest">Searching {currentTabMeta.label}…</p>
              </motion.div>
            )}

            {/* API-based tabs: empty state */}
            {!isExternalTab && !loading && photos.length === 0 && settingsLoaded && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-4"
              >
                {/* Check if the service is configured */}
                {(activeTab === 'unsplash' && (!settings.unsplash.enabled || !settings.unsplash.apiKey)) ||
                 (activeTab === 'pexels'   && (!settings.pexels.enabled   || !settings.pexels.apiKey))   ||
                 (activeTab === 'pixabay'  && (!settings.pixabay.enabled  || !settings.pixabay.apiKey))  ? (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-black/5 flex items-center justify-center text-2xl">🔑</div>
                    <div className="space-y-1">
                      <p className="font-bold text-night">{currentTabMeta.label} not configured</p>
                      <p className="text-sm text-black/40">
                        Add an API key in <span className="font-bold text-gold">Admin Panel → Photos</span> to enable this service.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-black/5 flex items-center justify-center text-2xl">🔍</div>
                    <div className="space-y-1">
                      <p className="font-bold text-night">Search for photos</p>
                      <p className="text-sm text-black/40">Type a keyword above and press Search or Enter</p>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* API-based tabs: results grid */}
            {!isExternalTab && !loading && photos.length > 0 && (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Attribution notice */}
                <div className="mb-4 px-4 py-2.5 bg-gold/5 border border-gold/15 rounded-2xl flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Attribution</span>
                  <span className="text-[11px] text-black/40">
                    Photos courtesy of {currentTabMeta.label}. Please credit the photographer when publishing.
                  </span>
                </div>

                {/* Masonry-style grid */}
                <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative break-inside-avoid rounded-2xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300"
                      onMouseEnter={() => setHoveredId(photo.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => handleSelect(photo)}
                    >
                      <img
                        src={photo.preview}
                        alt={photo.altText || ''}
                        className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      {/* Overlay */}
                      <AnimatePresence>
                        {hoveredId === photo.id && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3"
                          >
                            <p className="text-white text-[11px] font-bold truncate">
                              {photo.photographer}
                            </p>
                            <p className="text-white/50 text-[9px] uppercase tracking-widest mt-0.5">
                              {currentTabMeta.label}
                            </p>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleSelect(photo); }}
                              className="mt-2 w-full py-2 bg-gold text-night rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all"
                            >
                              Use Photo
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
