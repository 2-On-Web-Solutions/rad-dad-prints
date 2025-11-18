'use client';

import { useEffect, useState } from 'react';
import { FiUploadCloud, FiTrash2, FiDownloadCloud } from 'react-icons/fi';
import type { CRMRow } from './CRMBoard';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

const CRM_FILES_BUCKET = 'crm_files';

// Extend whatever CRMRow.files look like with storagePath
type CRMFile = CRMRow['files'][number] & {
  storagePath: string;
};

type Props = {
  row: CRMRow;
  onClose: (updatedFiles?: CRMFile[]) => void;
};

export default function FilesModal({ row, onClose }: Props) {
  const supabase = supabaseBrowser as SupabaseClient;

  const [files, setFiles] = useState<CRMFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // delete-confirm modal state
  const [fileToDelete, setFileToDelete] = useState<CRMFile | null>(null);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  // download state
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // ------------------------------------------------
  // Load existing files from crm_files for this job
  // ------------------------------------------------
  useEffect(() => {
    async function loadFiles() {
      setError(null);

      const { data, error: dbError } = await supabase
        .from('crm_files')
        .select('id, name, size_label, uploaded_at, storage_path')
        .eq('job_id', row.id)
        .order('uploaded_at', { ascending: false });

      if (dbError) {
        console.error('Error loading CRM files:', dbError);
        setError('Error loading files for this customer.');
        return;
      }

      const mapped: CRMFile[] =
        (data || []).map((f) => ({
          id: f.id,
          name: f.name,
          sizeLabel: f.size_label ?? '',
          uploadedAt: f.uploaded_at,
          storagePath: f.storage_path,
        })) ?? [];

      setFiles(mapped);
    }

    if (row.id) {
      loadFiles();
    }
  }, [row.id, supabase]);

  // ------------------------------------------------
  // Upload handler
  // ------------------------------------------------
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      // ----- get current user (for path scoping) -----
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('No auth user when uploading file', userError);
        setError('You must be logged in to upload files.');
        setUploading(false);
        (e.target as HTMLInputElement).value = '';
        return;
      }

      const userId = user.id;

      // ----- upload to Storage -----
      const fileName = file.name;
      const storagePath = `${userId}/${row.id}/${Date.now()}-${fileName}`;

      const { error: storageError } = await supabase.storage
        .from(CRM_FILES_BUCKET)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || undefined,
        });

      if (storageError) {
        console.error('Storage upload error:', storageError);
        setError('Error uploading file to storage.');
        setUploading(false);
        (e.target as HTMLInputElement).value = '';
        return;
      }

      // ----- insert DB record into crm_files -----
      const prettySize = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

      const { data: dbRow, error: dbError } = await supabase
        .from('crm_files')
        .insert({
          job_id: row.id,
          name: fileName,
          size_label: prettySize,
          storage_path: storagePath,
          uploaded_at: new Date().toISOString(),
        })
        .select('id, uploaded_at, storage_path')
        .single();

      if (dbError || !dbRow) {
        console.error('DB insert error:', dbError);
        setError('Error saving file record.');
        setUploading(false);
        (e.target as HTMLInputElement).value = '';
        return;
      }

      const newFile: CRMFile = {
        id: dbRow.id,
        name: fileName,
        sizeLabel: prettySize,
        uploadedAt: dbRow.uploaded_at,
        storagePath: dbRow.storage_path,
      };

      setFiles((prev) => [newFile, ...prev]);
      setUploading(false);
      (e.target as HTMLInputElement).value = '';
    } catch (err) {
      console.error('Unexpected upload error:', err);
      setError('Unexpected error uploading file.');
      setUploading(false);
      (e.target as HTMLInputElement).value = '';
    }
  }

  // ------------------------------------------------
  // Download handler (uses signed URL for private bucket)
  // ------------------------------------------------
  async function handleDownload(f: CRMFile) {
    try {
      setError(null);
      setDownloadingId(f.id);
      console.log('Starting download for', f);

      // signed URL works for private buckets (no need to make bucket public)
      const { data, error: urlError } = await supabase.storage
        .from(CRM_FILES_BUCKET)
        .createSignedUrl(f.storagePath, 60 * 60); // 1 hour expiry

      if (urlError || !data?.signedUrl) {
        console.error('Error getting signed URL:', urlError);
        setError('Error starting download.');
        setDownloadingId(null);
        return;
      }

      // Trigger browser download via an <a> element
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = f.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      console.log('Download triggered for', f.name);
    } catch (err) {
      console.error('Unexpected download error:', err);
      setError('Unexpected error starting download.');
    } finally {
      // keep spinner visible briefly so it feels responsive
      setTimeout(() => {
        setDownloadingId((current) => (current === f.id ? null : current));
      }, 800);
    }
  }

  // ------------------------------------------------
  // Delete handler (opens modal)
  // ------------------------------------------------
  function requestDelete(f: CRMFile) {
    setError(null);
    setFileToDelete(f);
    setDeleteInput('');
  }

  // ------------------------------------------------
  // Confirm delete: DB row + storage object
  // ------------------------------------------------
  async function confirmDelete() {
    if (!fileToDelete) return;
    setDeleting(true);
    setError(null);

    try {
      // 1) delete DB row
      const { error: dbError } = await supabase
        .from('crm_files')
        .delete()
        .eq('id', fileToDelete.id);

      if (dbError) {
        console.error('Error deleting crm_files row:', dbError);
        setError('Error deleting file record.');
        setDeleting(false);
        return;
      }

      // 2) delete from storage (best-effort)
      if (fileToDelete.storagePath) {
        const { error: storageError } = await supabase.storage
          .from(CRM_FILES_BUCKET)
          .remove([fileToDelete.storagePath]);

        if (storageError) {
          console.error('Error deleting storage object:', storageError);
        }
      }

      // 3) update local state so it doesn’t come back
      setFiles((prev) => prev.filter((x) => x.id !== fileToDelete.id));
      setFileToDelete(null);
      setDeleteInput('');
    } catch (err) {
      console.error('Unexpected delete error:', err);
      setError('Unexpected error deleting file.');
    } finally {
      setDeleting(false);
    }
  }

  function closeWithSave() {
    onClose(files);
  }

  const showDeleteModal = fileToDelete !== null;

  return (
    <>
      {/* Main files modal */}
      <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="w-full max-w-[720px] rounded-xl border border-[var(--color-foreground)]/25 bg-[var(--color-background)]">
          <div className="p-4 border-b border-[var(--color-foreground)]/20 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                Files — {row.name || row.ref}
              </h3>
              <p className="text-xs opacity-60">
                Attach reference images, STL/OBJ files, or invoices for this
                customer.
              </p>
            </div>
            <button
              className="text-sm opacity-70 hover:opacity-100"
              onClick={() => onClose()}
            >
              ✕
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-[var(--color-foreground)]/25 cursor-pointer hover:bg-[var(--color-foreground)]/10 text-sm">
                <FiUploadCloud />
                <span>{uploading ? 'Uploading…' : 'Upload file'}</span>
                <input
                  type="file"
                  className="hidden"
                  disabled={uploading}
                  onChange={handleUpload}
                />
              </label>
              <div className="text-xs opacity-60">
                {files.length} file{files.length === 1 ? '' : 's'} attached
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-400 whitespace-pre-line">
                {error}
              </div>
            )}

            <div className="rounded-lg border border-[var(--color-foreground)]/20 bg-[var(--color-foreground)]/5 max-h-[320px] overflow-auto">
              {files.length === 0 ? (
                <div className="py-8 text-center text-sm opacity-60">
                  No files yet. Upload STL/OBJ, reference images, or invoices.
                </div>
              ) : (
                <ul className="divide-y divide-[var(--color-foreground)]/15 text-sm">
                  {files.map((f) => {
                    const isDownloading = downloadingId === f.id;
                    return (
                      <li
                        key={f.id}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <div className="font-medium truncate">{f.name}</div>
                          <div className="text-[11px] opacity-60">
                            {f.sizeLabel} •{' '}
                            {new Date(f.uploadedAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="p-1.5 rounded-md border border-[var(--color-foreground)]/30 hover:bg-[var(--color-foreground)]/10 text-xs flex items-center justify-center disabled:opacity-40"
                            onClick={() => handleDownload(f)}
                            disabled={isDownloading}
                            title="Download file"
                          >
                            {isDownloading ? (
                              <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <FiDownloadCloud className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            className="p-1.5 rounded-md border border-red-500/40 text-red-300 hover:bg-red-500/10"
                            onClick={() => requestDelete(f)}
                            title="Delete file"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-[var(--color-foreground)]/20 flex items-center justify-end gap-2">
            <button
              className="px-3 py-2 text-sm rounded-md border border-[var(--color-foreground)]/25 hover:bg-[var(--color-foreground)]/10"
              onClick={() => onClose()}
            >
              Close
            </button>
            <button
              className="px-3 py-2 text-sm rounded-md border border-teal-500/40 bg-teal-500/20 hover:bg-teal-500/30 text-teal-100"
              onClick={closeWithSave}
            >
              Save changes
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && fileToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-[var(--color-background)] border border-red-500/40 shadow-xl">
            <div className="px-5 pt-4 pb-3 border-b border-red-500/30">
              <h4 className="text-base font-semibold text-red-200">
                Delete file?
              </h4>
              <p className="mt-1 text-xs opacity-70">
                This will permanently remove{' '}
                <span className="font-medium">{fileToDelete.name}</span> from
                this customer and delete the underlying file from storage.
              </p>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs opacity-70">
                To confirm, type <span className="font-mono">DELETE</span>{' '}
                below.
              </p>
              <input
                className="w-full rounded-md border border-[var(--color-foreground)]/25 bg-transparent px-3 py-2 text-sm outline-none focus:border-red-400"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="DELETE"
                autoFocus
              />
            </div>

            <div className="px-5 pb-4 pt-3 border-t border-[var(--color-foreground)]/20 flex justify-end gap-2">
              <button
                className="px-3 py-2 text-xs rounded-md border border-[var(--color-foreground)]/25 hover:bg-[var(--color-foreground)]/10"
                onClick={() => {
                  if (!deleting) {
                    setFileToDelete(null);
                    setDeleteInput('');
                  }
                }}
              >
                Cancel
              </button>
              <button
                className="px-3 py-2 text-xs rounded-md border border-red-500/70 bg-red-600/20 text-red-100 hover:bg-red-600/35 disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={deleteInput !== 'DELETE' || deleting}
                onClick={confirmDelete}
              >
                {deleting ? 'Deleting…' : 'Delete file'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}