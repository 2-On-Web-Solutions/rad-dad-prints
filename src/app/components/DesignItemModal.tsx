'use client';

import { useEffect, useState } from 'react';

export type FileRef = { label: string; href: string; type?: string };
export type CatalogItem = {
  id: string;
  title: string;
  img?: string;
  images?: string[];
  priceFrom?: string;
  files?: FileRef[];
  blurb?: string;
};

export default function DesignItemModal({
  open,
  item,
  onClose,
}: {
  open: boolean;
  item: CatalogItem | null;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);

  // Compose image list (ensure stable array shape)
  const imgs =
    (item?.images && item.images.length > 0)
      ? item.images
      : (item?.img ? [item.img] : []);

  const imgCount = imgs.length; // stable primitive for deps

  const clampIdx = (n: number) =>
    imgCount ? ((n % imgCount) + imgCount) % imgCount : 0;

  // Reset to first image when opening this item
  useEffect(() => {
    if (open) setIdx(0);
  }, [open, item?.id]); // depend on a primitive key

  // ESC closes, ←/→ navigate (deps array has constant size/order)
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIdx((i) => clampIdx(i + 1));
      if (e.key === 'ArrowLeft') setIdx((i) => clampIdx(i - 1));
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, imgCount]);

  if (!open || !item) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-modal="true"
      role="dialog"
    >
      <div className="relative w-full max-w-5xl bg-[var(--color-background)] text-[var(--color-foreground)] rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--color-foreground)]/10">
          <h4 className="text-xl font-semibold">{item.title}</h4>
          <button
            aria-label="Close item"
            onClick={onClose}
            className="ml-auto text-2xl hover:opacity-80"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-[100px_1fr_260px] gap-4 md:gap-6 px-6 py-6">
          {/* Thumbnails */}
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:h-[380px]">
            {imgCount ? (
              imgs.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  onClick={() => setIdx(i)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border transition ${
                    i === idx
                      ? 'border-teal-400'
                      : 'border-[var(--color-foreground)]/15 hover:border-[var(--color-foreground)]/40'
                  }`}
                  aria-label={`Show image ${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`${item.title} ${i + 1}`}
                    className="object-cover w-full h-full"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))
            ) : (
              <div className="text-sm opacity-60 italic">No images</div>
            )}
          </div>

          {/* Main image */}
          <div
            className="relative rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/40 to-indigo-600/30 h-[280px] md:h-[380px] flex items-center justify-center select-none"
            onClick={imgCount ? () => setIdx((i) => clampIdx(i + 1)) : undefined}
            title={imgCount ? 'Click to view next image' : undefined}
          >
            {imgs[idx] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgs[idx]}
                alt={`${item.title} preview`}
                className="object-contain max-h-full max-w-full"
              />
            )}

            {imgCount > 1 && (
              <div className="absolute bottom-2 right-2 text-xs px-2 py-1 rounded bg-black/50">
                {idx + 1} / {imgCount}
              </div>
            )}

            {imgCount > 1 && (
              <>
                <button
                  onClick={() => setIdx((i) => clampIdx(i - 1))}
                  className="hidden md:block absolute left-2 top-1/2 -translate-y-1/2 px-2 py-1.5 rounded bg-black/40 hover:bg-black/60"
                  aria-label="Previous image"
                >
                  ←
                </button>
                <button
                  onClick={() => setIdx((i) => clampIdx(i + 1))}
                  className="hidden md:block absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1.5 rounded bg-black/40 hover:bg-black/60"
                  aria-label="Next image"
                >
                  →
                </button>
              </>
            )}
          </div>

          {/* Right panel */}
          <div className="flex flex-col justify-between md:h-[380px] mt-4 md:mt-0">
            <div>
              {item.priceFrom && (
                <div className="text-teal-400 font-semibold mb-1">
                  {item.priceFrom}
                </div>
              )}
              {item.blurb && (
                <p className="text-sm opacity-80 leading-relaxed">{item.blurb}</p>
              )}
            </div>

            {/* Downloads */}
            <div className="mt-4 md:mt-auto">
              {item.files?.length ? (
                <div className="flex flex-col gap-2">
                  {item.files.map((f) => (
                    <a
                      key={`${f.href}-${f.label ?? ''}`}
                      href={f.href}
                      download
                      className="px-4 py-2 rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-foreground)]/[0.05] hover:bg-[var(--color-foreground)]/[0.1] text-sm font-medium w-fit transition"
                    >
                      Download {f.label || (f.type?.toUpperCase() || 'File')}
                    </a>
                  ))}
                </div>
              ) : (
                <div className="opacity-70 text-sm mt-2">
                  No downloads yet. Contact us for custom STL export.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}