'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  FormEvent,
} from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import {
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiTrash2,
  FiX,
  FiCalendar,
} from 'react-icons/fi';

type NoteRow = {
  id: string;
  user_id: string;
  note_date: string; // ISO date (YYYY-MM-DD)
  note: string;
  updated_at: string;
};

type AgendaRow = {
  id: string;
  user_id: string;
  slot_date: string; // ISO date (YYYY-MM-DD)
  time_label: string;
  title: string;
  kind: string | null;
  sort_index: number | null;
  created_at: string;
};

function ymd(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Convert '10:30am' → minutes since midnight. Fallback 0 if format is weird. */
function timeLabelToMinutes(label: string): number {
  const m = label.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (!m) return 0;

  let hour = parseInt(m[1], 10);
  const minute = parseInt(m[2], 10);
  const period = m[3].toLowerCase();

  if (Number.isNaN(hour) || Number.isNaN(minute)) return 0;

  if (period === 'pm' && hour !== 12) hour += 12;
  if (period === 'am' && hour === 12) hour = 0;

  return hour * 60 + minute;
}

/** Sort slots by time (then by created_at as a tie-breaker). */
function sortAgendaSlots(slots: AgendaRow[]): AgendaRow[] {
  return [...slots].sort((a, b) => {
    const diff =
      timeLabelToMinutes(a.time_label) - timeLabelToMinutes(b.time_label);
    if (diff !== 0) return diff;
    return a.created_at.localeCompare(b.created_at);
  });
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarBoard({ userId }: { userId: string }) {
  const [month, setMonth] = useState(startOfMonth(new Date())); // current month view
  const [selected, setSelected] = useState<Date>(new Date()); // selected day

  // ----- NOTES STATE -----
  const [notes, setNotes] = useState<Record<string, string>>({}); // key: 'YYYY-MM-DD'
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null); // which date is saving
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ----- AGENDA STATE -----
  const [agendaSlots, setAgendaSlots] = useState<AgendaRow[]>([]);
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [agendaSaving, setAgendaSaving] = useState(false);

  // Add-modal state (time split into hour / minute / period)
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addHour, setAddHour] = useState('10');
  const [addMinute, setAddMinute] = useState('00');
  const [addPeriod, setAddPeriod] = useState<'am' | 'pm'>('am');
  const [addTitle, setAddTitle] = useState('');
  const [addKind, setAddKind] = useState('');

  // Delete-modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AgendaRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  // Helper to build time_label from hour/minute/period
  function buildTimeLabel(): string {
    let h = parseInt(addHour || '0', 10);
    let m = parseInt(addMinute || '0', 10);

    if (!Number.isFinite(h) || h < 1) h = 12;
    if (h > 12) h = 12;

    if (!Number.isFinite(m) || m < 0) m = 0;
    if (m > 59) m = 59;

    const hourStr = String(h);
    const minuteStr = String(m).padStart(2, '0');

    return `${hourStr}:${minuteStr}${addPeriod}`;
  }

  // ---------- LOAD NOTES FOR VISIBLE MONTH ----------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const supabase = supabaseBrowser;

      const from = ymd(startOfMonth(month));
      const to = ymd(endOfMonth(month));

      const { data, error } = await supabase
        .from('calendar_notes')
        .select('*')
        .gte('note_date', from)
        .lte('note_date', to)
        .order('note_date', { ascending: true });

      if (cancelled) return;
      if (error) {
        console.error('calendar load error', error);
        setNotes({});
        setLoading(false);
        return;
      }

      const map: Record<string, string> = {};
      (data as NoteRow[]).forEach((row) => {
        map[row.note_date] = row.note || '';
      });
      setNotes(map);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [month]);

  // ---------- LOAD AGENDA FOR SELECTED DAY ----------
  const selectedKey = ymd(selected);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setAgendaLoading(true);
      const supabase = supabaseBrowser;
      const { data, error } = await supabase
        .from('calendar_agenda_slots')
        .select('*')
        .eq('user_id', userId)
        .eq('slot_date', selectedKey)
        .order('time_label', { ascending: true }) // still fine; we re-sort anyway
        .order('created_at', { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error('agenda load error', error);
        setAgendaSlots([]);
      } else {
        const rows = (data as AgendaRow[]) ?? [];
        setAgendaSlots(sortAgendaSlots(rows));
      }
      setAgendaLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, selectedKey]);

  // ---------- MONTH GRID (6 x 7) ----------
  const cells = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const startWeekIdx = start.getDay(); // 0..6
    const totalDays = end.getDate();

    const days: Date[] = [];
    // leading blanks from prev month
    for (let i = 0; i < startWeekIdx; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() - (startWeekIdx - i));
      days.push(d);
    }
    // current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(month.getFullYear(), month.getMonth(), i));
    }
    // trailing to 42 cells
    while (days.length % 7 !== 0 || days.length < 42) {
      const last = days[days.length - 1];
      const d = new Date(last);
      d.setDate(d.getDate() + 1);
      days.push(d);
    }
    return days;
  }, [month]);

  const selectedNote = notes[selectedKey] ?? '';

  // ---------- DEBOUNCED NOTE SAVE ----------
  function queueSave(dateKey: string, text: string) {
    setNotes((prev) => ({ ...prev, [dateKey]: text }));
    setSavingKey(dateKey);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const supabase = supabaseBrowser;
        const { error } = await supabase
          .from('calendar_notes')
          .upsert(
            {
              user_id: userId,
              note_date: dateKey,
              note: text,
            },
            { onConflict: 'user_id,note_date' },
          );
        if (error) console.error('save error', error);
      } finally {
        setSavingKey(null);
      }
    }, 600);
  }

  // ---------- AGENDA HANDLERS ----------
  function openAddModal() {
    setAddHour('10');
    setAddMinute('00');
    setAddPeriod('am');
    setAddTitle('');
    setAddKind('');
    setIsAddOpen(true);
  }

  function closeAddModal() {
    setIsAddOpen(false);
  }

  async function handleConfirmAdd(e?: FormEvent) {
    if (e) e.preventDefault();

    const trimmedTitle = addTitle.trim();
    if (!trimmedTitle) return;

    const timeLabel = buildTimeLabel();

    setAgendaSaving(true);
    const supabase = supabaseBrowser;
    const { data, error } = await supabase
      .from('calendar_agenda_slots')
      .insert({
        user_id: userId,
        slot_date: selectedKey,
        time_label: timeLabel,
        title: trimmedTitle,
        kind: addKind.trim() || null,
      })
      .select('*')
      .single();

    if (error) {
      console.error('add agenda error', error);
    } else if (data) {
      setAgendaSlots((prev) =>
        sortAgendaSlots([...prev, data as AgendaRow]),
      );
      closeAddModal();
    }
    setAgendaSaving(false);
  }

  function openDeleteModal(slot: AgendaRow) {
    setDeleteTarget(slot);
    setDeleteConfirm('');
    setIsDeleteOpen(true);
  }

  function closeDeleteModal() {
    setIsDeleteOpen(false);
    setDeleteTarget(null);
  }

  async function handleConfirmDelete(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!deleteTarget) return;
    if (deleteConfirm !== 'DELETE') return;

    setAgendaSaving(true);
    const supabase = supabaseBrowser;
    const { error } = await supabase
      .from('calendar_agenda_slots')
      .delete()
      .eq('id', deleteTarget.id)
      .eq('user_id', userId);

    if (error) {
      console.error('delete agenda error', error);
    } else {
      setAgendaSlots((prev) =>
        prev.filter((slot) => slot.id !== deleteTarget.id),
      );
      closeDeleteModal();
    }
    setAgendaSaving(false);
  }

  // ---------- RENDER ----------
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px]">
        {/* LEFT: month grid */}
        <div className="p-4">
          {/* toolbar */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-semibold">
              {month.toLocaleString(undefined, {
                month: 'long',
                year: 'numeric',
              })}
              {loading && (
                <span className="text-xs opacity-60 ml-2">loading…</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-md border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10"
                onClick={() => setMonth(addMonths(month, -1))}
                title="Previous month"
              >
                <FiChevronLeft />
              </button>
              <button
                className="px-3 py-2 rounded-md border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10"
                onClick={() => {
                  const t = startOfMonth(new Date());
                  setMonth(t);
                  setSelected(new Date());
                }}
              >
                Today
              </button>
              <button
                className="p-2 rounded-md border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10"
                onClick={() => setMonth(addMonths(month, 1))}
                title="Next month"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>

          {/* weekday header */}
          <div className="grid grid-cols-7 text-xs uppercase tracking-wide opacity-60 mb-1 px-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="px-1 py-2">
                {w}
              </div>
            ))}
          </div>

          {/* days */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              const inMonth = d.getMonth() === month.getMonth();
              const key = ymd(d);
              const hasNote = !!notes[key]?.trim();
              const isToday = isSameDay(d, new Date());
              const isSel = isSameDay(d, selected);

              return (
                <button
                  key={key + i}
                  onClick={() => setSelected(new Date(d))}
                  className={[
                    'group relative h-[92px] rounded-md border text-left p-2 overflow-hidden transition',
                    inMonth
                      ? 'border-[var(--color-foreground)]/10 bg-[var(--color-foreground)]/[0.03] hover:bg-[var(--color-foreground)]/[0.08]'
                      : 'border-[var(--color-foreground)]/5 bg-transparent opacity-60',
                    isSel ? 'ring-2 ring-teal-400/60' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{d.getDate()}</span>
                    {isToday && (
                      <span className="text-[10px] px-1 rounded bg-teal-500/20 text-teal-300">
                        Today
                      </span>
                    )}
                  </div>

                  {/* tiny preview line */}
                  <div className="mt-1 text-[11px] leading-snug line-clamp-3 opacity-80">
                    {hasNote ? (
                      notes[key]
                    ) : (
                      <span className="opacity-30">—</span>
                    )}
                  </div>

                  {/* dot to indicate note */}
                  {hasNote && (
                    <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-teal-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT: notes + agenda panel */}
        <aside className="border-l border-[var(--color-foreground)]/10 p-4 bg-[var(--color-foreground)]/[0.02] flex flex-col">
          {/* Day heading */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">
              {selected.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h3>
            <div className="text-xs opacity-70">
              {savingKey === selectedKey ? 'Saving…' : 'Saved'}
            </div>
          </div>

          {/* NOTES (smaller) */}
          <div>
            <label className="block text-xs font-semibold mb-1 opacity-70">
              Notes
            </label>
            <textarea
              value={selectedNote}
              onChange={(e) => queueSave(selectedKey, e.target.value)}
              placeholder="Add notes, jobs, deadlines, print sessions…"
              className="w-full h-[140px] rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] p-3 text-sm outline-none focus:ring-2 focus:ring-teal-400/40"
            />
          </div>

          {/* Quick tags */}
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              'Client call',
              'Order shipped',
              'Printer maintenance',
              'Slice & queue',
              'Invoice sent',
              'Paid',
            ].map((tag) => (
              <button
                key={tag}
                className="text-xs px-2 py-1 rounded-md border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10"
                onClick={() =>
                  queueSave(
                    selectedKey,
                    (notes[selectedKey] ?? '').trim()
                      ? `${(notes[selectedKey] ?? '').trim()}\n• ${tag}`
                      : `• ${tag}`,
                  )
                }
              >
                + {tag}
              </button>
            ))}
          </div>

          {/* AGENDA CARD (mirrors Overview style) */}
          <div className="mt-6">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-3 h-[372px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#432389]/30 flex items-center justify-center">
                    <FiCalendar />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Day Agenda</h4>
                    <p className="text-[0.7rem] opacity-60">
                      These timeslots feed the Overview agenda.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openAddModal}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 hover:bg-white/10 text-xs"
                  title="Add timeslot"
                >
                  <FiPlus />
                </button>
              </div>

              <div className="flex items-center justify-between text-[0.7rem] opacity-60">
                {agendaLoading && <span>Loading…</span>}
                {!agendaLoading && agendaSaving && <span>Saving…</span>}
                {!agendaLoading && !agendaSaving && (
                  <span>{agendaSlots.length || 'No'} slots</span>
                )}
              </div>

              {/* List */}
              <div className="space-y-2 text-sm overflow-y-auto flex-1 min-h-0 pr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {agendaSlots.length === 0 && !agendaLoading && (
                  <div className="text-xs opacity-60">
                    No agenda for this day yet. Click the + button to add one.
                  </div>
                )}

                {agendaSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/25 px-3 py-2"
                  >
                    <div className="w-20 flex-shrink-0 text-[0.75rem] opacity-70 mt-[2px]">
                      {slot.time_label}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{slot.title}</div>
                      {slot.kind && (
                        <div className="text-[0.7rem] uppercase tracking-wide opacity-50">
                          {slot.kind}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => openDeleteModal(slot)}
                      className="ml-1 text-[0.7rem] opacity-60 hover:opacity-100 hover:text-rose-300"
                      title="Delete timeslot"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ADD MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-foreground)]/25 bg-[var(--color-background)] p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Add agenda slot</h2>
              <button
                type="button"
                onClick={closeAddModal}
                className="text-xs opacity-60 hover:opacity-100"
              >
                <FiX />
              </button>
            </div>
            <p className="text-[0.75rem] opacity-60 mb-4">
              Slots are tied to{' '}
              {selected.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
              .
            </p>
            <form className="space-y-3 text-sm" onSubmit={handleConfirmAdd}>
              <div className="space-y-1">
                <label className="text-[0.75rem] opacity-70">
                  Time<span className="text-rose-300">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={addHour}
                    onChange={(e) => setAddHour(e.target.value)}
                    className="w-16 rounded-md border border-[var(--color-foreground)]/30 bg-[var(--color-background)] px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-teal-400/40"
                    placeholder="10"
                  />
                  <span className="text-sm opacity-70">:</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={addMinute}
                    onChange={(e) => setAddMinute(e.target.value)}
                    className="w-16 rounded-md border border-[var(--color-foreground)]/30 bg-[var(--color-background)] px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-teal-400/40"
                    placeholder="30"
                  />
                  <select
                    value={addPeriod}
                    onChange={(e) =>
                      setAddPeriod(e.target.value as 'am' | 'pm')
                    }
                    className="rounded-md border border-[var(--color-foreground)]/30 bg-[var(--color-background)] px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-teal-400/40"
                  >
                    <option value="am">am</option>
                    <option value="pm">pm</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[0.75rem] opacity-70">
                  Title<span className="text-rose-300">*</span>
                </label>
                <input
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  placeholder="e.g., Pickup – Order #RD-1043"
                  className="w-full rounded-md border border-[var(--color-foreground)]/30 bg-[var(--color-background)] px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-teal-400/40"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[0.75rem] opacity-70">
                  Type / Tag (optional)
                </label>
                <input
                  value={addKind}
                  onChange={(e) => setAddKind(e.target.value)}
                  placeholder="print, pickup, quote…"
                  className="w-full rounded-md border border-[var(--color-foreground)]/30 bg-[var(--color-background)] px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-teal-400/40"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="px-3 py-1.5 text-xs rounded-md border border-[var(--color-foreground)]/30 hover:bg-[var(--color-foreground)]/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !addHour.trim() ||
                    !addMinute.trim() ||
                    !addTitle.trim() ||
                    agendaSaving
                  }
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-md border border-teal-400/70 text-teal-100 hover:bg-teal-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiPlus />
                  Add slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteOpen && deleteTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-foreground)]/25 bg-[var(--color-background)] p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-rose-200">
                Delete agenda slot
              </h2>
              <button
                type="button"
                onClick={closeDeleteModal}
                className="text-xs opacity-60 hover:opacity-100"
              >
                <FiX />
              </button>
            </div>
            <p className="text-[0.8rem] opacity-70 mb-3">
              You are about to delete this slot:
            </p>
            <div className="mb-3 rounded-lg border border-rose-400/40 bg-rose-900/20 px-3 py-2 text-[0.8rem]">
              <div className="font-semibold">
                {deleteTarget.time_label} – {deleteTarget.title}
              </div>
              {deleteTarget.kind && (
                <div className="text-[0.7rem] uppercase tracking-wide opacity-75">
                  {deleteTarget.kind}
                </div>
              )}
            </div>
            <p className="text-[0.8rem] opacity-70 mb-2">
              This action cannot be undone. Type{' '}
              <span className="font-mono text-rose-200">DELETE</span> to
              confirm.
            </p>
            <form
              className="space-y-3 text-sm"
              onSubmit={handleConfirmDelete}
            >
              <input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="w-full rounded-md border border-[var(--color-foreground)]/30 bg-[var(--color-background)] px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-rose-400/40"
                placeholder="Type DELETE to confirm"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="px-3 py-1.5 text-xs rounded-md border border-[var(--color-foreground)]/30 hover:bg-[var(--color-foreground)]/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteConfirm !== 'DELETE' || agendaSaving}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-md border border-rose-400/80 text-rose-100 hover:bg-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FiTrash2 />
                  Delete slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}