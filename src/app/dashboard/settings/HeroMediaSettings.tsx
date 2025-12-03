'use client';

import { useEffect, useRef, useState } from 'react';
import {
  FiImage,
  FiUpload,
  FiPlay,
  FiX,
  FiTrash2,
  FiPlus,
} from 'react-icons/fi';
import { supabaseBrowser } from '@/lib/supabase/client';

type MediaKind = 'video' | 'image';

type AdminHeroItem = {
  id: string;
  slot: 'main' | 'side';
  label: string;
  kind: MediaKind;
  storage_path: string;
  is_default: boolean;
  is_protected: boolean;
};

type AdminHeroConfig = {
  selected_main: string | null;
  selected_side: string | null;
};

type MediaItem = {
  id: string;
  label: string;
  kind: MediaKind;
  source: 'preset' | 'upload';
  isFromDb?: boolean;
  storage_path?: string | null;
};

// Helper so we only have one place that knows bucket + path
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
function buildPublicSrc(storagePath?: string | null) {
  if (!storagePath || !SUPABASE_URL) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/site-hero-media/${storagePath}`;
}

/* ---------- Re-usable preview block ---------- */
function MediaPreview({
  kind,
  label,
  variant,
  storagePath,
}: {
  kind: MediaKind;
  label: string;
  variant: 'wide' | 'tall';
  storagePath?: string | null;
}) {
  const base =
    'relative overflow-hidden rounded-lg border border-[var(--color-foreground)]/15 bg-black shadow-[0_0_18px_rgba(19,200,223,0.25)]';

  // Tweaked to feel closer to the live hero frames
  const size =
    variant === 'wide'
      ? 'w-full max-w-[420px] aspect-[4/3]'
      : 'w-full max-w-[260px] aspect-[4/3]';

  const publicSrc = buildPublicSrc(storagePath);

  return (
    <div className={`${base} ${size}`}>
      <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[9px] uppercase tracking-wide text-white/80">
        {kind === 'video' ? (
          <>
            <FiPlay className="h-3 w-3" /> Video
          </>
        ) : (
          <>
            <FiImage className="h-3 w-3" /> Image
          </>
        )}
      </div>

      {publicSrc ? (
        kind === 'video' ? (
          <video
            src={publicSrc}
            className="h-full w-full object-contain bg-black"
            muted
            loop
            playsInline
            autoPlay
          />
        ) : (
          <img
            src={publicSrc}
            alt={label}
            className="h-full w-full object-contain bg-black"
          />
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-black px-3 text-center text-[11px] leading-snug text-white">
          {label || (variant === 'wide' ? 'Hero preview' : 'Side media preview')}
        </div>
      )}
    </div>
  );
}

/* ---------- Modal for picking preset / uploads for ONE slot ---------- */
function MediaLibraryModal({
  open,
  title,
  forSlot,
  currentKind, // still here for future filtering if we want it
  onClose,
  onSelectPreset,
  presets,
  uploads,
  onAddUpload,
  onDeleteUpload,
}: {
  open: boolean;
  title: string;
  forSlot: 'main' | 'side';
  currentKind: MediaKind;
  onClose: () => void;
  onSelectPreset: (item: MediaItem) => void;
  presets: MediaItem[];
  uploads: MediaItem[];
  onAddUpload: () => void;
  onDeleteUpload: (id: string) => void;
}) {
  if (!open) return null;

  const slotLabel = forSlot === 'main' ? 'hero block' : 'side media';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-xl rounded-xl border border-[var(--color-foreground)]/20 bg-[var(--color-background)] p-4 shadow-2xl">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-[11px] opacity-60">
              Choose from our presets or your saved uploads for this {slotLabel}.
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-foreground)]/20 bg-[var(--color-foreground)]/5 hover:bg-[var(--color-foreground)]/15"
          >
            <FiX className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Presets */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                Preset options
              </p>
              <span className="rounded-full bg-[var(--color-foreground)]/10 px-2 py-0.5 text-[10px] opacity-70">
                {presets.length} available
              </span>
            </div>
            {presets.length === 0 ? (
              <p className="text-[10px] opacity-60">
                No presets from the database yet. We&apos;ll still use your manual
                labels above as the live hero content.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {presets.map((preset) => {
                  const thumbSrc = buildPublicSrc(preset.storage_path);
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        onSelectPreset(preset);
                        onClose();
                      }}
                      className="group flex flex-col items-stretch rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-foreground)]/[0.04] px-2 py-1.5 text-left hover:border-teal-400/70 hover:bg-[var(--color-foreground)]/[0.1]"
                    >
                      {/* Slightly taller + object-contain so it’s not super zoomed */}
                      <div className="mb-1 h-14 w-full overflow-hidden rounded-sm bg-black">
                        {thumbSrc &&
                          (preset.kind === 'video' ? (
                            <video
                              src={thumbSrc}
                              className="h-full w-full object-contain"
                              muted
                              loop
                              playsInline
                            />
                          ) : (
                            <img
                              src={thumbSrc}
                              alt={preset.label}
                              className="h-full w-full object-contain"
                            />
                          ))}
                      </div>
                      <div className="truncate text-[10px] font-medium">
                        {preset.label}
                      </div>
                      <div className="truncate text-[9px] opacity-60">
                        {preset.kind === 'video' ? 'Video preset' : 'Image preset'}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Uploads */}
          <section className="border-t border-[var(--color-foreground)]/10 pt-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                Your uploads
              </p>
              <button
                type="button"
                onClick={onAddUpload}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--color-foreground)]/25 bg-[var(--color-foreground)]/5 px-2 py-1 text-[10px] hover:bg-[var(--color-foreground)]/15"
              >
                <FiPlus className="h-3 w-3" /> Add upload
              </button>
            </div>

            {uploads.length === 0 ? (
              <p className="text-[10px] opacity-60">
                No uploads saved yet for this slot. Use{' '}
                <span className="inline-flex items-center gap-1 rounded bg-[var(--color-foreground)]/15 px-1.5 py-0.5">
                  <FiUpload className="h-3 w-3" /> Add upload
                </span>{' '}
                to pick a video or image from your device.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {uploads.map((item) => {
                  const thumbSrc = buildPublicSrc(item.storage_path);
                  return (
                    <div
                      key={item.id}
                      className="group flex flex-col rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-foreground)]/[0.04] p-1.5"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPreset(item);
                          onClose();
                        }}
                        className="flex flex-1 flex-col text-left"
                      >
                        {/* Same adjustment here */}
                        <div className="mb-1 h-14 w-full overflow-hidden rounded-sm bg-black">
                          {thumbSrc &&
                            (item.kind === 'video' ? (
                              <video
                                src={thumbSrc}
                                className="h-full w-full object-contain"
                                muted
                                loop
                                playsInline
                              />
                            ) : (
                              <img
                                src={thumbSrc}
                                alt={item.label}
                                className="h-full w-full object-contain"
                              />
                            ))}
                        </div>
                        <div className="truncate text-[10px] font-medium">
                          {item.label}
                        </div>
                        <div className="truncate text-[9px] opacity-60">
                          {item.kind === 'video'
                            ? 'Uploaded video'
                            : 'Uploaded image'}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteUpload(item.id)}
                        className="mt-1 inline-flex items-center gap-1 self-end rounded-md px-1.5 py-0.5 text-[9px] text-red-300 hover:bg-red-500/10"
                      >
                        <FiTrash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <p className="text-[10px] opacity-60">
            Uploads are saved to your Supabase <code>site-hero-media</code> bucket
            and stored in <code>hero_media_items</code>, so they&apos;ll still be
            available after you refresh this page.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ===================== MAIN SETTINGS CARD ===================== */

export default function HeroMediaSettings() {
  // Preview state (what you SEE in the card)
  const [mainKind, setMainKind] = useState<MediaKind>('video');
  const [mainLabel, setMainLabel] = useState<string>('Runway hero video');
  const [secondaryKind, setSecondaryKind] = useState<MediaKind>('image');
  const [secondaryLabel, setSecondaryLabel] =
    useState<string>('Rad Dad logo loop');
  const [mainPath, setMainPath] = useState<string | null>(null);
  const [secondaryPath, setSecondaryPath] = useState<string | null>(null);

  // Stored rows + config
  const [items, setItems] = useState<AdminHeroItem[]>([]);
  const [config, setConfig] = useState<AdminHeroConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Upload lists
  const [mainUploads, setMainUploads] = useState<MediaItem[]>([]);
  const [sideUploads, setSideUploads] = useState<MediaItem[]>([]);

  // Modals
  const [mainModalOpen, setMainModalOpen] = useState(false);
  const [sideModalOpen, setSideModalOpen] = useState(false);

  // Green "confirm hero change" modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [justConfirmed, setJustConfirmed] = useState(false);

  // Red "restore default" modal
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreSlot, setRestoreSlot] = useState<'main' | 'side' | null>(null);
  const [restoreText, setRestoreText] = useState('');
  const [restoring, setRestoring] = useState(false);

  // Hidden file inputs for uploads
  const mainFileInputRef = useRef<HTMLInputElement | null>(null);
  const sideFileInputRef = useRef<HTMLInputElement | null>(null);

  // IDs for live (saved) config vs. pending selections
  const [savedMainId, setSavedMainId] = useState<string | null>(null);
  const [savedSideId, setSavedSideId] = useState<string | null>(null);
  const [pendingMainId, setPendingMainId] = useState<string | null>(null);
  const [pendingSideId, setPendingSideId] = useState<string | null>(null);

  /* ---------- Initial load from admin API ---------- */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/hero-media/overview');
        if (!res.ok) return;

        const data = (await res.json()) as {
          items: AdminHeroItem[];
          config: AdminHeroConfig | null;
        };

        if (cancelled) return;

        setItems(data.items || []);
        setConfig(data.config ?? null);

        const toMediaItem = (i: AdminHeroItem): MediaItem => ({
          id: i.id,
          label: i.label,
          kind: i.kind,
          source: i.is_default ? 'preset' : 'upload',
          isFromDb: true,
          storage_path: i.storage_path,
        });

        setMainUploads(
          (data.items || [])
            .filter((i) => i.slot === 'main' && !i.is_default)
            .map(toMediaItem),
        );
        setSideUploads(
          (data.items || [])
            .filter((i) => i.slot === 'side' && !i.is_default)
            .map(toMediaItem),
        );

        const pickForSlot = (
          slot: 'main' | 'side',
        ): AdminHeroItem | undefined => {
          const selectedId =
            slot === 'main'
              ? data.config?.selected_main ?? null
              : data.config?.selected_side ?? null;

          const fromConfig = data.items.find(
            (item) => item.id === selectedId && item.slot === slot,
          );
          if (fromConfig) return fromConfig;

          const def = data.items.find(
            (item) => item.slot === slot && item.is_default === true,
          );
          if (def) return def;

          return data.items.find((item) => item.slot === slot);
        };

        const mainItem = pickForSlot('main');
        const sideItem = pickForSlot('side');

        if (mainItem) {
          setMainKind(mainItem.kind);
          setMainLabel(mainItem.label);
          setMainPath(mainItem.storage_path);
          setSavedMainId(mainItem.id);
        }
        if (sideItem) {
          setSecondaryKind(sideItem.kind);
          setSecondaryLabel(sideItem.label);
          setSecondaryPath(sideItem.storage_path);
          setSavedSideId(sideItem.id);
        }
      } catch (err) {
        console.error('Failed to load hero media admin overview', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- Save selection to API (ONLY called on confirm / restore / delete) ---------- */
  async function updateSelection(slot: 'main' | 'side', itemId: string | null) {
    try {
      const res = await fetch('/api/admin/hero-media/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot, itemId }),
      });

      if (!res.ok) {
        console.error('Failed to update hero media selection', await res.text());
        return;
      }

      setConfig((prev) => {
        const next: AdminHeroConfig = {
          selected_main: prev?.selected_main ?? null,
          selected_side: prev?.selected_side ?? null,
        };
        if (slot === 'main') next.selected_main = itemId;
        else next.selected_side = itemId;
        return next;
      });

      if (slot === 'main') {
        setSavedMainId(itemId);
        // once live, clear pending
        setPendingMainId(null);
      } else {
        setSavedSideId(itemId);
        setPendingSideId(null);
      }
    } catch (err) {
      console.error('Failed to update hero media selection', err);
    }
  }

  /* ---------- Upload helper (real Supabase upload) ---------- */
  function triggerUpload(slot: 'main' | 'side') {
    if (slot === 'main') mainFileInputRef.current?.click();
    else sideFileInputRef.current?.click();
  }

  async function handleFileInputChange(
    e: React.ChangeEvent<HTMLInputElement>,
    slot: 'main' | 'side',
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    const supabase = supabaseBrowser;
    const kind: MediaKind = file.type.startsWith('video') ? 'video' : 'image';

    const cleanName = file.name.replace(/[^\w.-]+/g, '_').toLowerCase();
    const path = `${slot}/${Date.now()}-${cleanName}`;

    const { error: uploadError } = await supabase.storage
      .from('site-hero-media')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Upload error', uploadError);
      alert('Upload failed – check console for details.');
      e.target.value = '';
      return;
    }

    const { data, error: insertError } = await supabase
      .from('hero_media_items')
      .insert({
        slot,
        label: file.name,
        kind,
        storage_path: path,
        is_default: false,
        is_protected: false,
      })
      .select('*')
      .single();

    if (insertError || !data) {
      console.error('Insert hero_media_items error', insertError);
      alert('Saving uploaded media failed – see console.');
      e.target.value = '';
      return;
    }

    const newRow = data as AdminHeroItem;
    setItems((prev) => [...prev, newRow]);

    const mediaItem: MediaItem = {
      id: newRow.id,
      label: newRow.label,
      kind: newRow.kind,
      source: 'upload',
      isFromDb: true,
      storage_path: newRow.storage_path,
    };

    if (slot === 'main') {
      setMainUploads((prev) => [...prev, mediaItem]);
      setMainKind(mediaItem.kind);
      setMainLabel(mediaItem.label);
      setMainPath(mediaItem.storage_path ?? null);
      setPendingMainId(newRow.id); // draft – not live until confirm
    } else {
      setSideUploads((prev) => [...prev, mediaItem]);
      setSecondaryKind(mediaItem.kind);
      setSecondaryLabel(mediaItem.label);
      setSecondaryPath(mediaItem.storage_path ?? null);
      setPendingSideId(newRow.id); // draft – not live until confirm
    }

    // allow re-selecting the same file if needed
    e.target.value = '';
  }

  /* ---------- Delete helper (bucket + DB + state) ---------- */
  async function handleDeleteUpload(slot: 'main' | 'side', id: string) {
    const supabase = supabaseBrowser;

    // Find the row we’re deleting
    const row = items.find((i) => i.id === id);
    if (!row) {
      // Just clean local state if somehow not in items[]
      if (slot === 'main') {
        setMainUploads((prev) => prev.filter((u) => u.id !== id));
      } else {
        setSideUploads((prev) => prev.filter((u) => u.id !== id));
      }
      return;
    }

    // Safety: never delete protected/default rows
    if (row.is_protected || row.is_default) {
      alert('This preset is protected and cannot be deleted.');
      return;
    }

    // Compute remaining items for this slot (for fallback)
    const remainingForSlot = items.filter(
      (i) => i.id !== id && i.slot === slot,
    );
    const fallback =
      remainingForSlot.find((i) => i.is_default) ?? remainingForSlot[0] ?? null;

    // Is this the currently selected *live* item?
    const isCurrent =
      slot === 'main'
        ? config?.selected_main === id
        : config?.selected_side === id;

    // If the config currently points at this row, update config FIRST
    if (isCurrent) {
      if (fallback) {
        if (slot === 'main') {
          setMainKind(fallback.kind);
          setMainLabel(fallback.label);
          setMainPath(fallback.storage_path);
        } else {
          setSecondaryKind(fallback.kind);
          setSecondaryLabel(fallback.label);
          setSecondaryPath(fallback.storage_path);
        }
        await updateSelection(slot, fallback.id);
      } else {
        if (slot === 'main') {
          setMainPath(null);
          setMainLabel('');
        } else {
          setSecondaryPath(null);
          setSecondaryLabel('');
        }
        await updateSelection(slot, null);
      }
    }

    // Also clear pending if it pointed at this id
    if (slot === 'main' && pendingMainId === id) {
      setPendingMainId(null);
    }
    if (slot === 'side' && pendingSideId === id) {
      setPendingSideId(null);
    }

    // Optimistic local state update
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (slot === 'main') {
      setMainUploads((prev) => prev.filter((u) => u.id !== id));
    } else {
      setSideUploads((prev) => prev.filter((u) => u.id !== id));
    }

    // Delete from storage (if path present)
    if (row.storage_path) {
      const { error: storageError } = await supabase.storage
        .from('site-hero-media')
        .remove([row.storage_path]);

      if (storageError) {
        console.error('Storage delete error', storageError);
      }
    }

    // Now safe to delete DB row (config already updated if needed)
    const { error: dbError } = await supabase
      .from('hero_media_items')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('hero_media_items delete error', dbError);
    }
  }

  /* ---------- When you click something in the modal – update preview + pending only ---------- */
  function selectForMain(item: MediaItem) {
    setMainKind(item.kind);
    setMainLabel(item.label);
    if (item.storage_path) setMainPath(item.storage_path);
    setPendingMainId(item.id); // draft – API later on confirm
  }

  function selectForSide(item: MediaItem) {
    setSecondaryKind(item.kind);
    setSecondaryLabel(item.label);
    if (item.storage_path) setSecondaryPath(item.storage_path);
    setPendingSideId(item.id); // draft – API later on confirm
  }

  const toMediaItem = (i: AdminHeroItem): MediaItem => ({
    id: i.id,
    label: i.label,
    kind: i.kind,
    source: i.is_default ? 'preset' : 'upload',
    isFromDb: true,
    storage_path: i.storage_path,
  });

  const mainPresets: MediaItem[] = items
    .filter((i) => i.slot === 'main' && i.is_default)
    .map(toMediaItem);

  const sidePresets: MediaItem[] = items
    .filter((i) => i.slot === 'side' && i.is_default)
    .map(toMediaItem);

  /* ---------- Green confirm modal handler ---------- */
  async function handleConfirmSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (confirmText.trim().toUpperCase() !== 'CONFIRM') return;

    try {
      setConfirming(true);

      // Commit any pending changes to the DB
      const ops: Promise<void>[] = [];

      if (pendingMainId && pendingMainId !== savedMainId) {
        ops.push(updateSelection('main', pendingMainId));
      }

      if (pendingSideId && pendingSideId !== savedSideId) {
        ops.push(updateSelection('side', pendingSideId));
      }

      if (ops.length > 0) {
        await Promise.all(ops);
      }

      setJustConfirmed(true);
      setTimeout(() => setJustConfirmed(false), 3000);
    } finally {
      setConfirming(false);
      setConfirmOpen(false);
      setConfirmText('');
    }
  }

  /* ---------- Restore default handler (red modal) ---------- */
  async function handleRestoreSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (restoreText.trim().toUpperCase() !== 'CONFIRM' || !restoreSlot) return;

    try {
      setRestoring(true);
      const def = items.find(
        (i) => i.slot === restoreSlot && i.is_default === true,
      );
      if (!def) {
        console.warn('No default hero_media_item found for slot', restoreSlot);
      } else {
        if (restoreSlot === 'main') {
          setMainKind(def.kind);
          setMainLabel(def.label);
          setMainPath(def.storage_path);
          setPendingMainId(null); // no draft; default is now live
        } else {
          setSecondaryKind(def.kind);
          setSecondaryLabel(def.label);
          setSecondaryPath(def.storage_path);
          setPendingSideId(null);
        }
        await updateSelection(restoreSlot, def.id);
        setJustConfirmed(true);
        setTimeout(() => setJustConfirmed(false), 3000);
      }
    } catch (err) {
      console.error('Failed to restore hero media default', err);
    } finally {
      setRestoring(false);
      setRestoreOpen(false);
      setRestoreSlot(null);
      setRestoreText('');
    }
  }

  function openRestoreModal(slot: 'main' | 'side') {
    setRestoreSlot(slot);
    setRestoreText('');
    setRestoreOpen(true);
  }

  return (
    <>
      <section className="flex flex-col gap-3 rounded-xl border border-[var(--color-foreground)]/10 bg-[var(--color-foreground)]/[0.03] p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-300">
            <FiImage className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-medium">Hero Media</h2>
            <p className="text-xs opacity-60">
              Choose the main hero video/image and the smaller side media.
            </p>
            {loading && (
              <p className="mt-0.5 text-[10px] opacity-50">
                Loading current hero media…
              </p>
            )}
          </div>
        </div>

        <div className="mt-2 space-y-5 text-xs">
          {/* MAIN HERO BLOCK */}
          <div className="space-y-2.5">
            <label className="block text-xs font-medium">
              Main hero video / image
            </label>

            <div className="flex flex-col gap-2">
              <input
                className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/40"
                placeholder="Label / description"
                value={mainLabel}
                onChange={(e) => setMainLabel(e.target.value)}
              />
            </div>

            {/* Main preview + actions */}
            <div className="mt-1 flex gap-3">
              <div className="w-2/3">
                <MediaPreview
                  kind={mainKind}
                  label={mainLabel}
                  variant="wide"
                  storagePath={mainPath}
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 items-stretch max-w-[210px]">
                <button
                  type="button"
                  onClick={() => setMainModalOpen(true)}
                  className="inline-flex w-full items-center justify-center rounded-md border border-[var(--color-foreground)]/25 bg-[var(--color-foreground)]/10 px-2 py-1.5 text-[11px] hover:bg-[var(--color-foreground)]/20"
                >
                  Open media library
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className="inline-flex w-full items-center justify-center rounded-md border border-emerald-500/60 bg-emerald-500/10 px-2 py-1.5 text-[11px] font-medium text-emerald-200 hover:bg-emerald-500/20"
                >
                  Confirm change
                </button>
                <button
                  type="button"
                  onClick={() => openRestoreModal('main')}
                  className="inline-flex w-full items-center justify-center rounded-md border border-red-500/60 bg-red-500/10 px-2 py-1.5 text-[11px] font-medium text-red-200 hover:bg-red-500/20"
                >
                  Restore default
                </button>
                <p className="text-[10px] opacity-60">
                  Includes default and seasonal hero presets plus any uploads you
                  save for this block.
                </p>
              </div>
            </div>
          </div>

          {/* SIDE HERO BLOCK */}
          <div className="border-t border-[var(--color-foreground)]/10 pt-4 space-y-2.5">
            <label className="block text-xs font-medium">
              Smaller side image / video
            </label>

            <div className="flex flex-col gap-2">
              <input
                className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/40"
                placeholder="Label / description"
                value={secondaryLabel}
                onChange={(e) => setSecondaryLabel(e.target.value)}
              />
            </div>

            {/* Side preview + actions */}
            <div className="mt-1 flex gap-3">
              <div className="w-2/3">
                <MediaPreview
                  kind={secondaryKind}
                  label={secondaryLabel}
                  variant="tall"
                  storagePath={secondaryPath}
                />
              </div>
              <div className="flex flex-1 flex-col gap-2 items-stretch max-w-[210px]">
                <button
                  type="button"
                  onClick={() => setSideModalOpen(true)}
                  className="inline-flex w-full items-center justify-center rounded-md border border-[var(--color-foreground)]/25 bg-[var(--color-foreground)]/10 px-2 py-1.5 text-[11px] hover:bg-[var(--color-foreground)]/20"
                >
                  Open media library
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className="inline-flex w-full items-center justify-center rounded-md border border-emerald-500/60 bg-emerald-500/10 px-2 py-1.5 text-[11px] font-medium text-emerald-200 hover:bg-emerald-500/20"
                >
                  Confirm change
                </button>
                <button
                  type="button"
                  onClick={() => openRestoreModal('side')}
                  className="inline-flex w-full items-center justify-center rounded-md border border-red-500/60 bg-red-500/10 px-2 py-1.5 text-[11px] font-medium text-red-200 hover:bg-red-500/20"
                >
                  Restore default
                </button>
                <p className="text-[10px] opacity-60">
                  Swap between logo loops, seasonal badges, or your own uploaded
                  side graphics and clips.
                </p>
              </div>
            </div>

            {justConfirmed && (
              <p className="pt-1 text-right text-[10px] text-emerald-300">
                Confirmed – your current hero media selection is now live on the
                homepage.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Hidden file inputs for uploads */}
      <input
        ref={mainFileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => handleFileInputChange(e, 'main')}
      />
      <input
        ref={sideFileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => handleFileInputChange(e, 'side')}
      />

      {/* MAIN MODAL */}
      <MediaLibraryModal
        open={mainModalOpen}
        title="Main hero media library"
        forSlot="main"
        currentKind={mainKind}
        onClose={() => setMainModalOpen(false)}
        presets={mainPresets}
        uploads={mainUploads}
        onSelectPreset={selectForMain}
        onAddUpload={() => triggerUpload('main')}
        onDeleteUpload={(id) => handleDeleteUpload('main', id)}
      />

      {/* SIDE MODAL */}
      <MediaLibraryModal
        open={sideModalOpen}
        title="Side hero media library"
        forSlot="side"
        currentKind={secondaryKind}
        onClose={() => setSideModalOpen(false)}
        presets={sidePresets}
        uploads={sideUploads}
        onSelectPreset={selectForSide}
        onAddUpload={() => triggerUpload('side')}
        onDeleteUpload={(id) => handleDeleteUpload('side', id)}
      />

      {/* GREEN CONFIRM MODAL */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl border border-emerald-500/40 bg-[var(--color-background)] p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-emerald-200">
                  Confirm hero media change
                </h3>
                <p className="mt-1 text-[11px] opacity-70">
                  This will update the hero media selection on the public
                  website. Type <strong>CONFIRM</strong> to proceed.
                </p>
              </div>
              <button
                onClick={() => setConfirmOpen(false)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-foreground)]/30 bg-[var(--color-foreground)]/10 hover:bg-[var(--color-foreground)]/20"
              >
                <FiX className="h-3.5 w-3.5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSubmit} className="mt-4 space-y-3">
              <input
                autoFocus
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type CONFIRM to continue"
                className="w-full rounded-md border border-emerald-500/40 bg-[var(--color-background)] px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-emerald-400/60"
              />
              <div className="flex justify-end gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  className="rounded-md border border-[var(--color-foreground)]/25 px-3 py-1 hover:bg-[var(--color-foreground)]/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    confirming ||
                    confirmText.trim().toUpperCase() !== 'CONFIRM'
                  }
                  className="rounded-md bg-emerald-500/80 px-3 py-1 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-emerald-500"
                >
                  {confirming ? 'Applying…' : 'Apply change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RED RESTORE DEFAULT MODAL */}
      {restoreOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl border border-red-500/40 bg-[var(--color-background)] p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-red-200">
                  Restore default hero media
                </h3>
                <p className="mt-1 text-[11px] opacity-70">
                  This will revert the {restoreSlot === 'side' ? 'side block' : 'main block'} to
                  its default preset and update the live site. Type{' '}
                  <strong>CONFIRM</strong> to proceed.
                </p>
              </div>
              <button
                onClick={() => setRestoreOpen(false)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-foreground)]/30 bg-[var(--color-foreground)]/10 hover:bg-[var(--color-foreground)]/20"
              >
                <FiX className="h-3.5 w-3.5" />
              </button>
            </div>

            <form onSubmit={handleRestoreSubmit} className="mt-4 space-y-3">
              <input
                autoFocus
                value={restoreText}
                onChange={(e) => setRestoreText(e.target.value)}
                placeholder="Type CONFIRM to continue"
                className="w-full rounded-md border border-red-500/40 bg-[var(--color-background)] px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-red-400/60"
              />
              <div className="flex justify-end gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setRestoreOpen(false)}
                  className="rounded-md border border-[var(--color-foreground)]/25 px-3 py-1 hover:bg-[var(--color-foreground)]/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    restoring ||
                    restoreText.trim().toUpperCase() !== 'CONFIRM'
                  }
                  className="rounded-md bg-red-500/80 px-3 py-1 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-red-500"
                >
                  {restoring ? 'Restoring…' : 'Restore default'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}