'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiUpload, FiX, FiTag, FiGrid, FiCreditCard } from 'react-icons/fi';

/* =========================
   API ROUTES (single place)
   ========================= */
const API = {
  // public reads
  listBundles:   (qs = '') => `/api/public/bundles${qs ? `?${qs}` : ''}`,
  getBundle:     (id: string) => `/api/public/bundles/${id}`,
  listCats:      `/api/public/bundle-categories`,   // <-- public list

  // protected writes
  createBundle:  `/api/bundles/upload`,
  updateBundle:  (id: string) => `/api/bundles/${id}`,
  deleteBundle:  `/api/bundles/delete`,
  addImage:      `/api/bundles/add-image`,
  removeImage:   `/api/bundles/remove-image`,
  updateThumb:   `/api/bundles/update-thumb`,
  addFile:       `/api/bundles/add-file`,
  removeFile:    `/api/bundles/remove-file`,

  // category CRUD (modal)
  createCat:     `/api/bundle-categories`,
  deleteCat:     `/api/bundle-categories`,
};

type BundleImage = { id: string; url: string };
type BundleFile  = { id: string; label: string; file_url: string; mime_type?: string };

type PendingGalleryFile = File;
type PendingAssetFile   = File;

type Category = { id: string; label: string; count?: number }; // <-- no icon here

export type BundleRecord = {
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
  images: BundleImage[];
  files: BundleFile[];
  imageCount: number;
  fileCount: number;
  _pendingGalleryFiles?: PendingGalleryFile[];
  _pendingAssetFiles?: PendingAssetFile[];
};

/* =========================
   Helpers
   ========================= */
async function safeJson<T = any>(res: Response): Promise<T> {
  const txt = await res.text();
  try { return txt ? (JSON.parse(txt) as T) : ({} as T); }
  catch {
    console.error('Non-JSON response:', txt.slice(0, 240));
    return {} as T;
  }
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function uniqueById<T extends { id: string }>(arr: T[]): T[] {
  const seen = new Set<string>(); const out: T[] = [];
  for (const it of arr) if (!seen.has(it.id)) { seen.add(it.id); out.push(it); }
  return out;
}

/* Ensure exactly one 'uncategorized' exists in a list */
function withSingleUncategorized(list: Category[]): Category[] {
  const hasUncat = list.some(c => c.id === 'uncategorized');
  const base = hasUncat ? list : [{ id: 'uncategorized', label: 'Uncategorized', count: 0 }, ...list];
  return uniqueById(base);
}

/* Try to seed baseline categories in DB if missing */
async function seedBaselineCategoriesIfNeeded(current: Category[]) {
  const needed: Category[] = [
    { id: 'uncategorized', label: 'Uncategorized' },
    { id: 'starter-kits',  label: 'Starter Bundle' },
    { id: 'desk-sets',     label: 'Desk Set' },
  ];

  const have = new Set(current.map(c => c.id));
  const toCreate = needed.filter(c => !have.has(c.id));

  for (const c of toCreate) {
    try {
      const res = await fetch(API.createCat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // IMPORTANT: do NOT send `icon` (your table doesn’t have this column)
        body: JSON.stringify({ id: c.id, label: c.label }),
      });
      if (!res.ok) {
        const msg = await res.text();
        console.warn('createCat warn', c.id, msg.slice(0, 200));
      }
    } catch (e) {
      console.warn('createCat error', c.id, e);
    }
  }
}

/* =========================
   Component
   ========================= */
