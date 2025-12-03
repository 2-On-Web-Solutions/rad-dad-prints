'use client';

import { useEffect, useState } from 'react';
import { FiType } from 'react-icons/fi';
import { supabaseBrowser } from '@/lib/supabase/client';
import ThemeModeSettings from './ThemeModeSettings';

const FONT_OPTIONS = [
  { id: 'display', label: 'Bold Display (default)' }, // Oswald original hero font
  { id: 'sans', label: 'Clean Sans' },
  { id: 'script', label: 'Dancing Script' },
  { id: 'mono', label: 'Tech Mono' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'serif', label: 'Classic Serif' },
];

// Normalise supabaseBrowser so this file works whether it's a client
// instance or a function that returns a client.
const supabase =
  typeof supabaseBrowser === 'function'
    ? (supabaseBrowser as unknown as () => any)()
    : (supabaseBrowser as any);

// Shape of a row in the `site_tagline` table
type SiteTaglineRow = {
  id: string;
  main_text: string | null;
  sub_text: string | null;
  font_id: string | null;
  updated_at: string | null;
};

// Character limits per line (including spaces & punctuation)
const MAX_MAIN_CHARS = 40;
const MAX_SUB_CHARS = 28;

function limitChars(value: string, maxChars: number) {
  if (value.length <= maxChars) return value;
  return value.slice(0, maxChars);
}

function countChars(value: string) {
  return value.length;
}

export default function TaglineSettings() {
  const [tagline, setTagline] = useState<string>('YOU THINK IT, WE PRINT IT!');
  const [subTag, setSubTag] = useState<string>('Custom 3D Printing');
  // 🔹 Default to Oswald / Bold Display to match Hero
  const [font, setFont] = useState<string>('display');

  const [rowId, setRowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mainCharCount = countChars(tagline);
  const subCharCount = countChars(subTag);

  const effectiveTagline = tagline || 'YOU THINK IT, WE PRINT IT!';
  const effectiveSubTag = subTag || 'Custom 3D Printing';

  /* ======== Load current tagline settings from `site_tagline` ======== */
  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('site_tagline')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error('Error loading hero tagline settings:', error);
        setError('Could not load tagline settings.');
      } else if (data) {
        const row = data as SiteTaglineRow;
        setRowId(row.id);
        if (row.main_text) {
          setTagline(limitChars(row.main_text, MAX_MAIN_CHARS));
        }
        if (row.sub_text) {
          setSubTag(limitChars(row.sub_text, MAX_SUB_CHARS));
        }
        // 🔹 If no font is stored yet, fall back to 'display' (Oswald)
        if (row.font_id) {
          setFont(row.font_id);
        } else {
          setFont('display');
        }
      }

      setLoading(false);
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  /* ================== Save (upsert) current settings ================== */
  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = {
      main_text: limitChars(tagline, MAX_MAIN_CHARS),
      sub_text: limitChars(subTag, MAX_SUB_CHARS),
      font_id: font,
    };

    let dbError: any = null;
    let newId: string | null = rowId;

    if (rowId) {
      // Update existing row
      const { data, error } = await supabase
        .from('site_tagline')
        .update(payload)
        .eq('id', rowId)
        .select('id')
        .maybeSingle();

      dbError = error;
      if (data?.id) newId = data.id;
    } else {
      // Insert first row
      const { data, error } = await supabase
        .from('site_tagline')
        .insert(payload)
        .select('id')
        .maybeSingle();

      dbError = error;
      if (data?.id) newId = data.id;
    }

    if (dbError) {
      console.error('Error saving hero tagline settings:', dbError);
      setError('Could not save tagline settings.');
    } else {
      setRowId(newId);
      setSuccess('Tagline updated.');
      setTimeout(() => setSuccess(null), 2500);
    }

    setSaving(false);
  }

  return (
    <section className="rounded-xl border border-[var(--color-foreground)]/10 bg-[var(--color-foreground)]/[0.03] p-4 sm:p-5 flex flex-col gap-2">
      {/* 🔹 Top half: theme presets */}
      <ThemeModeSettings />

      {/* Divider */}
      <div className="border-t border-[var(--color-foreground)]/10 pt-3" />

      {/* 🔹 Bottom half: tagline + preview */}
      <div className="flex items-center gap-3 mb-1">
        <div className="h-9 w-9 rounded-full bg-pink-500/15 flex items-center justify-center text-pink-300">
          <FiType className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-medium">Tagline &amp; Hero Text</h2>
          <p className="text-xs opacity-60">
            Edit the big line under your hero image and choose a font style.
          </p>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        {/* Main line */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block font-medium">Main tagline</label>
            <span className="text-[10px] opacity-60">
              Max {MAX_MAIN_CHARS} characters &middot; {mainCharCount}/
              {MAX_MAIN_CHARS}
            </span>
          </div>
          <input
            className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/40"
            value={tagline}
            onChange={(e) =>
              setTagline(limitChars(e.target.value, MAX_MAIN_CHARS))
            }
          />
        </div>

        {/* Sub line */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block font-medium">Sub-line</label>
            <span className="text-[10px] opacity-60">
              Max {MAX_SUB_CHARS} characters &middot; {subCharCount}/
              {MAX_SUB_CHARS}
            </span>
          </div>
          <input
            className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/40"
            value={subTag}
            onChange={(e) =>
              setSubTag(limitChars(e.target.value, MAX_SUB_CHARS))
            }
          />
        </div>

        {/* Font + Save row */}
        <div className="mt-1 space-y-1">
          <div className="flex items-center gap-3">
            <label className="block font-medium whitespace-nowrap">
              Font style
            </label>
            <select
              className="flex-1 max-w-[220px] rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/40"
              value={font}
              onChange={(e) => setFont(e.target.value)}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-md border border-teal-500/70 bg-teal-500/10 px-3 py-1.5 text-[11px] font-semibold text-teal-100 hover:bg-teal-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              Save tagline
            </button>
          </div>
        </div>

        {/* Preview block – mimics hero layout */}
        <div className="mt-2 rounded-md border border-[var(--color-foreground)]/15 bg-[var(--color-background)]/80 p-3">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="opacity-60">Preview</span>
            <span className="flex gap-2 text-[10px]">
              {loading && <span className="opacity-60">Loading…</span>}
              {saving && <span className="opacity-60">Saving…</span>}
              {error && <span className="text-red-400">{error}</span>}
              {success && <span className="text-emerald-400">{success}</span>}
            </span>
          </div>

          <div className="rounded-lg border border-[var(--color-foreground)]/25 bg-black/70 px-4 py-4">
            <div className="text-right uppercase tracking-[0.22em] leading-tight text-xs">
              <div className="text-[var(--color-foreground)]">
                {effectiveTagline}
              </div>
              {/* vertical offset between lines to match hero */}
              <div className="mt-2 text-[var(--color-foreground)]">
                {effectiveSubTag}
              </div>
            </div>

            <div className="mt-2 text-[10px] opacity-50 text-right">
              Font: {FONT_OPTIONS.find((f) => f.id === font)?.label}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}