'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  FiPlus,
  FiFileText,
  FiPaperclip,
  FiEdit2,
  FiTrash2,
  FiSearch,
} from 'react-icons/fi';
import { supabaseBrowser } from '@/lib/supabase/client';
import NotesModal from './NotesModal';
import FilesModal from './FilesModal';
import MessageModal from './MessageModal';
import AddCustomerModal from './AddCustomerModal';
import InvoiceModal from './InvoiceModal';
import DeleteConfirmModal from './DeleteConfirmModal';

type CRMStatus = 'pending' | 'working' | 'completed';

type CRMFile = {
  id: string;
  name: string;
  sizeLabel: string;
  uploadedAt: string;
};

export type CRMRow = {
  id: string;
  ref: string;
  email: string;
  name: string;
  topic: string;
  message: string;
  notes: string;
  files: CRMFile[];
  createdAt: string;
  status: CRMStatus;
};

// storage bucket for CRM files
const CRM_FILES_BUCKET = 'crm_files';

// --- status styling helpers ---
const STATUS_META: Record<
  CRMStatus,
  {
    emoji: string;
    label: string;
    selectTextClass: string;
    selectBorderClass: string;
    tabBgClass: string;
    tabTextClass: string;
  }
> = {
  pending: {
    emoji: '🟡',
    label: 'Pending',
    // all dropdown text white now
    selectTextClass: 'text-white',
    selectBorderClass: 'border-[var(--color-foreground)]/80',
    tabBgClass: 'bg-yellow-500/20',
    tabTextClass: 'text-yellow-200',
  },
  working: {
    emoji: '🟢',
    label: 'Working',
    selectTextClass: 'text-white',
    selectBorderClass: 'border-[var(--color-foreground)]/80',
    tabBgClass: 'bg-green-500/20',
    tabTextClass: 'text-green-200',
  },
  completed: {
    emoji: '🔴',
    label: 'Completed',
    selectTextClass: 'text-white',
    selectBorderClass: 'border-[var(--color-foreground)]/80',
    tabBgClass: 'bg-red-500/20',
    tabTextClass: 'text-red-200',
  },
};

// --- dummy data kept only as a fallback if DB load fails ---
const DUMMY_ROWS: CRMRow[] = [
  {
    id: '1',
    ref: '20251115-142310-K9F3',
    email: 'alex.tabletop@example.com',
    name: 'Alex Tabletop',
    topic: 'Custom 3D Print',
    message: 'Looking for a set of dungeon tiles sized for 28mm minis.',
    notes: 'Wants dark grey PLA+; rough quote $60–70. Prefers pickup.',
    files: [
      {
        id: 'f1',
        name: 'dungeon_tiles_v3.stl',
        sizeLabel: '12.4 MB',
        uploadedAt: '2025-11-15T14:23:00Z',
      },
    ],
    createdAt: '2025-11-15T14:21:00Z',
    status: 'pending',
  },
  {
    id: '2',
    ref: '20251114-193015-Z4Q1',
    email: 'melissa.desk@example.com',
    name: 'Melissa F.',
    topic: 'Desk Organizer',
    message: 'Need a custom drawer organizer for office supplies.',
    notes: 'In progress on Prusa #2, PETG. Due Friday.',
    files: [],
    createdAt: '2025-11-14T19:30:15Z',
    status: 'working',
  },
  {
    id: '3',
    ref: '20251110-091500-B8L9',
    email: 'jordan.rc@example.com',
    name: 'Jordan R.',
    topic: 'RC Car Parts',
    message: 'Replacement chassis + battery tray for 1/10 scale buggy.',
    notes: 'Completed & picked up. Happy with print quality.',
    files: [
      {
        id: 'f2',
        name: 'rc_chassis_rev2.step',
        sizeLabel: '3.1 MB',
        uploadedAt: '2025-11-10T09:20:00Z',
      },
    ],
    createdAt: '2025-11-10T09:15:00Z',
    status: 'completed',
  },
  {
    id: '4',
    ref: '20251116-204210-M3X8',
    email: 'cosplay.armor@example.com',
    name: 'Liam Cosplay',
    topic: 'Cosplay Armor',
    message: 'Full chest and shoulder armor; needs by end of next month.',
    notes: 'Big job – maybe split into phases. Ask about budget.',
    files: [],
    createdAt: '2025-11-16T20:42:10Z',
    status: 'pending',
  },
];

