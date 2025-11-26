'use client';

import { useState } from 'react';
import { FiDroplet } from 'react-icons/fi';

type GradientOption = {
  id: string;
  name: string;
  from: string;
  to: string;
};

const PRESET_GRADIENTS: GradientOption[] = [
  { id: 'rad-dad', name: 'Rad Dad Purple', from: '#13c8df', to: '#6d44af' },
  { id: 'neon-mint', name: 'Neon Mint', from: '#3bffbd', to: '#00a3ff' },
  { id: 'sunset', name: 'Sunset Glow', from: '#ff8a00', to: '#e52e71' },
  { id: 'ice', name: 'Ice & Steel', from: '#6dd5ed', to: '#2c3e50' },
  { id: 'royal', name: 'Royal Violet', from: '#4e54c8', to: '#8f94fb' },
  { id: 'ember', name: 'Ember Forge', from: '#f2994a', to: '#eb5757' },
];

export default function ThemeSettings() {
  const [selectedId, setSelectedId] = useState<string>('rad-dad');

  const selected = PRESET_GRADIENTS.find((g) => g.id === selectedId) ?? PRESET_GRADIENTS[0];

  return (
    <section className="rounded-xl border border-[var(--color-foreground)]/10 bg-[var(--color-foreground)]/[0.03] p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-400/40 to-purple-500/40 flex items-center justify-center text-slate-900">
          <FiDroplet className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-medium">Gradient / Theme</h2>
          <p className="text-xs opacity-60">
            Pick from a set of predefined gradient themes for hero frames and accents.
          </p>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          {PRESET_GRADIENTS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedId(g.id)}
              className={`group relative overflow-hidden rounded-md border px-2 py-2 text-left ${
                selectedId === g.id
                  ? 'border-teal-400/80'
                  : 'border-[var(--color-foreground)]/20 hover:border-teal-400/60'
              }`}
            >
              <div
                className="h-6 rounded-md mb-1"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${g.from}, ${g.to})`,
                }}
              />
              <div className="text-[11px] font-medium">{g.name}</div>
              <div className="text-[9px] opacity-60">
                {g.from} → {g.to}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-2 rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)]/80 p-3">
          <div className="text-[10px] opacity-60 mb-1">Preview</div>
          <div
            className="h-16 rounded-xl shadow-lg"
            style={{
              backgroundImage: `linear-gradient(130deg, ${selected.from}, ${selected.to})`,
            }}
          />
        </div>

        <p className="text-[10px] opacity-60 pt-1">
          Later we’ll map these IDs to CSS variables (or Tailwind classes) so
          changing the selection updates the hero frame glow, CTA buttons, and
          other accents across the site.
        </p>
      </div>
    </section>
  );
}