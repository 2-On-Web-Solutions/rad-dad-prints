'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  FiUpload,
  FiTrash2,
  FiX,
  FiImage,
  FiGrid,
  FiLayout,
  FiTag,
  FiEdit2,
  FiPlus,
  FiSearch,
} from 'react-icons/fi';

import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { supabaseBrowser } from '@/lib/supabase/client';

// ----------------------------
// Types
// ----------------------------
type MediaItem = {
  id: string;
  url: string;
  type: 'image' | 'video';
  caption: string;
  tags: string[];
  created_at: string;
  sort_order: number;
  storage_path?: string; // <- tracked for safe deletion
};

// ----------------------------
// MAIN COMPONENT
// ----------------------------
export default function MediaManager() {
  // ===== CORE STATE =====
  const [items, setItems] = useState<MediaItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftItem, setDraftItem] = useState<MediaItem | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);

  const [layoutMode, setLayoutMode] = useState<'grid' | 'cards'>('grid');

  const [search, setSearch] = useState('');
  const [newTag, setNewTag] = useState('');

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const draftFileRef = useRef<File | null>(null);

  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);

  // meta-update status
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [metaSaveStatus, setMetaSaveStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');

  // local edit state for caption/tags so we don't thrash the gallery on every keypress
  const [detailCaption, setDetailCaption] = useState('');
  const [detailTags, setDetailTags] = useState<string[]>([]);

  // ===== LOAD FROM SUPABASE ON MOUNT =====
  useEffect(() => {
    async function loadMedia() {
      const supabase = supabaseBrowser;

      const { data, error } = await supabase
        .from('media_assets')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error loading media_assets:', error);
        return;
      }

      const mapped: MediaItem[] =
        (data || []).map((row: any) => ({
          id: row.id,
          url: row.public_url,
          type: row.type,
          caption: row.caption ?? '',
          tags: row.tags ?? [],
          created_at: row.created_at,
          sort_order: row.sort_order ?? 0,
          storage_path: row.storage_path ?? undefined,
        })) || [];

      setItems(mapped);

      if (mapped.length > 0) {
        setSelectedId(mapped[0].id);
        setIsPanelOpen(true);
      }
    }

    loadMedia();
  }, []);

  // ===== DERIVED =====
  const activeItem: MediaItem | null = draftItem
    ? draftItem
    : items.find((i) => i.id === selectedId) || null;

  // keep local detail state in sync when the active/draft item changes
  useEffect(() => {
    if (draftItem) {
      setDetailCaption(draftItem.caption);
      setDetailTags(draftItem.tags);
    } else if (activeItem) {
      setDetailCaption(activeItem.caption);
      setDetailTags(activeItem.tags);
    } else {
      setDetailCaption('');
      setDetailTags([]);
    }
  }, [draftItem, activeItem]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = [...items].sort((a, b) => a.sort_order - b.sort_order);

    if (!q) return base;

    return base.filter(
      (item) =>
        item.caption.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [items, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / pageSize || 1)
  );
  const currentPage = Math.min(page, totalPages);
  const sliceStart = (currentPage - 1) * pageSize;
  const sliceEnd = sliceStart + pageSize;
  const pagedItems = filteredItems.slice(sliceStart, sliceEnd);

  // ===== UPLOAD / DRAFT FLOW =====
  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const isVideo = file.type.startsWith('video');
    const objectUrl = URL.createObjectURL(file);

    const nextSortOrder =
      items.length === 0
        ? 0
        : Math.max(...items.map((i) => i.sort_order)) + 1;

    const staged: MediaItem = {
      id: `local-${Date.now()}`, // temp id on client
      url: objectUrl,
      type: isVideo ? 'video' : 'image',
      caption: file.name.replace(/\.[^/.]+$/, ''), // filename minus extension
      tags: ['new'],
      created_at: new Date().toISOString(),
      sort_order: nextSortOrder,
    };

    setDraftItem(staged);
    draftFileRef.current = file;
    setIsPanelOpen(true);
  }

  // secure upload via /api/media/upload (server-side Supabase)
  async function confirmAddDraftToGallery() {
    if (!draftItem || !draftFileRef.current) return;

    const file = draftFileRef.current;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('caption', draftItem.caption);
    formData.append('tags', draftItem.tags.join(','));
    formData.append('sort_order', String(draftItem.sort_order ?? 0));

    const res = await fetch('/api/media/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      console.error('Upload API failed', errBody);
      return;
    }

    // The route should respond with { item: { ...dbRowMapped } }
    const { item } = await res.json();

    const newItem: MediaItem = {
      id: item.id,
      url: item.url,
      type: item.type,
      caption: item.caption,
      tags: item.tags,
      created_at: item.created_at,
      sort_order: item.sort_order,
      storage_path: item.storage_path,
    };

    setItems((prev) => [newItem, ...prev]);
    setSelectedId(newItem.id);
    setIsPanelOpen(true);

    setDraftItem(null);
    draftFileRef.current = null;
  }

  function cancelDraft() {
    setDraftItem(null);
    draftFileRef.current = null;
    if (!selectedId) {
      setIsPanelOpen(false);
    }
  }

  // ===== EDIT / DELETE =====
  function handleSelect(id: string) {
    setSelectedId(id);
    setDraftItem(null);
    setIsPanelOpen(true);
    setMetaSaveStatus('idle');
  }

  async function handleDelete(id: string) {
    if (draftItem && draftItem.id === id) {
      cancelDraft();
      return;
    }

    const toDelete = items.find((m) => m.id === id);
    if (!toDelete) return;

    const res = await fetch('/api/media/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: toDelete.id,
        storage_path: toDelete.storage_path ?? null,
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      console.error('Delete API failed', errBody);
      return;
    }

    setItems((prev) => prev.filter((m) => m.id !== id));

    if (selectedId === id) {
      const remaining = items.filter((m) => m.id !== id);
      if (remaining.length) {
        setSelectedId(remaining[0].id);
      } else {
        setSelectedId(null);
        setIsPanelOpen(false);
      }
    }
  }

  // local-only edits for caption/tags (persist when Update button is clicked)
  function updateCaption(newCaption: string) {
    setMetaSaveStatus('idle');

    if (draftItem) {
      setDraftItem({ ...draftItem, caption: newCaption });
      // detailCaption will be synced from draft via useEffect
      return;
    }

    setDetailCaption(newCaption);
  }

  function addTagToActiveItem() {
    const value = newTag.trim();
    if (!value) return;

    setMetaSaveStatus('idle');

    if (draftItem && activeItem && draftItem.id === activeItem.id) {
      if (!draftItem.tags.includes(value)) {
        setDraftItem({
          ...draftItem,
          tags: [...draftItem.tags, value],
        });
      }
      setNewTag('');
      return;
    }

    if (!detailTags.includes(value)) {
      setDetailTags((prev) => [...prev, value]);
    }
    setNewTag('');
  }

  function removeTagFromActiveItem(tag: string) {
    setMetaSaveStatus('idle');

    if (draftItem && activeItem && draftItem.id === activeItem.id) {
      setDraftItem({
        ...draftItem,
        tags: draftItem.tags.filter((t) => t !== tag),
      });
      return;
    }

    setDetailTags((prev) => prev.filter((t) => t !== tag));
  }

  // Save caption/tags of the current non-draft item to Supabase
  async function handleSaveMeta() {
    if (!activeItem) return;
    if (draftItem && draftItem.id === activeItem.id) return;

    setIsSavingMeta(true);
    setMetaSaveStatus('idle');

    // optimistic local update so cards reflect the new data
    setItems((prev) =>
      prev.map((m) =>
        m.id === activeItem.id
          ? { ...m, caption: detailCaption, tags: detailTags }
          : m
      )
    );

    try {
      const res = await fetch('/api/media/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeItem.id,
          caption: detailCaption,
          tags: detailTags,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        console.error('Failed to update media meta', body);
        setMetaSaveStatus('error');
      } else {
        setMetaSaveStatus('success');
      }
    } catch (err) {
      console.error('Unexpected error while updating media meta', err);
      setMetaSaveStatus('error');
    } finally {
      setIsSavingMeta(false);
      setTimeout(() => setMetaSaveStatus('idle'), 2000);
    }
  }

  // ===== DRAG & DROP =====
  function ThumbCard({
    item,
    onSelect,
    onDelete,
    isActive,
    layoutMode,
    dragHandleProps,
  }: {
    item: MediaItem;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    isActive: boolean;
    layoutMode: 'grid' | 'cards';
    dragHandleProps: {
      attributes: Record<string, any>;
      listeners?: Record<string, any>;
    };
  }) {
    const baseClasses =
      layoutMode === 'grid'
        ? `
          relative rounded-lg overflow-hidden
          border ${
            isActive
              ? 'border-teal-400'
              : 'border-[var(--color-foreground)]/20'
          }
          bg-[var(--color-foreground)]/[0.03] hover:bg-[var(--color-foreground)]/10
          transition
        `
        : `
          relative rounded-xl overflow-hidden
          border ${
            isActive
              ? 'border-teal-400'
              : 'border-[var(--color-foreground)]/20'
          }
          bg-[var(--color-foreground)]/[0.03] hover:bg-[var(--color-foreground)]/10
          transition flex flex-col
        `;

    const innerMediaClasses =
      layoutMode === 'grid'
        ? 'h-32 w-full'
        : 'h-40 w-full';

    return (
      <div className={baseClasses}>
        {/* overlay row: drag handle + delete */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between z-10 pointer-events-none">
          {/* drag handle */}
          <button
            className="
              text-[10px] leading-none text-[var(--color-foreground)]/60
              bg-[var(--color-background)]/60 backdrop-blur
              border border-[var(--color-foreground)]/30 rounded px-1 py-[2px]
              hover:text-[var(--color-foreground)]
              cursor-grab
            "
            style={{ pointerEvents: 'auto' }}
            title="Drag to reorder"
            {...dragHandleProps.attributes}
            {...(dragHandleProps.listeners ?? {})}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            ⋮⋮
          </button>

          {/* delete button */}
          <button
            className="
              text-[10px] leading-none text-[var(--color-foreground)]/80
              bg-[var(--color-background)]/60 backdrop-blur
              border border-[var(--color-foreground)]/30 rounded px-1 py-[2px]
              hover:bg-[var(--color-foreground)]/10 hover:text-[var(--color-foreground)]
            "
            style={{ pointerEvents: 'auto' }}
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
          >
            <FiTrash2 className="w-3 h-3" />
          </button>
        </div>

        {/* main clickable body */}
        <div
          className="cursor-pointer"
          onClick={() => onSelect(item.id)}
        >
          {item.type === 'image' ? (
            <div
              className={`${innerMediaClasses} flex items-center justify-center bg-black/40`}
            >
              <img
                src={item.url}
                alt={item.caption || 'media preview'}
                className="max-h-full max-w-full object-contain"
                draggable={false}
              />
            </div>
          ) : (
            <div
              className={`${innerMediaClasses} flex items-center justify-center bg-black/50`}
            >
              <div className="text-xs flex items-center gap-2 opacity-80">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-black/60 border border-white/20 text-[10px]">
                  ▶
                </span>
                <span>Video</span>
              </div>
            </div>
          )}

          <div className="p-3 flex flex-col gap-2 text-[11px]">
            <div className="min-w-0">
              <div className="font-medium truncate text-[var(--color-foreground)]">
                {item.caption || 'Untitled'}
              </div>
              <div className="opacity-60 truncate">
                {item.tags.slice(0, 2).join(', ')}
                {item.tags.length > 2 ? '…' : ''}
              </div>
            </div>

            <div className="opacity-40 text-[10px] flex items-center gap-2">
              <span>{item.type === 'image' ? 'Image' : 'Video'}</span>
              <span>•</span>
              <span>
                {new Date(item.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function SortableThumbCard({
    item,
    isActive,
    layoutMode,
    onSelect,
    onDelete,
  }: {
    item: MediaItem;
    isActive: boolean;
    layoutMode: 'grid' | 'cards';
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: item.id });

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.4 : 1,
    };

    return (
      <div ref={setNodeRef} style={style}>
        <ThumbCard
          item={item}
          isActive={isActive}
          layoutMode={layoutMode}
          onSelect={onSelect}
          onDelete={onDelete}
          dragHandleProps={{
            attributes,
            listeners,
          }}
        />
      </div>
    );
  }

  // Persist updated sort_order values via secure API route
  async function persistSortOrderToDB(updatedItems: MediaItem[]) {
    try {
      const payload = updatedItems.map((m) => ({
        id: m.id,
        sort_order: m.sort_order ?? 0,
      }));

      const res = await fetch('/api/media/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payload }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        console.error('Failed to persist media sort_order', body);
      }
    } catch (err) {
      console.error(
        'Unexpected error while saving media sort_order',
        err
      );
    }
  }

  // after drag, update local ordering AND persist to DB
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentIds = pagedItems.map((i) => i.id);

    const oldIndex = currentIds.indexOf(active.id as string);
    const newIndex = currentIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedVisible = arrayMove(pagedItems, oldIndex, newIndex);

    const newVisibleOrderMap: Record<string, number> = {};
    reorderedVisible.forEach((item, idx) => {
      newVisibleOrderMap[item.id] = idx;
    });

    const fullSorted = [...items].sort(
      (a, b) => a.sort_order - b.sort_order
    );

    const merged = fullSorted.map((it) => {
      if (newVisibleOrderMap[it.id] !== undefined) {
        return {
          ...it,
          sort_order: sliceStart + newVisibleOrderMap[it.id],
        };
      }
      return it;
    });

    const resorted = merged.sort(
      (a, b) => a.sort_order - b.sort_order
    );

    const reindexed = resorted.map((it, idx) => ({
      ...it,
      sort_order: idx,
    }));

    setItems(reindexed);
    void persistSortOrderToDB(reindexed);
  }

  // ===== PAGER UI =====
  function Pager({
    align = 'center',
  }: {
    align?: 'left' | 'center' | 'right';
  }) {
    const justify =
      align === 'left'
        ? 'justify-start'
        : align === 'right'
        ? 'justify-end'
        : 'justify-center';

    return (
      <div
        className={`flex items-center ${justify} gap-4 text-sm flex-shrink-0`}
      >
        <button
          disabled={currentPage === 1}
          className={`
            px-3 py-1 rounded-md border border-[var(--color-foreground)]/20
            ${
              currentPage === 1
                ? 'opacity-30 cursor-not-allowed'
                : 'hover:bg-[var(--color-foreground)]/10 transition'
            }
          `}
          onClick={() => {
            if (currentPage > 1) setPage(currentPage - 1);
          }}
        >
          Prev
        </button>

        <div className="opacity-70 text-xs">
          Page {currentPage} / {totalPages}
        </div>

        <button
          disabled={currentPage === totalPages}
          className={`
            px-3 py-1 rounded-md border border-[var(--color-foreground)]/20
            ${
              currentPage === totalPages
                ? 'opacity-30 cursor-not-allowed'
                : 'hover:bg-[var(--color-foreground)]/10 transition'
            }
          `}
          onClick={() => {
            if (currentPage < totalPages) setPage(currentPage + 1);
          }}
        >
          Next
        </button>
      </div>
    );
  }

  // ===== RENDER =====
  return (
    <section className="max-w-[1400px] mx-auto pb-24 flex flex-col gap-6">
      {/* hidden file input for uploads */}
      <input
        type="file"
        accept="image/*,video/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChosen}
      />

      {/* HEADER / ACTION BAR */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        {/* left: title/desc */}
        <div>
          <h1 className="text-3xl font-semibold mb-1">
            Media Library
          </h1>
          <p className="opacity-70 text-sm max-w-[60ch]">
            Upload print photos, timelapses, and behind-the-scenes
            shots. Tag them for reuse on the site (gallery, product
            pages, bundles).
          </p>
        </div>

        {/* right: actions + top pager */}
        <div className="flex flex-col items-start sm:items-end gap-4">
          {/* action bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Upload / start draft */}
            <button
              onClick={handleUploadClick}
              className="
                inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium
                border border-[var(--color-foreground)]/20
                bg-[var(--color-foreground)]/5 hover:bg-[var(--color-foreground)]/10
                transition
              "
            >
              <FiUpload className="text-lg" />
              <span>
                {draftItem ? 'Replace Draft' : 'Upload Media'}
              </span>
            </button>

            {/* Layout toggle */}
            <div
              className="
                flex items-stretch rounded-lg overflow-hidden border border-[var(--color-foreground)]/20
                bg-[var(--color-foreground)]/5 text-sm
              "
            >
              <button
                onClick={() => setLayoutMode('grid')}
                className={`
                  px-3 py-2 flex items-center gap-2 transition
                  ${
                    layoutMode === 'grid'
                      ? 'bg-[var(--color-foreground)]/20'
                      : 'hover:bg-[var(--color-foreground)]/10'
                  }
                `}
                title="Dense grid"
              >
                <FiGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setLayoutMode('cards')}
                className={`
                  px-3 py-2 flex items-center gap-2 transition border-l border-[var(--color-foreground)]/20
                  ${
                    layoutMode === 'cards'
                      ? 'bg-[var(--color-foreground)]/20'
                      : 'hover:bg-[var(--color-foreground)]/10'
                  }
                `}
                title="Larger tiles"
              >
                <FiLayout className="w-4 h-4" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>

            {/* per-page selector */}
            <div className="flex items-center gap-2 text-xs text-[var(--color-foreground)] border border-[var(--color-foreground)]/20 rounded-lg bg-[var(--color-foreground)]/5 px-3 py-2">
              <span className="opacity-70 whitespace-nowrap">
                Per page:
              </span>
              <select
                className="
                  bg-transparent outline-none text-xs
                  focus:ring-2 focus:ring-teal-400/40 rounded-md border border-[var(--color-foreground)]/20 px-2 py-1
                "
                value={pageSize}
                onChange={(e) => {
                  const newSize = Number(e.target.value);
                  setPageSize(newSize);
                  setPage(1);
                }}
              >
                <option value={6}>6</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </div>
          </div>

          {/* pager top right */}
          <Pager align="right" />

          {/* search bar */}
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
            <input
              className="
                w-full rounded-md border border-[var(--color-foreground)]/20
                bg-[var(--color-background)] py-2 pl-9 pr-3 text-sm
                outline-none focus:ring-2 focus:ring-teal-400/40
              "
              placeholder="Search captions / tags..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* CONTENT AREA: gallery + side panel */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:gap-6">
        {/* LEFT: thumbnail gallery with drag+drop */}
        <div className="flex-1">
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={pagedItems.map((i) => i.id)}
              strategy={rectSortingStrategy}
            >
              <div
                className={
                  layoutMode === 'grid'
                    ? 'grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(180px,100%),1fr))]'
                    : 'grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))]'
                }
              >
                {pagedItems.map((item) => (
                  <SortableThumbCard
                    key={item.id}
                    item={item}
                    isActive={!!activeItem && activeItem.id === item.id}
                    layoutMode={layoutMode}
                    onSelect={handleSelect}
                    onDelete={handleDelete}
                  />
                ))}

                {!pagedItems.length && (
                  <div className="opacity-60 text-sm col-span-full flex flex-col items-center py-16 gap-2 text-center border border-dashed border-[var(--color-foreground)]/20 rounded-xl">
                    <FiImage className="w-6 h-6 opacity-50" />
                    <div>No media found.</div>
                    <div className="text-[11px] opacity-60 max-w-[28ch]">
                      Try clearing search or upload something new.
                    </div>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>

          {/* bottom pager */}
          <div className="pt-8">
            <Pager align="left" />
          </div>
        </div>

        {/* RIGHT: detail side panel */}
        {isPanelOpen && activeItem && (
          <aside
            className="
              relative mt-6 lg:mt-0 lg:w-[360px] flex-shrink-0
              rounded-xl border border-[var(--color-foreground)]/20
              bg-[var(--color-background)] text-[var(--color-foreground)]
              shadow-xl overflow-hidden
            "
          >
            {/* close button (mobile) */}
            <button
              onClick={() => setIsPanelOpen(false)}
              className="
                absolute top-2 right-2 p-2 rounded-md border border-[var(--color-foreground)]/20
                bg-[var(--color-background)]/80 backdrop-blur
                hover:bg-[var(--color-foreground)]/10 transition text-xs
                lg:hidden
              "
              title="Close"
            >
              <FiX className="w-4 h-4" />
            </button>

            {/* media preview */}
            <div className="relative bg-black/40">
              {activeItem.type === 'image' ? (
                <div className="w-full h-[220px] flex items-center justify-center bg-black/40">
                  <img
                    src={activeItem.url}
                    alt={activeItem.caption || 'media preview'}
                    className="max-h-full max-w-full object-contain"
                    draggable={false}
                  />
                </div>
              ) : (
                <div className="w-full h-[220px] bg-black/70 flex items-center justify-center text-xs text-white/80">
                  <div className="flex flex-col items-center gap-2">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded bg-black/60 border border-white/20 text-[11px]">
                      ▶
                    </span>
                    <div className="opacity-70 text-[11px]">
                      Video preview (placeholder)
                    </div>
                  </div>
                </div>
              )}

              <div className="absolute bottom-2 right-2 flex items-center gap-2">
                <button
                  onClick={() => handleDelete(activeItem.id)}
                  className="
                    p-2 rounded-md border border-white/30 bg-black/60 text-white/90
                    text-[11px] hover:bg-black/80 transition
                  "
                  title="Delete media"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* info / editable fields */}
            <div className="p-4 flex flex-col gap-5 text-sm">
              {/* caption */}
              <div>
                <label className="block text-[11px] font-medium mb-1 opacity-80">
                  Caption / Description
                </label>

                <div className="flex items-start gap-2">
                  <textarea
                    className="
                      w-full min-h-[60px] rounded-md border border-[var(--color-foreground)]/30
                      bg-transparent text-sm p-2 outline-none
                      focus:ring-2 focus:ring-teal-400/40
                    "
                    value={detailCaption}
                    onChange={(e) => updateCaption(e.target.value)}
                  />

                  <div className="shrink-0 flex flex-col gap-2">
                    <div
                      className="
                        p-2 rounded-md border border-[var(--color-foreground)]/20
                        hover:bg-[var(--color-foreground)]/10 transition
                        text-[11px] flex items-center justify-center
                      "
                      title="Edit caption"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* tags */}
              <div>
                <label className="block text-[11px] font-medium mb-1 opacity-80">
                  Tags
                </label>

                {/* current tags */}
                <div className="flex flex-wrap gap-2">
                  {detailTags.map((tag) => (
                    <span
                      key={tag}
                      className="
                        inline-flex items-center gap-2 text-[11px]
                        rounded-md border border-[var(--color-foreground)]/30
                        bg-[var(--color-foreground)]/10 px-2 py-1
                      "
                    >
                      <span className="flex items-center gap-1">
                        <FiTag className="w-3 h-3 opacity-60" />
                        <span>{tag}</span>
                      </span>

                      <button
                        className="opacity-60 hover:opacity-100 transition"
                        title="Remove tag"
                        onClick={() => removeTagFromActiveItem(tag)}
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  {detailTags.length === 0 && (
                    <span className="text-[11px] opacity-60">
                      No tags yet.
                    </span>
                  )}
                </div>

                {/* add tag */}
                <div className="flex items-center gap-2 mt-3">
                  <input
                    className="
                      flex-1 rounded-md border border-[var(--color-foreground)]/30
                      bg-transparent text-xs px-2 py-2 outline-none
                      focus:ring-2 focus:ring-teal-400/40
                    "
                    placeholder="Add tag (ex: customer job)"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTagToActiveItem();
                      }
                    }}
                  />
                  <button
                    onClick={addTagToActiveItem}
                    className="
                      text-xs px-3 py-2 rounded-md border border-[var(--color-foreground)]/20
                      bg-[var(--color-foreground)]/5 hover:bg-[var(--color-foreground)]/10
                      transition flex items-center gap-2
                    "
                    title="Add tag"
                  >
                    <FiPlus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* meta */}
              <div className="text-[11px] opacity-60 leading-relaxed border-t border-[var(--color-foreground)]/20 pt-3">
                <div className="flex flex-col">
                  <span>
                    Type:{' '}
                    {activeItem.type === 'image'
                      ? 'Image'
                      : 'Video / Timelapse'}
                  </span>

                  <span>
                    Uploaded:{' '}
                    {isMounted
                      ? new Date(
                          activeItem.created_at
                        ).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })
                      : '—'}
                  </span>

                  <span>ID: {activeItem.id}</span>
                </div>
              </div>

              {/* UPDATE button for existing items */}
              {(!draftItem || draftItem.id !== activeItem.id) && (
                <div className="flex justify-end border-t border-[var(--color-foreground)]/20 pt-4">
                  <button
                    onClick={handleSaveMeta}
                    disabled={isSavingMeta}
                    className="
                      text-sm font-medium px-4 py-2 rounded-md
                      border border-teal-500/40
                      bg-teal-500/10 text-teal-400
                      hover:bg-teal-500/20 transition
                      disabled:opacity-40 disabled:cursor-not-allowed
                    "
                  >
                    {isSavingMeta
                      ? 'Saving...'
                      : metaSaveStatus === 'success'
                      ? 'Saved'
                      : metaSaveStatus === 'error'
                      ? 'Error – Retry'
                      : 'Update Details'}
                  </button>
                </div>
              )}

              {/* draft action bar */}
              {draftItem && draftItem.id === activeItem.id && (
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:items-center border-t border-[var(--color-foreground)]/20 pt-4">
                  <button
                    onClick={cancelDraft}
                    className="
                      text-sm px-4 py-2 rounded-md border border-[var(--color-foreground)]/20
                      hover:bg-[var(--color-foreground)]/10 transition
                    "
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmAddDraftToGallery}
                    className="
                      text-sm font-medium px-4 py-2 rounded-md
                      border border-teal-500/30 bg-teal-500/10 text-teal-400
                      hover:bg-teal-500/20 transition
                    "
                  >
                    Add to Gallery
                  </button>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}