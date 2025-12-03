'use client';

import { useState } from 'react';
import { FiDroplet } from 'react-icons/fi';

type GradientOption = {
  id: string;
  name: string;
  from: string;
  to: string;
  mid?: string; // optional middle stop
};

type SolidOption = {
  id: string;
  name: string;
  value: string;
};

const PRESET_GRADIENTS: GradientOption[] = [
  {
    id: 'rad-dad',
    name: 'Rad Dad Gradient',
    from: '#13c8df',
    mid: '#a78bfa', // <-- NEW middle color
    to: '#6b04af',
  },
  { id: 'neon-mint', name: 'Neon Mint', from: '#3bffbd', to: '#00a3ff' },
  { id: 'aurora', name: 'Aurora Sky', from: '#4facfe', to: '#00f2fe' },
  { id: 'sunrise', name: 'Soft Sunrise', from: '#ff9a9e', to: '#fecfef' },
  { id: 'ember', name: 'Ember Forge', from: '#f83600', to: '#f9d423' },
  { id: 'forest', name: 'Forest Trail', from: '#5a3f37', to: '#2c7744' },
  { id: 'magma', name: 'Magma Core', from: '#fc466b', to: '#3f5efb' },
  { id: 'candy', name: '50 Shades', from: '#bdc3c7', to: '#2c3e50' },
  { id: 'midnight', name: 'Midnight Steel', from: '#141e30', to: '#243b55' },
  { id: 'ocean', name: 'Deep Ocean', from: '#00c6ff', to: '#0072ff' },
  { id: 'orchid', name: 'Neon Orchid', from: '#da22ff', to: '#9733ee' },
  { id: 'silver-steel', name: 'Silver Steel', from: '#bdc3c7', to: '#2c3e50' },
];

const VISIBLE_SOLIDS = 9;
const VISIBLE_GRADIENTS = 9;

const SOLID_COLORS: SolidOption[] = [
  { id: 'solid-purple', name: 'Rad Dad Purple', value: '#432389' },
  { id: 'solid-blue', name: 'Blue', value: '#3b82f6' },
  { id: 'solid-teal', name: 'Teal', value: '#14b8a6' },
  { id: 'solid-green', name: 'Green', value: '#22c55e' },
  { id: 'solid-yellow', name: 'Yellow', value: '#eab308' },
  { id: 'solid-orange', name: 'Orange', value: '#f97316' },
  { id: 'solid-red', name: 'Red', value: '#ef4444' },
  { id: 'solid-black', name: 'Black', value: '#020617' },
  { id: 'solid-white', name: 'White', value: '#f9fafb' },
];

type SelectedKind = 'gradient' | 'solid' | 'custom-gradient' | 'custom-solid';

