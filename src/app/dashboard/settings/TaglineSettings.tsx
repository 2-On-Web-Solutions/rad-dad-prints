'use client';

import { useState } from 'react';
import { FiType } from 'react-icons/fi';

const FONT_OPTIONS = [
  { id: 'sans', label: 'Clean Sans (default)' },
  { id: 'script', label: 'Dancing Script' },
  { id: 'mono', label: 'Tech Mono' },
  { id: 'display', label: 'Bold Display' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'serif', label: 'Classic Serif' },
];

export default function TaglineSettings() {
  const [tagline, setTagline] = useState<string>(
    'YOU THINK IT, WE PRINT IT!',
  );
  const [subTag, setSubTag] = useState<string>('Custom 3D Printing');
  const [font, setFont] = useState<string>('sans');

  return (
    <section className="rounded-xl border border-[var(--color-foreground)]/10 bg-[var(--color-foreground)]/[0.03] p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-pink-500/15 flex items-center justify-center text-pink-300">
          <FiType className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-medium">Tagline & Hero Text</h2>
          <p className="text-xs opacity-60">
            Edit the big line under your hero image and choose a font style.
          </p>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="space-y-1">
          <label className="block font-medium">Main tagline</label>
          <input
            className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/40"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="block font-medium">Sub-line</label>
          <input
            className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/40"
            value={subTag}
            onChange={(e) => setSubTag(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="block font-medium">Font style</label>
          <select
            className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/40"
            value={font}
            onChange={(e) => setFont(e.target.value)}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-2 rounded-md border border-[var(--color-foreground)]/15 bg-[var(--color-background)]/80 p-3">
          <div className="text-[10px] opacity-60 mb-1">Preview</div>
          <div className="text-xs">
            <div className="uppercase tracking-[0.18em]">
              {tagline || 'TAGLINE GOES HERE'}
            </div>
            <div className="opacity-70">{subTag || 'Sub-line here'}</div>
            <div className="mt-1 text-[10px] opacity-50">
              Font: {FONT_OPTIONS.find((f) => f.id === font)?.label}
            </div>
          </div>
        </div>

        <p className="text-[10px] opacity-60 pt-1">
          Later we’ll store this in a `branding` row and swap your current
          hard-coded hero text with this config (plus actual font classes for
          each option).
        </p>
      </div>
    </section>
  );
}