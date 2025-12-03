'use client';

import { useEffect, useState } from 'react';
import { FiStar, FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import { supabaseBrowser } from '@/lib/supabase/client';

type ReviewRow = {
  id: string;
  name: string | null;
  quote: string | null;
  stars: number | null;
};

type ReviewDraft = {
  id: string; // empty string = new
  name: string;
  quote: string;
  stars: number;
};

const EMPTY_DRAFT: ReviewDraft = {
  id: '',
  name: '',
  quote: '',
  stars: 5,
};

export default function ReviewsSettings() {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [reviews, setReviews] = useState<ReviewDraft[]>([]);
  const [draft, setDraft] = useState<ReviewDraft | null>(null);

  // ----- Load from Supabase on mount -----
  useEffect(() => {
    async function load() {
      const supabase = supabaseBrowser;

      const { data, error } = await supabase
        .from('customer_reviews')
        .select('id,name,quote,stars,sort_order,created_at')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading reviews:', error);
        setReviews([]);
      } else {
        const mapped: ReviewDraft[] =
          (data as ReviewRow[] | null)?.map((r) => ({
            id: r.id,
            name: r.name ?? '',
            quote: r.quote ?? '',
            stars: r.stars ?? 5,
          })) ?? [];
        setReviews(mapped);
      }

      setLoading(false);
    }

    load();
  }, []);

  function clampStars(n: number) {
    if (Number.isNaN(n)) return 1;
    return Math.min(5, Math.max(1, Math.round(n)));
  }

  // ----- Modal helpers -----
  function openNew() {
    setDraft({ ...EMPTY_DRAFT });
    setModalOpen(true);
  }

  function openEdit(r: ReviewDraft) {
    setDraft({ ...r });
    setModalOpen(true);
  }

  function closeModal() {
    setDraft(null);
    setModalOpen(false);
  }

  // ----- Save to Supabase (insert/update) -----
  async function saveDraft() {
    if (!draft) return;

    const name = draft.name.trim();
    const quote = draft.quote.trim();
    const stars = clampStars(draft.stars);

    if (!name || !quote) return;

    setSaving(true);
    const supabase = supabaseBrowser;

    // New review
    if (!draft.id) {
      const { data, error } = await supabase
        .from('customer_reviews')
        .insert({
          name,
          quote,
          stars,
        })
        .select('id,name,quote,stars')
        .single();

      if (error) {
        console.error('Error inserting review:', error);
        alert('Could not save review. Check console for details.');
        setSaving(false);
        return;
      }

      const row = data as ReviewRow;
      const created: ReviewDraft = {
        id: row.id,
        name: row.name ?? name,
        quote: row.quote ?? quote,
        stars: row.stars ?? stars,
      };

      setReviews((prev) => [...prev, created]);
    } else {
      // Update existing
      const { error } = await supabase
        .from('customer_reviews')
        .update({ name, quote, stars })
        .eq('id', draft.id);

      if (error) {
        console.error('Error updating review:', error);
        alert('Could not update review. Check console for details.');
        setSaving(false);
        return;
      }

      setReviews((prev) =>
        prev.map((r) =>
          r.id === draft.id ? { ...r, name, quote, stars } : r,
        ),
      );
    }

    setSaving(false);
    closeModal();
  }

  // ----- Delete from Supabase -----
  async function removeReview(id: string) {
    if (!id) return;
    if (!window.confirm('Remove this review from the carousel?')) return;

    const supabase = supabaseBrowser;
    const { error } = await supabase
      .from('customer_reviews')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting review:', error);
      alert('Could not delete review. Check console for details.');
      return;
    }

    setReviews((prev) => prev.filter((r) => r.id !== id));

    if (draft && draft.id === id) {
      closeModal();
    }
  }

  return (
    <>
      <section className="rounded-xl border border-[var(--color-foreground)]/10 bg-[var(--color-foreground)]/[0.03] p-4 sm:p-5 flex flex-col gap-3">
        {/* Header */}
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

        {/* Scrollable list (taller) */}
        <div className="mt-1 rounded-lg bg-[var(--color-background)]/40 border border-[var(--color-foreground)]/10 p-2 text-xs">
          {loading && <p className="opacity-60">Loading reviews…</p>}

          {!loading && reviews.length === 0 && (
            <p className="opacity-60">No reviews set yet.</p>
          )}

          {!loading && reviews.length > 0 && (
            <ul className="space-y-1 max-h-52 overflow-y-auto pr-1">
              {reviews.map((r) => (
                <li
                  key={r.id}
                  className="flex items-start justify-between gap-2 rounded-md px-2 py-1 hover:bg-[var(--color-foreground)]/5 transition"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 text-[10px] text-yellow-300">
                      {'★'.repeat(clampStars(r.stars))}
                    </div>
                    <div className="line-clamp-2 opacity-80">
                      “{r.quote}”
                    </div>
                    <div className="mt-0.5 opacity-60">— {r.name}</div>
                  </div>
                  <button
                    className="mt-1 inline-flex h-7 w-7 flex-none items-center justify-center rounded-md border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10 text-[10px]"
                    title="Edit review"
                    onClick={() => openEdit(r)}
                  >
                    <FiEdit2 className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer buttons (button moved up a bit, tighter left/right) */}
        <div className="flex items-center justify-between gap-3 mt-1">
          <button
            onClick={openNew}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium border border-[var(--color-foreground)]/20 bg-[var(--color-foreground)]/5 hover:bg-[var(--color-foreground)]/10 transition whitespace-nowrap"
          >
            <FiPlus className="w-3 h-3" />
            <span>New Review</span>
          </button>

          <p className="text-[10px] opacity-60">
            Showing up to 3–4 rows at a time. Use the scrollbar to see the rest.
          </p>
        </div>
      </section>

      {/* Modal */}
      {modalOpen && draft && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-xl border border-[var(--color-foreground)]/20 bg-[var(--color-background)] shadow-xl p-4 sm:p-5 text-xs sm:text-sm">
            {/* Modal header */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-semibold">
                  {draft.id ? 'Edit review' : 'New review'}
                </h3>
                <p className="text-[11px] opacity-60">
                  These reviews are saved in your <code>customer_reviews</code>{' '}
                  table so the homepage can rotate through them.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-foreground)]/35 bg-[var(--color-background)] hover:bg-[var(--color-foreground)]/10 shadow-sm"
              >
                <FiX className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-medium">
                  Customer name
                </label>
                <input
                  className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-400/40"
                  value={draft.name}
                  onChange={(e) =>
                    setDraft((d) =>
                      d ? { ...d, name: e.target.value } : d,
                    )
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-medium">
                  Quote
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-400/40 resize-y"
                  value={draft.quote}
                  onChange={(e) =>
                    setDraft((d) =>
                      d ? { ...d, quote: e.target.value } : d,
                    )
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-medium">
                  Stars
                </label>
                <select
                  className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-teal-400/40"
                  value={draft.stars}
                  onChange={(e) =>
                    setDraft((d) =>
                      d
                        ? { ...d, stars: Number(e.target.value) || 5 }
                        : d,
                    )
                  }
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} star{n === 1 ? '' : 's'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal footer */}
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {draft.id && (
                  <button
                    type="button"
                    onClick={() => removeReview(draft.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-red-500/40 px-3 py-1.5 text-[11px] sm:text-xs font-medium text-red-300 hover:bg-red-500/10"
                  >
                    <FiTrash2 className="w-3 h-3" />
                    Delete
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-[var(--color-foreground)]/30 px-3 py-1.5 text-[11px] sm:text-xs opacity-80 hover:bg-[var(--color-foreground)]/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={
                    saving || !draft.name.trim() || !draft.quote.trim()
                  }
                  className="inline-flex items-center gap-2 rounded-md bg-teal-500/90 px-3 py-1.5 text-[11px] sm:text-xs font-medium text-black hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving…' : 'Save review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}