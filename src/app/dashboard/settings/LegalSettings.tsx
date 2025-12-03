'use client';

import { useEffect, useState } from 'react';
import { FiFileText, FiShield } from 'react-icons/fi';
import { supabaseBrowser } from '@/lib/supabase/client';

type LegalRow = {
  id: string;
  tos_text: string | null;
  privacy_text: string | null;
};

export default function LegalSettings() {
  const supabase = supabaseBrowser;

  const [tos, setTos] = useState<string>(
    'Welcome to Rad Dad Prints. By using our website and services, you agree to the following terms…',
  );
  const [privacy, setPrivacy] = useState<string>(
    'At Rad Dad Prints, your privacy is important to us. We only collect personal information you voluntarily provide…',
  );
  const [activeTab, setActiveTab] = useState<'tos' | 'privacy'>('tos');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // Load current legal content
  useEffect(() => {
    async function loadLegal() {
      setLoading(true);
      setErrorMsg(null);
      setSavedMsg(null);

      const { data, error } = await supabase
        .from('legal_content')
        .select('id, tos_text, privacy_text')
        .eq('id', 'default')
        .maybeSingle();

      if (error) {
        console.error('Error loading legal content', error);
        setErrorMsg('Could not load current Terms & Privacy text.');
        setLoading(false);
        return;
      }

      const row = (data ?? null) as LegalRow | null;

      if (row) {
        if (row.tos_text != null) setTos(row.tos_text);
        if (row.privacy_text != null) setPrivacy(row.privacy_text);
      }

      setLoading(false);
    }

    loadLegal();
  }, [supabase]);

  async function handleSave() {
    setSaving(true);
    setErrorMsg(null);
    setSavedMsg(null);

    const { error } = await supabase.from('legal_content').upsert({
      id: 'default',
      tos_text: tos.trim(),
      privacy_text: privacy.trim(),
    });

    if (error) {
      console.error('Error saving legal content', error);
      setErrorMsg('There was a problem saving your changes.');
      setSaving(false);
      return;
    }

    setSaving(false);
    setSavedMsg('Saved!');
    // auto-clear "Saved" after a few seconds
    setTimeout(() => setSavedMsg(null), 2500);
  }

  const currentValue = activeTab === 'tos' ? tos : privacy;
  const onChange = (value: string) => {
    activeTab === 'tos' ? setTos(value) : setPrivacy(value);
    setSavedMsg(null); // typing clears the "Saved" indicator
  };

  return (
    <section className="rounded-xl border border-[var(--color-foreground)]/10 bg-[var(--color-foreground)]/[0.03] p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-300">
          <FiShield className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-medium">Terms & Privacy</h2>
          <p className="text-xs opacity-60">
            Update the text shown in your Terms of Service & Privacy Policy modals.
          </p>
        </div>
      </div>

      {/* status row */}
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
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

        <div className="text-right">
          {loading && <span className="opacity-60">Loading…</span>}
          {!loading && savedMsg && (
            <span className="text-emerald-300">{savedMsg}</span>
          )}
          {!loading && errorMsg && (
            <span className="text-red-400">{errorMsg}</span>
          )}
        </div>
      </div>

      <textarea
        rows={7}
        className="mt-1 w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1.5 text-xs leading-relaxed outline-none focus:ring-2 focus:ring-teal-400/40 resize-none"
        value={currentValue}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
      />

      <div className="flex items-center justify-between text-[11px] gap-3">
        <p className="opacity-60 max-w-[70%]">
          These fields control the text inside your public Terms of Service &
          Privacy Policy modals.
        </p>
        <button
          onClick={handleSave}
          disabled={loading || saving}
          className="inline-flex items-center justify-center gap-1 rounded-md px-2.5 py-1 border border-teal-400/60 bg-teal-500/20 hover:bg-teal-500/30 text-[11px] font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </section>
  );
}