export default function ThemeSettings() {
  const [selectedKind, setSelectedKind] = useState<SelectedKind>('gradient');
  const [selectedGradientId, setSelectedGradientId] = useState<string>('rad-dad');
  const [selectedSolidId, setSelectedSolidId] = useState<string>('solid-purple');

  const [customSolid, setCustomSolid] = useState('#432389');
  const [customFrom, setCustomFrom] = useState('#13c8df');
  const [customTo, setCustomTo] = useState('#6b04af'); // <-- fixed typo

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<null | { kind: 'ok' | 'error'; message: string }>(
    null,
  );

  const activeGradient =
    PRESET_GRADIENTS.find((g) => g.id === selectedGradientId) ?? PRESET_GRADIENTS[0];
  const activeSolid =
    SOLID_COLORS.find((s) => s.id === selectedSolidId) ?? SOLID_COLORS[0];

  let previewFrom = activeGradient.from;
  let previewMid = activeGradient.mid;
  let previewTo = activeGradient.to;
  let previewLabel: string;

  if (selectedKind === 'solid') {
    previewFrom = activeSolid.value;
    previewMid = undefined;
    previewTo = activeSolid.value;
    previewLabel = `Solid • ${activeSolid.name}`;
  } else if (selectedKind === 'custom-solid') {
    previewFrom = customSolid;
    previewMid = undefined;
    previewTo = customSolid;
    previewLabel = 'Custom color';
  } else if (selectedKind === 'custom-gradient') {
    previewFrom = customFrom;
    previewMid = undefined; // custom gradient still 2-stop for now
    previewTo = customTo;
    previewLabel = 'Custom gradient';
  } else {
    previewLabel = `Gradient • ${activeGradient.name}`;
  }

  const isSolidActive = (id: string) =>
    selectedKind === 'solid' && selectedSolidId === id;
  const isGradientActive = (id: string) =>
    selectedKind === 'gradient' && selectedGradientId === id;

  const visibleSolids = SOLID_COLORS.slice(0, VISIBLE_SOLIDS);
  const visibleGradients = PRESET_GRADIENTS.slice(0, VISIBLE_GRADIENTS);

  const openConfirmModal = () => {
    setConfirmText('');
    setShowConfirmModal(true);
  };
  const closeConfirmModal = () => setShowConfirmModal(false);

  const canApply = confirmText.trim().toUpperCase() === 'CONFIRM' && !isSaving;

  const showToast = (kind: 'ok' | 'error', message: string) => {
    setToast({ kind, message });
    setTimeout(() => setToast(null), 2500);
  };

  // Apply + save to Supabase via /api/theme
  const applyTheme = async () => {
    let solidColor: string | null = null;
    let from: string | null = null;
    let to: string | null = null;

    if (selectedKind === 'solid') {
      solidColor = activeSolid.value;
    } else if (selectedKind === 'custom-solid') {
      solidColor = customSolid;
    } else if (selectedKind === 'gradient') {
      from = activeGradient.from;
      to = activeGradient.to;
    } else if (selectedKind === 'custom-gradient') {
      from = customFrom;
      to = customTo;
    }

    const payload = {
      kind: selectedKind,
      solidColor,
      from,
      to,
    };

    try {
      setIsSaving(true);

      const res = await fetch('/api/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        showToast('error', data?.message ?? 'Failed to apply theme');
        return;
      }

      // Update CSS vars locally so the hero/glow change instantly
      if (typeof document !== 'undefined') {
        const root = document.documentElement;

        const resolvedFrom = from ?? solidColor ?? '#13c8df';
        const resolvedTo = to ?? solidColor ?? '#6b04af';

        root.style.setProperty('--hero-grad-from', resolvedFrom);
        root.style.setProperty('--hero-grad-to', resolvedTo);

        // Only Rad Dad preset gets a middle stop
        if (selectedKind === 'gradient' && activeGradient.id === 'rad-dad') {
          root.style.setProperty('--hero-grad-mid', activeGradient.mid ?? '#a78bfa');
        } else {
          // For everything else, remove middle var so CSS falls back to 2-stop
          root.style.removeProperty('--hero-grad-mid');
        }
      }

      showToast('ok', 'Theme updated!');
      setShowConfirmModal(false);
      setConfirmText('');
    } catch (err) {
      console.error('Apply theme error', err);
      showToast('error', 'Unexpected error while applying theme');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <section className="rounded-xl border border-[var(--color-foreground)]/10 bg-[var(--color-foreground)]/[0.03] p-4 sm:p-5 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-400/40 to-purple-500/40 flex items-center justify-center text-slate-900">
            <FiDroplet className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-medium">Gradient / Theme</h2>
            <p className="text-xs opacity-60">
              Pick a solid accent color or a gradient theme for hero frames and other
              highlights.
            </p>
          </div>
        </div>

        {/* TOP: Custom solid + custom gradient */}
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Custom solid color */}
            <div
              className={`rounded-md border px-3 py-2.5 text-[11px] space-y-1.5 ${
                selectedKind === 'custom-solid'
                  ? 'border-teal-400/90 bg-teal-400/5'
                  : 'border-[var(--color-foreground)]/20'
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedKind('custom-solid')}
                className="w-full text-left flex items-center justify-between"
              >
                <span className="font-semibold">Custom color</span>
                <span className="text-[10px] opacity-60">Click to use</span>
              </button>
              <div className="flex items-center gap-2">
                <div
                  className="h-1.5 flex-1 rounded-full"
                  style={{ backgroundColor: customSolid }}
                />
                <input
                  type="color"
                  value={customSolid}
                  onChange={(e) => {
                    setCustomSolid(e.target.value);
                    setSelectedKind('custom-solid');
                  }}
                  className="h-5 w-8 rounded border border-[var(--color-foreground)]/30 bg-transparent cursor-pointer"
                />
                <span className="text-[10px] opacity-70 truncate">{customSolid}</span>
              </div>
            </div>

            {/* Custom gradient (still 2-stop) */}
            <div
              className={`rounded-md border px-3 py-2.5 text-[11px] space-y-1.5 ${
                selectedKind === 'custom-gradient'
                  ? 'border-teal-400/90 bg-teal-400/5'
                  : 'border-[var(--color-foreground)]/20'
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedKind('custom-gradient')}
                className="w-full text-left flex items-center justify-between"
              >
                <span className="font-semibold">Custom gradient</span>
                <span className="text-[10px] opacity-60">Click to use</span>
              </button>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] opacity-60">From</span>
                    <input
                      type="color"
                      value={customFrom}
                      onChange={(e) => {
                        setCustomFrom(e.target.value);
                        setSelectedKind('custom-gradient');
                      }}
                      className="h-5 w-8 rounded border border-[var(--color-foreground)]/30 bg-transparent cursor-pointer"
                    />
                  </div>
                  <span className="block text-[10px] opacity-70 truncate">
                    {customFrom}
                  </span>
                </div>

                <div className="space-y-0.5 pl-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] opacity-60">To</span>
                    <input
                      type="color"
                      value={customTo}
                      onChange={(e) => {
                        setCustomTo(e.target.value);
                        setSelectedKind('custom-gradient');
                      }}
                      className="h-5 w-8 rounded border border-[var(--color-foreground)]/30 bg-transparent cursor-pointer"
                    />
                  </div>
                  <span className="block text-[10px] opacity-70 truncate">
                    {customTo}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle: preset solids & gradients */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* SOLID COLORS */}
            <div>
              <div className="mb-1">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
                  Solid colors
                </h3>
              </div>
              <div className="space-y-1.5">
                {visibleSolids.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedKind('solid');
                      setSelectedSolidId(c.id);
                    }}
                    className={`w-full rounded-md border px-2 py-1 text-left text-[10px] transition-colors ${
                      isSolidActive(c.id)
                        ? 'border-teal-400/90 bg-teal-400/5'
                        : 'border-[var(--color-foreground)]/20 hover:border-teal-400/60'
                    }`}
                  >
                    <div
                      className="h-1.5 w-full rounded-full"
                      style={{ backgroundColor: c.value }}
                    />
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{c.name}</span>
                      <span className="opacity-60 truncate">{c.value}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* GRADIENTS */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
                  Gradients
                </h3>
              </div>
              <div className="space-y-1.5">
                {visibleGradients.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setSelectedKind('gradient');
                      setSelectedGradientId(g.id);
                    }}
                    className={`w-full rounded-md border px-2 py-1 text-left text-[10px] transition-colors ${
                      isGradientActive(g.id)
                        ? 'border-teal-400/90 bg-teal-400/5'
                        : 'border-[var(--color-foreground)]/20 hover:border-teal-400/60'
                    }`}
                  >
                    <div
                      className="h-1.5 w-full rounded-full"
                      style={
                        g.mid
                          ? {
                              backgroundImage: `linear-gradient(135deg, ${g.from}, ${g.mid}, ${g.to})`,
                            }
                          : {
                              backgroundImage: `linear-gradient(135deg, ${g.from}, ${g.to})`,
                            }
                      }
                    />
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{g.name}</span>
                      <span className="opacity-60 truncate">
                        {g.from}
                        {g.mid ? ` → ${g.mid}` : ''} → {g.to}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview + Confirm */}
          <div className="mt-1 rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)]/80 p-2.5">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] opacity-60">Preview</div>
              <div className="text-[10px] opacity-70 truncate max-w-[60%] text-right">
                {previewLabel}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div
                  className="h-8 rounded-lg shadow-lg"
                  style={
                    selectedKind === 'solid' || selectedKind === 'custom-solid'
                      ? { backgroundColor: previewFrom }
                      : previewMid
                      ? {
                          backgroundImage: `linear-gradient(130deg, ${previewFrom}, ${previewMid}, ${previewTo})`,
                        }
                      : {
                          backgroundImage: `linear-gradient(130deg, ${previewFrom}, ${previewTo})`,
                        }
                  }
                />
              </div>

              <button
                type="button"
                onClick={openConfirmModal}
                className="shrink-0 inline-flex items-center justify-center rounded-md border border-emerald-500/60 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-200 hover:bg-emerald-500/20 hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/70 focus:ring-offset-0 transition-colors"
              >
                Confirm theme
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CONFIRM MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-xl border border-[var(--color-foreground)]/20 bg-[var(--color-background)] p-4 shadow-xl">
            <h3 className="text-sm font-semibold mb-2">Apply theme?</h3>
            <p className="text-xs opacity-70 mb-3">
              This will update the hero frame glow, CTA buttons, and other accent
              elements on your storefront.
              <br />
              <span className="mt-1 inline-block">
                Type{' '}
                <span className="font-semibold text-emerald-300">CONFIRM</span> to
                continue.
              </span>
            </p>

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type CONFIRM to continue"
              className="mb-4 w-full rounded-md border border-emerald-500/60 bg-transparent px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-400/70"
            />

            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={closeConfirmModal}
                className="rounded-md border border-[var(--color-foreground)]/40 px-3 py-1.5 hover:bg-[var(--color-foreground)]/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyTheme}
                disabled={!canApply}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                  canApply
                    ? 'border border-emerald-500 bg-emerald-700 text-emerald-50 shadow-sm hover:bg-emerald-600 hover:border-emerald-400'
                    : 'border border-emerald-500/40 bg-transparent text-emerald-300/50 cursor-not-allowed'
                }`}
              >
                {isSaving ? 'Saving…' : 'Apply theme'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 rounded-md px-3 py-2 text-xs shadow-lg border ${
            toast.kind === 'ok'
              ? 'bg-emerald-600 text-emerald-50 border-emerald-400'
              : 'bg-rose-600 text-rose-50 border-rose-400'
          }`}
        >
          {toast.message}
        </div>
      )}
    </>
  );
}