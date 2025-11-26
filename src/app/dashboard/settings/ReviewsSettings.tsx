'use client';

import { useState } from 'react';
import { FiStar, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

type ReviewDraft = {
  id: string;
  name: string;
  quote: string;
  stars: number;
};

export default function ReviewsSettings() {
  const [open, setOpen] = useState(false);
  const [reviews, setReviews] = useState<ReviewDraft[]>([
    {
      id: 'sarah',
      name: 'Sarah M.',
      quote:
        'Amazing print quality and fast turnaround! My custom project came out better than expected.',
      stars: 5,
    },
    {
      id: 'jason',
      name: 'Jason L.',
      quote:
        'Great communication and attention to detail. Highly recommend Rad Dad Prints!',
      stars: 5,
    },
  ]);

  const [draft, setDraft] = useState<ReviewDraft | null>(null);

  function startNew() {
    setDraft({ id: '', name: '', quote: '', stars: 5 });
    setOpen(true);
  }

  function startEdit(r: ReviewDraft) {
    setDraft(r);
    setOpen(true);
  }

  function cancelEdit() {
    setDraft(null);
    setOpen(false);
  }

  function saveDraft() {
    if (!draft) return;
    if (!draft.quote.trim() || !draft.name.trim()) return;

    if (!draft.id) {
      const id = draft.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      setReviews((prev) => [...prev, { ...draft, id }]);
    } else {
      setReviews((prev) =>
        prev.map((r) => (r.id === draft.id ? draft : r)),
      );
    }
    cancelEdit();
  }

  function removeReview(id: string) {
    if (!window.confirm('Remove this review from the carousel?')) return;
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <section className="rounded-xl border border-[var(--color-foreground)]/10 bg-[var(--color-foreground)]/[0.03] p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-yellow-500/15 flex items-center justify-center text-yellow-300">
          <FiStar className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-medium">Customer Reviews</h2>
          <p className="text-xs opacity-60">
            Control the 3-card review section on the homepage.
          </p>
        </div>
      </div>

      <ul className="mt-1 space-y-1 text-xs rounded-lg bg-[var(--color-background)]/40 border border-[var(--color-foreground)]/10 p-2">
        {reviews.slice(0, 3).map((r) => (
          <li key={r.id} className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1 text-[10px] text-yellow-300">
                {'★'.repeat(r.stars)}
              </div>
              <div className="line-clamp-2 opacity-80">“{r.quote}”</div>
              <div className="mt-0.5 opacity-60">— {r.name}</div>
            </div>
            <button
              className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10 text-[10px]"
              title="Edit review"
              onClick={() => startEdit(r)}
            >
              <FiEdit2 className="w-3 h-3" />
            </button>
          </li>
        ))}
        {reviews.length === 0 && (
          <li className="opacity-60">No reviews set yet.</li>
        )}
      </ul>

      <div className="flex items-center justify-between gap-3 mt-1">
        <button
          onClick={startNew}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium border border-[var(--color-foreground)]/20 bg-[var(--color-foreground)]/5 hover:bg-[var(--color-foreground)]/10 transition"
        >
          <FiPlus className="w-3 h-3" />
          <span>New Review</span>
        </button>

        <button
          onClick={() => setOpen((v) => !v)}
          className="text-[11px] opacity-70 hover:opacity-100 underline-offset-2 hover:underline"
        >
          {open ? 'Collapse editor' : 'Expand editor'}
        </button>
      </div>

      {open && draft && (
        <div className="mt-2 space-y-2 rounded-lg border border-[var(--color-foreground)]/15 bg-[var(--color-background)]/60 p-3 text-xs">
          <div className="space-y-1">
            <label className="block font-medium">Customer name</label>
            <input
              className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/40"
              value={draft.name}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, name: e.target.value } : d))
              }
            />
          </div>

          <div className="space-y-1">
            <label className="block font-medium">Quote</label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/40 resize-none"
              value={draft.quote}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, quote: e.target.value } : d))
              }
            />
          </div>

          <div className="space-y-1">
            <label className="block font-medium">Stars</label>
            <select
              className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/40"
              value={draft.stars}
              onChange={(e) =>
                setDraft((d) =>
                  d
                    ? { ...d, stars: Number(e.target.value) || 5 }
                    : d,
                )
              }
            >
              {[5, 4, 3].map((n) => (
                <option key={n} value={n}>
                  {n} star{n === 1 ? '' : 's'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              onClick={saveDraft}
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium bg-teal-500/90 hover:bg-teal-400 text-black transition"
            >
              Save
            </button>
            {draft.id && (
              <button
                onClick={() => removeReview(draft.id)}
                className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium border border-red-500/40 text-red-300 hover:bg-red-500/10"
              >
                <FiTrash2 className="w-3 h-3" />
                Delete
              </button>
            )}
            <button
              onClick={cancelEdit}
              className="text-[11px] opacity-70 hover:opacity-100 underline-offset-2 hover:underline"
            >
              Cancel
            </button>
          </div>

          <p className="text-[10px] opacity-60 pt-1">
            Later we’ll hook this into a `reviews` table so you can reorder and
            publish/archive testimonials.
          </p>
        </div>
      )}
    </section>
  );
}
