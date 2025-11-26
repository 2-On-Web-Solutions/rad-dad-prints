'use client';

import { useState } from 'react';
import { FiList, FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';

type DraftService = {
  id: string;
  name: string;
  details: string;
  startingPrice: string;
};

export default function ServicesSettings() {
  const [open, setOpen] = useState(false);

  // Temporary local list – later we’ll load/save this from Supabase
  const [services, setServices] = useState<DraftService[]>([
    {
      id: 'fdm-printing',
      name: 'FDM Printing (PLA / PETG / ABS)',
      details: 'Strong & affordable parts. 0.12–0.28 mm layers, basic cleanup.',
      startingPrice: 'From $15',
    },
    {
      id: 'resin-printing',
      name: 'Resin Printing (SLA/DLP)',
      details: 'High detail minis & small parts. UV cure, support removal.',
      startingPrice: 'From $25',
    },
  ]);

  const [draft, setDraft] = useState<DraftService | null>(null);

  function startNew() {
    setDraft({
      id: '',
      name: '',
      details: '',
      startingPrice: '',
    });
    setOpen(true);
  }

  function startEdit(svc: DraftService) {
    setDraft(svc);
    setOpen(true);
  }

  function cancelEdit() {
    setDraft(null);
    setOpen(false);
  }

  function saveDraft() {
    if (!draft) return;
    if (!draft.name.trim()) return;

    if (!draft.id) {
      const id = draft.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      setServices((prev) => [...prev, { ...draft, id }]);
    } else {
      setServices((prev) =>
        prev.map((s) => (s.id === draft.id ? draft : s)),
      );
    }
    cancelEdit();
  }

  function removeService(id: string) {
    if (!window.confirm('Remove this service from the public list?')) return;
    setServices((prev) => prev.filter((s) => s.id !== id));
  }

  return (
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

      {/* Mini preview of top 3 items */}
      <ul className="mt-1 space-y-1 text-xs rounded-lg bg-[var(--color-background)]/40 border border-[var(--color-foreground)]/10 p-2">
        {services.slice(0, 3).map((svc) => (
          <li key={svc.id} className="flex items-start justify-between gap-2">
            <div>
              <div className="font-medium">{svc.name}</div>
              <div className="opacity-60 line-clamp-2">{svc.details}</div>
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
        {services.length === 0 && (
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
          onClick={() => setOpen((v) => !v)}
          className="text-[11px] opacity-70 hover:opacity-100 underline-offset-2 hover:underline"
        >
          {open ? 'Collapse editor' : 'Expand editor'}
        </button>
      </div>

      {/* Simple inline editor */}
      {open && draft && (
        <div className="mt-2 space-y-2 rounded-lg border border-[var(--color-foreground)]/15 bg-[var(--color-background)]/60 p-3 text-xs">
          <div className="space-y-1">
            <label className="block font-medium">Service name</label>
            <input
              className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/40"
              value={draft.name}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, name: e.target.value } : d))
              }
            />
          </div>

          <div className="space-y-1">
            <label className="block font-medium">What’s included</label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/40 resize-none"
              value={draft.details}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, details: e.target.value } : d))
              }
            />
          </div>

          <div className="space-y-1">
            <label className="block font-medium">Starting price label</label>
            <input
              className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/40"
              placeholder="From $15"
              value={draft.startingPrice}
              onChange={(e) =>
                setDraft((d) =>
                  d ? { ...d, startingPrice: e.target.value } : d,
                )
              }
            />
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
                onClick={() => removeService(draft.id)}
                className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium border border-red-500/40 text-red-300 hover:bg-red-500/10"
              >
                <FiTrash2 className="w-3 h-3" />
                Delete service
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
            Later we’ll wire this to Supabase so changes sync directly to the
            public Services table.
          </p>
        </div>
      )}
    </section>
  );
}