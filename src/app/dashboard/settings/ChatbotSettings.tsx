'use client';

import { useState } from 'react';
import { FiMessageCircle, FiPlus, FiTrash2 } from 'react-icons/fi';

type FaqPair = {
  id: string;
  question: string;
  answer: string;
};

export default function ChatbotSettings() {
  const [greeting, setGreeting] = useState<string>(
    'Hi! 👋 Ask me anything about our services.',
  );

  const [faqs, setFaqs] = useState<FaqPair[]>([
    {
      id: 'turnaround',
      question: 'How long does printing usually take?',
      answer:
        'Most small jobs are ready in 3–5 business days. Larger or rush jobs may vary.',
    },
    {
      id: 'file-types',
      question: 'What file types do you accept?',
      answer: 'We accept STL, OBJ, and STEP files. For other formats, just ask.',
    },
  ]);

  function addFaq() {
    setFaqs((prev) => [
      ...prev,
      { id: `faq-${Date.now()}`, question: '', answer: '' },
    ]);
  }

  function updateFaq(id: string, patch: Partial<FaqPair>) {
    setFaqs((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    );
  }

  function removeFaq(id: string) {
    if (!window.confirm('Remove this Q&A pair from the bot?')) return;
    setFaqs((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <section className="rounded-xl border border-[var(--color-foreground)]/10 bg-[var(--color-foreground)]/[0.03] p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300">
          <FiMessageCircle className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-medium">FAQ Chat Bot</h2>
          <p className="text-xs opacity-60">
            Configure the greeting and canned answers the widget can use.
          </p>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="space-y-1">
          <label className="block font-medium">Greeting message</label>
          <input
            className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/40"
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between mt-1">
          <span className="font-medium text-[11px] opacity-80">
            Common Q&A pairs
          </span>
          <button
            onClick={addFaq}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 border border-[var(--color-foreground)]/20 bg-[var(--color-background)] text-[11px] hover:bg-[var(--color-foreground)]/10"
          >
            <FiPlus className="w-3 h-3" />
            Add FAQ
          </button>
        </div>

        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {faqs.map((faq) => (
            <div
              key={faq.id}
              className="rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)]/80 p-2 space-y-1"
            >
              <input
                className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-[11px] outline-none focus:ring-2 focus:ring-teal-400/40"
                placeholder="Question"
                value={faq.question}
                onChange={(e) =>
                  updateFaq(faq.id, { question: e.target.value })
                }
              />
              <textarea
                rows={2}
                className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-[11px] outline-none focus:ring-2 focus:ring-teal-400/40 resize-none"
                placeholder="Answer"
                value={faq.answer}
                onChange={(e) =>
                  updateFaq(faq.id, { answer: e.target.value })
                }
              />
              <div className="flex justify-end">
                <button
                  onClick={() => removeFaq(faq.id)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 border border-red-500/40 text-[10px] text-red-300 hover:bg-red-500/10"
                >
                  <FiTrash2 className="w-3 h-3" />
                  Remove
                </button>
              </div>
            </div>
          ))}

          {faqs.length === 0 && (
            <div className="text-[11px] opacity-60">
              No Q&A pairs yet. Add a few common questions so the bot has
              something to respond with.
            </div>
          )}
        </div>

        <p className="text-[10px] opacity-60 pt-1">
          Later we’ll point the chat widget to this config (or a Supabase
          table) so it can match user questions to these answers.
        </p>
      </div>
    </section>
  );
}