// src/app/dashboard/notes/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { FiPlus, FiChevronLeft, FiChevronRight, FiTrash2 } from 'react-icons/fi';
import { supabaseBrowser } from '@/lib/supabase/client';
import { Rock_Salt } from 'next/font/google';

const rockSalt = Rock_Salt({
  subsets: ['latin'],
  weight: '400',
});

type DashboardNote = {
  id: string;
  content: string;
  note_date: string; // 'YYYY-MM-DD'
  source: 'voice' | 'manual' | string;
  folder_slug: string | null;
  created_at: string;
};

// fixed 9-per-page grid target (3×3 on large screens)
const PER_PAGE = 9;

// helper to format date
function formatNiceDate(dateStr: string) {
  const parts = dateStr.split('-').map((p) => Number(p));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return dateStr;
  }
  const [year, month, day] = parts;
  const d = new Date(year, month - 1, day); // local time

  return d.toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });
}

function getDateKey(d: Date) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

// compute today's key once for initial filter + new-note insert
const TODAY_KEY = getDateKey(new Date());

export default function NotesManagerPage() {
  const [notes, setNotes] = useState<DashboardNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  // default to *today* so we only see current-date notes on first open
  const [selectedDate, setSelectedDate] = useState<string | null>(TODAY_KEY);
  const [showAdd, setShowAdd] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [saving, setSaving] = useState(false);

  // delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DashboardNote | null>(null);

  // 30-day cutoff key (memo so it doesn't change)
  const cutoffDateKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return getDateKey(d);
  }, []);

  // initial load + 30-day prune
  useEffect(() => {
    const loadNotes = async () => {
      setLoading(true);
      const supabase = supabaseBrowser;

      // prune >30-day notes
      const { error: deleteError } = await supabase
        .from('dashboard_notes')
        .delete()
        .lt('note_date', cutoffDateKey);

      if (deleteError) {
        console.error('error pruning old notes', deleteError);
      }

      // load last 30 days
      const { data, error } = await supabase
        .from('dashboard_notes')
        .select('id, content, note_date, source, folder_slug, created_at')
        .gte('note_date', cutoffDateKey)
        .order('note_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('error loading notes', error);
        setNotes([]);
      } else {
        setNotes(data as DashboardNote[]);
      }

      setLoading(false);
    };

    loadNotes();
  }, [cutoffDateKey]);

  // Unique dates (for right column) — oldest first so *today* sits at the bottom
  const availableDates = useMemo(() => {
    const set = new Set<string>();
    for (const n of notes) set.add(n.note_date);
    return Array.from(set).sort((a, b) => (a < b ? -1 : 1)); // oldest first
  }, [notes]);

  // Filter by date if selected
  const filteredNotes = useMemo(() => {
    if (!selectedDate) return notes;
    return notes.filter((n) => n.note_date === selectedDate);
  }, [notes, selectedDate]);

  // Pagination (fixed PER_PAGE)
  const total = filteredNotes.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PER_PAGE;
  const visibleNotes = filteredNotes.slice(startIndex, startIndex + PER_PAGE);

  const handleChangePage = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setPage((p) => Math.max(1, p - 1));
    } else {
      setPage((p) => Math.min(totalPages, p + 1));
    }
  };

  const openAddModal = () => {
    setNewContent('');
    setShowAdd(true);
  };

  const handleSaveNote = async () => {
    if (!newContent.trim()) return;
    setSaving(true);

    try {
      const supabase = supabaseBrowser;
      const todayKey = TODAY_KEY;

      const { data, error } = await supabase
        .from('dashboard_notes')
        .insert({
          content: newContent.trim(),
          note_date: todayKey,
          source: 'manual',
          folder_slug: null,
        })
        .select('id, content, note_date, source, folder_slug, created_at')
        .single();

      if (error) {
        console.error('error saving note', error);
      } else if (data) {
        setNotes((prev) => [data as DashboardNote, ...prev]);
        // stay filtered on *today* and jump back to page 1
        setSelectedDate(todayKey);
        setPage(1);
        setShowAdd(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirmed = async (id: string) => {
    setDeletingId(id);
    try {
      const supabase = supabaseBrowser;
      const { error } = await supabase
        .from('dashboard_notes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('error deleting note', error);
      } else {
        setNotes((prev) => prev.filter((n) => n.id !== id));
      }
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
    }
  };

  const handleClearFilter = () => {
    setSelectedDate(null);
    setPage(1);
  };

  // small helper for preview text in confirmation modal
  const deletePreview = pendingDelete
    ? pendingDelete.content.length > 140
      ? `${pendingDelete.content.slice(0, 137)}…`
      : pendingDelete.content
    : '';

  return (
    <section className="max-w-6xl mx-auto pb-12 pt-4 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Notes</h1>
          <p className="text-sm opacity-70">
            Sticky-note view of your last 30 days of voice &amp; manual notes.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-full border border-teal-400/70 px-4 py-2 text-sm font-medium text-teal-200 hover:bg-teal-500/15 transition-colors"
        >
          <FiPlus />
          Add note
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,1.3fr)] gap-4">
        {/* LEFT: sticky-note grid with fixed window height */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="opacity-70">
                Showing{' '}
                <span className="font-semibold">{visibleNotes.length}</span> of{' '}
                <span className="font-semibold">{total}</span> note
                {total === 1 ? '' : 's'}
                {selectedDate
                  ? ` for ${formatNiceDate(selectedDate)}`
                  : ' (all dates)'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleChangePage('prev')}
                disabled={currentPage <= 1}
                className="w-7 h-7 grid place-items-center rounded-full border border-white/15 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <FiChevronLeft size={14} />
              </button>
              <span className="text-xs opacity-70">
                Page {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => handleChangePage('next')}
                disabled={currentPage >= totalPages}
                className="w-7 h-7 grid place-items-center rounded-full border border-white/15 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <FiChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* FIXED HEIGHT WINDOW FOR GRID (taller so the 3×3 fits inside) */}
          <div className="h-[600px] rounded-xl bg-black/20 border border-white/10 p-4 overflow-hidden">
            {loading ? (
              <div className="w-full h-full grid place-items-center text-sm opacity-70">
                Loading notes…
              </div>
            ) : visibleNotes.length === 0 ? (
              <div className="w-full h-full grid place-items-center text-sm opacity-70 text-center">
                No notes to show for this range yet. Add one with the button
                above.
              </div>
            ) : (
              <div className="grid h-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[180px]">
                {visibleNotes.map((note) => (
                  <div
                    key={note.id}
                    className="
                      relative
                      w-[220px] h-[180px]
                      bg-sky-300 text-slate-900
                      shadow-[0_14px_28px_rgba(0,0,0,0.55)]
                      transform-gpu -rotate-1
                      px-4 py-3
                      overflow-hidden
                    "
                    style={{ borderRadius: 0 }}
                  >
                    {/* delete icon */}
                    <button
                      type="button"
                      onClick={() => setPendingDelete(note)}
                      disabled={deletingId === note.id}
                      className="absolute top-2 right-2 text-xs text-slate-800/70 hover:text-red-600 disabled:opacity-40"
                    >
                      <FiTrash2 />
                    </button>

                    {/* meta line */}
                    <div className="text-[0.7rem] uppercase tracking-wide font-semibold opacity-70 mb-1">
                      {note.source === 'voice' ? 'Voice note' : 'Manual'}
                      {note.folder_slug ? ` • ${note.folder_slug}` : ''}
                    </div>

                    {/* text area – scrollable, scrollbar hidden, Rock Salt font */}
                    <div
                      className={`mt-1 h-[120px] overflow-y-auto whitespace-pre-wrap text-sm leading-snug ${rockSalt.className}`}
                      style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                      }}
                    >
                      <style jsx>{`
                        div::-webkit-scrollbar {
                          display: none;
                        }
                      `}</style>
                      {note.content}
                    </div>

                    <div className="mt-2 text-[0.7rem] opacity-70">
                      {formatNiceDate(note.note_date)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: date filter column */}
        <aside className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2">
                Dates
              </h2>
              <p className="text-[0.75rem] opacity-60">
                Last 30 days of notes. Click to filter.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClearFilter}
              className={`text-xs rounded-full px-2 py-1 border ${
                selectedDate === null
                  ? 'bg-white text-black border-white'
                  : 'border-white/25 text-white/80 hover:bg-white/10'
              }`}
            >
              All
            </button>
          </div>

          {/* No internal scrollbar here – overflow hidden */}
          <div className="flex-1 min-h-0 border border-white/10 rounded-lg bg-black/20 px-3 py-2 overflow-hidden">
            {availableDates.length === 0 ? (
              <p className="text-[0.75rem] opacity-60 mt-1">
                No dates yet—add a note to get started.
              </p>
            ) : (
              <ul className="space-y-1 text-sm">
                {availableDates.map((d) => {
                  const isActive = selectedDate === d;
                  const countForDate = notes.filter((n) => n.note_date === d)
                    .length;
                  return (
                    <li key={d}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate(d);
                          setPage(1);
                        }}
                        className={`w-full flex items-center justify-between rounded-md px-2 py-1 text-left text-xs ${
                          isActive ? 'bg-white text-black' : 'hover:bg-white/10'
                        }`}
                      >
                        <span>{formatNiceDate(d)}</span>
                        <span className="opacity-70">{countForDate}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {/* Add-note modal */}
      {showAdd && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-white/15 p-4 space-y-3">
            <h2 className="text-sm font-semibold">Add note</h2>
            <textarea
              className={`w-full min-h-[120px] rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-sm ${rockSalt.className}`}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Type your note here…"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-3 py-1.5 rounded-lg text-xs border border-white/20 hover:bg-white/10"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={saving || !newContent.trim()}
                className="px-3 py-1.5 rounded-lg text-xs bg-teal-500 text-black font-semibold hover:bg-teal-400 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {pendingDelete && (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-red-400/40 p-5 space-y-4">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-red-300">
              <FiTrash2 />
              Delete note?
            </h2>
            <p className="text-xs opacity-70">
              This action cannot be undone. The following note will be permanently
              removed:
            </p>
            <div
              className={`rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm whitespace-pre-wrap max-h-32 overflow-y-auto ${rockSalt.className}`}
            >
              {deletePreview}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={deletingId === pendingDelete?.id}
                className="px-3 py-1.5 rounded-lg text-xs border border-white/20 hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => pendingDelete && handleDeleteConfirmed(pendingDelete.id)}
                disabled={deletingId === pendingDelete?.id}
                className="px-3 py-1.5 rounded-lg text-xs bg-red-500 text-black font-semibold hover:bg-red-400 disabled:opacity-50"
              >
                {deletingId === pendingDelete?.id ? 'Deleting…' : 'Delete note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}