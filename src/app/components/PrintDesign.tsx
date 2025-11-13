'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Trophy,
  ToyBrick,
  Landmark,
  Home as HomeIcon,
  Wrench,
  Shield,
  GraduationCap,
  Sparkles,
  Box,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import DesignsModal from './shop/DesignsModal';

type PublicCategory = {
  id: string;           // slug
  label: string;
  sort_order: number;
  blurb?: string | null;
  icon_slug?: string | null;
  count: number;
};

const ALL_ID = 'all';

const categoryIcon = (slug?: string) => {
  switch (slug) {
    case 'sports': return <Trophy className="w-14 h-14" />;
    case 'toys': return <ToyBrick className="w-14 h-14" />;
    case 'models': return <Landmark className="w-14 h-14" />;
    case 'home': return <HomeIcon className="w-14 h-14" />;
    case 'gadgets': return <Wrench className="w-14 h-14" />;
    case 'cosplay': return <Shield className="w-14 h-14" />;
    case 'education': return <GraduationCap className="w-14 h-14" />;
    case 'all': return <Sparkles className="w-14 h-14" />;
    default: return <Box className="w-14 h-14" />;
  }
};

export default function PrintDesign() {
  // modal state
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string>(ALL_ID);

  // categories from API
  const [cats, setCats] = useState<PublicCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingCats(true);
      try {
        const res = await fetch('/api/public/design-categories', { cache: 'no-store' });
        const data = await res.json();

        if (cancelled) return;

        const list: PublicCategory[] = [
          {
            id: ALL_ID,
            label: 'All',
            sort_order: -1,
            blurb: 'Everything in one place.',
            icon_slug: 'all',
            count: data?.total ?? 0,
          },
          ...(data?.categories ?? []),
        ];
        setCats(list);
      } catch {
        // fail silently for now
      } finally {
        if (!cancelled) setLoadingCats(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // carousel sizing + arrows
  const [visibleCount, setVisibleCount] = useState(3);
  const [geom, setGeom] = useState({ cardW: 400, gap: 32, glow: 20 });
  const [arrow, setArrow] = useState({ left: -10, right: -10 });

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const landscape = w > h;

      // iPad mini LANDSCAPE (≈1024×768)
      const isIpadMiniLandscape =
        landscape && w >= 990 && w <= 1060 && h >= 700 && h <= 820;

      // iPad Pro PORTRAIT (≈1024×1366)
      const isIpadProPortrait =
        !landscape && w >= 1000 && w <= 1130 && h >= 1280 && h <= 1400;

      if (isIpadMiniLandscape) {
        setVisibleCount(3);
        setGeom({ cardW: 300, gap: 16, glow: 16 });
        setArrow({ left: -128, right: 12 });
        return;
      }

      if (isIpadProPortrait) {
        setVisibleCount(3);
        setGeom({ cardW: 360, gap: 24, glow: 18 });
        setArrow({ left: -114, right: -114 });
        return;
      }

      if (w < 640) {
        setVisibleCount(1);
        setGeom({ cardW: 260, gap: 16, glow: 12 });
        setArrow({ left: -10, right: -10 });
      } else if (w < 1024) {
        setVisibleCount(2);
        setGeom({ cardW: 320, gap: 24, glow: 16 });
        setArrow({ left: -10, right: -10 });
      } else {
        setVisibleCount(3);
        setGeom({ cardW: 400, gap: 32, glow: 20 });
        setArrow({ left: -10, right: -10 });
      }
    };

    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('orientationchange', compute);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('orientationchange', compute);
    };
  }, []);

  // carousel data
  const baseCats = useMemo(
    () => cats.filter((c) => c.id !== ALL_ID),
    [cats]
  );
  const total = baseCats.length || 1; // guard against 0
  const loop = useMemo(
    () => [...baseCats, ...baseCats, ...baseCats],
    [baseCats]
  );

  // autoplay + seamless loop
  const [isPaused, setIsPaused] = useState(false);
  const [slideIdx, setSlideIdx] = useState(total);
  const [noAnim, setNoAnim] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => setSlideIdx((i) => i + 1), 4200);
    return () => clearInterval(id);
  }, [isPaused]);

  useEffect(() => {
    if (!total) return;
    if (slideIdx >= 2 * total) {
      setNoAnim(true);
      setSlideIdx((i) => i - total);
    } else if (slideIdx < total) {
      setNoAnim(true);
      setSlideIdx((i) => i + total);
    }
  }, [slideIdx, total]);

  useEffect(() => {
    if (!noAnim) return;
    const id = requestAnimationFrame(() => setNoAnim(false));
    return () => cancelAnimationFrame(id);
  }, [noAnim]);

  const next = () => setSlideIdx((i) => i + 1);
  const prev = () => setSlideIdx((i) => i - 1);

  const openModal = (startId: string = ALL_ID) => {
    setActiveCategoryId(startId);
    setCategoryOpen(true);
    document.body.style.overflow = 'hidden';
  };

  useEffect(() => {
    if (!categoryOpen) document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [categoryOpen]);

  // geometry transforms
  const viewportPx = visibleCount * geom.cardW + (visibleCount - 1) * geom.gap;
  const STEP = geom.cardW + geom.gap;
  const x = -slideIdx * STEP;

  return (
    <section
      id="print-designs"
      className="ipm-print-scope py-16 px-4 sm:px-8 lg:px-6 xl:px-12 2xl:px-16 max-w-[1800px] mx-auto"
    >
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
        <div
          className="relative overflow-visible"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="ipm-frame relative mx-auto" style={{ width: viewportPx + geom.glow * 2 }}>
            {/* Prev */}
            <button
              aria-label="Previous"
              onClick={prev}
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
              className="ipm-prev flex absolute top-1/2 -translate-y-1/2 z-10
                         bg-[var(--color-background)]/80 border border-[var(--color-foreground)]/20
                         backdrop-blur p-1.5 sm:p-2 rounded-full hover:bg-[var(--color-background)] transition"
              style={{ left: `${arrow.left}px` }}
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
                {(loadingCats ? Array.from({ length: 6 }) : loop).map((c, i) => (
                  <button
                    key={loadingCats ? `sk-${i}` : `${(c as PublicCategory).id}-${i}`}
                    type="button"
                    onClickCapture={(e) => {
                      e.stopPropagation();
                      if (!loadingCats) openModal((c as PublicCategory).id);
                    }}
                    className="relative z-20 pointer-events-auto shrink-0 grow-0 rounded-none
                               border border-[var(--color-foreground)]/15
                               bg-[var(--color-foreground)]/5 hover:bg-[var(--color-foreground)]/10
                               transition card-glow"
                    style={{
                      width: geom.cardW,
                      minWidth: geom.cardW,
                      maxWidth: geom.cardW,
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <div className="p-4 sm:p-6 md:p-8 h-full min-h-[200px] sm:min-h-[220px] md:min-h-[240px] flex flex-col items-center text-center">
                      {loadingCats ? (
                        <>
                          <div className="mb-3 sm:mb-4 h-[56px] w-[56px] rounded-lg bg-white/5 animate-pulse" />
                          <div className="h-6 w-32 rounded bg-white/5 animate-pulse" />
                          <div className="mt-3 h-10 w-40 rounded bg-white/5 animate-pulse" />
                        </>
                      ) : (
                        <>
                          <div className="mb-3 sm:mb-4 h-[44px] sm:h-[56px] flex items-center justify-center select-none text-brand-500
                                          [&_svg]:w-10 [&_svg]:h-10 sm:[&_svg]:w-12 sm:[&_svg]:h-12 md:[&_svg]:w-14 md:[&_svg]:h-14">
                            {categoryIcon((c as PublicCategory).icon_slug || (c as PublicCategory).id)}
                          </div>
                          <div className="text-lg sm:text-xl md:text-2xl font-semibold h-[28px] sm:h-[32px] flex items-center justify-center">
                            {(c as PublicCategory).label}
                          </div>
                          {(c as PublicCategory).blurb && (
                            <p
                              className="opacity-70 text-xs sm:text-sm mt-2 sm:mt-3 max-w-[32ch] h-[36px] sm:h-[40px]"
                              style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                            >
                              {(c as PublicCategory).blurb as string}
                            </p>
                          )}
                        </>
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
              className="ipm-next flex absolute top-1/2 -translate-y-1/2 z-10
                         bg-[var(--color-background)]/80 border border-[var(--color-foreground)]/20
                         backdrop-blur p-1.5 sm:p-2 rounded-full hover:bg-[var(--color-background)] transition"
              style={{ right: `${arrow.right}px` }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Designs modal (reads items/images/files from API) */}
      {categoryOpen && (
        <DesignsModal
          open={categoryOpen}
          initialCategory={activeCategoryId}
          onClose={() => setCategoryOpen(false)}
        />
      )}
    </section>
  );
}