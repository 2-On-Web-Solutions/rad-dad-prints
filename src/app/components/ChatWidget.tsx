"use client"; // Marks this as a client component (needed for hooks like useState/useEffect)

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion"; // Animations for widget open/close
import { MessageSquare, X } from "lucide-react"; // Icons for launcher button
import { findFaqAnswer } from "../lib/faqSearch"; // Custom FAQ matcher logic

// Message type for chat history
type Msg = { role: "user" | "assistant"; content: string };

export default function ChatWidget() {
  // === STATE ===
  const [open, setOpen] = useState(false); // widget open/closed
  const [input, setInput] = useState(""); // current input value
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! 👋 Ask me anything about our services." }, // initial greeting
  ]);
  const listRef = useRef<HTMLDivElement>(null); // used to auto-scroll to bottom

  // Auto-scroll when new messages appear
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

  // === SEND HANDLER ===
  const send = () => {
    const text = input.trim();
    if (!text) return; // ignore empty input
    setInput("");

    // push user message into chat
    setMessages((m) => [...m, { role: "user", content: text }]);

    // lookup FAQ answer (static logic in faqSearch.ts)
    const { answer } = findFaqAnswer(text);

    // push assistant answer into chat
    setMessages((m) => [...m, { role: "assistant", content: answer }]);
  };

  // Handle pressing "Enter" to send
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") send();
  };

  return (
    <>
      {/* === Launcher button ===
           - Toggles widget open/closed
           - Color: bg-[#13c8df] (change here for brand color) */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 rounded-full p-4 shadow-xl bg-[#432389] text-white hover:scale-105 transition"
        aria-label="Open chat"
      >
        {open ? <X /> : <MessageSquare />}
      </button>

      {/* === Chat Panel === */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ opacity: 0, y: 20, scale: 0.98 }} // entry animation
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }} // exit animation
            className="fixed bottom-20 right-5 z-50 w-[360px] max-h-[70vh] rounded-2xl shadow-2xl 
                       border border-white/10 bg-neutral-900/95 text-neutral-100 backdrop-blur"
          >
            {/* Header title (edit text for branding) */}
            <header className="px-4 py-3 border-b border-white/10 font-semibold">
              Rad Dad Prints • FAQ Bot
            </header>

            {/* === Messages list ===
                 - Renders all chat history
                 - Scrollable container with auto-scroll via listRef */}
            <div
              ref={listRef}
              className="px-4 py-3 space-y-3 overflow-y-auto max-h-[48vh]"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm leading-relaxed max-w-[80%] ${
                      m.role === "user"
                        ? "bg-[#432389] text-white" // user bubble color
                        : "bg-white/10 text-neutral-100" // assistant bubble color
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
            </div>

            {/* === Input area === */}
            <div className="p-3 border-t border-white/10 flex gap-2">
              {/* Text input
                  - Focus ring color: ring-[#13c8df] */}
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder="Type a question…"
                className="flex-1 rounded-xl bg-white/5 px-3 py-2 text-sm outline-none 
                           focus:ring-2 ring-[#432389]"
              />
              {/* Send button
                  - Button color: bg-[#13c8df] */}
              <button
                onClick={send}
                className="rounded-xl px-3 py-2 text-sm bg-[#432389] text-white hover:opacity-90"
              >
                Send
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}