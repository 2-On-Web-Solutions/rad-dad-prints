'use client';

import { useState } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';

type Preset = {
  id: string;
  label: string;
  swatchFrom: string; // accent / header & buttons
  swatchTo: string; // background
};

const LIGHT_PRESETS: Preset[] = [
  {
    id: 'light-rad-dad',
    label: 'Rad Dad Light',
    swatchFrom: '#f5f3ff',
    swatchTo: '#432389',
  },
  {
    id: 'light-sky',
    label: 'Sky Daybreak',
    swatchFrom: '#e0f2ff',
    swatchTo: '#0ea5e9',
  },
  {
    id: 'light-warm',
    label: 'Warm Studio',
    swatchFrom: '#fff7ed',
    swatchTo: '#fb923c',
  },
  {
    id: 'light-minimal',
    label: 'Minimal Gray',
    swatchFrom: '#f4f4f5',
    swatchTo: '#111827',
  },
];

const DARK_PRESETS: Preset[] = [
  {
    id: 'dark-rad-dad',
    label: 'Rad Dad Dark',
    swatchFrom: '#13c8df',
    swatchTo: '#020617',
  },
  {
    id: 'dark-neon',
    label: 'Neon Mint',
    swatchFrom: '#22c55e',
    swatchTo: '#020617',
  },
  {
    id: 'dark-ember',
    label: 'Ember Forge',
    swatchFrom: '#f97316',
    swatchTo: '#020617',
  },
  {
    id: 'dark-midnight',
    label: 'Midnight Steel',
    swatchFrom: '#4b5563',
    swatchTo: '#020617',
  },
];

const LIGHT_CUSTOM_ID = 'light-custom';
const DARK_CUSTOM_ID = 'dark-custom';

type ConfirmMode = 'light' | 'dark' | null;

