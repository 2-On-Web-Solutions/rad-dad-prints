'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ItemModal, { type CatalogItem } from './ItemModal';

/** =======================
 *  Types
 *  ======================= */
type CatalogCategory = {
  id: string;
  label: string;
  coverEmoji?: string;
  blurb?: string;
  items: CatalogItem[];
};

/** =======================
 *  Data (Bundles & Packages)
 *  ======================= */
const BASE_CATEGORIES: CatalogCategory[] = [
  {
    id: 'starter',
    label: 'Starter Bundle',
    coverEmoji: '🎁',
    blurb: 'Great entry pack: small prints + samples.',
    items: [
      { id: 'st-1', title: 'Starter Pack (5 pcs)', priceFrom: 'From $20' },
      { id: 'st-2', title: 'Sample Color Set', priceFrom: 'From $10' },
    ],
  },
  {
    id: 'gamer',
    label: 'Gamer Pack',
    coverEmoji: '🎮',
    blurb: 'Controller stand, cable clips, desk badge.',
    items: [
      { id: 'ga-1', title: 'Controller Stand', priceFrom: 'From $12' },
      { id: 'ga-2', title: 'Cable Clip Pack', priceFrom: 'From $6' },
    ],
  },
  {
    id: 'classroom',
    label: 'Classroom Kit',
    coverEmoji: '🏫',
    blurb: 'Education models, labels, organizers.',
    items: [
      { id: 'cl-1', title: 'Math Shapes Set', priceFrom: 'From $18' },
      { id: 'cl-2', title: 'Desk Nameplates (10)', priceFrom: 'From $25' },
    ],
  },
  {
    id: 'maker',
    label: 'Maker Bundle',
    coverEmoji: '🧰',
    blurb: 'Jigs, helpers, nozzle caddies, bins.',
    items: [
      { id: 'mk-1', title: 'Tool Caddy', priceFrom: 'From $14' },
      { id: 'mk-2', title: 'Parts Bins (6)', priceFrom: 'From $16' },
    ],
  },
  {
    id: 'cosplay-pack',
    label: 'Cosplay Pack',
    coverEmoji: '🛡️',
    blurb: 'Emblems, badges, strap guides.',
    items: [
      { id: 'cp-1', title: 'Armor Emblem Set', priceFrom: 'From $20' },
      { id: 'cp-2', title: 'Buckle + Strap Guides', priceFrom: 'From $12' },
    ],
  },
  {
    id: 'swag',
    label: 'Team Swag',
    coverEmoji: '🏒',
    blurb: 'Keychains, nameplates, number plaques.',
    items: [
      { id: 'sw-1', title: 'Keychain 10-Pack', priceFrom: 'From $18' },
      { id: 'sw-2', title: 'Nameplates (Team)', priceFrom: 'From $45' },
    ],
  },
];

// "All" virtual category
const ALL_ID = 'all';
const ALL_CATEGORY: CatalogCategory = {
  id: ALL_ID,
  label: 'All',
  coverEmoji: '✨',
  blurb: 'Everything in one place.',
  items: BASE_CATEGORIES.flatMap((c) => c.items),
};
const CATEGORIES_WITH_ALL: CatalogCategory[] = [ALL_CATEGORY, ...BASE_CATEGORIES];

/** =======================
 *  Component (identical layout/behavior to PrintDesign)
 *  ======================= */