export default function BundlesManager() {
  // Data
  const [bundles, setBundles] = useState<BundleRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingBundles, setLoadingBundles] = useState(true);
  const [loadingCats, setLoadingCats] = useState(true);

  // Filters / paging
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(12);

  // View toggle
  const [viewMode, setViewMode] = useState<'grid' | 'cards'>('cards');

  // Editor modal
  const [openEditor, setOpenEditor] = useState(false);
  const [draft, setDraft] = useState<BundleRecord | null>(null);
  const [draftThumbFile, setDraftThumbFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // upload busy flags
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState(false);

  // hidden file inputs
  const extraImgInputRef = useRef<HTMLInputElement | null>(null);
  const assetInputRef    = useRef<HTMLInputElement | null>(null);

  // Category modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  // keeping the “icon” choice in UI is harmless; we just won’t send it
  const [newCategoryIcon, setNewCategoryIcon] = useState<string>('sports');
  const [savingCategory, setSavingCategory] = useState(false);
  const [deleteCatId, setDeleteCatId] = useState<string>('');
  const [reassignCatId, setReassignCatId] = useState<string>('uncategorized');
  const ICONS = ['sports','toys','models','home','gadgets','cosplay','education','art','office','nature'];

  /* ----------------------- LOADERS ----------------------- */
  async function reloadCategories() {
    setLoadingCats(true);
    try {
      let list: Category[] = [];
      const res  = await fetch(API.listCats, { cache: 'no-store' });
      if (res.ok) {
        const data = await safeJson<any>(res);
        // Expecting shape: { categories: [{ id, label, count? }] }
        list = Array.isArray(data?.categories)
          ? data.categories.map((c: any) => ({ id: c.id, label: c.label, count: c.count ?? 0 }))
          : [];
      } else {
        console.warn('listCats not ok', res.status);
      }

      // Seed if empty or missing uncategorized; then re-read
      if (!list.length || !list.some(c => c.id === 'uncategorized')) {
        await seedBaselineCategoriesIfNeeded(list);
        try {
          const again = await fetch(API.listCats, { cache: 'no-store' });
          if (again.ok) {
            const data2 = await safeJson<any>(again);
            list = Array.isArray(data2?.categories)
              ? data2.categories.map((c: any) => ({ id: c.id, label: c.label, count: c.count ?? 0 }))
              : list;
          }
        } catch {}
      }

      const final = withSingleUncategorized(uniqueById(list));
      setCategories(final);

      // keep filter valid
      if (selectedCategory !== 'all' && !final.some(c => c.id === selectedCategory)) {
        setSelectedCategory('all');
      }

      // sensible defaults for delete modal
      const first = final.find(c => c.id !== 'uncategorized') ?? final[0];
      setDeleteCatId(first?.id || 'uncategorized');
      setReassignCatId('uncategorized');
    } catch (e) {
      console.error('categories load error', e);
      const fallback = withSingleUncategorized([]);
      setCategories(fallback);
      setSelectedCategory('all');
      setDeleteCatId('uncategorized');
      setReassignCatId('uncategorized');
    } finally {
      setLoadingCats(false);
    }
  }

  async function reloadBundles() {
    setLoadingBundles(true);
    try {
      const sp = new URLSearchParams();
      if (selectedCategory !== 'all') sp.set('category', selectedCategory);
      if (query.trim())             sp.set('q', query.trim());
      sp.set('page',     String(page));
      sp.set('pageSize', String(pageSize));

      const res  = await fetch(API.listBundles(sp.toString()), { cache: 'no-store' });
      const data = await safeJson<any>(res);

      const items: BundleRecord[] = (Array.isArray(data?.items) ? data.items : []).map((row: any) => {
        const gallery: BundleImage[] =
          (row.images || []).map((img: any) => ({ id: img.id ?? `img-${Math.random()}`, url: img.url || img.image_url }));

        const files: BundleFile[] =
          (row.files || []).map((f: any) => ({
            id: f.id ?? `file-${Math.random()}`,
            label: f.label || 'Download',
            file_url: f.file_url,
            mime_type: f.mime_type || '',
          }));

        const imageCount = (row.thumb_url ? 1 : 0) + gallery.length;

        return {
          id: row.id,
          title: row.title || '',
          blurb: row.blurb || '',
          price_from: row.price_from || '',
          category_id: row.category_id || 'uncategorized',
          thumb_url: row.thumb_url || null,
          thumb_storage_path: row.thumb_storage_path || null,
          sort_order: row.sort_order ?? 0,
          is_active: row.is_active ?? true,
          created_at: row.created_at ?? '',
          images: gallery,
          files,
          imageCount,
          fileCount: files.length,
          _pendingGalleryFiles: [],
          _pendingAssetFiles: [],
        };
      });

      setBundles(items);

      // Hydrate counts if list payload lacked details
      const needHydration = items.filter(b => b.imageCount <= 1 || b.fileCount === 0);
      if (needHydration.length) {
        await Promise.all(
          needHydration.map(async (b) => {
            try {
              const r = await fetch(API.getBundle(b.id), { cache: 'no-store' });
              if (!r.ok) return;
              const d = await safeJson<any>(r);
              const gallery: BundleImage[] = (d?.images || []).map((i: any) => ({ id: i.id, url: i.url || i.image_url }));
              const files: BundleFile[]    = (d?.files  || []).map((f: any) => ({
                id: f.id, label: f.label || 'Download', file_url: f.file_url, mime_type: f.mime_type || ''
              }));
              setBundles(prev => prev.map(p =>
                p.id === b.id
                  ? { ...p,
                      images: gallery,
                      files,
                      imageCount: (d?.thumb_url ? 1 : 0) + gallery.length,
                      fileCount: files.length
                    }
                  : p
              ));
            } catch (e) {
              console.warn('bundle hydrate failed', b.id, e);
            }
          })
        );
      }
    } catch (e) {
      console.error('bundles load error', e);
      setBundles([]);
    } finally {
      setLoadingBundles(false);
    }
  }

  useEffect(() => { reloadCategories(); }, []);
  useEffect(() => {
    reloadBundles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, query, page, pageSize]);

  /* ---------------------- FILTER/PAGE --------------------- */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bundles.filter((b) => {
      const matchesSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.blurb.toLowerCase().includes(q) ||
        b.category_id.toLowerCase().includes(q);
      const matchesCat = selectedCategory === 'all' || b.category_id === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [bundles, query, selectedCategory]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize || 1));
  const currentPage = Math.min(page, totalPages);
  const sliceStart  = (currentPage - 1) * pageSize;
  const sliceEnd    = sliceStart + pageSize;
  const paged       = filtered.slice(sliceStart, sliceEnd);

  /* ---------------------- LIST SYNC ----------------------- */
  function syncInList(id: string, updater: (old: BundleRecord) => BundleRecord) {
    setBundles((prev) => prev.map((rec) => (rec.id !== id ? rec : updater(rec))));
  }

  /* ----------------------- EDITOR ------------------------- */
  function startNew() {
    const realCats = categories.length ? categories : [{ id: 'uncategorized', label: 'Uncategorized' }];
    const defaultCat = (realCats.find(c => c.id === 'uncategorized') ?? realCats[0]).id;

    const blank: BundleRecord = {
      id: '',
      title: '',
      blurb: '',
      price_from: '',
      category_id: defaultCat,
      thumb_url: null,
      thumb_storage_path: null,
      sort_order: bundles.length,
      is_active: true,
      created_at: '',
      images: [],
      files: [],
      imageCount: 0,
      fileCount: 0,
      _pendingGalleryFiles: [],
      _pendingAssetFiles: [],
    };
    setDraft(blank);
    setDraftThumbFile(null);
    setOpenEditor(true);
  }

  async function startEdit(id: string) {
    try {
      const res = await fetch(API.getBundle(id), { cache: 'no-store' });
      if (!res.ok) { console.error('bundle detail fetch failed', res.status); return; }
      const data = await safeJson<any>(res);

      const gallery: BundleImage[] = (data?.images || []).map((i: any) => ({ id: i.id, url: i.url || i.image_url }));
      const files:   BundleFile[]  = (data?.files  || []).map((f: any) => ({
        id: f.id, label: f.label || 'Download', file_url: f.file_url, mime_type: f.mime_type || '',
      }));

      const base: BundleRecord = {
        id: data?.id,
        title: data?.title || '',
        blurb: data?.blurb || '',
        price_from: data?.price_from || '',
        category_id: data?.category_id || 'uncategorized',
        thumb_url: data?.thumb_url || null,
        thumb_storage_path: data?.thumb_storage_path || null,
        sort_order: data?.sort_order ?? 0,
        is_active: true,
        created_at: '',
        images: gallery,
        files,
        imageCount: (data?.thumb_url ? 1 : 0) + gallery.length,
        fileCount: files.length,
        _pendingGalleryFiles: [],
        _pendingAssetFiles: [],
      };

      syncInList(id, (old) => ({ ...old, images: gallery, files, imageCount: base.imageCount, fileCount: base.fileCount }));

      setDraft(base);
      setDraftThumbFile(null);
      setOpenEditor(true);
    } catch (e) {
      console.error('edit load error', e);
    }
  }

  function cancelEdit() {
    setOpenEditor(false);
    setDraft(null);
    setDraftThumbFile(null);
  }

  /* ------------------------ SAVE ------------------------- */
  async function saveDraft() {
    if (!draft) return;
    if (!draft.title.trim()) { alert('Please enter a title.'); return; }
    if (!draft.id && !draftThumbFile) { alert('Please choose a thumbnail before saving.'); return; }

    setSaving(true);

    const catIds = new Set(categories.map(c => c.id));
    const categoryToSend = catIds.has(draft.category_id) ? draft.category_id : 'uncategorized';

    // NEW BUNDLE
    if (!draft.id) {
      const fd = new FormData();
      fd.append('title',       draft.title || '');
      fd.append('blurb',       draft.blurb || '');
      fd.append('price_from',  draft.price_from || '');
      fd.append('category_id', categoryToSend);
      fd.append('sort_order',  String(draft.sort_order ?? bundles.length));
      if (draftThumbFile) fd.append('file', draftThumbFile);

      const res = await fetch(API.createBundle, { method: 'POST', body: fd });
      if (!res.ok) {
        console.error('upload failed', await res.text());
        alert('Could not save bundle (upload).');
        setSaving(false);
        return;
      }

      const body   = await res.json();
      const created: BundleRecord = {
        id: body.item.id,
        title: body.item.title || draft.title,
        blurb: body.item.blurb || draft.blurb || '',
        price_from: body.item.price_from || draft.price_from || '',
        category_id: body.item.category_id || categoryToSend || 'uncategorized',
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
        _pendingAssetFiles: [],
      };

      // pending gallery
      if (draft._pendingGalleryFiles?.length) {
        for (const file of draft._pendingGalleryFiles) {
          const imgFD = new FormData();
          imgFD.append('bundle_id', created.id);
          imgFD.append('file', file);
          const imgRes = await fetch(API.addImage, { method: 'POST', body: imgFD });
          if (imgRes.ok) {
            const j = await imgRes.json();
            const it = j.item;
            if (it?.id) {
              const newImg = { id: it.id, url: it.url || it.image_url };
              created.images.push(newImg);
              created.imageCount += 1;
            }
          }
        }
      }

      // pending files
      if (draft._pendingAssetFiles?.length) {
        for (const file of draft._pendingAssetFiles) {
          const fFD = new FormData();
          fFD.append('bundle_id', created.id);
          fFD.append('file', file);
          const fRes = await fetch(API.addFile, { method: 'POST', body: fFD });
          if (fRes.ok) {
            const j = await fRes.json();
            const it = j.item;
            if (it?.id) {
              const newFile: BundleFile = {
                id: it.id,
                label: it.label || 'Download',
                file_url: it.file_url,
                mime_type: it.mime_type || '',
              };
              created.files.push(newFile);
              created.fileCount += 1;
            }
          }
        }
      }

      setBundles((prev) => [created, ...prev]);
      setSaving(false);
      cancelEdit();
      return;
    }

    // UPDATE EXISTING
    const payload = {
      title: draft.title || '',
      blurb: draft.blurb || '',
      price_from: draft.price_from || '',
      category_id: categoryToSend,
      sort_order: draft.sort_order ?? 0,
      is_active: draft.is_active ?? true,
      thumb_url: draft.thumb_url || null,
    };

    const putRes = await fetch(API.updateBundle(draft.id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!putRes.ok) {
      const bodyPreview = await putRes.text();
      console.error('update failed', putRes.status, bodyPreview.slice(0, 240));
      alert('Could not update bundle.');
      setSaving(false);
      return;
    }

    if (draftThumbFile) {
      const thumbFD = new FormData();
      thumbFD.append('bundle_id', draft.id);
      thumbFD.append('file', draftThumbFile);
      const tRes = await fetch(API.updateThumb, { method: 'POST', body: thumbFD });
      if (tRes.ok) {
        const tJson = await tRes.json();
        const newThumb = tJson.item?.thumb_url || draft.thumb_url || null;
        setDraft((old) => (old ? { ...old, thumb_url: newThumb } : old));
        syncInList(draft.id, (old) => {
          const hadThumb = !!old.thumb_url;
          return { ...old, ...payload, thumb_url: newThumb, imageCount: hadThumb ? old.imageCount : old.imageCount + 1 };
        });
      } else {
        console.error('thumb update failed', await tRes.text());
      }
    } else {
      syncInList(draft.id, (old) => ({ ...old, ...payload }));
    }

    setSaving(false);
    cancelEdit();
  }

  /* ------------------------ DELETE ----------------------- */
  async function removeBundle(id: string) {
    if (!id) return;
    if (!window.confirm('Delete this bundle? This cannot be undone.')) return;

    setDeleting(true);
    const rec = bundles.find((b) => b.id === id);
    const thumb_storage_path = rec?.thumb_storage_path ?? null;

    const resp = await fetch(API.deleteBundle, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, thumb_storage_path, deleteAssets: true }),
    });

    if (!resp.ok) {
      console.error('delete failed', await resp.text());
      alert('Could not delete bundle.');
      setDeleting(false);
      return;
    }

    setBundles((prev) => prev.filter((b) => b.id !== id));
    if (draft?.id === id) cancelEdit();
    setDeleting(false);
  }

  /* ------------------- IMAGE / FILE HELPERS ------------------- */
  function handleThumbFilePick(file: File) {
    setDraftThumbFile(file);
    const localUrl = URL.createObjectURL(file);
    if (!draft) return;
    setDraft({ ...draft, thumb_url: localUrl });
    if (draft.id) {
      syncInList(draft.id, (old) => {
        const hadThumb = !!old.thumb_url;
        return { ...old, thumb_url: localUrl, imageCount: hadThumb ? old.imageCount : old.imageCount + 1 };
      });
    }
  }

  function clickAddExtraImage() { extraImgInputRef.current?.click(); }

  async function handleExtraImgChosen(file: File) {
    if (!draft) return;

    if (!draft.id) {
      const localUrl = URL.createObjectURL(file);
      const newImg: BundleImage = { id: `local-${Date.now()}`, url: localUrl };
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
      fd.append('bundle_id', draft.id);
      fd.append('file', file);
      const res = await fetch(API.addImage, { method: 'POST', body: fd });
      if (!res.ok) { console.error('add-image failed', await res.text()); alert('Could not upload image.'); return; }
      const body = await res.json();
      const it = body.item;
      if (it?.id) {
        const newImg: BundleImage = { id: it.id, url: it.url || it.image_url };
        setDraft((old) => (old ? { ...old, images: [...old.images, newImg], imageCount: old.imageCount + 1 } : old));
        syncInList(draft.id, (old) => ({ ...old, images: [...old.images, newImg], imageCount: old.imageCount + 1 }));
      }
    } finally { setUploadingImg(false); }
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
      syncInList(draft.id, (old) => {
        const newImages = old.images.filter((img) => img.id !== imgId);
        const wasRemote = !imgId.startsWith('local-');
        return { ...old, images: newImages, imageCount: wasRemote ? old.imageCount - 1 : old.imageCount };
      });
      if (!imgId.startsWith('local-')) {
        try {
          await fetch(API.removeImage, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: imgId }),
          });
        } catch (e) { console.error('remove-image error', e); }
      }
    }
  }

  function clickAddAsset() { assetInputRef.current?.click(); }

  async function handleAssetChosen(file: File) {
    if (!draft) return;
    const MAX_MB = 100;
    if (file.size > MAX_MB * 1024 * 1024) { alert(`File is too large (>${MAX_MB}MB).`); return; }

    if (!draft.id) {
      const mock: BundleFile = {
        id: `local-${Date.now()}`, label: file.name || 'File',
        file_url: `/local/${file.name}`, mime_type: file.type || 'application/octet-stream'
      };
      setDraft({
        ...draft,
        files: [...draft.files, mock],
        fileCount: draft.fileCount + 1,
        _pendingAssetFiles: [...(draft._pendingAssetFiles || []), file]
      });
      return;
    }

    setUploadingAsset(true);
    try {
      const fd = new FormData();
      fd.append('bundle_id', draft.id);
      fd.append('file', file);
      const res = await fetch(API.addFile, { method: 'POST', body: fd });
      if (!res.ok) { console.error('add-file failed', await res.text()); alert('Could not upload file.'); return; }
      const body = await res.json();
      const it = body.item;
      if (it?.id) {
        const newFile: BundleFile = { id: it.id, label: it.label || 'Download', file_url: it.file_url, mime_type: it.mime_type || '' };
        setDraft((old) => (old ? { ...old, files: [...old.files, newFile], fileCount: old.fileCount + 1 } : old));
        syncInList(draft.id, (old) => ({ ...old, files: [...old.files, newFile], fileCount: old.fileCount + 1 }));
      }
    } finally { setUploadingAsset(false); }
  }

  async function removeFile(fileId: string) {
    if (!draft) return;
    setDraft((old) => {
      if (!old) return old;
      const newFiles = old.files.filter((f) => f.id !== fileId);
      const wasRemote = !fileId.startsWith('local-');
      return { ...old, files: newFiles, fileCount: wasRemote ? old.fileCount - 1 : old.fileCount };
    });
    if (draft.id) {
      syncInList(draft.id, (old) => {
        const newFiles = old.files.filter((f) => f.id !== fileId);
        const wasRemote = !fileId.startsWith('local-');
        return { ...old, files: newFiles, fileCount: wasRemote ? old.fileCount - 1 : old.fileCount };
      });
      if (!fileId.startsWith('local-')) {
        try {
          await fetch(API.removeFile, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: fileId }),
          });
        } catch (e) { console.error('remove-file error', e); }
      }
    }
  }

  /* -------------------- CATEGORY MODAL -------------------- */
  function openCategoryModal() {
    setShowCategoryModal(true);
    setNewCategoryName('');
    setNewCategoryIcon('sports');
  }
  function closeCategoryModal() {
    setShowCategoryModal(false);
    setNewCategoryName('');
  }

  async function saveNewCategory() {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    const id = slugify(trimmed);
    if (categories.some((c) => c.id === id)) {
      setSelectedCategory(id);
      closeCategoryModal();
      return;
    }

    setSavingCategory(true);
    try {
      const res = await fetch(API.createCat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // IMPORTANT: do NOT send icon
        body: JSON.stringify({ id, label: trimmed }),
      });
      if (!res.ok) {
        console.error('create category failed', await res.text());
      }
      await reloadCategories();
      setSelectedCategory(id);
    } finally {
      setSavingCategory(false);
      closeCategoryModal();
    }
  }

  async function deleteCategory() {
    if (!deleteCatId) return;
    if (!window.confirm('Delete category and reassign existing bundles?')) return;

    try {
      const res = await fetch(API.deleteCat, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteCatId, reassignTo: reassignCatId || 'uncategorized' }),
      });
      if (!res.ok) {
        console.error('delete category failed', await res.text());
      }
      await reloadCategories();
      setBundles(prev => prev.map(b =>
        b.category_id === deleteCatId ? { ...b, category_id: reassignCatId || 'uncategorized' } : b
      ));
    } catch (e) {
      console.error('delete category error', e);
    }
  }

  /* ------------------------ Pager ------------------------ */
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

  /* ---------------------- Grid Tile ---------------------- */
  function GridTile({ b }: { b: BundleRecord }) {
    return (
      <div className="group rounded-xl border border-[var(--color-foreground)]/10 bg-[var(--color-foreground)]/[0.03] overflow-hidden" title={b.title}>
        <div className="relative aspect-square bg-[var(--color-background)] flex items-center justify-center overflow-hidden">
          {b.thumb_url || b.images[0]?.url ? (
            <img src={b.thumb_url || b.images[0]?.url || ''} alt={b.title || 'thumbnail'} className="h-full w-full object-contain" />
          ) : (
            <div className="text-xs opacity-70">No image</div>
          )}
          <div className="absolute top-2 right-2 hidden gap-2 group-hover:flex">
            <button className="p-1.5 rounded-md border border-[var(--color-foreground)]/30 bg-black/40 hover:bg-black/60" title="Edit" onClick={() => startEdit(b.id)} disabled={deleting}>
              <FiEdit2 className="w-4 h-4 text-white" />
            </button>
            <button className="p-1.5 rounded-md border border-[var(--color-foreground)]/30 bg-black/40 hover:bg-black/60" title="Delete" onClick={() => removeBundle(b.id)} disabled={deleting}>
              <FiTrash2 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
        <div className="p-3">
          <div className="text-sm font-medium truncate">{b.title || 'Untitled bundle'}</div>
          <div className="text-[11px] opacity-60 capitalize truncate">
            {categories.find((c) => c.id === b.category_id)?.label || b.category_id || 'Uncategorized'}
          </div>
          {b.price_from && <div className="text-teal-400 text-xs font-medium mt-1">{b.price_from}</div>}
          <div className="mt-2 text-[10px] opacity-60">{b.imageCount} image{b.imageCount === 1 ? '' : 's'} • {b.fileCount} file{b.fileCount === 1 ? '' : 's'}</div>
        </div>
      </div>
    );
  }

  /* ------------------------ RENDER ----------------------- */
  return (
    <section className="max-w-[1400px] mx-auto space-y-6 pb-24">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-1">Bundles & Packages</h1>
          <p className="opacity-70 text-sm max-w-[60ch]">Group standalone designs into packaged sets with shared pricing and a thumbnail.</p>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => { setShowCategoryModal(true); setNewCategoryName(''); setNewCategoryIcon('sports'); }}
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
              <span>New Bundle</span>
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
              placeholder="Search bundles..."
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
                <option key={cat.id} value={cat.id}>
                  {cat.label}{typeof cat.count === 'number' ? ` (${cat.count})` : ''}
                </option>
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

          {/* View toggle */}
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

        <div className="text-xs opacity-70 shrink-0 text-right">
          {loadingBundles ? 'Loading…' : `${filtered.length} bundle${filtered.length === 1 ? '' : 's'} total`}
        </div>
      </div>

      {/* RESULTS */}
      {viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
          {paged.map((b) => <GridTile key={b.id || `temp-${b.title}`} b={b} />)}
          {!paged.length && !loadingBundles && <div className="opacity-70 text-sm col-span-full">No results.</div>}
          {loadingBundles && <div className="opacity-70 text-sm col-span-full">Loading…</div>}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {paged.map((b) => (
            <div key={b.id || `temp-${b.title}`} className="rounded-xl border border-[var(--color-foreground)]/10 bg-[var(--color-foreground)]/[0.03] overflow-hidden flex flex-col">
              <div className="relative h-36 bg-[var(--color-background)] flex items-center justify-center overflow-hidden border-b border-[var(--color-foreground)]/10">
                {b.thumb_url || b.images[0]?.url ? (
                  <img src={b.thumb_url || b.images[0]?.url || ''} alt={b.title || 'thumbnail'} className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="text-xs opacity-70">No image</div>
                )}
              </div>

              <div className="p-3 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold leading-tight text-sm">{b.title || 'Untitled bundle'}</div>
                    <div className="text-[11px] opacity-60 capitalize">
                      {categories.find((c) => c.id === b.category_id)?.label || b.category_id || 'Uncategorized'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-md border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10 transition" title="Edit" onClick={() => startEdit(b.id)} disabled={deleting}>
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-md border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10 transition" title="Delete" onClick={() => removeBundle(b.id)} disabled={deleting}>
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {b.price_from && <div className="text-teal-400 text-sm font-medium mt-2">{b.price_from}</div>}
                {b.blurb && <p className="text-xs opacity-70 mt-2 line-clamp-3">{b.blurb}</p>}

                <div className="text-[10px] opacity-60 mt-auto pt-3 flex flex-wrap gap-2">
                  <span>{b.imageCount} image{b.imageCount === 1 ? '' : 's'}</span>
                  <span>•</span>
                  <span>{b.fileCount} file{b.fileCount === 1 ? '' : 's'}</span>
                </div>
              </div>
            </div>
          ))}
          {!paged.length && !loadingBundles && <div className="opacity-70 text-sm col-span-full">No results.</div>}
          {loadingBundles && <div className="opacity-70 text-sm col-span-full">Loading…</div>}
        </div>
      )}

      <div className="pt-8"><Pager align="center" /></div>

      {/* CATEGORY MODAL — with icon select + delete/reassign */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/70 p-4" onClick={(e) => { if (e.target === e.currentTarget) closeCategoryModal(); }}>
          <div className="w-full max-w-md rounded-xl border border-[var(--color-foreground)]/20 bg-[var(--color-background)] text-[var(--color-foreground)] shadow-2xl p-5 flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <FiTag className="text-lg" />
                <div className="text-base font-semibold leading-tight">Manage Categories</div>
              </div>
              <button onClick={closeCategoryModal} className="p-2 rounded-md border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10 transition" title="Close">
                <FiX />
              </button>
            </div>

            {/* Create */}
            <div>
              <div className="text-xs opacity-70 mb-2">Create a category you can assign to bundles.</div>
              <label className="text-xs opacity-70">Category name</label>
              <input
                className="w-full rounded-md border border-[var(--color-foreground)]/30 bg-transparent text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400/40"
                placeholder="e.g. Starter Kits"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />

              {/* Icon picker kept for future (no effect on save yet) */}
              <div className="mt-3">
                <div className="text-xs opacity-70 mb-1">Icon (optional, not saved yet)</div>
                <div className="grid grid-cols-6 gap-2">
                  {ICONS.map(ic => (
                    <button
                      key={ic}
                      onClick={() => setNewCategoryIcon(ic)}
                      className={`text-xs px-2 py-1 rounded-md border ${newCategoryIcon === ic ? 'border-teal-500/50 bg-teal-500/10' : 'border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10'}`}
                      title={ic}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end mt-3">
                <button
                  onClick={saveNewCategory}
                  className="text-sm font-medium px-4 py-2 rounded-md border border-teal-500/30 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition"
                  disabled={savingCategory}
                >
                  {savingCategory ? 'Saving…' : 'Save Category'}
                </button>
              </div>
            </div>

            {/* Delete / Reassign */}
            {categories.length > 0 && (
              <div className="pt-2 border-t border-[var(--color-foreground)]/10">
                <div className="text-xs opacity-70 mb-2">Delete category</div>
                <div className="grid grid-cols-1 gap-2">
                  <select
                    className="rounded-md border border-[var(--color-foreground)]/30 bg-transparent text-sm px-3 py-2 outline-none"
                    value={deleteCatId}
                    onChange={(e) => setDeleteCatId(e.target.value)}
                  >
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                  <div className="text-xs opacity-70">Reassign bundles to</div>
                  <select
                    className="rounded-md border border-[var(--color-foreground)]/30 bg-transparent text-sm px-3 py-2 outline-none"
                    value={reassignCatId}
                    onChange={(e) => setReassignCatId(e.target.value)}
                  >
                    {withSingleUncategorized(categories.filter(c => c.id !== deleteCatId))
                      .map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                  <button
                    onClick={deleteCategory}
                    className="mt-2 text-sm px-4 py-2 rounded-md border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                  >
                    Delete Category
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button onClick={closeCategoryModal} className="text-sm px-4 py-2 rounded-md border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10 transition" disabled={savingCategory}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDITOR MODAL */}
      {openEditor && draft && (
        <div className="fixed inset-0 z-[220] bg-black/70 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) cancelEdit(); }}>
          <div className="w-full max-w-2xl rounded-xl border border-[var(--color-foreground)]/20 bg-[var(--color-background)] text-[var(--color-foreground)] shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-foreground)]/10">
              <div className="font-semibold">{draft.id ? 'Edit Bundle' : 'New Bundle'}</div>
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

                <label className="text-xs opacity-70">Description</label>
                <textarea
                  className="w-full min-h-24 rounded-md border border-[var(--color-foreground)]/30 bg-transparent text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400/40"
                  value={draft.blurb}
                  onChange={(e) => setDraft({ ...draft, blurb: e.target.value })}
                />

                <label className="text-xs opacity-70">Price (display)</label>
                <input
                  className="w-full rounded-md border border-[var(--color-foreground)]/30 bg-transparent text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400/40"
                  placeholder="$49.99"
                  value={draft.price_from}
                  onChange={(e) => setDraft({ ...draft, price_from: e.target.value })}
                />

                <label className="text-xs opacity-70">Category</label>
                <select
                  className="w-full rounded-md border border-[var(--color-foreground)]/30 bg-transparent text-[var(--color-foreground)] text-sm px-3 py-2 outline-none"
                  value={draft.category_id}
                  onChange={(e) => setDraft({ ...draft, category_id: e.target.value })}
                >
                  {withSingleUncategorized(categories).map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
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
                        <button className="absolute -top-2 -right-2 bg-black/70 rounded-full p-1" onClick={() => removeImage(img.id)} title="Remove">
                          <FiX className="text-white text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={clickAddExtraImage} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10" disabled={uploadingImg}>
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
                  <button type="button" onClick={clickAddAsset} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10" disabled={uploadingAsset}>
                    <FiUpload />
                    <span className="text-sm">{uploadingAsset ? 'Uploading…' : 'Add File'}</span>
                  </button>
                  <input ref={assetInputRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleAssetChosen(e.target.files[0])} />
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