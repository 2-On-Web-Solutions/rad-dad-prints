'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ItemModal, { type CatalogItem } from './ItemModal';

/* =======================
   Types
======================= */
type CatalogCategory = {
  id: string;
  label: string;
  coverEmoji?: string;
  blurb?: string;
  items: CatalogItem[];
};

/* =======================
   Data
======================= */
const BASE_CATEGORIES: CatalogCategory[] = [
  {
    id: 'sports',
    label: 'Sports',
    coverEmoji: '🏒',
    blurb: 'Logos, nameplates, team swag, trophy parts.',
    items: [
      {
        id: 'sp-1',
        title: 'Hockey Nameplate (Desk)',
        priceFrom: 'From $15',
        images: ['/assets/prints/nameplate-1.jpg', '/assets/prints/nameplate-2.jpg'],
        files: [
          { label: 'STL', href: '/files/prints/hockey-nameplate.stl', type: 'model/stl' },
          { label: 'OBJ', href: '/files/prints/hockey-nameplate.obj', type: 'model/obj' },
        ],
        blurb: 'Personalized nameplate sized for typical desk displays; color options available.',
      },
      { id: 'sp-2', title: 'Team Keychain Pack (5)', priceFrom: 'From $12', images: ['/assets/prints/keychains-1.jpg'], files: [{ label: 'STL', href: '/files/prints/keychain-pack.stl', type: 'model/stl' }] },
      { id: 'sp-3', title: 'Number Plaque (Wall)', priceFrom: 'From $18', images: ['/assets/prints/number-plaque.jpg'], files: [{ label: 'STL', href: '/files/prints/number-plaque.stl', type: 'model/stl' }], blurb: 'Custom wall-mounted number plaque. Choose digits, size, and color.' },
      { id: 'sp-4', title: 'Coach Whistle Guard', priceFrom: 'From $8', images: ['/assets/prints/whistle-guard.jpg'], files: [{ label: 'STL', href: '/files/prints/whistle-guard.stl', type: 'model/stl' }] },
      { id: 'sp-5', title: 'Puck Stand', priceFrom: 'From $10', images: ['/assets/prints/puck-stand-1.jpg', '/assets/prints/puck-stand-2.jpg'], files: [{ label: 'STL', href: '/files/prints/puck-stand.stl', type: 'model/stl' }] },
    ],
  },
  {
    id: 'toys',
    label: 'Toys',
    coverEmoji: '🧸',
    blurb: 'Articulated figures, puzzles, fidgets.',
    items: [
      { id: 'to-1', title: 'Articulated Dragon', priceFrom: 'From $20', images: ['/assets/prints/dragon-1.jpg', '/assets/prints/dragon-2.jpg'], files: [{ label: 'STL', href: '/files/prints/dragon.stl', type: 'model/stl' }], blurb: 'Poseable desk dragon with segmented body.' },
      { id: 'to-2', title: 'Puzzle Cube', priceFrom: 'From $12' },
      { id: 'to-3', title: 'Fidget Chain', priceFrom: 'From $7' },
      { id: 'to-4', title: 'Mini Race Car', priceFrom: 'From $9' },
      { id: 'to-5', title: 'Marble Maze', priceFrom: 'From $14' },
    ],
  },
  {
    id: 'models',
    label: 'Models',
    coverEmoji: '🏛️',
    blurb: 'Miniatures, props, and display stands.',
    items: [
      { id: 'mo-1', title: 'Tabletop Mini (28mm)', priceFrom: 'From $8' },
      { id: 'mo-2', title: 'Prop Stand / Base', priceFrom: 'From $10' },
      { id: 'mo-3', title: 'Terrain Scatter Pack', priceFrom: 'From $18' },
      { id: 'mo-4', title: 'Helmet Display Stand', priceFrom: 'From $22' },
      { id: 'mo-5', title: 'Scale Railing Set', priceFrom: 'From $16' },
    ],
  },
  { id: 'home', label: 'Home', coverEmoji: '🏠', blurb: 'Hooks, organizers, name plates.', items: [{ id: 'ho-1', title: 'Cable Clip', priceFrom: 'From $3' }] },
  { id: 'gadgets', label: 'Gadgets', coverEmoji: '🔧', blurb: 'Phone stands, mounts, helpers.', items: [{ id: 'ga-1', title: 'Phone Stand', priceFrom: 'From $5' }] },
  { id: 'cosplay', label: 'Cosplay', coverEmoji: '🛡️', blurb: 'Props, armor bits, badges.', items: [{ id: 'co-1', title: 'Emblem Badge', priceFrom: 'From $8' }] },
  { id: 'education', label: 'Education', coverEmoji: '🎓', blurb: 'Classroom aids, models.', items: [{ id: 'ed-1', title: 'Math Shapes Set', priceFrom: 'From $12' }] },
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

/* =======================
   Component
======================= */
export default function PrintDesign() {
  // modal controls
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string>(ALL_ID);

  const [itemOpen, setItemOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<CatalogItem | null>(null);

  // search
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement | null>(null);

  // ====== WINDOWED CAROUSEL STATE ======
  const total = BASE_CATEGORIES.length;
  const [startIdx, setStartIdx] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3); // 3 desktop, 2 tablet, 1 mobile

  // NEW: auto-rotate pause flag
  const [isPaused, setIsPaused] = useState(false);

  // responsive visible count (prevents overflow)
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

  // visible window
  const visibleCats = useMemo(
    () => Array.from({ length: visibleCount }, (_, i) => BASE_CATEGORIES[(startIdx + i) % total]),
    [startIdx, visibleCount, total]
  );

  const next = () => setStartIdx((i) => (i + 1) % total);
  const prev = () => setStartIdx((i) => (i - 1 + total) % total);

  // NEW: auto-rotate (pauses on hover/focus)
  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => setStartIdx((i) => (i + 1) % total), 4200);
    return () => clearInterval(id);
  }, [isPaused, total]);

  // derived active category for modal grid
  const activeCategory = useMemo(
    () => CATEGORIES_WITH_ALL.find((c) => c.id === activeCategoryId) ?? ALL_CATEGORY,
    [activeCategoryId]
  );

  // ESC / Cmd+F in modal
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
    <section id="print-designs" className="py-16 px-4 sm:px-8 lg:px-16 max-w-[1800px] mx-auto">
      {/* Left title + button | Right carousel */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(260px,360px)_1fr] gap-10 items-start">
        {/* Left: headline + animated button */}
        <div className="flex flex-col items-center md:items-start justify-center">
          <h2 className="text-[3rem] leading-tight font-semibold text-[var(--color-foreground)]">
            <span className="block text-center md:text-center">Print</span>
            <span className="block text-center md:text-center">Designs</span>
          </h2>
          <div className="mt-4 flex ml-2 justify-center md:justify-start">
            <button
              type="button"
              onClick={() => openModal(ALL_ID)}
              className="animated-link-2 relative inline-flex items-center justify-center px-4 py-2 rounded-md"
            >
              <span className="relative z-10 text-sm">Browse All</span>
              <i aria-hidden className="animated-link-effect-2"><div /></i>
            </button>
          </div>
        </div>

        {/* Right: WINDOWED CAROUSEL (no overflow) */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Arrows outside */}
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
                className="
                  w-[400px] min-w-[400px] max-w-[400px]  /* FIXED WIDTH */
                  shrink-0 grow-0
                  rounded-2xl border border-[var(--color-foreground)]/10
                  bg-[var(--color-foreground)]/5 hover:bg-[var(--color-foreground)]/10
                  transition shadow-md
                "
              >
                <div className="p-8 h-full min-h-[240px] flex flex-col items-center text-center">
                  {/* icon row (fixed height) */}
                  <div className="mb-4 text-6xl leading-none h-[56px] flex items-center justify-center select-none">
                    {c.coverEmoji ?? '🧩'}
                  </div>

                  {/* title row (fixed height) */}
                  <div className="text-2xl font-semibold h-[32px] flex items-center justify-center">
                    {c.label}
                  </div>

                  {/* blurb row (fixed height + clamp) */}
                  <p
                    className="opacity-70 text-sm mt-3 max-w-[32ch] h-[40px]"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {c.blurb}
                  </p>
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

      {/* Category Modal (tabs + search) */}
      {categoryOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 p-4 md:p-8 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setCategoryOpen(false); }}
          aria-modal="true"
          role="dialog"
        >
          <div className="relative w-full max-w-5xl bg-[var(--color-background)] text-[var(--color-foreground)] rounded-xl shadow-2xl">
            {/* Header */}
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

              {/* Tabs + Search */}
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

            {/* Grid (filtered) */}
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
              {!filteredItems.length && (
                <div className="col-span-full opacity-70 text-sm">
                  No matches for “{query}”. Try a different term or switch tabs above.
                </div>
              )}
            </div>

            <div className="px-5 md:px-8 pb-6">
              <p className="text-sm opacity-70">
                Tip: These are examples. We can customize sizing, colors, and materials for your project.
              </p>
            </div>
          </div>

          {/* Nested Item Modal */}
          <ItemModal open={itemOpen} item={activeItem} onClose={() => setItemOpen(false)} />
        </div>
      )}
    </section>
  );
}