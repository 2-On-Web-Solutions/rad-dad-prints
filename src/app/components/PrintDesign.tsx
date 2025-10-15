'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import ItemModal, { type CatalogItem } from './ItemModal';
import {
  Trophy, ToyBrick, Landmark, Home, Wrench, Shield, GraduationCap,
  Sparkles, Box, ChevronLeft, ChevronRight,
} from 'lucide-react';

type CatalogCategory = {
  id: string;
  label: string;
  icon?: ReactNode;
  blurb?: string;
  items: CatalogItem[];
};

const BASE_CATEGORIES: CatalogCategory[] = [
  {
    id: 'sports',
    label: 'Sports',
    icon: <Trophy className="w-14 h-14" />,
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
    icon: <ToyBrick className="w-14 h-14" />,
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
    icon: <Landmark className="w-14 h-14" />,
    blurb: 'Miniatures, props, and display stands.',
    items: [
      { id: 'mo-1', title: 'Tabletop Mini (28mm)', priceFrom: 'From $8' },
      { id: 'mo-2', title: 'Prop Stand / Base', priceFrom: 'From $10' },
      { id: 'mo-3', title: 'Terrain Scatter Pack', priceFrom: 'From $18' },
      { id: 'mo-4', title: 'Helmet Display Stand', priceFrom: 'From $22' },
      { id: 'mo-5', title: 'Scale Railing Set', priceFrom: 'From $16' },
    ],
  },
  { id: 'home', label: 'Home', icon: <Home className="w-14 h-14" />, blurb: 'Hooks, organizers, name plates.', items: [{ id: 'ho-1', title: 'Cable Clip', priceFrom: 'From $3' }] },
  { id: 'gadgets', label: 'Gadgets', icon: <Wrench className="w-14 h-14" />, blurb: 'Phone stands, mounts, helpers.', items: [{ id: 'ga-1', title: 'Phone Stand', priceFrom: 'From $5' }] },
  { id: 'cosplay', label: 'Cosplay', icon: <Shield className="w-14 h-14" />, blurb: 'Props, armor bits, badges.', items: [{ id: 'co-1', title: 'Emblem Badge', priceFrom: 'From $8' }] },
  { id: 'education', label: 'Education', icon: <GraduationCap className="w-14 h-14" />, blurb: 'Classroom aids, models.', items: [{ id: 'ed-1', title: 'Math Shapes Set', priceFrom: 'From $12' }] },
];

const ALL_ID = 'all';
const ALL_CATEGORY: CatalogCategory = {
  id: ALL_ID,
  label: 'All',
  icon: <Sparkles className="w-14 h-14" />,
  blurb: 'Everything in one place.',
  items: BASE_CATEGORIES.flatMap((c) => c.items),
};
const CATEGORIES_WITH_ALL: CatalogCategory[] = [ALL_CATEGORY, ...BASE_CATEGORIES];

