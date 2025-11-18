'use client';

import { useState } from 'react';
import type { CRMRow } from './CRMBoard';

type Props = {
  row: CRMRow;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteConfirmModal({ row, onCancel, onConfirm }: Props) {
  const [text, setText] = useState('');
  const disabled = text.trim().toUpperCase() !== 'DELETE';

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-red-500/40 bg-[var(--color-background)] shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-red-500/40">
          <h2 className="text-sm font-semibold text-red-300">
            Confirm deletion
          </h2>
          <button
            className="text-sm opacity-70 hover:opacity-100"
            onClick={onCancel}
          >
            ✕
          </button>
        </div>

        <div className="px-4 py-3 space-y-3 text-sm">
          <p className="text-xs opacity-80">
            You are about to permanently delete this customer/job entry:
          </p>
          <div className="rounded-md border border-[var(--color-foreground)]/25 bg-[var(--color-background)]/80 px-3 py-2 text-xs space-y-1">
            <div>
              <span className="opacity-60">Ref #: </span>
              <span className="font-mono">{row.ref}</span>
            </div>
            <div>
              <span className="opacity-60">Name: </span>
              {row.name || '—'}
            </div>
            <div>
              <span className="opacity-60">Email: </span>
              {row.email || '—'}
            </div>
            <div>
              <span className="opacity-60">Topic: </span>
              {row.topic || '—'}
            </div>
          </div>

          <p className="text-[11px] text-red-300">
            This action cannot be undone. Type <strong>DELETE</strong> in all
            caps to confirm.
          </p>

          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="w-full rounded-md border border-red-500/60 bg-[var(--color-background)]/80 px-2 py-1 text-xs outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--color-foreground)]/20">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-md border border-[var(--color-foreground)]/25 text-xs hover:bg-[var(--color-foreground)]/10"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onConfirm}
            className={`px-3 py-1.5 rounded-md border text-xs ${
              disabled
                ? 'border-red-500/30 text-red-300/50 bg-red-500/10 cursor-not-allowed'
                : 'border-red-500/70 text-red-50 bg-red-500/30 hover:bg-red-500/40'
            }`}
          >
            Delete entry
          </button>
        </div>
      </div>
    </div>
  );
}
