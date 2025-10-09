'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) setIdx(startIndex);
  }, [open, startIndex]);

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

  useEffect(() => {
    if (!open || paused || total <= 1) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % total), 5000);
    return () => clearInterval(id);
  }, [open, paused, total]);

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
      {/* Gradient frame (matches Hero video) */}
      <div className="relative w-full max-w-6xl overflow-hidden p-[2px] bg-gradient-to-r from-[#13c8df] via-[#a78bfa] to-[#6b04af] shadow-[0_0_35px_rgba(19,200,223,0.45)]">
        {/* Actual modal surface */}
        <div className="bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 md:px-6 py-3 border-b border-[var(--color-foreground)]/10">
            <div /> {/* left spacer */}
            <h3 className="text-lg font-semibold justify-self-center">Gallery</h3>
            <div className="justify-self-end flex items-center gap-3">
              <span className="text-sm opacity-70">
                {Math.min(idx + 1, total)} / {total}
              </span>
              <button
                aria-label="Close gallery"
                onClick={onClose}
                className="text-2xl leading-none hover:opacity-80"
              >
                ×
              </button>
            </div>
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

            {/* Arrows (Lucide) */}
            <button
              aria-label="Previous"
              onClick={() => prev(true)}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-[var(--color-background)]/80 border border-[var(--color-foreground)]/20 rounded-full p-2 backdrop-blur
                         hover:bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              aria-label="Next"
              onClick={() => next(true)}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-[var(--color-background)]/80 border border-[var(--color-foreground)]/20 rounded-full p-2 backdrop-blur
                         hover:bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <ChevronRight className="w-5 h-5" />
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
    </div>
  );
}