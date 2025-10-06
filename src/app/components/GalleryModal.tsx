'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  open: boolean;
  images: string[];
  startIndex?: number;
  onClose: () => void;
};

export default function GalleryModal({ open, images, startIndex = 0, onClose }: Props) {
  const total = images.length;

  const [idx, setIdx] = useState(startIndex);
  const [paused, setPaused] = useState(false);

  // keep a small "resume after interaction" timer
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // reset index when re-opening / startIndex changes
  useEffect(() => {
    if (open) setIdx(startIndex);
  }, [open, startIndex]);

  // keyboard controls
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next(true);
      if (e.key === 'ArrowLeft') prev(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, total]);

  const mainSrc = useMemo(() => images[idx] ?? images[0], [images, idx]);

  // helpers
  const pauseFor = (ms = 6000) => {
    setPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => setPaused(false), ms);
  };

  const next = (fromUser = false) => {
    if (fromUser) pauseFor();
    setIdx((i) => (i + 1) % total);
  };

  const prev = (fromUser = false) => {
    if (fromUser) pauseFor();
    setIdx((i) => (i - 1 + total) % total);
  };

  // auto-rotate
  useEffect(() => {
    if (!open || paused || total <= 1) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % total), 5000);
    return () => clearInterval(id);
  }, [open, paused, total]);

  // clear timers when closing/unmounting
  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-6xl bg-[var(--color-background)] text-[var(--color-foreground)] rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-[var(--color-foreground)]/10">
          <h3 className="text-lg font-semibold">Gallery</h3>
          <span className="ml-auto text-sm opacity-70">
            {Math.min(idx + 1, total)} / {total}
          </span>
          <button
            aria-label="Close gallery"
            onClick={onClose}
            className="ml-2 text-2xl leading-none hover:opacity-80"
          >
            ×
          </button>
        </div>

        {/* Main image */}
        <div
          className="relative bg-black/10"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <img
            src={mainSrc}
            alt=""
            className="block w-full max-h-[60vh] md:max-h-[70vh] object-contain select-none transition-opacity duration-300"
            draggable={false}
          />

          {/* Arrows */}
          <button
            aria-label="Previous"
            onClick={() => prev(true)}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-[var(--color-background)]/80 border border-[var(--color-foreground)]/20 rounded-full px-3 py-2 backdrop-blur hover:bg-[var(--color-background)]"
          >
            ‹
          </button>
          <button
            aria-label="Next"
            onClick={() => next(true)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-[var(--color-background)]/80 border border-[var(--color-foreground)]/20 rounded-full px-3 py-2 backdrop-blur hover:bg-[var(--color-background)]"
          >
            ›
          </button>
        </div>

        {/* Thumbnails */}
        <div className="px-3 md:px-6 py-3 border-t border-[var(--color-foreground)]/10">
          <div className="relative flex items-center gap-3">
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1">
              {images.map((src, i) => {
                const active = i === idx;
                return (
                  <button
                    key={src + i}
                    onClick={() => {
                      setIdx(i);
                      pauseFor();
                    }}
                    className={`snap-start shrink-0 rounded-md overflow-hidden border transition
                      ${
                        active
                          ? 'border-brand-500 ring-2 ring-brand-500/40'
                          : 'border-[var(--color-foreground)]/15 hover:border-[var(--color-foreground)]/40'
                      }`}
                    aria-current={active ? 'true' : 'false'}
                  >
                    <img
                      src={src}
                      alt=""
                      className="w-28 h-20 object-cover"
                      draggable={false}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}