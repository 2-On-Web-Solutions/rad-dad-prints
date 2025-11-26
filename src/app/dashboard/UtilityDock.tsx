'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiEdit3, FiX } from 'react-icons/fi';
import { HiOutlineCalculator } from 'react-icons/hi';

// Simple helper for clamping values into a range
function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

type Pos = { x: number; y: number };

const NOTE_TEXT_KEY = 'rdp_note_text_v1';
const NOTE_DRAW_KEY = 'rdp_note_drawing_v1';

// layout constants
// ↓ pulled in a bit so panels sit tighter to the sidebar / tab bar
const PANEL_COL_X = 72;
const HEADER_OFFSET = 64;

const CALC_WIDTH = 220;
const CALC_HEIGHT = 270;

const NOTE_WIDTH = 260;
const NOTE_HEIGHT = 430;

// defaults for “home” positions (used on mount AND on close)
const DEFAULT_CALC_POS: Pos = {
  x: PANEL_COL_X,
  y: HEADER_OFFSET + 8,
};

const DEFAULT_NOTE_POS: Pos = {
  x: PANEL_COL_X,
  y: HEADER_OFFSET + 8 + CALC_HEIGHT + 16,
};

// max number of digits the calculator will accept
const MAX_DIGITS = 15;

// --- Small 4-function calculator state helpers ---
type CalcState = {
  display: string;
  stored: number | null;
  op: '+' | '-' | '×' | '÷' | null;
  replaceOnNext: boolean;
};

const defaultCalc: CalcState = {
  display: '0',
  stored: null,
  op: null,
  replaceOnNext: false,
};

function doOp(a: number, b: number, op: CalcState['op']): number {
  switch (op) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      return b === 0 ? a : a / b;
    default:
      return b;
  }
}

