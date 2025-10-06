'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

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

export default function ItemModal({
  open,
  item,
  onClose,
}: {
  open: boolean;
  item: CatalogItem | null;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const imgs = item?.images ?? (item?.img ? [item.img] : []);

  // reset index when opening
  useEffect(() => {
    if (open) setIdx(0);
  }, [open, item]);

  // ESC key closes modal
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

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

        {/* Main content grid */}
        <div className="grid grid-cols-1 md:grid-cols-[100px_1fr_260px] gap-4 md:gap-6 px-6 py-6">
          {/* Thumbnail column */}
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:h-[380px]">
            {imgs.length > 0 ? (
              imgs.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border transition ${
                    i === idx
                      ? 'border-teal-400'
                      : 'border-[var(--color-foreground)]/15 hover:border-[var(--color-foreground)]/40'
                  }`}
                >
                  <Image
                    src={src}
                    alt={`${item.title} thumbnail ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))
            ) : (
              <div className="text-sm opacity-60 italic">No images</div>
            )}
          </div>

          {/* Main image */}
          <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/40 to-indigo-600/30 h-[280px] md:h-[380px]">
            {imgs[idx] && (
              <Image
                src={imgs[idx]}
                alt={`${item.title} main image`}
                fill
                className="object-cover transition-all duration-300"
              />
            )}
          </div>

          {/* Right description panel */}
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
                      key={f.href}
                      href={f.href}
                      download
                      className="px-4 py-2 rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-foreground)]/[0.05] hover:bg-[var(--color-foreground)]/[0.1] text-sm font-medium w-fit transition"
                    >
                      Download {f.label}
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