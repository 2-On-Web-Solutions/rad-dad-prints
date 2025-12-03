"use client"; // Marks this as a client component (needed for hooks like useState/useEffect)

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion"; // Animations for widget open/close
import { MessageSquare, X } from "lucide-react"; // Icons for launcher button

// Message type for chat history
type Msg = { role: "user" | "assistant"; content: string };

// FAQ config coming from the API
type FaqPair = {
  id: string;
  slug?: string | null;
  questions?: string[] | null;
  answer: string;
};

type FaqConfig = {
  greeting: string;
  faqs: FaqPair[];
};

// Re-usable styles that use the hero CSS variables
const launcherStyle: CSSProperties = {
  backgroundImage:
    "linear-gradient(135deg, var(--hero-grad-from), var(--hero-grad-to))",
  boxShadow: "0 0 20px var(--hero-glow)",
};

const userBubbleStyle: CSSProperties = {
  backgroundImage:
    "linear-gradient(135deg, var(--hero-grad-from), var(--hero-grad-to))",
};

const sendButtonStyle: CSSProperties = {
  backgroundImage:
    "linear-gradient(135deg, var(--hero-grad-from), var(--hero-grad-to))",
  boxShadow: "0 0 14px var(--hero-glow)",
};

export default function ChatWidget() {
  // === STATE ===
  const [open, setOpen] = useState(false); // widget open/closed
  const [input, setInput] = useState(""); // current input value
  const [messages, setMessages] = useState<Msg[]>([]); // chat history
  const [config, setConfig] = useState<FaqConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const listRef = useRef<HTMLDivElement>(null); // used to auto-scroll to bottom

  // Load FAQ config from public API
  useEffect(() => {
    let cancelled = false;

    async function loadConfig() {
      try {
        const res = await fetch("/api/public/faqs");
        if (!res.ok) throw new Error("Failed to fetch FAQs");

        const data = (await res.json()) as FaqConfig;

        if (cancelled) return;

        console.log("FAQ config from API:", data);
        setConfig(data);

        // Initial greeting message
        const greetingText =
          data.greeting || "Hi! 👋 Ask me anything about our services.";

        setMessages([
          {
            role: "assistant",
            content: greetingText,
          },
        ]);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          const fallbackGreeting =
            "Hi! 👋 Ask me anything about our services. (FAQ config is temporarily unavailable.)";

          setConfig({
            greeting: fallbackGreeting,
            faqs: [],
          });

          setMessages([
            {
              role: "assistant",
              content: fallbackGreeting,
            },
          ]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-scroll when new messages appear
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

  // Simple matcher against FAQ triggers + slug
  function findBestAnswer(text: string): string | null {
    if (!config) return null;

    const normalized = text.trim().toLowerCase();
    if (!normalized) return null;

    for (const faq of config.faqs) {
      // 1) Match by slug (e.g. user types "pricing" and slug is "pricing")
      if (faq.slug) {
        const slugNorm = faq.slug.toLowerCase();
        if (normalized.includes(slugNorm) || slugNorm.includes(normalized)) {
          return faq.answer;
        }
      }

      // 2) Match by any trigger phrase
      const triggers = faq.questions ?? [];
      for (const trigger of triggers) {
        const t = trigger.toLowerCase().trim();
        if (!t) continue;

        if (normalized.includes(t) || t.includes(normalized)) {
          return faq.answer;
        }
      }
    }

    return null;
  }

  // === SEND HANDLER ===
  const send = () => {
    const text = input.trim();
    if (!text) return; // ignore empty input
    setInput("");

    const answer =
      findBestAnswer(text) ??
      "I'm not sure about that one yet 🤔 — try asking about our hours, pricing, materials, or how to request a quote.";

    // push user + assistant message into chat
    setMessages((m) => [
      ...m,
      { role: "user", content: text },
      { role: "assistant", content: answer },
    ]);
  };

  // Handle pressing "Enter" to send
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") send();
  };

  return (
    <>
      {/* === Launcher button ===
           - Toggles widget open/closed
           - Uses hero gradient + glow via CSS vars */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 rounded-full p-4 text-white hover:scale-105 transition"
        style={launcherStyle}
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

            {/* === Messages list === */}
            <div
              ref={listRef}
              className="px-4 py-3 space-y-3 overflow-y-auto max-h-[48vh]"
            >
              {loading && messages.length === 0 && (
                <p className="text-xs opacity-60">Loading FAQ config…</p>
              )}

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
                        ? "text-white bg-transparent"
                        : "bg-white/10 text-neutral-100"
                    }`}
                    style={m.role === "user" ? userBubbleStyle : undefined}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
            </div>

            {/* === Input area === */}
            <div className="p-3 border-t border-white/10 flex gap-2">
              {/* Text input */}
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder="Ask about hours, pricing, materials…"
                className="flex-1 rounded-xl bg-white/5 px-3 py-2 text-sm outline-none 
                           focus:ring-2 focus:ring-[var(--hero-grad-from)]"
              />
              {/* Send button */}
              <button
                onClick={send}
                className="rounded-xl px-3 py-2 text-sm text-white hover:opacity-90"
                style={sendButtonStyle}
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