const STATUS_TABS: { value: 'all' | CRMStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'working', label: 'Working' },
  { value: 'completed', label: 'Completed' },
];

export default function CRMBoard() {
  const supabase = supabaseBrowser;

  const [rows, setRows] = useState<CRMRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | CRMStatus>('pending');
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [notesModalRow, setNotesModalRow] = useState<CRMRow | null>(null);
  const [filesModalRow, setFilesModalRow] = useState<CRMRow | null>(null);
  const [messageModalRow, setMessageModalRow] = useState<CRMRow | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [invoiceRow, setInvoiceRow] = useState<CRMRow | null>(null);
  const [deleteRowTarget, setDeleteRowTarget] = useState<CRMRow | null>(null);

  // ---------- Load jobs + file counts from Supabase on mount ----------
  useEffect(() => {
    let isMounted = true;

    async function loadJobs() {
      setLoading(true);
      setLoadError(null);

      const { data: jobs, error } = await supabase
        .from('crm_jobs')
        .select(
          'id, ref, email, name, topic, message, notes, status, created_at',
        )
        .order('created_at', { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error('Error loading CRM jobs:', error);
        setLoadError(error.message);
        setRows(DUMMY_ROWS);
        setLoading(false);
        return;
      }

      const jobRows = jobs || [];
      const jobIds = jobRows.map((j: any) => j.id as string);

      // Build a map of job_id -> files[] so counts are correct on first render
      let fileMap: Record<string, CRMFile[]> = {};

      if (jobIds.length) {
        const { data: fileRows, error: filesError } = await supabase
          .from('crm_files')
          .select('id, job_id, name, size_label, uploaded_at')
          .in('job_id', jobIds);

        if (filesError) {
          console.error('Error loading CRM file counts:', filesError);
        } else if (fileRows) {
          fileMap = fileRows.reduce(
            (acc: Record<string, CRMFile[]>, f: any) => {
              const jobId = f.job_id as string;
              if (!acc[jobId]) acc[jobId] = [];
              acc[jobId].push({
                id: f.id,
                name: f.name,
                sizeLabel: f.size_label ?? '',
                uploadedAt: f.uploaded_at,
              });
              return acc;
            },
            {},
          );
        }
      }

      const mapped: CRMRow[] =
        jobRows.map((job: any) => ({
          id: job.id,
          ref: job.ref,
          email: job.email ?? '',
          name: job.name ?? '',
          topic: job.topic ?? '',
          message: job.message ?? '',
          notes: job.notes ?? '',
          files: fileMap[job.id] ?? [],
          createdAt: job.created_at,
          status: job.status as CRMStatus,
        })) ?? [];

      setRows(mapped);
      setLoading(false);
    }

    void loadJobs();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  // ---------- Filtering ----------
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        r.ref.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.topic.toLowerCase().includes(q)
      );
    });
  }, [rows, statusFilter, search]);

  // ---------- DB-backed updates ----------

  async function updateStatus(id: string, status: CRMStatus) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));

    const { error } = await supabase
      .from('crm_jobs')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
    }
  }

  async function updateNotes(id: string, notes: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, notes } : r)));

    const { error } = await supabase
      .from('crm_jobs')
      .update({ notes })
      .eq('id', id);

    if (error) {
      console.error('Error updating notes:', error);
    }
  }

  // inline edits (local state)
  function updateField<K extends keyof CRMRow>(
    id: string,
    field: K,
    value: CRMRow[K],
  ) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  }

  // persist email / name / topic changes to DB on blur
  async function persistInlineField<K extends 'email' | 'name' | 'topic'>(
    id: string,
    field: K,
    value: CRMRow[K],
  ) {
    const { error } = await supabase
      .from('crm_jobs')
      .update({ [field]: value })
      .eq('id', id);

    if (error) {
      console.error(`Error updating ${field}:`, error);
    }
  }

  async function handleCreateCustomer(input: {
    ref: string;
    email: string;
    name: string;
    topic: string;
    message: string;
    status: CRMStatus;
  }) {
    const { data, error } = await supabase
      .from('crm_jobs')
      .insert({
        ref: input.ref,
        email: input.email,
        name: input.name,
        topic: input.topic,
        message: input.message,
        status: input.status,
        notes: '',
      })
      .select(
        'id, ref, email, name, topic, message, notes, status, created_at',
      )
      .single();

    if (error || !data) {
      console.error('Error creating CRM job:', error);
      alert('Error creating customer / job. Check console for details.');
      return;
    }

    const newRow: CRMRow = {
      id: data.id,
      ref: data.ref,
      email: data.email ?? '',
      name: data.name ?? '',
      topic: data.topic ?? '',
      message: data.message ?? '',
      notes: data.notes ?? '',
      files: [],
      createdAt: data.created_at,
      status: data.status as CRMStatus,
    };

    setRows((prev) => [newRow, ...prev]);
  }

  // Delete a job + all associated files (db rows + storage objects)
  async function handleDeleteConfirmed(row: CRMRow) {
    // Optimistic UI: remove row immediately
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    setDeleteRowTarget(null);

    try {
      // 1) Load file rows for this job so we know which storage paths to delete
      const { data: fileRows, error: fileQueryError } = await supabase
        .from('crm_files')
        .select('id, storage_path')
        .eq('job_id', row.id);

      if (fileQueryError) {
        console.error('Error loading files for deletion:', fileQueryError);
      }

      const storagePaths: string[] =
        (fileRows ?? [])
          .map((f: any) => f.storage_path as string | null)
          .filter((p): p is string => !!p);

      // 2) Delete crm_files rows
      const { error: filesDeleteError } = await supabase
        .from('crm_files')
        .delete()
        .eq('job_id', row.id);

      if (filesDeleteError) {
        console.error('Error deleting crm_files rows:', filesDeleteError);
      }

      // 3) Delete storage objects (best effort)
      if (storagePaths.length) {
        const { error: storageError } = await supabase.storage
          .from(CRM_FILES_BUCKET)
          .remove(storagePaths);

        if (storageError) {
          console.error('Error deleting storage objects:', storageError);
        }
      }

      // 4) Delete the crm_jobs row itself
      const { error: jobError } = await supabase
        .from('crm_jobs')
        .delete()
        .eq('id', row.id);

      if (jobError) {
        console.error('Error deleting CRM job:', jobError);
        // You could optionally re-load here if you want to sync UI again.
      }
    } catch (err) {
      console.error('Unexpected error deleting CRM job + files:', err);
    }
  }

  function getTabActiveClasses(value: 'all' | CRMStatus) {
    if (value === 'all') {
      return 'font-semibold bg-teal-500/25';
    }
    const meta = STATUS_META[value];
    return `font-semibold ${meta.tabBgClass}`;
  }

  return (
    <div className="p-4 space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-[var(--color-foreground)]/25 bg-[var(--color-foreground)]/5 hover:bg-[var(--color-foreground)]/15 text-sm transition"
          >
            <FiPlus />
            Add customer
          </button>
          <span className="text-xs opacity-60 hidden sm:inline">
            (Manual entry – later we’ll hook this to Supabase.)
          </span>
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">
          {/* Status tabs */}
          <div className="inline-flex rounded-full border border-[var(--color-foreground)]/25 bg-[var(--color-foreground)]/5 overflow-hidden text-xs">
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.value;
              const activeClasses = active ? getTabActiveClasses(tab.value) : '';
              return (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`px-3 py-1.5 capitalize transition border-r border-[var(--color-foreground)]/10 hover:bg-[var(--color-foreground)]/10 ${activeClasses}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-full border border-[var(--color-foreground)]/25 bg-[var(--color-foreground)]/5 text-xs">
            <FiSearch className="opacity-60" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ref, email, name, topic…"
              className="bg-transparent outline-none text-xs w-40 sm:w-56"
            />
          </div>
        </div>
      </div>

      {loadError && (
        <div className="text-xs text-red-400">
          Error loading CRM jobs from Supabase – using demo data for now.
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto lg:overflow-x-hidden rounded-lg border border-[var(--color-foreground)]/15 bg-[var(--color-background)]/80">
        <table className="w-full text-sm">
          <thead className="text-left text-xs opacity-70 border-b border-[var(--color-foreground)]/15">
            <tr>
              <th className="py-2 px-3 whitespace-nowrap w-[140px]">Ref #</th>
              <th className="py-2 px-3 whitespace-nowrap w-[260px]">Email</th>
              <th className="py-2 px-3 whitespace-nowrap w-[140px]">Name</th>
              <th className="py-2 px-3 whitespace-nowrap w-[170px]">Topic</th>
              <th className="py-2 px-3 whitespace-nowrap w-[300px]">Message</th>
              <th className="py-2 px-3 whitespace-nowrap">Notes</th>
              <th className="py-2 px-3 whitespace-nowrap">Files</th>
              <th className="py-2 px-3 whitespace-nowrap">Invoice</th>
              <th className="py-2 px-3 whitespace-nowrap">Date</th>
              <th className="py-2 px-3 whitespace-nowrap">Status</th>
              <th className="py-2 px-3 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="align-middle">
            {filteredRows.map((row) => {
              const meta = STATUS_META[row.status];
              return (
                <tr
                  key={row.id}
                  className="border-t border-[var(--color-foreground)]/12 hover:bg-[var(--color-foreground)]/5 transition"
                >
                  <td className="py-3 px-3 font-mono text-xs whitespace-nowrap w-[140px]">
                    {row.ref}
                  </td>

                  {/* Editable email */}
                  <td className="py-3 px-3 whitespace-nowrap w-[260px]">
                    <input
                      value={row.email}
                      onChange={(e) =>
                        updateField(row.id, 'email', e.target.value)
                      }
                      onBlur={(e) =>
                        persistInlineField(row.id, 'email', e.target.value)
                      }
                      className="w-full bg-transparent border border-transparent hover:border-[var(--color-foreground)]/30 focus:border-[var(--color-foreground)]/50 rounded px-1 py-0.5 text-xs outline-none"
                    />
                  </td>

                  {/* Editable name */}
                  <td className="py-3 px-3 whitespace-nowrap w-[140px]">
                    <input
                      value={row.name}
                      onChange={(e) =>
                        updateField(row.id, 'name', e.target.value)
                      }
                      onBlur={(e) =>
                        persistInlineField(row.id, 'name', e.target.value)
                      }
                      className="w-full bg-transparent border border-transparent hover:border-[var(--color-foreground)]/30 focus:border-[var(--color-foreground)]/50 rounded px-1 py-0.5 text-xs outline-none"
                    />
                  </td>

                  {/* Editable topic */}
                  <td className="py-3 px-3 whitespace-nowrap w-[170px]">
                    <input
                      value={row.topic}
                      onChange={(e) =>
                        updateField(row.id, 'topic', e.target.value)
                      }
                      onBlur={(e) =>
                        persistInlineField(row.id, 'topic', e.target.value)
                      }
                      className="w-full bg-transparent border border-transparent hover:border-[var(--color-foreground)]/30 focus:border-[var(--color-foreground)]/50 rounded px-1 py-0.5 text-xs outline-none"
                    />
                  </td>

                  {/* Message – up to 2 lines, click to open modal */}
                  <td className="py-3 px-3 max-w-[300px] w-[300px]">
                    <button
                      type="button"
                      onClick={() => setMessageModalRow(row)}
                      className="text-left w-full text-xs opacity-80 hover:opacity-100 hover:text-teal-200"
                    >
                      <div className="line-clamp-2 whitespace-normal">
                        {row.message}
                      </div>
                    </button>
                  </td>

                  {/* Notes */}
                  <td className="py-3 px-3">
                    <button
                      className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10 text-xs"
                      onClick={() => setNotesModalRow(row)}
                    >
                      <FiEdit2 className="w-3 h-3" />
                      View
                    </button>
                  </td>

                  {/* Files */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <button
                      className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10 text-xs"
                      onClick={() => setFilesModalRow(row)}
                    >
                      <FiPaperclip className="w-3 h-3" />
                      {row.files.length ? `${row.files.length} file(s)` : 'Files'}
                    </button>
                  </td>

                  {/* Invoice */}
                  <td className="py-3 px-3">
                    <button
                      className="inline-flex items-center gap-1 px-2 py-1 rounded border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10 text-xs"
                      onClick={() => setInvoiceRow(row)}
                    >
                      <FiFileText className="w-3 h-3" />
                      Send
                    </button>
                  </td>

                  {/* Date */}
                  <td className="py-3 px-3 whitespace-nowrap text-xs">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <select
                      className={`bg-[var(--color-background)] border rounded px-2 py-1 text-xs ${meta.selectBorderClass} ${meta.selectTextClass}`}
                      value={row.status}
                      onChange={(e) =>
                        void updateStatus(row.id, e.target.value as CRMStatus)
                      }
                    >
                      <option value="pending">
                        {STATUS_META.pending.emoji} {STATUS_META.pending.label}
                      </option>
                      <option value="working">
                        {STATUS_META.working.emoji} {STATUS_META.working.label}
                      </option>
                      <option value="completed">
                        {STATUS_META.completed.emoji}{' '}
                        {STATUS_META.completed.label}
                      </option>
                    </select>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <button
                        className="px-2.5 py-1.5 rounded border border-red-500/40 text-red-300 hover:bg-red-500/10 text-xs"
                        onClick={() => setDeleteRowTarget(row)}
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {!filteredRows.length && (
              <tr>
                <td
                  colSpan={11}
                  className="py-10 text-center text-sm opacity-60"
                >
                  {loading
                    ? 'Loading customers…'
                    : 'No customers match this filter yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Notes modal */}
      {notesModalRow && (
        <NotesModal
          row={notesModalRow}
          onClose={(updated) => {
            if (updated !== undefined) {
              void updateNotes(notesModalRow!.id, updated);
            }
            setNotesModalRow(null);
          }}
        />
      )}

      {/* Files modal */}
      {filesModalRow && (
        <FilesModal
          row={filesModalRow}
          onClose={(updatedFiles) => {
            if (updatedFiles) {
              const rowId = filesModalRow!.id;
              setRows((prev) =>
                prev.map((r) =>
                  r.id === rowId ? { ...r, files: updatedFiles } : r,
                ),
              );
            }
            setFilesModalRow(null);
          }}
        />
      )}

      {/* Message modal */}
      {messageModalRow && (
        <MessageModal
          row={messageModalRow}
          onClose={() => setMessageModalRow(null)}
        />
      )}

      {/* Add customer modal */}
      {addModalOpen && (
        <AddCustomerModal
          onClose={() => setAddModalOpen(false)}
          onCreate={(data) => {
            void handleCreateCustomer(data);
            setAddModalOpen(false);
          }}
        />
      )}

      {/* Invoice modal */}
      {invoiceRow && (
        <InvoiceModal
          row={invoiceRow}
          onClose={() => setInvoiceRow(null)}
          onSend={(payload) => {
            alert(
              `Invoice would be sent to ${payload.email} for Ref #${payload.ref}.\n\nAmount: ${payload.amount || 'N/A'}\nSubject: ${payload.subject}`,
            );
            setInvoiceRow(null);
          }}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteRowTarget && (
        <DeleteConfirmModal
          row={deleteRowTarget}
          onCancel={() => setDeleteRowTarget(null)}
          onConfirm={() => void handleDeleteConfirmed(deleteRowTarget!)}
        />
      )}
    </div>
  );
}