'use client';

import { useState } from 'react';
import { FiFileText, FiShield } from 'react-icons/fi';

export default function LegalSettings() {
  const [tos, setTos] = useState<string>(
    'Welcome to Rad Dad Prints. By using our website and services, you agree to the following terms…',
  );
  const [privacy, setPrivacy] = useState<string>(
    'At Rad Dad Prints, your privacy is important to us. We only collect personal information you voluntarily provide…',
  );
  const [activeTab, setActiveTab] = useState<'tos' | 'privacy'>('tos');

  return (
    <section className="rounded-xl border border-[var(--color-foreground)]/10 bg-[var(--color-foreground)]/[0.03] p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-300">
          <FiShield className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-medium">Terms & Privacy</h2>
          <p className="text-xs opacity-60">
            Update the text shown in your Terms of Service & Privacy Policy
            modals.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs mt-1">
        <button
          onClick={() => setActiveTab('tos')}
          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 border text-[11px] ${
            activeTab === 'tos'
              ? 'border-teal-400/60 bg-teal-500/15'
              : 'border-[var(--color-foreground)]/20 bg-[var(--color-background)] hover:bg-[var(--color-foreground)]/10'
          }`}
        >
          <FiFileText className="w-3 h-3" />
          Terms of Service
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 border text-[11px] ${
            activeTab === 'privacy'
              ? 'border-teal-400/60 bg-teal-500/15'
              : 'border-[var(--color-foreground)]/20 bg-[var(--color-background)] hover:bg-[var(--color-foreground)]/10'
          }`}
        >
          <FiShield className="w-3 h-3" />
          Privacy Policy
        </button>
      </div>

      <textarea
        rows={7}
        className="mt-1 w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1.5 text-xs leading-relaxed outline-none focus:ring-2 focus:ring-teal-400/40 resize-none"
        value={activeTab === 'tos' ? tos : privacy}
        onChange={(e) =>
          activeTab === 'tos'
            ? setTos(e.target.value)
            : setPrivacy(e.target.value)
        }
      />

      <p className="text-[10px] opacity-60">
        We’ll later connect this to a `legal_content` table and wire your
        existing modals so they pull from here instead of hard-coded strings.
      </p>
    </section>
  );
}