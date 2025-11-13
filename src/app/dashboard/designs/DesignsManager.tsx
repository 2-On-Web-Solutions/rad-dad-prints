'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiUpload,
  FiX,
  FiTag,
  FiGrid,
  FiCreditCard,
} from 'react-icons/fi';

import { supabaseBrowser } from '@/lib/supabase/client';

// ---------- DB row types we read on load ----------
type PrintDesignRow = {
  id: string;
  title: string;
  blurb: string | null;
  price_from: string | null;
  category_id: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  thumb_url: string | null;
  thumb_storage_path: string | null;
  design_images?: { count: number }[];
  design_files?: { count: number }[];
};

type CategoryRow = {
  slug: string;
  label: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

// ---------- UI-level types ----------
type DesignImage = { id: string; url: string };
type DesignFile = { id: string; label: string; file_url: string; mime_type?: string };

type PendingGalleryFile = File;
type PendingStlFile = File;

export type DesignRecord = {
  id: string;
  title: string;
  blurb: string;
  price_from: string;
  category_id: string;
  thumb_url: string | null;
  thumb_storage_path?: string | null;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  images: DesignImage[];
  files: DesignFile[];
  imageCount: number;
  fileCount: number;
  _pendingGalleryFiles?: PendingGalleryFile[];
  _pendingStlFiles?: PendingStlFile[];
};

// --------------------------------------------------------------------
// Component
// --------------------------------------------------------------------
export default function DesignsManager() {
  // DB data
  const [designs, setDesigns] = useState<DesignRecord[]>([]);
  const [categories, setCategories] = useState<{ id: string; label: string }[]>([]);
  const [loadingDesigns, setLoadingDesigns] = useState(true);
  const [loadingCats, setLoadingCats] = useState(true);

  // UI / filters / paging
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(12);

  // NEW: Grid / Cards toggle (default to Cards to match previous look)
  const [viewMode, setViewMode] = useState<'grid' | 'cards'>('cards');

  // editor drawer
  const [openEditor, setOpenEditor] = useState(false);
  const [draft, setDraft] = useState<DesignRecord | null>(null);
  const [draftThumbFile, setDraftThumbFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // upload busy flags for sub-actions
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingStl, setUploadingStl] = useState(false);

  // hidden file inputs for “Add Extra Img” and “Add STL”
  const extraImgInputRef = useRef<HTMLInputElement | null>(null);
  const stlInputRef = useRef<HTMLInputElement | null>(null);

  // category modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  // delete category controls
  const [categoryToDelete, setCategoryToDelete] = useState<string>('');
  const [reassignTarget, setReassignTarget] = useState<string>('uncategorized');
  const [catUsageCount, setCatUsageCount] = useState<number>(0);
  const [loadingUsage, setLoadingUsage] = useState<boolean>(false);
  const [deletingCategory, setDeletingCategory] = useState<boolean>(false);

  function syncDesignInList(id: string, updater: (oldRec: DesignRecord) => DesignRecord) {
    setDesigns((prev) => prev.map((rec) => (rec.id !== id ? rec : updater(rec))));
  }

  // --------------------------------------------------------------------
  // LOAD FROM SUPABASE
  // --------------------------------------------------------------------
  async function reloadCategories() {
    const supabase = supabaseBrowser;
    const { data, error } = await supabase
      .from('design_categories')
      .select('slug,label,sort_order,is_active,created_at')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error loading categories:', error);
    } else {
      const mapped =
        (data || []).map((row: CategoryRow) => ({ id: row.slug, label: row.label })) || [];
      setCategories(mapped);
    }
    setLoadingCats(false);
  }

  async function reloadDesigns() {
    const supabase = supabaseBrowser;
    const { data, error } = await supabase
      .from('print_designs')
      .select(`
        id,
        title,
        blurb,
        price_from,
        category_id,
        sort_order,
        is_active,
        created_at,
        thumb_url,
        thumb_storage_path,
        design_images(count),
        design_files(count)
      `)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error loading print_designs:', error);
      setLoadingDesigns(false);
      return;
    }

    const mapped: DesignRecord[] =
      (data || []).map((row: PrintDesignRow) => {
        const galleryCount = row.design_images?.[0]?.count || 0;
        const fileCount = row.design_files?.[0]?.count || 0;
        const cardImageTotal = (row.thumb_url ? 1 : 0) + galleryCount;

        return {
          id: row.id,
          title: row.title || '',
          blurb: row.blurb || '',
          price_from: row.price_from || '',
          category_id: row.category_id || 'uncategorized',
          thumb_url: row.thumb_url || null,
          thumb_storage_path: row.thumb_storage_path || null,
          sort_order: row.sort_order,
          is_active: row.is_active,
          created_at: row.created_at,
          images: [],
          files: [],
          imageCount: cardImageTotal,
          fileCount,
          _pendingGalleryFiles: [],
          _pendingStlFiles: [],
        };
      }) || [];

    setDesigns(mapped);
    setLoadingDesigns(false);
  }

  useEffect(() => {
    reloadCategories();
    reloadDesigns();
  }, []);

  // --------------------------------------------------------------------
  // FILTER + PAGINATION
  // --------------------------------------------------------------------
  const filteredDesigns = useMemo(() => {
    const q = query.trim().toLowerCase();
    return designs.filter((d) => {
      const matchesSearch =
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.blurb.toLowerCase().includes(q) ||
        d.category_id.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'all' || d.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [designs, query, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredDesigns.length / pageSize || 1));
  const currentPage = Math.min(page, totalPages);
  const sliceStart = (currentPage - 1) * pageSize;
  const sliceEnd = sliceStart + pageSize;
  const pagedDesigns = filteredDesigns.slice(sliceStart, sliceEnd);

  // --------------------------------------------------------------------
  // EDITOR HELPERS
  // --------------------------------------------------------------------
  function startNew() {
    const defaultCat = categories[0]?.id || 'uncategorized';
    const blank: DesignRecord = {
      id: '',
      title: '',
      blurb: '',
      price_from: '',
      category_id: defaultCat,
      thumb_url: null,
      thumb_storage_path: null,
      sort_order: designs.length,
      is_active: true,
      created_at: '',
      images: [],
      files: [],
      imageCount: 0,
      fileCount: 0,
      _pendingGalleryFiles: [],
      _pendingStlFiles: [],
    };
    setDraft(blank);
    setDraftThumbFile(null);
    setOpenEditor(true);
  }

  async function startEdit(id: string) {
    const base = designs.find((d) => d.id === id);
    if (!base) return;

    const supabase = supabaseBrowser;

    const { data: imgRows } = await supabase
      .from('design_images')
      .select('id,image_url,sort_order')
      .eq('design_id', id)
      .order('sort_order', { ascending: true });

    const { data: fileRows } = await supabase
      .from('design_files')
      .select('id,label,file_url,mime_type,sort_order')
      .eq('design_id', id)
      .order('sort_order', { ascending: true });

    const galleryOnly: DesignImage[] = (imgRows || []).map((row) => ({ id: row.id, url: row.image_url }));
    const mergedFiles: DesignFile[] = (fileRows || []).map((row) => ({
      id: row.id,
      label: row.label || 'Download',
      file_url: row.file_url,
      mime_type: row.mime_type || '',
    }));

    const fullDraft: DesignRecord = {
      ...base,
      images: galleryOnly,
      files: mergedFiles,
      _pendingGalleryFiles: [],
      _pendingStlFiles: [],
    };

    syncDesignInList(id, (oldRec) => ({
      ...oldRec,
      images: galleryOnly,
      files: mergedFiles,
      imageCount: (oldRec.thumb_url ? 1 : 0) + galleryOnly.length,
      fileCount: mergedFiles.length,
    }));

    setDraft(fullDraft);
    setDraftThumbFile(null);
    setOpenEditor(true);
  }

  function cancelEdit() {
    setOpenEditor(false);
    setDraft(null);
    setDraftThumbFile(null);
  }

  // ----- SAVE MAIN FORM -----
  async function saveDraft() {
    if (!draft) return;

    if (!draft.title.trim()) {
      alert('Please enter a title.');
      return;
    }
    if (!draft.id && !draftThumbFile) {
      alert('Please choose a thumbnail image before saving.');
      return;
    }

    setSaving(true);

    // NEW DESIGN
    if (!draft.id) {
      const fd = new FormData();
      fd.append('title', draft.title || '');
      fd.append('blurb', draft.blurb || '');
      fd.append('price_from', draft.price_from || '');
      fd.append('category_id', draft.category_id || 'uncategorized');
      fd.append('sort_order', String(draft.sort_order ?? designs.length));
      if (draftThumbFile) fd.append('file', draftThumbFile);

      const res = await fetch('/api/designs/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        console.error('upload failed', await res.text());
        alert('Could not save design (upload). Check console.');
        setSaving(false);
        return;
      }

      const body = await res.json();
      const created: DesignRecord = {
        id: body.item.id,
        title: body.item.title || draft.title,
        blurb: body.item.blurb || draft.blurb || '',
        price_from: body.item.price_from || draft.price_from || '',
        category_id: body.item.category_id || draft.category_id,
        thumb_url: body.item.thumb_url || null,
        thumb_storage_path: body.item.thumb_storage_path || null,
        sort_order: body.item.sort_order ?? draft.sort_order ?? 0,
        is_active: body.item.is_active ?? true,
        created_at: body.item.created_at ?? '',
        images: [],
        files: [],
        imageCount: body.item.thumb_url ? 1 : 0,
        fileCount: 0,
        _pendingGalleryFiles: [],
        _pendingStlFiles: [],
      };

      // attach any pending gallery/images
      if (draft._pendingGalleryFiles?.length) {
        for (const file of draft._pendingGalleryFiles) {
          const imgFD = new FormData();
          imgFD.append('design_id', created.id);
          imgFD.append('file', file);
          const imgRes = await fetch('/api/designs/add-image', { method: 'POST', body: imgFD });
          if (imgRes.ok) {
            const imgJson = await imgRes.json();
            const serverItem = imgJson.item;
            if (serverItem?.id) {
              const newImg = { id: serverItem.id, url: serverItem.url || serverItem.image_url };
              created.images.push(newImg);
              created.imageCount += 1;
            }
          }
        }
      }

      // attach pending files
      if (draft._pendingStlFiles?.length) {
        for (const file of draft._pendingStlFiles) {
          const stlFD = new FormData();
          stlFD.append('design_id', created.id);
          stlFD.append('file', file);
          const stlRes = await fetch('/api/designs/add-file', { method: 'POST', body: stlFD });
          if (stlRes.ok) {
            const stlJson = await stlRes.json();
            const serverFile = stlJson.item;
            if (serverFile?.id) {
              const newFile = {
                id: serverFile.id,
                label: serverFile.label || 'Download',
                file_url: serverFile.file_url,
                mime_type: serverFile.mime_type || '',
              };
              created.files.push(newFile);
              created.fileCount += 1;
            }
          }
        }
      }

      setDesigns((prev) => [created, ...prev]);
      setSaving(false);
      setOpenEditor(false);
      setDraft(null);
      setDraftThumbFile(null);
      return;
    }

    // UPDATE EXISTING
    const supabase = supabaseBrowser;
    const payload = {
      title: draft.title || '',
      blurb: draft.blurb || '',
      price_from: draft.price_from || '',
      category_id: draft.category_id || 'uncategorized',
      sort_order: draft.sort_order ?? 0,
      is_active: draft.is_active ?? true,
    };

    const { error } = await supabase.from('print_designs').update(payload).eq('id', draft.id);
    if (error) {
      console.error('update failed', error);
      alert('Could not update design. Check console.');
      setSaving(false);
      return;
    }

    if (draftThumbFile) {
      const thumbFD = new FormData();
      thumbFD.append('design_id', draft.id);
      thumbFD.append('file', draftThumbFile);
      const thumbRes = await fetch('/api/designs/update-thumb', { method: 'POST', body: thumbFD });
      if (thumbRes.ok) {
        const tJson = await thumbRes.json();
        const newThumbUrl = tJson.item?.thumb_url || draft.thumb_url || null;
        setDraft((old) => (old ? { ...old, thumb_url: newThumbUrl } : old));
        syncDesignInList(draft.id, (oldRec) => {
          const hadThumbBefore = !!oldRec.thumb_url;
          return {
            ...oldRec,
            ...payload,
            thumb_url: newThumbUrl,
            imageCount: hadThumbBefore ? oldRec.imageCount : oldRec.imageCount + 1,
          };
        });
      } else {
        console.error('thumb update failed', await thumbRes.text());
      }
    } else {
      syncDesignInList(draft.id, (oldRec) => ({ ...oldRec, ...payload }));
    }

    setSaving(false);
    setOpenEditor(false);
    setDraft(null);
    setDraftThumbFile(null);
  }

  // ----- DELETE WHOLE DESIGN -----
  async function removeDesign(id: string) {
    if (!id) return;
    if (!window.confirm('Delete this design? This cannot be undone.')) return;

    setDeleting(true);

    const rec = designs.find((d) => d.id === id);
    const thumb_storage_path = rec?.thumb_storage_path ?? null;

    const resp = await fetch('/api/designs/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, thumb_storage_path }),
    });

    if (!resp.ok) {
      console.error('delete failed', await resp.text());
      alert('Could not delete design. Check console.');
      setDeleting(false);
      return;
    }

    setDesigns((prev) => prev.filter((d) => d.id !== id));
    if (draft?.id === id) cancelEdit();
    setDeleting(false);
  }

  // --------------------------------------------------------------------
  // IMAGE / STL helpers
  // --------------------------------------------------------------------
  function handleThumbFilePick(file: File) {
    setDraftThumbFile(file);
    const localUrl = URL.createObjectURL(file);
    if (!draft) return;
    setDraft({ ...draft, thumb_url: localUrl });
    if (draft.id) {
      syncDesignInList(draft.id, (oldRec) => {
        const hadThumbBefore = !!oldRec.thumb_url;
        return { ...oldRec, thumb_url: localUrl, imageCount: hadThumbBefore ? oldRec.imageCount : oldRec.imageCount + 1 };
      });
    }
  }

  function clickAddExtraImage() { extraImgInputRef.current?.click(); }

  async function handleExtraImgChosen(file: File) {
    if (!draft) return;
    if (!draft.id) {
      const localUrl = URL.createObjectURL(file);
      const newImg: DesignImage = { id: `local-${Date.now()}`, url: localUrl };
      setDraft({
        ...draft,
        images: [...draft.images, newImg],
        imageCount: draft.imageCount + 1,
        _pendingGalleryFiles: [...(draft._pendingGalleryFiles || []), file],
      });
      return;
    }
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append('design_id', draft.id);
      fd.append('file', file);
      const res = await fetch('/api/designs/add-image', { method: 'POST', body: fd });
      if (!res.ok) { console.error('add-image failed', await res.text()); alert('Could not upload image.'); return; }
      const body = await res.json();
      const serverItem = body.item;
      if (serverItem?.id) {
        const newImg: DesignImage = { id: serverItem.id, url: serverItem.url || serverItem.image_url };
        setDraft((old) => (old ? { ...old, images: [...old.images, newImg], imageCount: old.imageCount + 1 } : old));
        syncDesignInList(draft.id, (oldRec) => ({ ...oldRec, images: [...oldRec.images, newImg], imageCount: oldRec.imageCount + 1 }));
      }
    } finally { setUploadingImg(false); }
  }

  async function actuallyDeleteImageFromServer(imageId: string) {
    try {
      const resp = await fetch('/api/designs/remove-image', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: imageId }),
      });
      if (!resp.ok) { console.error('remove-image failed', await resp.text()); alert('Could not delete image on server.'); }
    } catch (err) { console.error('remove-image error', err); alert('Could not delete image on server.'); }
  }

  async function removeImage(imgId: string) {
    if (!draft) return;
    setDraft((old) => {
      if (!old) return old;
      const newImages = old.images.filter((img) => img.id !== imgId);
      const wasRemote = !imgId.startsWith('local-');
      return { ...old, images: newImages, imageCount: wasRemote ? old.imageCount - 1 : old.imageCount };
    });
    if (draft.id) {
      syncDesignInList(draft.id, (oldRec) => {
        const newImages = oldRec.images.filter((img) => img.id !== imgId);
        const wasRemote = !imgId.startsWith('local-');
        return { ...oldRec, images: newImages, imageCount: wasRemote ? oldRec.imageCount - 1 : oldRec.imageCount };
      });
      if (!imgId.startsWith('local-')) await actuallyDeleteImageFromServer(imgId);
    } else {
      setDraft((old) => (old ? { ...old, _pendingGalleryFiles: old._pendingGalleryFiles?.filter(() => true) } : old));
    }
  }

  function clickAddStl() { stlInputRef.current?.click(); }

  async function handleStlChosen(file: File) {
    if (!draft) return;
    const MAX_STL_MB = 100;
    if (file.size > MAX_STL_MB * 1024 * 1024) { alert(`File is too large (>${MAX_STL_MB}MB).`); return; }

    if (!draft.id) {
      const mock: DesignFile = { id: `local-${Date.now()}`, label: file.name || 'File', file_url: `/local/${file.name}`, mime_type: file.type || 'application/octet-stream' };
      setDraft({ ...draft, files: [...draft.files, mock], fileCount: draft.fileCount + 1, _pendingStlFiles: [...(draft._pendingStlFiles || []), file] });
      return;
    }

    setUploadingStl(true);
    try {
      const fd = new FormData();
      fd.append('design_id', draft.id);
      fd.append('file', file);
      const res = await fetch('/api/designs/add-file', { method: 'POST', body: fd });
      if (!res.ok) { console.error('add-file failed', await res.text()); alert('Could not upload STL/file.'); return; }
      const body = await res.json();
      const serverFile = body.item;
      if (serverFile?.id) {
        const newFile: DesignFile = { id: serverFile.id, label: serverFile.label || 'Download', file_url: serverFile.file_url, mime_type: serverFile.mime_type || '' };
        setDraft((old) => (old ? { ...old, files: [...old.files, newFile], fileCount: old.fileCount + 1 } : old));
        syncDesignInList(draft.id, (oldRec) => ({ ...oldRec, files: [...oldRec.files, newFile], fileCount: oldRec.fileCount + 1 }));
      }
    } finally { setUploadingStl(false); }
  }

  async function actuallyDeleteFileFromServer(fileId: string) {
    try {
      const resp = await fetch('/api/designs/remove-file', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: fileId }),
      });
      if (!resp.ok) { console.error('remove-file failed', await resp.text()); alert('Could not delete file on server.'); }
    } catch (err) { console.error('remove-file error', err); alert('Could not delete file on server.'); }
  }

  async function removeFile(fileId: string) {
    if (!draft) return;
    setDraft((old) => {
      if (!old) return old;
      const newFiles = old.files.filter((f) => f.id !== fileId);
      const wasRemote = !fileId.startsWith('local-');
      return { ...old, files: newFiles, fileCount: wasRemote ? old.fileCount - 1 : old.fileCount, _pendingStlFiles: old._pendingStlFiles?.filter(() => true) };
    });
    if (draft.id) {
      syncDesignInList(draft.id, (oldRec) => {
        const newFiles = oldRec.files.filter((f) => f.id !== fileId);
        const wasRemote = !fileId.startsWith('local-');
        return { ...oldRec, files: newFiles, fileCount: wasRemote ? oldRec.fileCount - 1 : oldRec.fileCount };
      });
      if (!fileId.startsWith('local-')) await actuallyDeleteFileFromServer(fileId);
    }
  }

  // --------------------------------------------------------------------
  // CATEGORY MODAL HELPERS
  // --------------------------------------------------------------------
  function openCategoryModal() {
    setShowCategoryModal(true);
    setNewCategoryName('');
    // seed delete UI defaults:
    const firstCat = categories[0]?.id;
    setCategoryToDelete(firstCat || '');
    setReassignTarget(
      categories.find((c) => c.id !== firstCat)?.id || 'uncategorized'
    );
    if (firstCat) void fetchCategoryUsage(firstCat);
  }

  function closeCategoryModal() {
    setShowCategoryModal(false);
    setNewCategoryName('');
    setCategoryToDelete('');
    setReassignTarget('uncategorized');
    setCatUsageCount(0);
  }

  async function saveNewCategory() {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    if (categories.some((c) => c.id === slug)) {
      setSelectedCategory(slug);
      closeCategoryModal();
      return;
    }

    setSavingCategory(true);
    const supabase = supabaseBrowser;

    const payload = { slug, label: trimmed, sort_order: categories.length, is_active: true };
    const { error } = await supabase.from('design_categories').insert(payload);

    if (error) {
      console.error('saveNewCategory() DB error', error);
      alert('Could not save category. Check console.');
      setSavingCategory(false);
      return;
    }

    await reloadCategories();
    setSelectedCategory(slug);
    setSavingCategory(false);
    // keep modal open so user can also delete others if they want
  }

  // fetch how many designs use a given category
  async function fetchCategoryUsage(slug: string) {
    if (!slug) { setCatUsageCount(0); return; }
    setLoadingUsage(true);
    const supabase = supabaseBrowser;
    const { count, error } = await supabase
      .from('print_designs')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', slug);
    if (error) {
      console.error('usage count error', error);
      setCatUsageCount(0);
    } else {
      setCatUsageCount(count || 0);
    }
    setLoadingUsage(false);
  }

  // delete a category (with reassignment)
  async function deleteCategory() {
    if (!categoryToDelete) return;
    if (reassignTarget === categoryToDelete) {
      alert('Reassign target must be different from the category being deleted.');
      return;
    }

    const labelDel = categories.find((c) => c.id === categoryToDelete)?.label || categoryToDelete;
    const labelTarget = categories.find((c) => c.id === reassignTarget)?.label || reassignTarget;

    const ok = window.confirm(
      catUsageCount > 0
        ? `Delete "${labelDel}" and move ${catUsageCount} design${catUsageCount === 1 ? '' : 's'} to "${labelTarget}"?`
        : `Delete "${labelDel}"?`
    );
    if (!ok) return;

    setDeletingCategory(true);
    const supabase = supabaseBrowser;

    // 1) reassign designs using this category
    if (catUsageCount > 0) {
      const { error: updateErr } = await supabase
        .from('print_designs')
        .update({ category_id: reassignTarget || 'uncategorized' })
        .eq('category_id', categoryToDelete);
      if (updateErr) {
        console.error('reassign error', updateErr);
        alert('Could not reassign designs. Check console.');
        setDeletingCategory(false);
        return;
      }

      // reflect locally
      setDesigns((prev) =>
        prev.map((d) =>
          d.category_id === categoryToDelete ? { ...d, category_id: reassignTarget || 'uncategorized' } : d
        )
      );
    }

    // 2) delete category row
    const { error: delErr } = await supabase
      .from('design_categories')
      .delete()
      .eq('slug', categoryToDelete);

    if (delErr) {
      console.error('delete category failed', delErr);
      alert('Could not delete category. Check console.');
      setDeletingCategory(false);
      return;
    }

    // 3) update local categories
    setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete));

    // if current filter was that category, bounce to "all"
    setSelectedCategory((cur) => (cur === categoryToDelete ? 'all' : cur));

    // reset delete UI
    const nextCandidate = categories.find((c) => c.id !== categoryToDelete)?.id || '';
    setCategoryToDelete(nextCandidate);
    setReassignTarget(categories.find((c) => c.id !== nextCandidate)?.id || 'uncategorized');
    setCatUsageCount(0);
    setDeletingCategory(false);
  }

  // --------------------------------------------------------------------
  // Pager UI
  // --------------------------------------------------------------------
  function Pager({ align = 'center' }: { align?: 'left' | 'center' | 'right' }) {
    const baseAlign = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';
    return (
      <div className={`flex items-center ${baseAlign} gap-4 text-sm flex-shrink-0`}>
        <button
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-md border border-[var(--color-foreground)]/20 ${
            currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[var(--color-foreground)]/10 transition'
          }`}
          onClick={() => { if (currentPage > 1) setPage(currentPage - 1); }}
        >
          Prev
        </button>

        <div className="opacity-70 text-xs">Page {currentPage} / {totalPages}</div>

        <button
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded-md border border-[var(--color-foreground)]/20 ${
            currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[var(--color-foreground)]/10 transition'
          }`}
          onClick={() => { if (currentPage < totalPages) setPage(currentPage + 1); }}
        >
          Next
        </button>
      </div>
    );
  }

  // --------------------------------------------------------------------
  // Compact tile for GRID mode
  // --------------------------------------------------------------------
  function GridTile({ d }: { d: DesignRecord }) {
    return (
      <div
        className="group rounded-xl border border-[var(--color-foreground)]/10 bg-[var(--color-foreground)]/[0.03] overflow-hidden"
        title={d.title}
      >
        <div className="relative aspect-square bg-[var(--color-background)] flex items-center justify-center overflow-hidden">
          {d.thumb_url || d.images[0]?.url ? (
            <img
              src={d.thumb_url || d.images[0]?.url || ''}
              alt={d.title || 'thumbnail'}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="text-xs opacity-70">No image</div>
          )}
          {/* quick actions on hover */}
          <div className="absolute top-2 right-2 hidden gap-2 group-hover:flex">
            <button
              className="p-1.5 rounded-md border border-[var(--color-foreground)]/30 bg-black/40 hover:bg-black/60"
              title="Edit"
              onClick={() => startEdit(d.id)}
              disabled={deleting}
            >
              <FiEdit2 className="w-4 h-4 text-white" />
            </button>
            <button
              className="p-1.5 rounded-md border border-[var(--color-foreground)]/30 bg-black/40 hover:bg-black/60"
              title="Delete"
              onClick={() => removeDesign(d.id)}
              disabled={deleting}
            >
              <FiTrash2 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
        <div className="p-3">
          <div className="text-sm font-medium truncate">{d.title || 'Untitled design'}</div>
          <div className="text-[11px] opacity-60 capitalize truncate">
            {categories.find((c) => c.id === d.category_id)?.label || d.category_id || 'Uncategorized'}
          </div>
          {d.price_from && <div className="text-teal-400 text-xs font-medium mt-1">{d.price_from}</div>}
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------
  return (
    <section className="max-w-[1400px] mx-auto space-y-6 pb-24">
      {/* HEADER / TOP BAR */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-1">Print Designs</h1>
          <p className="opacity-70 text-sm max-w-[60ch]">
            Add new printable items, edit names/description/pricing, upload STL files & thumbnails.
          </p>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={openCategoryModal}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border border-[var(--color-foreground)]/20 bg-[var(--color-foreground)]/5 hover:bg-[var(--color-foreground)]/10 transition"
            >
              <FiTag className="text-lg" />
              <span>New / Manage Categories</span>
            </button>

            <button
              onClick={startNew}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border border-[var(--color-foreground)]/20 bg-[var(--color-foreground)]/5 hover:bg-[var(--color-foreground)]/10 transition"
            >
              <FiPlus className="text-lg" />
              <span>New Design</span>
            </button>
          </div>

          <Pager align="right" />
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between rounded-xl border border-[var(--color-foreground)]/10 p-4 bg-[var(--color-foreground)]/[0.03]">
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full xl:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
            <input
              className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-teal-400/40"
              placeholder="Search designs..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            />
          </div>

          {/* Category filter */}
          <div>
            <select
              className="w-full sm:w-auto rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] text-[var(--color-foreground)] py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-teal-400/40"
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              disabled={loadingCats}
            >
              <option value="all">All categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Page size */}
          <div className="flex items-center gap-2 text-xs text-[var(--color-foreground)]">
            <span className="opacity-70 whitespace-nowrap">Per page:</span>
            <select
              className="rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] text-[var(--color-foreground)] py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-teal-400/40"
              value={pageSize}
              onChange={(e) => { const newSize = Number(e.target.value); setPageSize(newSize); setPage(1); }}
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </div>

          {/* NEW: View toggle (Grid / Cards) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm border ${
                viewMode === 'grid'
                  ? 'border-teal-500/40 bg-teal-500/10 text-teal-400'
                  : 'border-[var(--color-foreground)]/20 bg-[var(--color-foreground)]/5 hover:bg-[var(--color-foreground)]/10'
              } transition`}
              title="Grid"
            >
              <FiGrid />
              Grid
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm border ${
                viewMode === 'cards'
                  ? 'border-teal-500/40 bg-teal-500/10 text-teal-400'
                  : 'border-[var(--color-foreground)]/20 bg-[var(--color-foreground)]/5 hover:bg-[var(--color-foreground)]/10'
              } transition`}
              title="Cards"
            >
              <FiCreditCard />
              Cards
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="text-xs opacity-70 shrink-0 text-right">
          {loadingDesigns ? 'Loading…' : `${filteredDesigns.length} design${filteredDesigns.length === 1 ? '' : 's'} total`}
        </div>
      </div>

      {/* RESULTS */}
      {viewMode === 'grid' ? (
        // GRID MODE: tighter tiles; more columns
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
          {pagedDesigns.map((d) => (
            <GridTile key={d.id || `temp-${d.title}`} d={d} />
          ))}
          {!pagedDesigns.length && !loadingDesigns && <div className="opacity-70 text-sm col-span-full">No results.</div>}
          {loadingDesigns && <div className="opacity-70 text-sm col-span-full">Loading…</div>}
        </div>
      ) : (
        // CARDS MODE: narrower cards, 4 per row on XL
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pagedDesigns.map((d) => (
            <div
              key={d.id || `temp-${d.title}`}
              className="rounded-xl border border-[var(--color-foreground)]/10 bg-[var(--color-foreground)]/[0.03] overflow-hidden flex flex-col"
            >
              <div className="relative h-36 bg-[var(--color-background)] flex items-center justify-center overflow-hidden border-b border-[var(--color-foreground)]/10">
                {d.thumb_url || d.images[0]?.url ? (
                  <img src={d.thumb_url || d.images[0]?.url || ''} alt={d.title || 'thumbnail'} className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="text-xs opacity-70">No image</div>
                )}
              </div>

              <div className="p-3 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold leading-tight text-sm">{d.title || 'Untitled design'}</div>
                    <div className="text-[11px] opacity-60 capitalize">
                      {categories.find((c) => c.id === d.category_id)?.label || d.category_id || 'Uncategorized'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-md border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10 transition" title="Edit" onClick={() => startEdit(d.id)} disabled={deleting}>
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-md border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10 transition" title="Delete" onClick={() => removeDesign(d.id)} disabled={deleting}>
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {d.price_from && <div className="text-teal-400 text-sm font-medium mt-2">{d.price_from}</div>}

                {d.blurb && <p className="text-xs opacity-70 mt-2 line-clamp-3">{d.blurb}</p>}

                <div className="text-[10px] opacity-60 mt-auto pt-3 flex flex-wrap gap-2">
                  <span>{d.imageCount} image{d.imageCount === 1 ? '' : 's'}</span>
                  <span>•</span>
                  <span>{d.fileCount} file{d.fileCount === 1 ? '' : 's'}</span>
                </div>
              </div>
            </div>
          ))}

          {!pagedDesigns.length && !loadingDesigns && <div className="opacity-70 text-sm col-span-full">No results.</div>}
          {loadingDesigns && <div className="opacity-70 text-sm col-span-full">Loading…</div>}
        </div>
      )}

      <div className="pt-8"><Pager align="center" /></div>

      {/* CATEGORY MODAL */}
      {showCategoryModal && (
        <div
          className="fixed inset-0 z-[210] flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeCategoryModal(); }}
        >
          <div className="w-full max-w-sm rounded-xl border border-[var(--color-foreground)]/20 bg-[var(--color-background)] text-[var(--color-foreground)] shadow-2xl p-5 flex flex-col gap-5">
            {/* header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <FiTag className="text-lg" />
                <div className="text-base font-semibold leading-tight">Manage Categories</div>
              </div>
              <button onClick={closeCategoryModal} className="p-2 rounded-md border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10 transition" title="Close">
                <FiX />
              </button>
            </div>

            {/* CREATE */}
            <div className="space-y-2">
              <div className="text-xs opacity-70 leading-relaxed">
                Create a category you can assign to designs (e.g. “Cosplay Armor”, “Home Organization”, “RC / Hobby”).
              </div>

              <label className="text-xs font-medium opacity-80">Category name</label>
              <input
                className="w-full rounded-md border border-[var(--color-foreground)]/30 bg-transparent text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400/40"
                placeholder="e.g. Cosplay Armor"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />

              <div className="flex justify-end">
                <button
                  onClick={saveNewCategory}
                  className="text-sm font-medium px-4 py-2 rounded-md border border-teal-500/30 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition"
                  disabled={savingCategory}
                >
                  {savingCategory ? 'Saving…' : 'Save Category'}
                </button>
              </div>
            </div>

            <hr className="border-[var(--color-foreground)]/15" />

            {/* DELETE */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Delete category</div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-xs opacity-70 block mb-1">Category to delete</label>
                  <select
                    className="w-full rounded-md border border-[var(--color-foreground)]/30 bg-transparent text-sm px-3 py-2 outline-none text-[var(--color-foreground)]"
                    value={categoryToDelete}
                    onChange={async (e) => {
                      const val = e.target.value;
                      setCategoryToDelete(val);
                      // pick a default reassign target that isn't the same
                      const alt = categories.find((c) => c.id !== val)?.id || 'uncategorized';
                      setReassignTarget(alt);
                      await fetchCategoryUsage(val);
                    }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <div className="text-[11px] opacity-60 mt-1">
                    {loadingUsage ? 'Checking usage…' : `${catUsageCount} design${catUsageCount === 1 ? '' : 's'} currently in this category.`}
                  </div>
                </div>

                <div>
                  <label className="text-xs opacity-70 block mb-1">Reassign designs to</label>
                  <select
                    className="w-full rounded-md border border-[var(--color-foreground)]/30 bg-transparent text-sm px-3 py-2 outline-none text-[var(--color-foreground)]"
                    value={reassignTarget}
                    onChange={(e) => setReassignTarget(e.target.value)}
                  >
                    {categories
                      .filter((c) => c.id !== categoryToDelete)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    <option value="uncategorized">Uncategorized</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={deleteCategory}
                  className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-md border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition disabled:opacity-50"
                  disabled={!categoryToDelete || deletingCategory}
                  title="Delete selected category"
                >
                  <FiTrash2 className="w-4 h-4" />
                  {deletingCategory ? 'Deleting…' : 'Delete Category'}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={closeCategoryModal}
                className="text-sm px-4 py-2 rounded-md border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10 transition"
                disabled={savingCategory || deletingCategory}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDITOR DRAWER / MODAL */}
      {openEditor && draft && (
        <div
          className="fixed inset-0 z-[220] bg-black/70 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) cancelEdit(); }}
        >
          <div className="w-full max-w-2xl rounded-xl border border-[var(--color-foreground)]/20 bg-[var(--color-background)] text-[var(--color-foreground)] shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-foreground)]/10">
              <div className="font-semibold">{draft.id ? 'Edit Design' : 'New Design'}</div>
              <button onClick={cancelEdit} className="p-2 rounded-md border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10 transition" title="Close">
                <FiX />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <label className="text-xs opacity-70">Title</label>
                <input
                  className="w-full rounded-md border border-[var(--color-foreground)]/30 bg-transparent text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400/40"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />

                <label className="text-xs opacity-70">Blurb</label>
                <textarea
                  className="w-full min-h-24 rounded-md border border-[var(--color-foreground)]/30 bg-transparent text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400/40"
                  value={draft.blurb}
                  onChange={(e) => setDraft({ ...draft, blurb: e.target.value })}
                />

                <label className="text-xs opacity-70">Price (display)</label>
                <input
                  className="w-full rounded-md border border-[var(--color-foreground)]/30 bg-transparent text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400/40"
                  placeholder="$19.99"
                  value={draft.price_from}
                  onChange={(e) => setDraft({ ...draft, price_from: e.target.value })}
                />

                <label className="text-xs opacity-70">Category</label>
                <select
                  className="w-full rounded-md border border-[var(--color-foreground)]/30 bg-transparent text-[var(--color-foreground)] text-sm px-3 py-2 outline-none"
                  value={draft.category_id}
                  onChange={(e) => setDraft({ ...draft, category_id: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                  <option value="uncategorized">Uncategorized</option>
                </select>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-xs opacity-70 mb-1">Thumbnail</div>
                  <div className="flex items-center gap-3">
                    <div className="h-24 w-24 rounded-lg border border-[var(--color-foreground)]/20 bg-[var(--color-foreground)]/5 flex items-center justify-center overflow-hidden">
                      {draft.thumb_url ? (
                        <img src={draft.thumb_url} alt="thumb" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-[11px] opacity-60">No image</span>
                      )}
                    </div>
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10 cursor-pointer">
                      <FiUpload />
                      <span className="text-sm">Choose</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleThumbFilePick(e.target.files[0])} />
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs opacity-70">Gallery Images</div>
                  <div className="flex flex-wrap gap-2">
                    {draft.images.map((img) => (
                      <div key={img.id} className="relative h-16 w-16 rounded-md overflow-hidden border border-[var(--color-foreground)]/20">
                        <img src={img.url} alt="" className="h-full w-full object-cover" />
                        <button
                          className="absolute -top-2 -right-2 bg-black/70 rounded-full p-1"
                          onClick={() => removeImage(img.id)}
                          title="Remove"
                        >
                          <FiX className="text-white text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={clickAddExtraImage}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10"
                    disabled={uploadingImg}
                  >
                    <FiUpload />
                    <span className="text-sm">{uploadingImg ? 'Uploading…' : 'Add Image'}</span>
                  </button>
                  <input ref={extraImgInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleExtraImgChosen(e.target.files[0])} />
                </div>

                <div className="space-y-2">
                  <div className="text-xs opacity-70">Files (STL/others)</div>
                  <ul className="text-xs opacity-80 space-y-1">
                    {draft.files.map((f) => (
                      <li key={f.id} className="flex items-center justify-between">
                        <span className="truncate">{f.label}</span>
                        <button className="text-red-400 hover:underline" onClick={() => removeFile(f.id)}>remove</button>
                      </li>
                    ))}
                    {!draft.files.length && <li className="opacity-60">No files yet</li>}
                  </ul>
                  <button
                    type="button"
                    onClick={clickAddStl}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10"
                    disabled={uploadingStl}
                  >
                    <FiUpload />
                    <span className="text-sm">{uploadingStl ? 'Uploading…' : 'Add File'}</span>
                  </button>
                  <input ref={stlInputRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleStlChosen(e.target.files[0])} />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[var(--color-foreground)]/10">
              <button onClick={cancelEdit} className="px-4 py-2 rounded-md border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10">Cancel</button>
              <button
                onClick={saveDraft}
                disabled={saving}
                className="px-4 py-2 rounded-md border border-teal-500/30 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}