export default function ThemeModeSettings() {
  const [selectedLight, setSelectedLight] = useState<string>('light-rad-dad');
  const [selectedDark, setSelectedDark] = useState<string>('dark-rad-dad');

  const [lightCustomAccent, setLightCustomAccent] = useState('#22c55e');
  const [lightCustomBg, setLightCustomBg] = useState('#0f172a');

  const [darkCustomAccent, setDarkCustomAccent] = useState('#06b6d4');
  const [darkCustomBg, setDarkCustomBg] = useState('#020617');

  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  const [confirmInput, setConfirmInput] = useState('');

  const openConfirm = (mode: ConfirmMode) => {
    setConfirmMode(mode);
    setConfirmInput('');
  };

  const closeConfirm = () => {
    setConfirmMode(null);
    setConfirmInput('');
  };

  const handleApply = () => {
    if (confirmInput.trim().toUpperCase() !== 'CONFIRM' || !confirmMode) return;

    if (confirmMode === 'light') {
      console.log('Apply LIGHT theme preset:', {
        preset: selectedLight,
        accent:
          selectedLight === LIGHT_CUSTOM_ID
            ? lightCustomAccent
            : LIGHT_PRESETS.find((p) => p.id === selectedLight)?.swatchFrom,
        background:
          selectedLight === LIGHT_CUSTOM_ID
            ? lightCustomBg
            : LIGHT_PRESETS.find((p) => p.id === selectedLight)?.swatchTo,
      });
    } else if (confirmMode === 'dark') {
      console.log('Apply DARK theme preset:', {
        preset: selectedDark,
        accent:
          selectedDark === DARK_CUSTOM_ID
            ? darkCustomAccent
            : DARK_PRESETS.find((p) => p.id === selectedDark)?.swatchFrom,
        background:
          selectedDark === DARK_CUSTOM_ID
            ? darkCustomBg
            : DARK_PRESETS.find((p) => p.id === selectedDark)?.swatchTo,
      });
    }

    closeConfirm();
  };

  const getLightLabel = () => {
    if (selectedLight === LIGHT_CUSTOM_ID) return 'Custom light colors';
    return LIGHT_PRESETS.find((p) => p.id === selectedLight)?.label ?? 'Light preset';
  };

  const getDarkLabel = () => {
    if (selectedDark === DARK_CUSTOM_ID) return 'Custom dark colors';
    return DARK_PRESETS.find((p) => p.id === selectedDark)?.label ?? 'Dark preset';
  };

  // PRESET: two stacked rectangles (top/bottom), square corners.
  const renderPresetSwatch = (
    preset: Preset,
    name: string,
    selectedId: string,
    onSelect: (id: string) => void,
  ) => (
    <label
      key={preset.id}
      className="flex flex-col items-center gap-1 cursor-pointer group"
    >
      <div className="w-8 h-10 border border-[var(--color-foreground)]/25 bg-[var(--color-background)] group-hover:border-[var(--color-foreground)]/60 transition-colors flex flex-col">
        <div className="flex-1" style={{ backgroundColor: preset.swatchFrom }} />
        <div className="flex-1" style={{ backgroundColor: preset.swatchTo }} />
      </div>
      <input
        type="radio"
        name={name}
        value={preset.id}
        checked={selectedId === preset.id}
        onChange={() => onSelect(preset.id)}
        className="h-3 w-3"
      />
    </label>
  );

  // CUSTOM: two stacked rectangles with grey outline + hex next to each, radio under blocks, nudged left.
  const renderCustomPicker = (
    mode: 'light' | 'dark',
    selectedId: string,
    onSelect: (id: string) => void,
  ) => {
    const isLight = mode === 'light';
    const customId = isLight ? LIGHT_CUSTOM_ID : DARK_CUSTOM_ID;
    const accent = isLight ? lightCustomAccent : darkCustomAccent;
    const bg = isLight ? lightCustomBg : darkCustomBg;
    const setAccent = isLight ? setLightCustomAccent : setDarkCustomAccent;
    const setBg = isLight ? setLightCustomBg : setDarkCustomBg;

    const blockBase =
      'h-4 w-8 border border-[var(--color-foreground)]/35 bg-[var(--color-background)] group-hover:border-[var(--color-foreground)]/60 transition-colors';

    const Row = ({
      value,
      onChange,
    }: {
      value: string;
      onChange: (hex: string) => void;
    }) => (
      <div className="flex items-center gap-2">
        <label className="relative cursor-pointer group">
          <input
            type="color"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              onSelect(customId);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className={blockBase} style={{ backgroundColor: value }} />
        </label>
        <span className="text-[10px] font-mono opacity-70">
          {value.toUpperCase()}
        </span>
      </div>
    );

    return (
      <div className="flex flex-col items-start gap-1 ml-3">
        <Row value={accent} onChange={setAccent} />
        <Row value={bg} onChange={setBg} />

        {/* Slightly more left under the color blocks */}
        <div className="mt-1 flex items-center justify-start w-8">
          <input
            type="radio"
            name={isLight ? 'lightPreset' : 'darkPreset'}
            value={customId}
            checked={selectedId === customId}
            onChange={() => onSelect(customId)}
            className="h-3 w-3 relative left-[9px]"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 text-xs">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-300">
          <FiSun className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-medium">Light &amp; Dark Mode Presets (Coming Soon)</h2>
          <p className="text-xs opacity-60">
            Pick default accent (header &amp; buttons) and background colors for each
            theme.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {/* DARK ROW FIRST */}
        <div className="flex items-center gap-3">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <FiMoon className="w-3 h-3 text-indigo-300" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">
                Dark mode
              </span>
            </div>

            <div className="flex items-end gap-3">
              {DARK_PRESETS.map((preset) =>
                renderPresetSwatch(preset, 'darkPreset', selectedDark, setSelectedDark),
              )}

              {renderCustomPicker('dark', selectedDark, setSelectedDark)}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-1 items-end">
            <button
              type="button"
              onClick={() => openConfirm('dark')}
              className="inline-flex w-full items-center justify-center rounded-md border border-emerald-500/60 bg-emerald-500/10 px-2 py-1.5 text-[11px] font-medium text-emerald-200 hover:bg-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-background)] transition-colors whitespace-nowrap"
            >
              Confirm Change
            </button>
          </div>
        </div>

        {/* LIGHT ROW */}
        <div className="flex items-center gap-3">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <FiSun className="w-3 h-3 text-amber-300" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">
                Light mode
              </span>
            </div>

            <div className="flex items-end gap-3">
              {LIGHT_PRESETS.map((preset) =>
                renderPresetSwatch(preset, 'lightPreset', selectedLight, setSelectedLight),
              )}

              {renderCustomPicker('light', selectedLight, setSelectedLight)}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-1 items-end">
            <button
              type="button"
              onClick={() => openConfirm('light')}
              className="inline-flex w-full items-center justify-center rounded-md border border-emerald-500/60 bg-emerald-500/10 px-2 py-1.5 text-[11px] font-medium text-emerald-200 hover:bg-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-background)] transition-colors whitespace-nowrap"
            >
              Confirm Change
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRM MODAL */}
      {confirmMode && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-xl border border-[var(--color-foreground)]/20 bg-[var(--color-background)] p-4 shadow-2xl space-y-3">
            <h3 className="text-sm font-semibold">
              Confirm {confirmMode === 'dark' ? 'dark mode' : 'light mode'} change
            </h3>
            <p className="text-[11px] opacity-70">
              You are about to apply the{' '}
              <span className="font-semibold">
                {confirmMode === 'dark' ? getDarkLabel() : getLightLabel()}
              </span>{' '}
              preset to your storefront theme.
            </p>
            <p className="text-[11px] opacity-70">
              To continue, type{' '}
              <span className="font-semibold tracking-[0.16em]">CONFIRM</span> in the box
              below and click <span className="font-semibold">Apply changes</span>.
            </p>

            <input
              autoFocus
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              className="w-full rounded-md border border-[var(--color-foreground)]/30 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/60"
              placeholder="Type CONFIRM to continue"
            />

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={closeConfirm}
                className="inline-flex items-center justify-center rounded-md border border-[var(--color-foreground)]/40 px-3 py-1.5 text-[11px] font-medium hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={confirmInput.trim().toUpperCase() !== 'CONFIRM'}
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Apply changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}