export default function UtilityDock() {
  // mount flag for portals
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // which panels are open
  const [noteOpen, setNoteOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);

  // positions (start at the default docked positions)
  const [calcPos, setCalcPos] = useState<Pos>(DEFAULT_CALC_POS);
  const [notePos, setNotePos] = useState<Pos>(DEFAULT_NOTE_POS);

  // scratchpad mode: draw OR text
  const [noteMode, setNoteMode] = useState<'draw' | 'text'>('draw');

  // note text + drawing
  const [noteText, setNoteText] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  // calculator state
  const [calc, setCalc] = useState<CalcState>(defaultCalc);

  // z-index management so last-clicked panel comes to front
  const [topId, setTopId] = useState<'note' | 'calc' | null>(null);

  // --- load note text from localStorage on mount ---
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const txt = window.localStorage.getItem(NOTE_TEXT_KEY);
    if (txt) setNoteText(txt);
  }, []);

  // --- restore drawing into canvas whenever it exists + we're in Draw mode ---
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!mounted) return;
    if (!noteOpen) return;
    if (noteMode !== 'draw') return;
    if (!canvasRef.current) return;

    const dataUrl = window.localStorage.getItem(NOTE_DRAW_KEY);
    if (!dataUrl) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = dataUrl;
  }, [mounted, noteOpen, noteMode]);

  // persist note text
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(NOTE_TEXT_KEY, noteText);
  }, [noteText]);

  // --- DRAG HANDLER (shared for note + calc) ---
  function beginDrag(
    kind: 'note' | 'calc',
    downEvent: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) {
    if (typeof window === 'undefined') return;

    downEvent.preventDefault();
    downEvent.stopPropagation();
    setTopId(kind);

    const startX = downEvent.clientX;
    const startY = downEvent.clientY;

    const startPos = kind === 'note' ? notePos : calcPos;
    const width = kind === 'note' ? NOTE_WIDTH : CALC_WIDTH;
    const height = kind === 'note' ? NOTE_HEIGHT : CALC_HEIGHT;

    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const nextX = clamp(startPos.x + dx, 0, vw - width - 8);
      const nextY = clamp(startPos.y + dy, HEADER_OFFSET, vh - height - 8);

      if (kind === 'note') {
        setNotePos({ x: nextX, y: nextY });
      } else {
        setCalcPos({ x: nextX, y: nextY });
      }
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }

  // --- drawing handlers ---
  function getCanvasPoint(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function startDraw(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    const p = getCanvasPoint(e);
    drawing.current = true;
    last.current = p;
  }

  function moveDraw(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if (!drawing.current || !canvasRef.current || !last.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const p = getCanvasPoint(e);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  }

  function endDraw() {
    if (!drawing.current || !canvasRef.current) return;
    drawing.current = false;
    last.current = null;

    // save canvas as image
    const dataUrl = canvasRef.current.toDataURL('image/png');
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(NOTE_DRAW_KEY, dataUrl);
    }
  }

  function clearCanvas() {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(NOTE_DRAW_KEY);
    }
  }

  // --- calculator handlers ---

  // helper: count just the numeric digits (no minus / decimal)
  function countDigits(str: string) {
    return str.replace('-', '').replace('.', '').length;
  }

  function pressDigit(d: string) {
    setCalc((c) => {
      // if we're *not* starting fresh and we've already hit digit cap, ignore input
      if (!c.replaceOnNext && countDigits(c.display) >= MAX_DIGITS) {
        return c;
      }

      const next = c.replaceOnNext || c.display === '0' ? d : c.display + d;

      // safety: if for any reason we exceeded the cap, keep old state
      if (countDigits(next) > MAX_DIGITS) {
        return c;
      }

      return { ...c, display: next, replaceOnNext: false };
    });
  }

  function pressDot() {
    setCalc((c) => {
      if (c.replaceOnNext) {
        return { ...c, display: '0.', replaceOnNext: false };
      }
      if (c.display.includes('.')) return c;
      // we allow a dot even when at MAX_DIGITS since it's not a digit
      return { ...c, display: c.display + '.' };
    });
  }

  function pressOp(op: CalcState['op']) {
    setCalc((c) => {
      const currentVal = parseFloat(c.display || '0');
      if (c.stored == null) {
        return {
          display: c.display,
          stored: currentVal,
          op,
          replaceOnNext: true,
        };
      }
      const nextVal = doOp(c.stored, currentVal, c.op);
      return {
        display: String(nextVal),
        stored: nextVal,
        op,
        replaceOnNext: true,
      };
    });
  }

  function pressEquals() {
    setCalc((c) => {
      if (c.op == null || c.stored == null) return c;
      const currentVal = parseFloat(c.display || '0');
      const nextVal = doOp(c.stored, currentVal, c.op);
      return {
        display: String(nextVal),
        stored: null,
        op: null,
        replaceOnNext: true,
      };
    });
  }

  function pressClear() {
    setCalc(defaultCalc);
  }

  // === RENDER ===
  return (
    <>
      {/* header buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setNoteOpen((v) => !v);
            if (!noteOpen) {
              // reopening → snap back to default spot
              setNotePos(DEFAULT_NOTE_POS);
              setTopId('note');
              setNoteMode('draw');
            }
          }}
          className="h-9 w-9 rounded-lg bg-[rgba(67,35,137,0.9)] hover:bg-[rgba(67,35,137,1)] flex items-center justify-center text-white text-lg shadow"
          title="Open scratchpad"
        >
          <FiEdit3 />
        </button>
        <button
          type="button"
          onClick={() => {
            setCalcOpen((v) => !v);
            if (!calcOpen) {
              // reopening → snap back to default spot
              setCalcPos(DEFAULT_CALC_POS);
              setTopId('calc');
            }
          }}
          className="h-9 w-9 rounded-lg bg-[rgba(19,200,223,0.9)] hover:bg-[rgba(19,200,223,1)] flex items-center justify-center text-black text-xl shadow"
          title="Open calculator"
        >
          <HiOutlineCalculator />
        </button>
      </div>

      {/* floating panels rendered at the end of <body> so they are always on top */}
      {mounted &&
        createPortal(
          <>
            {/* Scratchpad panel */}
            {noteOpen && (
              <div
                style={{
                  position: 'fixed',
                  left: notePos.x,
                  top: notePos.y,
                  width: NOTE_WIDTH,
                  zIndex: topId === 'note' ? 999999 : 999998,
                }}
                className="rounded-xl border border-white/10 bg-neutral-900/95 text-neutral-50 shadow-2xl backdrop-blur-sm pointer-events-auto"
                onMouseDown={() => setTopId('note')}
              >
                <div
                  className="cursor-move flex items-center justify-between px-3 py-2 border-b border-white/10 select-none pointer-events-auto"
                  onMouseDown={(e) => beginDrag('note', e)}
                >
                  <span className="text-sm font-semibold">Scratchpad</span>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setNoteMode('draw')}
                      className={`px-2 py-0.5 rounded ${
                        noteMode === 'draw'
                          ? 'bg-[#13c8df] text-black'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      Draw
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoteMode('text')}
                      className={`px-2 py-0.5 rounded ${
                        noteMode === 'text'
                          ? 'bg-[#13c8df] text-black'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      Text
                    </button>
                    <button
                      className="ml-1 p-1 rounded hover:bg-white/10"
                      onClick={() => {
                        setNoteOpen(false);
                        // when closed, snap position back to home for next time
                        setNotePos(DEFAULT_NOTE_POS);
                      }}
                    >
                      <FiX />
                    </button>
                  </div>
                </div>

                <div className="p-3">
                  {noteMode === 'draw' ? (
                    <div className="rounded-lg border border-white/15 bg-black/30">
                      <canvas
                        ref={canvasRef}
                        width={NOTE_WIDTH - 32}
                        height={NOTE_HEIGHT - 110}
                        className="w-full rounded-t-lg bg-black/60"
                        onMouseDown={startDraw}
                        onMouseMove={moveDraw}
                        onMouseUp={endDraw}
                        onMouseLeave={endDraw}
                      />
                      <div className="flex items-center justify-between px-2 py-1 text-[11px] text-neutral-300">
                        <span>Draw (mouse / stylus)</span>
                        <button
                          type="button"
                          className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-xs"
                          onClick={clearCanvas}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  ) : (
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={12}
                      className="w-full h-[300px] rounded-lg border border-white/15 bg-black/40 px-2 py-1.5 text-sm outline-none resize-none focus:ring-2 focus:ring-[#13c8df]/60"
                      placeholder="Type quick notes…"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Calculator panel */}
            {calcOpen && (
              <div
                style={{
                  position: 'fixed',
                  left: calcPos.x,
                  top: calcPos.y,
                  width: CALC_WIDTH,
                  zIndex: topId === 'calc' ? 999999 : 999998,
                }}
                className="rounded-xl border border-white/10 bg-neutral-900/95 text-neutral-50 shadow-2xl backdrop-blur-sm pointer-events-auto"
                onMouseDown={() => setTopId('calc')}
              >
                <div
                  className="cursor-move flex items-center justify-between px-3 py-2 border-b border-white/10 select-none pointer-events-auto"
                  onMouseDown={(e) => beginDrag('calc', e)}
                >
                  <span className="text-sm font-semibold">Calculator</span>
                  <button
                    className="p-1 rounded hover:bg-white/10"
                    onClick={() => {
                      setCalcOpen(false);
                      // when closed, snap position back to home for next time
                      setCalcPos(DEFAULT_CALC_POS);
                    }}
                  >
                    <FiX />
                  </button>
                </div>

                <div className="p-3 space-y-3">
                  <div className="h-10 rounded-lg bg-black/70 flex items-center justify-end px-3 text-xl font-mono overflow-hidden">
                    {/* no truncate class → no "..." dots */}
                    <span className="max-w-full text-right">
                      {calc.display}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1 text-xs">
                    <button
                      className="col-span-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
                      onClick={pressClear}
                    >
                      AC
                    </button>
                    <button
                      className="py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
                      onClick={() => pressOp('÷')}
                    >
                      ÷
                    </button>
                    <button
                      className="py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
                      onClick={() => pressOp('×')}
                    >
                      ×
                    </button>

                    {[7, 8, 9].map((n) => (
                      <button
                        key={n}
                        className="py-1.5 rounded-lg bg-white/5 hover:bg-white/15"
                        onClick={() => pressDigit(String(n))}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      className="py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
                      onClick={() => pressOp('-')}
                    >
                      −
                    </button>

                    {[4, 5, 6].map((n) => (
                      <button
                        key={n}
                        className="py-1.5 rounded-lg bg-white/5 hover:bg-white/15"
                        onClick={() => pressDigit(String(n))}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      className="py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
                      onClick={() => pressOp('+')}
                    >
                      +
                    </button>

                    {[1, 2, 3].map((n) => (
                      <button
                        key={n}
                        className="py-1.5 rounded-lg bg-white/5 hover:bg-white/15"
                        onClick={() => pressDigit(String(n))}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      className="row-span-2 py-1.5 rounded-lg bg-[#13c8df] text-black font-semibold hover:bg-[#11b0c3]"
                      onClick={pressEquals}
                    >
                      =
                    </button>

                    <button
                      className="col-span-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/15"
                      onClick={() => pressDigit('0')}
                    >
                      0
                    </button>
                    <button
                      className="py-1.5 rounded-lg bg-white/5 hover:bg-white/15"
                      onClick={pressDot}
                    >
                      .
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>,
          document.body
        )}
    </>
  );
}