'use client';

import { useEffect, useState } from 'react';
import { FiList, FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import { supabaseBrowser } from '@/lib/supabase/client';

type DraftService = {
  id?: string; // undefined for new items
  name: string;
  details: string;
  startingPrice: string;
};

// Shape of the row we read from Supabase
type ServiceRow = {
  id: string;
  name: string | null;
  details: string | null;
  starting_price: string | null;
  sort_order: number | null;
};

// Text block under the table on the public Services page
type ServicePageMetaRow = {
  tagline: string | null;
  note_build_volumes: string | null;
  note_tolerances: string | null;
  note_file_formats: string | null;
  note_ready: string | null;
  note_disclaimer: string | null;
};

type ServicePageMetaDraft = {
  tagline: string;
  note_build_volumes: string;
  note_tolerances: string;
  note_file_formats: string;
  note_ready: string;
  note_disclaimer: string;
};

// Helper so we don't double-prefix things like "From $15"
function formatPriceLabel(label: string) {
  const trimmed = label.trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  if (trimmed.startsWith('$') || lower.startsWith('from')) {
    return trimmed;
  }
  return `$${trimmed}`;
}

export default function ServicesSettings() {
  const supabase = supabaseBrowser;

  const [services, setServices] = useState<DraftService[]>([]);
  const [draft, setDraft] = useState<DraftService | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [maxSortOrder, setMaxSortOrder] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // meta text states
  const [meta, setMeta] = useState<ServicePageMetaDraft | null>(null);
  const [metaDraft, setMetaDraft] =
    useState<ServicePageMetaDraft | null>(null);
  const [metaSaving, setMetaSaving] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [isMetaModalOpen, setIsMetaModalOpen] = useState(false);

  // Load from Supabase on mount
  useEffect(() => {
    async function loadServicesAndMeta() {
      setLoading(true);
      setErrorMsg(null);

      const [{ data, error }, metaRes] = await Promise.all([
        supabase
          .from('services')
          .select('id, name, details, starting_price, sort_order')
          .order('sort_order', { ascending: true }),
        supabase
          .from('service_page_meta')
          .select(
            'tagline, note_build_volumes, note_tolerances, note_file_formats, note_ready, note_disclaimer',
          )
          .eq('id', 'default')
          .maybeSingle(),
      ]);

      // services
      if (error) {
        console.error('Error loading services', error);
        setErrorMsg('Could not load services from Supabase.');
      } else {
        const rows = (data ?? []) as ServiceRow[];

        setServices(
          rows.map(
            (row): DraftService => ({
              id: row.id,
              name: row.name ?? '',
              details: row.details ?? '',
              startingPrice: row.starting_price ?? '',
            }),
          ),
        );

        const maxSort =
          rows.length > 0
            ? Math.max(...rows.map((r) => r.sort_order ?? 0))
            : 0;

        setMaxSortOrder(maxSort);
      }

      // meta text
      if (!metaRes.error && metaRes.data) {
        const m = metaRes.data as ServicePageMetaRow;
        setMeta({
          tagline: m.tagline ?? '',
          note_build_volumes: m.note_build_volumes ?? '',
          note_tolerances: m.note_tolerances ?? '',
          note_file_formats: m.note_file_formats ?? '',
          note_ready: m.note_ready ?? '',
          note_disclaimer: m.note_disclaimer ?? '',
        });
      } else if (metaRes.error) {
        console.warn('Error loading service_page_meta', metaRes.error);
      }

      setLoading(false);
    }

    loadServicesAndMeta();
  }, [supabase]);

  /* ---------- SERVICE CRUD ---------- */

  function startNew() {
    setDraft({
      id: undefined,
      name: '',
      details: '',
      startingPrice: '',
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  }

  function startEdit(svc: DraftService) {
    // clone so edits don’t mutate list until Save
    setDraft({ ...svc });
    setErrorMsg(null);
    setIsModalOpen(true);
  }

  function cancelEdit() {
    setDraft(null);
    setIsModalOpen(false);
    setSaving(false);
    setErrorMsg(null);
  }

  async function saveDraft() {
    if (!draft) return;
    if (!draft.name.trim()) return;

    setSaving(true);
    setErrorMsg(null);

    // NEW SERVICE
    if (!draft.id) {
      const slug = draft.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const newSort = maxSortOrder + 10;

      const { data, error } = await supabase
        .from('services')
        .insert({
          slug,
          name: draft.name.trim(),
          details: draft.details.trim(),
          starting_price: draft.startingPrice.trim(),
          sort_order: newSort,
          is_active: true,
        })
        .select('id, name, details, starting_price, sort_order')
        .single();

      if (error || !data) {
        console.error('Error inserting service', error);
        setErrorMsg('There was a problem saving this service.');
        setSaving(false);
        return;
      }

      const row = data as ServiceRow;

      setServices((prev) => [
        ...prev,
        {
          id: row.id,
          name: row.name ?? '',
          details: row.details ?? '',
          startingPrice: row.starting_price ?? '',
        },
      ]);

      setMaxSortOrder((prev) =>
        Math.max(prev, row.sort_order ?? newSort),
      );

      cancelEdit();
      setSaving(false);
      return;
    }

    // UPDATE EXISTING SERVICE
    const { data, error } = await supabase
      .from('services')
      .update({
        name: draft.name.trim(),
        details: draft.details.trim(),
        starting_price: draft.startingPrice.trim(),
      })
      .eq('id', draft.id)
      .select('id, name, details, starting_price, sort_order')
      .single();

    if (error || !data) {
      console.error('Error updating service', error);
      setErrorMsg('There was a problem saving this service.');
      setSaving(false);
      return;
    }

    const row = data as ServiceRow;

    setServices((prev) =>
      prev.map((s) =>
        s.id === row.id
          ? {
              id: row.id,
              name: row.name ?? '',
              details: row.details ?? '',
              startingPrice: row.starting_price ?? '',
            }
          : s,
      ),
    );

    cancelEdit();
    setSaving(false);
  }

  async function removeService(id?: string) {
    if (!id) return;
    if (!window.confirm('Remove this service from the public list?')) return;

    const { error } = await supabase.from('services').delete().eq('id', id);

    if (error) {
      console.error('Error deleting service', error);
      setErrorMsg('There was a problem deleting this service.');
      return;
    }

    setServices((prev) => prev.filter((s) => s.id !== id));
    cancelEdit();
  }

  /* ---------- META (TAGLINE + NOTES) ---------- */

  function openMetaModal() {
    setMetaError(null);
    setMetaDraft(
      meta ?? {
        tagline: '',
        note_build_volumes: '',
        note_tolerances: '',
        note_file_formats: '',
        note_ready: '',
        note_disclaimer: '',
      },
    );
    setIsMetaModalOpen(true);
  }

  function cancelMeta() {
    setIsMetaModalOpen(false);
    setMetaSaving(false);
    setMetaError(null);
    setMetaDraft(null);
  }

  async function saveMeta() {
    if (!metaDraft) return;
    setMetaSaving(true);
    setMetaError(null);

    const payload = {
      id: 'default',
      tagline: metaDraft.tagline.trim(),
      note_build_volumes: metaDraft.note_build_volumes.trim(),
      note_tolerances: metaDraft.note_tolerances.trim(),
      note_file_formats: metaDraft.note_file_formats.trim(),
      note_ready: metaDraft.note_ready.trim(),
      note_disclaimer: metaDraft.note_disclaimer.trim(),
    };

    const { data, error } = await supabase
      .from('service_page_meta')
      .upsert(payload, { onConflict: 'id' })
      .select(
        'tagline, note_build_volumes, note_tolerances, note_file_formats, note_ready, note_disclaimer',
      )
      .single();

    if (error || !data) {
      console.error('Error saving service_page_meta', error);
      setMetaError('There was a problem saving the services page text.');
      setMetaSaving(false);
      return;
    }

    const m = data as ServicePageMetaRow;

    const cleaned: ServicePageMetaDraft = {
      tagline: m.tagline ?? '',
      note_build_volumes: m.note_build_volumes ?? '',
      note_tolerances: m.note_tolerances ?? '',
      note_file_formats: m.note_file_formats ?? '',
      note_ready: m.note_ready ?? '',
      note_disclaimer: m.note_disclaimer ?? '',
    };

    setMeta(cleaned);
    setMetaDraft(cleaned);
    setMetaSaving(false);
    setIsMetaModalOpen(false);
  }

  /* ---------- RENDER ---------- */

  return (
    <>
      <section className="rounded-xl border border-[var(--color-foreground)]/10 bg-[var(--color-foreground)]/[0.03] p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400">
            <FiList className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-medium">Services List</h2>
            <p className="text-xs opacity-60">
              Add, remove, and reorder the services shown on the Services page.
            </p>
          </div>
        </div>

        {/* Status / error */}
        {loading && (
          <p className="text-[11px] opacity-60">Loading services…</p>
        )}
        {errorMsg && !isModalOpen && (
          <p className="text-[11px] text-red-400">{errorMsg}</p>
        )}

        {/* Scrollable preview of all services */}
        <ul
          className="
            mt-1 space-y-1 text-xs rounded-lg
            bg-[var(--color-background)]/40
            border border-[var(--color-foreground)]/10
            p-2
            max-h-56 overflow-y-auto
          "
        >
          {services.map((svc) => (
            <li
              key={svc.id ?? svc.name}
              className="flex items-start justify-between gap-2"
            >
              <div>
                <div className="font-medium flex items-baseline gap-2">
                  <span>{svc.name}</span>
                  {svc.startingPrice.trim() && (
                    <span className="text-[11px] opacity-80 text-emerald-300">
                      {formatPriceLabel(svc.startingPrice)}
                    </span>
                  )}
                </div>
                <div className="opacity-60 line-clamp-2">
                  {svc.details}
                </div>
              </div>
              <button
                className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10 text-[10px]"
                title="Edit service"
                onClick={() => startEdit(svc)}
              >
                <FiEdit2 className="w-3 h-3" />
              </button>
            </li>
          ))}
          {!loading && services.length === 0 && (
            <li className="opacity-60">No services yet. Add your first one.</li>
          )}
        </ul>

        <div className="flex items-center justify-between gap-3 mt-1">
          <button
            onClick={startNew}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium border border-[var(--color-foreground)]/20 bg-[var(--color-foreground)]/5 hover:bg-[var(--color-foreground)]/10 transition"
          >
            <FiPlus className="w-3 h-3" />
            <span>New Service</span>
          </button>

          <button
            onClick={openMetaModal}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium border border-[var(--color-foreground)]/25 bg-[var(--color-background)]/60 hover:bg-[var(--color-foreground)]/10 transition"
          >
            <FiEdit2 className="w-3 h-3" />
            <span>Service notes</span>
          </button>
        </div>
      </section>

      {/* Modal editor – services */}
      {isModalOpen && draft && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-[var(--color-foreground)]/20 bg-[var(--color-background)] p-4 sm:p-5 text-xs shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">
                {draft.id ? 'Edit Service' : 'New Service'}
              </h3>
              <button
                onClick={cancelEdit}
                aria-label="Close"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-foreground)]/30 bg-[var(--color-background)] hover:bg-[var(--color-foreground)]/10 text-sm leading-none"
              >
                ×
              </button>
            </div>

            {errorMsg && (
              <p className="text-[11px] text-red-400 mb-2">{errorMsg}</p>
            )}

            <div className="space-y-2">
              <div className="space-y-1">
                <label className="block font-medium">Service name</label>
                <input
                  className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/40"
                  value={draft.name}
                  onChange={(e) =>
                    setDraft((d) =>
                      d ? { ...d, name: e.target.value } : d,
                    )
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="block font-medium">What’s included</label>
                <textarea
                  rows={4}
                  className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/40 resize-none"
                  value={draft.details}
                  onChange={(e) =>
                    setDraft((d) =>
                      d ? { ...d, details: e.target.value } : d,
                    )
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="block font-medium">
                  Starting price label
                </label>
                <input
                  className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/40"
                  placeholder="From $15"
                  value={draft.startingPrice}
                  onChange={(e) =>
                    setDraft((d) =>
                      d
                        ? { ...d, startingPrice: e.target.value }
                        : d,
                    )
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 mt-1">
              <button
                onClick={saveDraft}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium bg-teal-500/90 hover:bg-teal-400 text-black transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>

              <div className="flex items-center gap-2">
                {draft.id && (
                  <button
                    onClick={() => removeService(draft.id)}
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
            </div>

            <p className="text-[10px] opacity-60 pt-2">
              Changes are saved to your <code>services</code> table in
              Supabase and power the public Services page.
            </p>
          </div>
        </div>
      )}

      {/* Modal editor – tagline + footer notes */}
      {isMetaModalOpen && metaDraft && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-[var(--color-foreground)]/20 bg-[var(--color-background)] p-4 sm:p-5 text-xs shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Services page text</h3>
              <button
                onClick={cancelMeta}
                aria-label="Close"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-foreground)]/30 bg-[var(--color-background)] hover:bg-[var(--color-foreground)]/10 text-sm leading-none"
              >
                ×
              </button>
            </div>

            {metaError && (
              <p className="text-[11px] text-red-400 mb-2">
                {metaError}
              </p>
            )}

            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              <div className="space-y-1">
                <label className="block font-medium">Tagline</label>
                <textarea
                  rows={2}
                  className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/40 resize-none"
                  value={metaDraft.tagline}
                  onChange={(e) =>
                    setMetaDraft((d) =>
                      d ? { ...d, tagline: e.target.value } : d,
                    )
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="block font-medium">Build volumes</label>
                <textarea
                  rows={2}
                  className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/40 resize-none"
                  value={metaDraft.note_build_volumes}
                  onChange={(e) =>
                    setMetaDraft((d) =>
                      d
                        ? { ...d, note_build_volumes: e.target.value }
                        : d,
                    )
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="block font-medium">Tolerances</label>
                <textarea
                  rows={2}
                  className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/40 resize-none"
                  value={metaDraft.note_tolerances}
                  onChange={(e) =>
                    setMetaDraft((d) =>
                      d
                        ? { ...d, note_tolerances: e.target.value }
                        : d,
                    )
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="block font-medium">File formats</label>
                <textarea
                  rows={2}
                  className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/40 resize-none"
                  value={metaDraft.note_file_formats}
                  onChange={(e) =>
                    setMetaDraft((d) =>
                      d
                        ? { ...d, note_file_formats: e.target.value }
                        : d,
                    )
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="block font-medium">
                  “Ready to print?” line
                </label>
                <textarea
                  rows={2}
                  className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/40 resize-none"
                  value={metaDraft.note_ready}
                  onChange={(e) =>
                    setMetaDraft((d) =>
                      d ? { ...d, note_ready: e.target.value } : d,
                    )
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="block font-medium">Price disclaimer</label>
                <textarea
                  rows={2}
                  className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/40 resize-none"
                  value={metaDraft.note_disclaimer}
                  onChange={(e) =>
                    setMetaDraft((d) =>
                      d
                        ? { ...d, note_disclaimer: e.target.value }
                        : d,
                    )
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 mt-1">
              <button
                onClick={saveMeta}
                disabled={metaSaving}
                className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium bg-teal-500/90 hover:bg-teal-400 text-black transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {metaSaving ? 'Saving…' : 'Save text'}
              </button>

              <button
                onClick={cancelMeta}
                className="text-[11px] opacity-70 hover:opacity-100 underline-offset-2 hover:underline"
              >
                Cancel
              </button>
            </div>

            <p className="text-[10px] opacity-60 pt-2">
              These fields control the tagline and notes under the Services
              table on the public site.
            </p>
          </div>
        </div>
      )}
    </>
  );
}