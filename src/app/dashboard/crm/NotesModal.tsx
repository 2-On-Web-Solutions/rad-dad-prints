'use client';

import { useState } from 'react';
import type { CRMRow } from './CRMBoard';

type Props = {
  row: CRMRow;
  onClose: (updatedNotes?: string) => void;
};

export default function NotesModal({ row, onClose }: Props) {
  const [notes, setNotes] = useState(row.notes ?? '');
  const [saving, setSaving] = useState(false);

  function handleSave() {
    setSaving(true);
    // purely local for now – no API
    setTimeout(() => {
      setSaving(false);
      onClose(notes);
    }, 200); // tiny delay to feel like a save
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-[640px] rounded-xl border border-[var(--color-foreground)]/25 bg-[var(--color-background)]">
        <div className="p-4 border-b border-[var(--color-foreground)]/20 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Notes — {row.name || row.ref}</h3>
            <p className="text-xs opacity-60">
              Internal notes about this job. These are not emailed to the customer.
            </p>
          </div>
          <button
            className="text-sm opacity-70 hover:opacity-100"
            onClick={() => onClose()}
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-3">
          <textarea
            className="w-full min-h-[200px] px-3 py-2 rounded-md border border-[var(--color-foreground)]/25 bg-transparent text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Job details, print settings, deadlines, special requests…"
          />

          <div className="text-[11px] opacity-60">
            Ref #{row.ref} • Created:{' '}
            {new Date(row.createdAt).toLocaleString()}
          </div>
        </div>

        <div className="p-4 border-t border-[var(--color-foreground)]/20 flex items-center justify-end gap-2">
          <button
            className="px-3 py-2 text-sm rounded-md border border-[var(--color-foreground)]/25 hover:bg-[var(--color-foreground)]/10"
            onClick={() => onClose()}
          >
            Cancel
          </button>
          <button
            className="px-3 py-2 text-sm rounded-md border border-teal-500/40 bg-teal-500/20 hover:bg-teal-500/30 text-teal-100"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save notes'}
          </button>
        </div>
      </div>
    </div>
  );
}