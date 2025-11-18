'use client';

import { useState } from 'react';
import type { CRMRow } from './CRMBoard';

type CRMStatus = CRMRow['status'];

type Props = {
  onClose: () => void;
  onCreate: (data: {
    ref: string;
    email: string;
    name: string;
    topic: string;
    message: string;
    status: CRMStatus;
  }) => void;
};

function makeTicketId() {
  const d = new Date();
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  const stamp =
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${stamp}-${rnd}`;
}

export default function AddCustomerModal({ onClose, onCreate }: Props) {
  const [ref, setRef] = useState<string>(makeTicketId());
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<CRMStatus>('pending');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !name || !topic || !message) {
      alert('Please fill in email, name, topic, and message.');
      return;
    }
    const finalRef = ref || makeTicketId();
    onCreate({ ref: finalRef, email, name, topic, message, status });
  }

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-xl border border-[var(--color-foreground)]/25 bg-[var(--color-background)] shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-foreground)]/20">
          <div>
            <h2 className="text-lg font-semibold">Add customer / job</h2>
            <p className="text-xs opacity-60">
              Manual entry for walk-ins, phone calls, or custom quotes.
            </p>
          </div>
          <button
            className="text-sm opacity-70 hover:opacity-100"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-3 space-y-3 text-sm">
          <div className="grid gap-3 md:grid-cols-[2fr,1fr]">
            <div className="space-y-1">
              <label className="text-xs opacity-70">Reference #</label>
              <div className="flex gap-2">
                <input
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                  className="flex-1 rounded-md border border-[var(--color-foreground)]/25 bg-[var(--color-background)]/80 px-2 py-1 text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={() => setRef(makeTicketId())}
                  className="px-2 py-1 rounded-md border border-[var(--color-foreground)]/25 bg-[var(--color-foreground)]/10 text-xs hover:bg-[var(--color-foreground)]/20"
                >
                  Generate
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs opacity-70">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CRMStatus)}
                className="w-full rounded-md border border-[var(--color-foreground)]/25 bg-[var(--color-background)] text-[var(--color-foreground)] px-2 py-1 text-xs outline-none"
              >
                <option value="pending">Pending</option>
                <option value="working">Working</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs opacity-70">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-[var(--color-foreground)]/25 bg-[var(--color-background)]/80 px-2 py-1 text-xs outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs opacity-70">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-[var(--color-foreground)]/25 bg-[var(--color-background)]/80 px-2 py-1 text-xs outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs opacity-70">Topic</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded-md border border-[var(--color-foreground)]/25 bg-[var(--color-background)]/80 px-2 py-1 text-xs outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs opacity-70">Message / brief</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-[var(--color-foreground)]/25 bg-[var(--color-background)]/80 px-2 py-1 text-xs outline-none resize-y"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-foreground)]/15 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-[var(--color-foreground)]/25 text-xs hover:bg-[var(--color-foreground)]/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-md border border-teal-400/60 bg-teal-500/20 text-xs text-teal-100 hover:bg-teal-500/30"
            >
              Add to board
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}