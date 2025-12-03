'use client';

import { useEffect, useMemo, useState } from 'react';
import { FaStar } from 'react-icons/fa';

type Review = {
  id: string;
  name: string;
  quote: string;
  stars: number;
};

const ROTATE_MS = 8000; // 8 seconds

export default function Reviews() {
  const [items, setItems] = useState<Review[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  // Fetch published reviews from public API
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/public/reviews', { cache: 'no-store' });
        if (!res.ok) return;

        const json = await res.json();
        if (cancelled) return;

        const mapped: Review[] = (Array.isArray(json.items) ? json.items : []).map(
          (r: any) => ({
            id: r.id,
            name: r.name ?? '',
            quote: r.quote ?? '',
            stars: typeof r.stars === 'number' ? r.stars : 5,
          }),
        );

        setItems(mapped);
        setCurrentPage(0);
      } catch {
        // fail silent – just don't render reviews
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Group into pages of 3
  const pages = useMemo(() => {
    if (!items.length) return [] as Review[][];
    const out: Review[][] = [];
    for (let i = 0; i < items.length; i += 3) {
      out.push(items.slice(i, i + 3));
    }
    return out;
  }, [items]);

  // Auto-rotate if more than one page
  useEffect(() => {
    if (pages.length <= 1) return;

    const id = window.setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % pages.length);
    }, ROTATE_MS);

    return () => window.clearInterval(id);
  }, [pages.length]);

  // ---------- EMPTY ----------
  if (!items.length) {
    return (
      <section id="reviews" className="pt-20 pb-10 px-4 sm:px-8 lg:px-16 w-full">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-semibold mb-6 text-[var(--color-foreground)]">
            Customer Reviews
          </h2>
          <p className="text-lg text-[var(--color-foreground)]/70">
            Once you add customer testimonials in the dashboard they will appear here.
          </p>
        </div>
      </section>
    );
  }

  // ---------- NORMAL ----------
  return (
    <section id="reviews" className="pt-20 pb-10 px-4 sm:px-8 lg:px-16 w-full">
      {/* Narrow heading block */}
      <div className="max-w-2xl mx-auto text-center mb-10">
        <h2 className="text-4xl font-semibold mb-6 text-[var(--color-foreground)]">
          Customer Reviews
        </h2>
        <p className="text-lg text-[var(--color-foreground)]/70">
          Hear what our customers have to say about their 3D printing experience!
        </p>
      </div>

      {/* Carousel area – cards wrapper gets its own wider max width */}
      <div className="relative mt-2 min-h-[260px]">
        {pages.map((page, pageIndex) => (
          <div
            key={pageIndex}
            className={`absolute inset-0 transition-opacity duration-700 ${
              pageIndex === currentPage
                ? 'opacity-100'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            <div
              className="
                mx-auto max-w-[1200px]
                grid gap-8 sm:grid-cols-2 lg:grid-cols-3
                justify-items-center
              "
            >
              {page.map((review) => (
                <article
                  key={review.id}
                  className="
                    bg-[var(--color-background)]
                    border border-[var(--color-foreground)]/10
                    rounded-lg shadow-md
                    p-6
                    text-center
                    flex flex-col items-center
                    hover:shadow-lg transition
                    w-full max-w-[360px]
                  "
                >
                  <div className="flex mb-3 text-yellow-400">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const active = i < Math.min(5, Math.max(1, review.stars));
                      return (
                        <FaStar
                          key={i}
                          className={
                            active
                              ? 'w-4 h-4 sm:w-5 sm:h-5'
                              : 'w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-foreground)]/40'
                          }
                        />
                      );
                    })}
                  </div>

                  <p className="text-[var(--color-foreground)]/90 italic mb-4 text-sm sm:text-base">
                    “{review.quote}”
                  </p>
                  <p className="font-semibold text-[var(--color-foreground)] text-sm sm:text-base">
                    — {review.name}
                  </p>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* No dots, tighter bottom so socials sit closer */}
    </section>
  );
}