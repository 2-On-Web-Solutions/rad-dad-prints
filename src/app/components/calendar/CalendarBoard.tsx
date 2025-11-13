'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

type NoteRow = {
  id: string;
  user_id: string;
  note_date: string; // ISO date (YYYY-MM-DD)
  note: string;
  updated_at: string;
};

function ymd(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date)   { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function addMonths(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function isSameDay(a: Date, b: Date) { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }

const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function CalendarBoard({ userId }: { userId: string }) {
  const [month, setMonth] = useState(startOfMonth(new Date())); // current month view
  const [selected, setSelected] = useState<Date>(new Date());   // selected day
  const [notes, setNotes] = useState<Record<string, string>>({}); // key: 'YYYY-MM-DD'
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null); // which date is saving
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load all notes for the visible month
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
      (data as NoteRow[]).forEach(row => { map[row.note_date] = row.note || ''; });
      setNotes(map);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [month]);

  // Month grid (6 rows x 7 cols)
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

  const selectedKey = ymd(selected);
  const selectedNote = notes[selectedKey] ?? '';

  // Debounced upsert
  function queueSave(dateKey: string, text: string) {
    setNotes(prev => ({ ...prev, [dateKey]: text }));
    setSavingKey(dateKey);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const supabase = supabaseBrowser;
        const { error } = await supabase
          .from('calendar_notes')
          .upsert({
            user_id: userId,
            note_date: dateKey,
            note: text,
          }, { onConflict: 'user_id,note_date' });
        if (error) console.error('save error', error);
      } finally {
        setSavingKey(null);
      }
    }, 600);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px]">
      {/* LEFT: month grid */}
      <div className="p-4">
        {/* toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">
            {month.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
            {loading && <span className="text-xs opacity-60 ml-2">loading…</span>}
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
              onClick={() => { const t = startOfMonth(new Date()); setMonth(t); setSelected(new Date()); }}
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
          {WEEKDAYS.map((w) => <div key={w} className="px-1 py-2">{w}</div>)}
        </div>

        {/* days */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            const inMonth = d.getMonth() === month.getMonth();
            const key = ymd(d);
            const hasNote = !!(notes[key]?.trim());
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
                  {isToday && <span className="text-[10px] px-1 rounded bg-teal-500/20 text-teal-300">Today</span>}
                </div>

                {/* tiny preview line */}
                <div className="mt-1 text-[11px] leading-snug line-clamp-3 opacity-80">
                  {hasNote ? notes[key] : <span className="opacity-30">—</span>}
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

      {/* RIGHT: day panel */}
      <aside className="border-l border-[var(--color-foreground)]/10 p-4 bg-[var(--color-foreground)]/[0.02]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">
            {selected.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          <div className="text-xs opacity-70">
            {savingKey === selectedKey ? 'Saving…' : 'Saved'}
          </div>
        </div>

        <textarea
          value={selectedNote}
          onChange={(e) => queueSave(selectedKey, e.target.value)}
          placeholder="Add notes, jobs, deadlines, print sessions…"
          className="w-full h-[220px] rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] p-3 text-sm outline-none focus:ring-2 focus:ring-teal-400/40"
        />

        {/* Quick tags */}
        <div className="mt-3 flex flex-wrap gap-2">
          {['Client call','Order shipped','Printer maintenance','Slice & queue','Invoice sent','Paid'].map(tag => (
            <button
              key={tag}
              className="text-xs px-2 py-1 rounded-md border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/10"
              onClick={() => queueSave(selectedKey, (notes[selectedKey] ?? '').trim()
                ? `${(notes[selectedKey] ?? '').trim()}\n• ${tag}`
                : `• ${tag}`)}
            >
              + {tag}
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}