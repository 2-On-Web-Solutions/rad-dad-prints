'use client';

import type { CRMRow } from './CRMBoard';

type Props = {
  row: CRMRow;
  onClose: () => void;
};

export default function MessageModal({ row, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-[720px] rounded-xl border border-[var(--color-foreground)]/25 bg-[var(--color-background)]">
        <div className="p-4 border-b border-[var(--color-foreground)]/20 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              Message — {row.name || row.email || row.ref}
            </h3>
            <p className="text-xs opacity-60">
              Original message from the contact form. This is read-only.
            </p>
          </div>
          <button
            className="text-sm opacity-70 hover:opacity-100"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          <div className="text-xs opacity-60 mb-2">
            Ref #{row.ref} • {new Date(row.createdAt).toLocaleString()}
          </div>
          <div className="rounded-md border border-[var(--color-foreground)]/25 bg-[var(--color-foreground)]/5 p-3 text-sm whitespace-pre-wrap leading-relaxed">
            {row.message}
          </div>
        </div>

        <div className="p-4 border-t border-[var(--color-foreground)]/20 flex items-center justify-end">
          <button
            className="px-3 py-2 text-sm rounded-md border border-[var(--color-foreground)]/25 hover:bg-[var(--color-foreground)]/10"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}