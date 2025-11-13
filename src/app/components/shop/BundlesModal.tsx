'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Trophy, ToyBrick, Landmark, Home as HomeIcon, Wrench, Shield, GraduationCap,
  Sparkles, Box, ChevronLeft, ChevronRight, Grid as GridIcon, Columns as CardsIcon, X,
} from 'lucide-react';
import DesignItemModal, { type CatalogItem } from '../DesignItemModal';

/* =========================
   Types from public API
   ========================= */
type PublicCategory = {
  id: string;          // slug
  label: string;
  sort_order: number;
  count: number;
};

type PublicBundleLite = {
  id: string;
  title: string;
  blurb?: string | null;
  price_from?: string | null;   // display price (preferred if present)
  price_total?: string | null;  // fallback
  thumb_url?: string | null;
  category_id: string;
};

type PublicBundleFull = {
  id: string;
  title: string;
  blurb?: string | null;
  price_from?: string | null;
  price_total?: string | null;
  thumb_url?: string | null;
  category_id: string;
  images?: { url: string }[];
  files?: { label: string; file_url: string; mime_type?: string }[];
};

export default function BundlesModal({
  open,
  initialCategory = 'all',
  onClose,
}: {
  open: boolean;
  initialCategory?: string;
  onClose: () => void;
}) {
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [activeCat, setActiveCat] = useState<string>(initialCategory);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement | null>(null);

  const [view, setView] = useState<'grid' | 'cards'>('grid');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(12);

  const [loadingCats, setLoadingCats] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<PublicBundleLite[]>([]);

  const [itemOpen, setItemOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<CatalogItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // sync when opening
  useEffect(() => {
    if (!open) return;
    setActiveCat(initialCategory || 'all');
    setQuery('');
    setPage(1);
  }, [open, initialCategory]);

  // lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // esc + ctrl/cmd+f
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  async function safeJson(res: Response) {
    const txt = await res.text();
    if (!txt) return {};
    try { return JSON.parse(txt); } catch {
      console.error('Bad JSON from API:', txt);
      return {};
    }
  }

  /* ===== Categories ===== */
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      setLoadingCats(true);
      try {
        const res = await fetch('/api/public/bundle-categories', { cache: 'no-store' });
        const data = await safeJson(res);
        if (cancelled) return;
        const list: PublicCategory[] = Array.isArray((data as any).categories) ? (data as any).categories : [];
        const totalCount =
          typeof (data as any).total === 'number'
            ? (data as any).total
            : list.reduce((a, c) => a + (c.count || 0), 0);
        setCategories([{ id: 'all', label: 'All', sort_order: -1, count: totalCount }, ...list]);
      } catch (e) {
        console.error('bundle categories load error', e);
      } finally {
        if (!cancelled) setLoadingCats(false);
      }
    })();

    return () => { cancelled = true; };
  }, [open]);

  /* ===== List (bundles) ===== */
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      setLoadingItems(true);
      try {
        const sp = new URLSearchParams();
        if (activeCat && activeCat !== 'all') sp.set('category', activeCat);
        if (query.trim()) sp.set('q', query.trim());
        sp.set('page', String(page));
        sp.set('pageSize', String(pageSize));

        const url = `/api/public/bundles${sp.toString() ? `?${sp.toString()}` : ''}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          console.error('Bundles API error', res.status, txt);
          if (!cancelled) { setItems([]); setTotal(0); }
          return;
        }

        const data = await safeJson(res) as any;
        if (cancelled) return;
        setItems(Array.isArray(data.items) ? data.items : []);
        setTotal(typeof data.total === 'number' ? data.total : (data.items?.length ?? 0));
      } catch (e) {
        console.error('bundles load error', e);
        if (!cancelled) { setItems([]); setTotal(0); }
      } finally {
        if (!cancelled) setLoadingItems(false);
      }
    })();

    return () => { cancelled = true; };
  }, [open, activeCat, query, page, pageSize]);

  // reset page on filters
  useEffect(() => { setPage(1); }, [activeCat, query]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const go = (p: number) => setPage(Math.min(Math.max(1, p), pageCount));

  /* ===== Detail (single bundle) ===== */
  async function openDetail(id: string) {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/public/bundles/${id}`, { cache: 'no-store' });
      if (!res.ok) {
        console.error('bundle detail api error', res.status);
        return;
      }
      const d = await safeJson(res) as PublicBundleFull;

      const raw = (d.images?.map(i => i.url) ?? []);
      const merged = [
        ...(d.thumb_url ? [d.thumb_url] : []),
        ...raw,
      ].filter((u, i, arr) => u && arr.indexOf(u) === i);

      const mapped: CatalogItem = {
        id: d.id,
        title: d.title,
        priceFrom: d.price_from || d.price_total || '',
        images: merged,
        files: (d.files ?? []).map(f => ({
          label: f.label || 'Download',
          href: f.file_url,
          type: f.mime_type || '',
        })),
        blurb: d.blurb || '',
      };

      setActiveItem(mapped);
      setItemOpen(true);
    } catch (e) {
      console.error('bundle detail load error', e);
    } finally {
      setLoadingDetail(false);
    }
  }

  const iconFor = (slug: string | undefined) => {
    switch (slug) {
      case 'sports': return <Trophy className="w-5 h-5" />;
      case 'toys': return <ToyBrick className="w-5 h-5" />;
      case 'models': return <Landmark className="w-5 h-5" />;
      case 'home': return <HomeIcon className="w-5 h-5" />;
      case 'gadgets': return <Wrench className="w-5 h-5" />;
      case 'cosplay': return <Shield className="w-5 h-5" />;
      case 'education': return <GraduationCap className="w-5 h-5" />;
      case 'all': return <Sparkles className="w-5 h-5" />;
      default: return <Box className="w-5 h-5" />;
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 p-4 md:p-8"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-modal="true"
      role="dialog"
    >
      <div className="relative w-full max-w-6xl bg-[var(--color-background)] text-[var(--color-foreground)] rounded-xl shadow-2xl
                      flex flex-col overflow-hidden h-[82vh] md:h-[86vh] min-h-[560px]">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--color-background)]/95 backdrop-blur border-b border-[var(--color-foreground)]/10 px-5 md:px-8 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="text-xl select-none">{iconFor(activeCat)}</div>
            <h3 className="text-xl md:text-2xl font-semibold">
              {categories.find((c) => c.id === activeCat)?.label ?? 'All'}
            </h3>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setView('grid')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm transition
                  ${view === 'grid'
                    ? 'bg-[var(--color-foreground)] text-[var(--color-background)] border-[var(--color-foreground)]'
                    : 'bg-[var(--color-foreground)]/5 border-[var(--color-foreground)]/15 hover:bg-[var(--color-foreground)]/10'}`}
                title="Grid (compact)"
              >
                <GridIcon className="w-4 h-4" /> Grid
              </button>
              <button
                onClick={() => setView('cards')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm transition
                  ${view === 'cards'
                    ? 'bg-[var(--color-foreground)] text-[var(--color-background)] border-[var(--color-foreground)]'
                    : 'bg-[var(--color-foreground)]/5 border-[var(--color-foreground)]/15 hover:bg-[var(--color-foreground)]/10'}`}
                title="Cards (roomier)"
              >
                <CardsIcon className="w-4 h-4" /> Cards
              </button>

              <button
                onClick={onClose}
                className="ml-2 p-2 rounded-md border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
            {/* Category chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {categories.map((cat) => {
                const active = cat.id === activeCat;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveCat(cat.id); setQuery(''); setPage(1); }}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-full border text-sm transition inline-flex items-center gap-1
                      ${active
                        ? 'bg-[var(--color-foreground)] text-[var(--color-background)] border-[var(--color-foreground)]'
                        : 'bg-[var(--color-foreground)]/5 border-[var(--color-foreground)]/15 hover:bg-[var(--color-foreground)]/10'}`}
                    aria-pressed={active}
                    title={`${cat.label}${cat.id === 'all' ? '' : ` • ${cat.count}`}`}
                  >
                    {iconFor(cat.id)} <span>{cat.label}</span>
                    {cat.id !== 'all' && <span className="opacity-70">({cat.count})</span>}
                  </button>
                );
              })}
              {loadingCats && <span className="opacity-60 text-sm px-2">Loading…</span>}
            </div>

            {/* Search */}
            <div className="md:ml-auto relative">
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search bundles…"
                className="w-full md:w-72 rounded-md border border-[var(--color-foreground)]/15 bg-[var(--color-foreground)]/[0.04] focus:bg-transparent outline-none px-9 py-2 text-sm"
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
          <div
            className={`px-5 md:px-8 py-6 grid gap-6
              ${view === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}
          >
            {loadingItems && Array.from({ length: pageSize }).map((_, i) => (
              <div key={`shimmer-${i}`} className="animate-pulse rounded-lg border border-[var(--color-foreground)]/10 bg-[var(--color-foreground)]/[0.04]">
                <div className="h-40 md:h-44 bg-[var(--color-foreground)]/10 rounded-t-lg" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 bg-[var(--color-foreground)]/10 rounded" />
                  <div className="h-3 w-1/3 bg-[var(--color-foreground)]/10 rounded" />
                </div>
              </div>
            ))}

            {!loadingItems && items.map((it) => {
              const price = it.price_from || it.price_total || '';
              return (
                <button
                  key={it.id}
                  onClick={() => openDetail(it.id)}
                  className={`text-left rounded-lg border border-[var(--color-foreground)]/10
                    ${view === 'grid'
                      ? 'bg-[var(--color-foreground)]/[0.04] hover:bg-[var(--color-foreground)]/[0.08]'
                      : 'bg-[var(--color-foreground)]/[0.03] hover:bg-[var(--color-foreground)]/[0.07]'}
                    transition shadow-sm`}
                >
                  <div className="h-40 md:h-44 rounded-t-lg bg-[var(--color-background)] relative overflow-hidden flex items-center justify-center border-b border-[var(--color-foreground)]/10">
                    {it.thumb_url
                      ? <img src={it.thumb_url} alt={it.title} className="max-h-full max-w-full object-contain" />
                      : <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-indigo-600/20" />}
                  </div>
                  <div className="p-4">
                    <div className="font-medium">{it.title}</div>
                    {!!price && <div className="text-sm text-teal-400 mt-1">{price}</div>}
                    {view === 'cards' && it.blurb && (
                      <p className="text-xs opacity-70 mt-1 line-clamp-2">{it.blurb}</p>
                    )}
                  </div>
                </button>
              );
            })}

            {!loadingItems && !items.length && (
              <div className="col-span-full opacity-70 text-sm">
                No matches{query ? ` for “${query}”` : ''}. Try a different term or switch tabs above.
              </div>
            )}
          </div>

          {(total > 0) && (
            <div className="px-5 md:px-8 pb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm opacity-70">
                Showing <span className="font-medium">{items.length ? (page - 1) * pageSize + 1 : 0}</span>–
                <span className="font-medium">{Math.min(page * pageSize, total)}</span> of <span className="font-medium">{total}</span>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm opacity-80">
                  Per page:{' '}
                  <select
                    className="ml-1 rounded-md border border-[var(--color-foreground)]/20 bg-transparent px-2 py-1 text-sm"
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  >
                    {[8, 12, 16, 24].map((n) => (
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

                  {Array.from({ length: Math.min(pageCount, 7) }).map((_, i) => {
                    let n = i + 1;
                    if (pageCount > 7) {
                      const windowNums = [1, 2, page - 1, page, page + 1, pageCount - 1, pageCount]
                        .filter((x, idx, arr) => x >= 1 && x <= pageCount && arr.indexOf(x) === idx)
                        .sort((a, b) => a - b);
                      n = windowNums[i] ?? 0;
                      if (!n) return null;
                    }
                    const active = n === page;
                    return (
                      <button
                        key={`p-${n}`}
                        onClick={() => go(n)}
                        className={`px-2.5 py-1 rounded border text-sm
                          ${active
                            ? 'bg-[var(--color-foreground)] text-[var(--color-background)] border-[var(--color-foreground)]'
                            : 'border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10'}`}
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

          <div className="px-5 md:px-8 pb-6">
            <p className="text-sm opacity-70">
              Tip: Bundles can be customized—swap items, change colors/materials, or adjust quantities.
            </p>
          </div>
        </div>
      </div>

      {/* Detail modal (reuses DesignItemModal) */}
      <DesignItemModal open={itemOpen} item={activeItem} onClose={() => setItemOpen(false)} />
      {loadingDetail && <div className="absolute bottom-4 right-6 text-xs opacity-70">Loading item…</div>}
    </div>
  );
}