export default function BundlesPackages() {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string>(ALL_ID);

  const [itemOpen, setItemOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<CatalogItem | null>(null);

  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement | null>(null);

  // windowed carousel (fixed card size, 3/2/1 responsive)
  const total = BASE_CATEGORIES.length;
  const [startIdx, setStartIdx] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      if (w < 640) setVisibleCount(1);
      else if (w < 1024) setVisibleCount(2);
      else setVisibleCount(3);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  const visibleCats = useMemo(
    () => Array.from({ length: visibleCount }, (_, i) => BASE_CATEGORIES[(startIdx + i) % total]),
    [startIdx, visibleCount, total]
  );

  const next = () => setStartIdx((i) => (i + 1) % total);
  const prev = () => setStartIdx((i) => (i - 1 + total) % total);

  // auto-rotate
  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => setStartIdx((i) => (i + 1) % total), 4200);
    return () => clearInterval(id);
  }, [isPaused, total]);

  const activeCategory = useMemo(
    () => CATEGORIES_WITH_ALL.find((c) => c.id === activeCategoryId) ?? ALL_CATEGORY,
    [activeCategoryId]
  );

  useEffect(() => {
    if (!categoryOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCategoryOpen(false);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [categoryOpen]);

  const openModal = (startId: string = ALL_ID) => {
    setActiveCategoryId(startId);
    setQuery('');
    setCategoryOpen(true);
  };

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = activeCategory.items;
    if (!q) return items;
    return items.filter((it) => it.title.toLowerCase().includes(q));
  }, [query, activeCategory]);

  return (
    <section id="bundles-packages" className="py-16 px-4 sm:px-8 lg:px-16 max-w-[1800px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-[minmax(260px,360px)_1fr] gap-10 items-start">
        {/* Left: Title + CTA (re-uses your animated button styles) */}
        <div className="flex flex-col items-center md:items-start justify-center">
          <h2 className="text-[3rem] leading-tight font-semibold text-[var(--color-foreground)]">
            <span className="block text-center md:text-center">Bundles</span>
            <span className="block text-center md:text-center">&amp; Packages</span>
          </h2>
          <div className="mt-4 flex ml-10 justify-center md:justify-start">
            <button
              type="button"
              onClick={() => openModal(ALL_ID)}
              className="animated-link-2 relative inline-flex items-center justify-center px-4 py-2 rounded-md"
            >
              <span className="relative z-10 text-sm">Browse All</span>
              <i aria-hidden className="animated-link-effect-2">
                <div />
              </i>
            </button>
          </div>
        </div>

        {/* Right: Carousel (same fixed card width) */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <button
            aria-label="Previous"
            onClick={prev}
            onFocus={() => setIsPaused(true)}
            onBlur={() => setIsPaused(false)}
            className="hidden sm:flex absolute -left-10 top-1/2 -translate-y-1/2 z-10
                       bg-[var(--color-background)]/80 border border-[var(--color-foreground)]/20
                       backdrop-blur px-3 py-2 rounded-full hover:bg-[var(--color-background)]"
          >
            ‹
          </button>

          <div className="flex items-stretch justify-center gap-8">
            {visibleCats.map((c, i) => (
              <button
                key={`${c.id}-${(startIdx + i) % total}`}
                onClick={() => openModal(c.id)}
                className="w-[300px] sm:w-[340px] md:w-[380px] lg:w-[400px] rounded-2xl border
                           border-[var(--color-foreground)]/10 bg-[var(--color-foreground)]/5
                           hover:bg-[var(--color-foreground)]/10 transition shadow-md"
              >
                <div className="p-8 h-full flex flex-col items-center text-center">
                  <div className="text-6xl mb-4 select-none">{c.coverEmoji ?? '🧩'}</div>
                  <div className="text-2xl font-semibold">{c.label}</div>
                  {c.blurb && <p className="opacity-70 text-sm mt-3 max-w-[32ch]">{c.blurb}</p>}
                </div>
              </button>
            ))}
          </div>

          <button
            aria-label="Next"
            onClick={next}
            onFocus={() => setIsPaused(true)}
            onBlur={() => setIsPaused(false)}
            className="hidden sm:flex absolute -right-10 top-1/2 -translate-y-1/2 z-10
                       bg-[var(--color-background)]/80 border border-[var(--color-foreground)]/20
                       backdrop-blur px-3 py-2 rounded-full hover:bg-[var(--color-background)]"
          >
            ›
          </button>
        </div>
      </div>

      {/* Modal (tabs + search) */}
      {categoryOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 p-4 md:p-8 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setCategoryOpen(false); }}
          aria-modal="true"
          role="dialog"
        >
          <div className="relative w-full max-w-5xl bg-[var(--color-background)] text-[var(--color-foreground)] rounded-xl shadow-2xl">
            <div className="sticky top-0 z-10 bg-[var(--color-background)]/95 backdrop-blur border-b border-[var(--color-foreground)]/10 px-5 md:px-8 pt-4 pb-3 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="text-2xl select-none">
                  {(CATEGORIES_WITH_ALL.find((c) => c.id === activeCategoryId)?.coverEmoji) ?? '🧩'}
                </div>
                <h3 className="text-2xl font-semibold">
                  {CATEGORIES_WITH_ALL.find((c) => c.id === activeCategoryId)?.label}
                </h3>
                <button onClick={() => setCategoryOpen(false)} className="ml-auto text-2xl hover:opacity-80" aria-label="Close modal">×</button>
              </div>

              <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {[ALL_CATEGORY, ...BASE_CATEGORIES].map((cat) => {
                    const active = cat.id === activeCategoryId;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => { setActiveCategoryId(cat.id); setQuery(''); }}
                        className={`whitespace-nowrap px-3 py-1.5 rounded-full border text-sm transition ${
                          active
                            ? 'bg-[var(--color-foreground)] text-[var(--color-background)] border-[var(--color-foreground)]'
                            : 'bg-[var(--color-foreground)]/5 border-[var(--color-foreground)]/15 hover:bg-[var(--color-foreground)]/10'
                        }`}
                        aria-pressed={active}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

                <div className="md:ml-auto relative">
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search items…"
                    className="w-full md:w-64 rounded-md border border-[var(--color-foreground)]/15 bg-[var(--color-foreground)]/[0.04] focus:bg-transparent outline-none px-9 py-2 text-sm"
                    aria-label="Search items"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60 select-none">🔎</span>
                  {query && (
                    <button
                      onClick={() => { setQuery(''); searchRef.current?.focus(); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-lg opacity-70 hover:opacity-100"
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="px-5 md:px-8 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((it) => (
                <button
                  key={it.id}
                  onClick={() => { setActiveItem(it); setItemOpen(true); }}
                  className="text-left rounded-lg border border-[var(--color-foreground)]/10 bg-[var(--color-foreground)]/[0.04] hover:bg-[var(--color-foreground)]/[0.08] transition shadow-md"
                >
                  <div className="h-40 md:h-48 rounded-t-lg bg-gradient-to-br from-purple-500/40 to-indigo-600/30 relative overflow-hidden" />
                  <div className="p-4">
                    <div className="font-medium">{it.title}</div>
                    {it.priceFrom && <div className="text-sm text-teal-400 mt-1">{it.priceFrom}</div>}
                  </div>
                </button>
              ))}
            </div>

            <div className="px-5 md:px-8 pb-6">
              <p className="text-sm opacity-70">
                Tip: These are examples. We can customize sizing, colors, and materials for your project.
              </p>
            </div>
          </div>

          <ItemModal open={itemOpen} item={activeItem} onClose={() => setItemOpen(false)} />
        </div>
      )}
    </section>
  );
}