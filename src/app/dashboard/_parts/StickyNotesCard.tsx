'use client';

import { useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiEdit3 } from 'react-icons/fi';
import { Rock_Salt } from 'next/font/google';

const rockSalt = Rock_Salt({
  subsets: ['latin'],
  weight: '400',
});

type StickyNote = {
  id: string;
  content: string;
  note_date: string;
};

type StickyNotesCardProps = {
  todayNotes: StickyNote[];
  yesterdayNotes: StickyNote[];
};

export default function StickyNotesCard({
  todayNotes,
  yesterdayNotes,
}: StickyNotesCardProps) {
  const [activeDay, setActiveDay] = useState<'today' | 'yesterday'>('today');
  const [indexByDay, setIndexByDay] = useState<{ today: number; yesterday: number }>({
    today: 0,
    yesterday: 0,
  });

  const isToday = activeDay === 'today';
  const notesForDay = isToday ? todayNotes : yesterdayNotes;
  const countForDay = notesForDay.length;

  const index = isToday ? indexByDay.today : indexByDay.yesterday;
  const safeIndex = countForDay === 0 ? 0 : Math.min(index, countForDay - 1);
  const currentNote = countForDay > 0 ? notesForDay[safeIndex] : null;

  const handlePrev = () => {
    if (countForDay === 0) return;
    setIndexByDay((prev) => {
      const key = isToday ? 'today' : 'yesterday';
      return { ...prev, [key]: Math.max(0, prev[key] - 1) };
    });
  };

  const handleNext = () => {
    if (countForDay === 0) return;
    setIndexByDay((prev) => {
      const key = isToday ? 'today' : 'yesterday';
      return { ...prev, [key]: Math.min(countForDay - 1, prev[key] + 1) };
    });
  };

  const canPrev = countForDay > 0 && safeIndex > 0;
  const canNext = countForDay > 0 && safeIndex < countForDay - 1;
  const positionLabel = countForDay > 0 ? `${safeIndex + 1} / ${countForDay}` : '0 / 0';

  const noteText =
    currentNote?.content ??
    `No ${isToday ? 'today' : 'yesterday'} notes yet.\nThey will appear here from Note Manager.`;

  return (
    <div className="flex h-full flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-sky-500/25 flex items-center justify-center">
            <FiEdit3 className="text-sky-300" />
          </div>
          <h2 className="text-sm font-semibold">Notes</h2>
        </div>

        {/* Today / Yesterday toggle */}
        <div className="inline-flex items-center rounded-full bg-white/5 p-0.5 text-[0.7rem]">
          <button
            type="button"
            onClick={() => setActiveDay('today')}
            className={`px-2.5 py-1 rounded-full transition border ${
              isToday
                ? 'bg-sky-400 text-slate-900 border-sky-300 shadow-md shadow-black/30'
                : 'bg-transparent text-slate-200 border-transparent hover:bg-white/5'
            }`}
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => setActiveDay('yesterday')}
            className={`px-2.5 py-1 rounded-full transition border ${
              !isToday
                ? 'bg-emerald-400 text-slate-900 border-emerald-300 shadow-md shadow-black/30'
                : 'bg-transparent text-slate-200 border-transparent hover:bg-white/5'
            }`}
          >
            Yesterday
          </button>
        </div>
      </div>

      {/* NOTE WRAPPER */}
      <div className="flex-1 flex items-start justify-center pt-4 relative overflow-visible">
        {/* STICKY NOTE */}
        <div
          className={`
            relative 
            w-[220px] h-[180px]
            px-4 py-3
            text-sm leading-relaxed 
            shadow-[0_14px_28px_rgba(0,0,0,0.55)] 
            transform-gpu -rotate-1 
            ${isToday ? 'bg-sky-300' : 'bg-emerald-300'}
            text-slate-900
          `}
          style={{ borderRadius: 0 }}
        >
          {/* TAPE — sits half-on / half-off the note, no longer clipped */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-20 bg-slate-200/70 opacity-80 rounded-sm" />

          {/* TEXT (scrollable but hidden scrollbar) */}
          <div
            className={`mt-1 h-full overflow-y-auto whitespace-pre-wrap ${rockSalt.className}`}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>

            {noteText}
          </div>
        </div>
      </div>

      {/* NAVIGATION — ONLY arrows + note count */}
      <div className="mt-2 flex items-center justify-between text-[0.7rem]">
        <button
          type="button"
          onClick={handlePrev}
          disabled={!canPrev}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/20 hover:bg-white/10 disabled:opacity-30"
        >
          <FiChevronLeft />
        </button>

        {/* NOTE COUNT ONLY */}
        <span className="opacity-80 font-medium">{positionLabel}</span>

        <button
          type="button"
          onClick={handleNext}
          disabled={!canNext}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/20 hover:bg-white/10 disabled:opacity-30"
        >
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
}