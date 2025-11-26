'use client';

import { useState } from 'react';
import { FiImage, FiUpload } from 'react-icons/fi';

type MediaKind = 'video' | 'image';

export default function HeroMediaSettings() {
  const [mainKind, setMainKind] = useState<MediaKind>('video');
  const [mainLabel, setMainLabel] = useState<string>('Runway hero video');
  const [secondaryLabel, setSecondaryLabel] = useState<string>('Rad Dad logo loop');

  // Later we’ll connect these to your Media Library / Supabase storage
  function handleFilePick(kind: 'main' | 'secondary') {
    // Placeholder; real implementation will open file picker + upload
    alert(
      `File picker for ${kind === 'main' ? 'main hero' : 'side hero'} media coming soon.`,
    );
  }

  return (
    <section className="rounded-xl border border-[var(--color-foreground)]/10 bg-[var(--color-foreground)]/[0.03] p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-cyan-500/15 flex items-center justify-center text-cyan-300">
          <FiImage className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-medium">Hero Media</h2>
          <p className="text-xs opacity-60">
            Choose the main hero video/image and the smaller side media.
          </p>
        </div>
      </div>

      <div className="space-y-3 text-xs">
        <div className="space-y-1">
          <label className="block font-medium">Main hero block</label>
          <div className="flex flex-col gap-2">
            <select
              className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/40"
              value={mainKind}
              onChange={(e) =>
                setMainKind((e.target.value as MediaKind) || 'video')
              }
            >
              <option value="video">Video</option>
              <option value="image">Image</option>
            </select>

            <div className="flex items-center justify-between gap-2">
              <input
                className="flex-1 rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/40"
                placeholder="Label / description"
                value={mainLabel}
                onChange={(e) => setMainLabel(e.target.value)}
              />
              <button
                onClick={() => handleFilePick('main')}
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 border border-[var(--color-foreground)]/20 bg-[var(--color-background)] hover:bg-[var(--color-foreground)]/10"
              >
                <FiUpload className="w-3 h-3" />
                Pick file
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block font-medium">Smaller side image/video</label>
          <div className="flex items-center justify-between gap-2">
            <input
              className="flex-1 rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/40"
              placeholder="Label / description"
              value={secondaryLabel}
              onChange={(e) => setSecondaryLabel(e.target.value)}
            />
            <button
              onClick={() => handleFilePick('secondary')}
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 border border-[var(--color-foreground)]/20 bg-[var(--color-background)] hover:bg-[var(--color-foreground)]/10"
            >
              <FiUpload className="w-3 h-3" />
              Pick file
            </button>
          </div>
        </div>

        <p className="text-[10px] opacity-60 pt-1">
          Implementation idea: link these selectors to your Media Library
          (images/videos stored in Supabase) plus a list of “preset” hero
          options we ship by default.
        </p>
      </div>
    </section>
  );
}