export default function PrintDesign() {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string>(ALL_ID);

  const [itemOpen, setItemOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<CatalogItem | null>(null);

  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement | null>(null);

  const total = BASE_CATEGORIES.length;
  const [visibleCount, setVisibleCount] = useState(3);
  const [geom, setGeom] = useState({ cardW: 400, gap: 32, glow: 20 });
  const [isPaused, setIsPaused] = useState(false);

  const loop = useMemo(() => [...BASE_CATEGORIES, ...BASE_CATEGORIES, ...BASE_CATEGORIES], []);
  const [slideIdx, setSlideIdx] = useState(total);
  const [noAnim, setNoAnim] = useState(false);

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      if (w < 640) {
        setVisibleCount(1);
        setGeom({ cardW: 260, gap: 16, glow: 12 });
      } else if (w < 1024) {
        setVisibleCount(2);
        setGeom({ cardW: 320, gap: 24, glow: 16 });
      } else {
        setVisibleCount(3);
        setGeom({ cardW: 400, gap: 32, glow: 20 });
      }
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => setSlideIdx((i) => i + 1), 4200);
    return () => clearInterval(id);
  }, [isPaused]);

  useEffect(() => {
    if (slideIdx >= 2 * total) { setNoAnim(true); setSlideIdx((i) => i - total); }
    else if (slideIdx < total) { setNoAnim(true); setSlideIdx((i) => i + total); }
  }, [slideIdx, total]);

  useEffect(() => {
    if (!noAnim) return;
    const id = requestAnimationFrame(() => setNoAnim(false));
    return () => cancelAnimationFrame(id);
  }, [noAnim]);

  const next = () => setSlideIdx((i) => i + 1);
  const prev = () => setSlideIdx((i) => i - 1);

  const activeCategory = useMemo(
    () => CATEGORIES_WITH_ALL.find((c) => c.id === activeCategoryId) ?? ALL_CATEGORY,
    [activeCategoryId]
  );

  useEffect(() => {
    if (!categoryOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCategoryOpen(false);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault(); searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [categoryOpen]);

  useEffect(() => {
    document.body.style.overflow = categoryOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [categoryOpen]);

  const openModal = (startId: string = ALL_ID) => {
    setActiveCategoryId(startId);
    setQuery('');
    setPage(1);
    setCategoryOpen(true);
  };

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = activeCategory.items;
    if (!q) return items;
    return items.filter((it) => it.title.toLowerCase().includes(q));
  }, [query, activeCategory]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  useEffect(() => { setPage(1); }, [query, activeCategoryId]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, filteredItems.length);
  const pagedItems = filteredItems.slice(start, end);
  const go = (p: number) => setPage(Math.min(Math.max(1, p), pageCount));

  const viewportPx = visibleCount * geom.cardW + (visibleCount - 1) * geom.gap;
  const STEP = geom.cardW + geom.gap;
  const x = -slideIdx * STEP;

  return (
    <section id="print-designs" className="ipm-print-scope py-16 px-4 sm:px-8 lg:px-16 max-w-[1800px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-[minmax(260px,360px)_1fr] ipm-stack gap-10 items-start">
        {/* Header */}
        <div className="ipm-header flex flex-col items-center md:items-start justify-center">
          <h2 className="font-extrabold leading-[1.15] tracking-[-0.02em] text-[clamp(1.75rem,3.5vw+0.5rem,3rem)] text-[var(--color-foreground)]">
            <span className="block text-center">Print</span>
            <span className="block text-center">Designs</span>
          </h2>
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() => openModal(ALL_ID)}
              className="animated-link relative inline-flex items-center justify-center px-4 py-2 rounded-md"
            >
              <span className="relative z-10 text-sm">Browse All</span>
              <i aria-hidden className="animated-link-effect"><div /></i>
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative overflow-visible" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
          <div className="ipm-frame relative mx-auto" style={{ width: viewportPx + geom.glow * 2 }}>
            {/* Prev */}
            <button
              aria-label="Previous"
              onClick={prev}
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
              className="ipm-prev flex absolute left-1 sm:-left-10 top-1/2 -translate-y-1/2 z-10
                         bg-[var(--color-background)]/80 border border-[var(--color-foreground)]/20
                         backdrop-blur p-1.5 sm:p-2 rounded-full hover:bg-[var(--color-background)] transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Viewport */}
            <div
              className="rdp-edge-mask overflow-x-hidden overflow-y-visible mx-auto pt-1 pb-6"
              style={{ width: viewportPx + geom.glow * 2, padding: `0 ${geom.glow}px` }}
            >
              <div
                className="flex items-stretch relative z-0"
                style={{
                  gap: `${geom.gap}px`,
                  transform: `translateX(${x}px)`,
                  transition: noAnim ? 'none' : 'transform 450ms ease-in-out',
                  willChange: 'transform',
                  width: 'max-content',
                }}
              >
                {loop.map((c, i) => (
                  <button
                    key={`${c.id}-${i}`}
                    type="button"
                    onClickCapture={(e) => { e.stopPropagation(); openModal(c.id); }}
                    className="relative z-20 pointer-events-auto shrink-0 grow-0 rounded-none
                               border border-[var(--color-foreground)]/15
                               bg-[var(--color-foreground)]/5 hover:bg-[var(--color-foreground)]/10
                               transition card-glow"
                    style={{ width: geom.cardW, minWidth: geom.cardW, maxWidth: geom.cardW, WebkitTapHighlightColor: 'transparent' }}
                  >
                    <div className="p-4 sm:p-6 md:p-8 h-full min-h-[200px] sm:min-h-[220px] md:min-h-[240px] flex flex-col items-center text-center">
                      <div className="mb-3 sm:mb-4 h-[44px] sm:h-[56px] flex items-center justify-center select-none text-brand-500
                                      [&_svg]:w-10 [&_svg]:h-10 sm:[&_svg]:w-12 sm:[&_svg]:h-12 md:[&_svg]:w-14 md:[&_svg]:h-14">
                        {c.icon ?? <Box className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14" />}
                      </div>
                      <div className="text-lg sm:text-xl md:text-2xl font-semibold h-[28px] sm:h-[32px] flex items-center justify-center">
                        {c.label}
                      </div>
                      {c.blurb && (
                        <p className="opacity-70 text-xs sm:text-sm mt-2 sm:mt-3 max-w-[32ch] h-[36px] sm:h-[40px]"
                           style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {c.blurb}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Next */}
            <button
              aria-label="Next"
              onClick={next}
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
              className="ipm-next flex absolute right-1 sm:-right-10 top-1/2 -translate-y-1/2 z-10
                         bg-[var(--color-background)]/80 border border-[var(--color-foreground)]/20
                         backdrop-blur p-1.5 sm:p-2 rounded-full hover:bg-[var(--color-background)] transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ===== Category Modal (RESTORED) ===== */}
      {categoryOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 p-4 md:p-8"
          onClick={(e) => { if (e.target === e.currentTarget) setCategoryOpen(false); }}
          aria-modal="true" role="dialog"
        >
          <div className="relative w-full max-w-5xl bg-[var(--color-background)] text-[var(--color-foreground)] rounded-xl shadow-2xl
                          flex flex-col overflow-hidden h-[80vh] md:h-[85vh] min-h-[560px]">
            {/* Header (sticky) */}
            <div className="sticky top-0 z-10 bg-[var(--color-background)]/95 backdrop-blur border-b border-[var(--color-foreground)]/10 px-5 md:px-8 pt-4 pb-3 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="text-2xl select-none">
                  {CATEGORIES_WITH_ALL.find((c) => c.id === activeCategoryId)?.icon ?? <Box className="w-6 h-6" />}
                </div>
                <h3 className="text-2xl font-semibold">
                  {CATEGORIES_WITH_ALL.find((c) => c.id === activeCategoryId)?.label}
                </h3>
                <button onClick={() => setCategoryOpen(false)} className="ml-auto text-2xl hover:opacity-80" aria-label="Close modal">
                  ×
                </button>
              </div>

              {/* Tabs + Search */}
              <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {[ALL_CATEGORY, ...BASE_CATEGORIES].map((cat) => {
                    const active = cat.id === activeCategoryId;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => { setActiveCategoryId(cat.id); setQuery(''); setPage(1); }}
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

            {/* Scrollable body (grid + footer + pagination) */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
              {/* Grid (filtered & paged) */}
              <div className="px-5 md:px-8 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pagedItems.map((it) => (
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

              {/* Pagination + page-size */}
              {!!filteredItems.length && (
                <div className="px-5 md:px-8 pb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm opacity-70">
                    Showing <span className="font-medium">{filteredItems.length ? start + 1 : 0}</span>–
                    <span className="font-medium">{end}</span> of <span className="font-medium">{filteredItems.length}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-sm opacity-80">
                      Per page:{' '}
                      <select
                        className="ml-1 rounded-md border border-[var(--color-foreground)]/20 bg-transparent px-2 py-1 text-sm"
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                      >
                        {[6, 9, 12, 18].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </label>

                    <div className="flex items-center gap-1">
                      <button
                        className="px-2 py-1 rounded border border-[var(--color-foreground)]/20 disabled:opacity-40 inline-flex items-center gap-1"
                        onClick={() => go(page - 1)}
                        disabled={page <= 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Prev</span>
                      </button>

                      {Array.from({ length: pageCount }).slice(0, 7).map((_, i) => {
                        let n = i + 1;
                        if (pageCount > 7) {
                          const window = [1, 2, page - 1, page, page + 1, pageCount - 1, pageCount]
                            .filter((x, idx, arr) => x >= 1 && x <= pageCount && arr.indexOf(x) === idx)
                            .sort((a, b) => a - b);
                          n = window[i] ?? 0;
                          if (!n) return null;
                        }
                        const active = n === page;
                        return (
                          <button
                            key={`p-${n}`}
                            onClick={() => go(n)}
                            className={`px-2.5 py-1 rounded border text-sm ${
                              active
                                ? 'bg-[var(--color-foreground)] text-[var(--color-background)] border-[var(--color-foreground)]'
                                : 'border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10'
                            }`}
                          >
                            {n}
                          </button>
                        );
                      })}

                      <button
                        className="px-2 py-1 rounded border border-[var(--color-foreground)]/20 disabled:opacity-40 inline-flex items-center gap-1"
                        onClick={() => go(page + 1)}
                        disabled={page >= pageCount}
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer tip */}
              <div className="px-5 md:px-8 pb-6">
                <p className="text-sm opacity-70">
                  Tip: These are examples. We can customize sizing, colors, and materials for your project.
                </p>
              </div>
            </div>
          </div>

          {/* Nested Item Modal inside the category modal */}
          <ItemModal open={itemOpen} item={activeItem} onClose={() => setItemOpen(false)} />
        </div>
      )}
    </section>
  );
}