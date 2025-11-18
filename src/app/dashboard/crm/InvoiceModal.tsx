'use client';

import { useState } from 'react';
import type { CRMRow } from './CRMBoard';

type Props = {
  row: CRMRow;
  onClose: () => void;
  onSend: (payload: {
    ref: string;
    email: string;
    name: string;
    subject: string;
    message: string;
    amount?: string;
    dueDate?: string;
  }) => void;
};

export default function InvoiceModal({ row, onClose, onSend }: Props) {
  const [email, setEmail] = useState(row.email);
  const [name, setName] = useState(row.name);
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [subject, setSubject] = useState(
    `Invoice for Rad Dad Prints — Ref #${row.ref}`,
  );
  const [message, setMessage] = useState(
    `Hi ${row.name || 'there'},\n\nThank you for choosing Rad Dad Prints!\n\nPlease find your invoice details below.\n\nReference: ${row.ref}\nProject: ${row.topic}\nAmount: $[amount]\nDue date: [due date]\n\nIf anything looks off, just reply to this email and we’ll fix it up.\n\n— Rad Dad Prints`,
  );

  // confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  function buildPayload() {
    return {
      ref: row.ref,
      email,
      name,
      subject,
      message,
      amount,
      dueDate,
    };
  }

  function validateBasicFields() {
    if (!email || !subject) {
      alert('Email and subject are required.');
      return false;
    }
    return true;
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateBasicFields()) return;
    // open CONFIRM modal instead of sending directly
    setConfirmOpen(true);
  }

  function handleConfirmSend() {
    if (confirmText.trim().toUpperCase() !== 'CONFIRM') {
      alert('Please type CONFIRM in all caps to send this invoice email.');
      return;
    }
    onSend(buildPayload());
  }

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-xl border border-[var(--color-foreground)]/25 bg-[var(--color-background)] shadow-xl relative">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-foreground)]/20">
          <div>
            <h2 className="text-lg font-semibold">Send invoice</h2>
            <p className="text-xs opacity-60">
              This will send an invoice email for Ref #{row.ref}.
            </p>
          </div>
          <button
            className="text-sm opacity-70 hover:opacity-100"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="px-4 py-3 space-y-3 text-sm">
          <div className="space-y-1">
            <label className="text-xs opacity-70">To (email)</label>
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

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs opacity-70">Amount (optional)</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 120.00"
                className="w-full rounded-md border border-[var(--color-foreground)]/25 bg-[var(--color-background)]/80 px-2 py-1 text-xs outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs opacity-70">Due date (optional)</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-md border border-[var(--color-foreground)]/25 bg-[var(--color-background)]/80 px-2 py-1 text-xs outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs opacity-70">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-md border border-[var(--color-foreground)]/25 bg-[var(--color-background)]/80 px-2 py-1 text-xs outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs opacity-70">Message body</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="w-full rounded-md border border-[var(--color-foreground)]/25 bg-[var(--color-background)]/80 px-2 py-1 text-xs outline-none resize-y"
            />
            <p className="text-[10px] opacity-60">
              Tip: you can leave placeholders like <code>[amount]</code> and{' '}
              <code>[due date]</code> for now and we’ll replace them later when
              we hook this up to a real invoice system.
            </p>
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
              className="px-3 py-1.5 rounded-md border border-amber-400/70 bg-amber-500/20 text-xs text-amber-50 hover:bg-amber-500/30"
            >
              Send invoice email
            </button>
          </div>
        </form>

        {/* CONFIRMATION MODAL (inside the invoice modal) */}
        {confirmOpen && (
          <div className="absolute inset-0 z-[130] bg-black/70 flex items-center justify-center px-4">
            <div className="w-full max-w-sm rounded-lg border border-[var(--color-foreground)]/40 bg-[var(--color-background)] shadow-lg p-4 space-y-3 text-sm">
              <h3 className="text-base font-semibold">Confirm send</h3>
              <p className="text-xs opacity-70">
                You are about to send an invoice email to{' '}
                <span className="font-mono">{email}</span> for Ref #
                {row.ref}.<br />
                To confirm, type <strong>CONFIRM</strong> in the box below.
              </p>

              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type CONFIRM to proceed"
                className="w-full rounded-md border border-[var(--color-foreground)]/40 bg-[var(--color-background)]/90 px-2 py-1 text-xs outline-none"
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-foreground)]/20 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmText('');
                    setConfirmOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-md border border-[var(--color-foreground)]/25 text-xs hover:bg-[var(--color-foreground)]/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSend}
                  className="px-3 py-1.5 rounded-md border border-amber-400/80 bg-amber-500/30 text-xs text-amber-50 hover:bg-amber-500/40"
                >
                  Confirm &amp; send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
