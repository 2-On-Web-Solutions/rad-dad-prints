'use client';

import { useEffect, useState } from 'react';
import { FiMessageCircle, FiPlus, FiEdit2 } from 'react-icons/fi';
import { supabaseBrowser } from '@/lib/supabase/client';

// Normalise supabaseBrowser so this file works whether it's a client
// instance or a function that returns a client.
const supabase =
  typeof supabaseBrowser === 'function'
    ? (supabaseBrowser as unknown as () => any)()
    : (supabaseBrowser as any);

type FaqPair = {
  id: string; // slug, e.g. "turnaround"
  questions: string; // newline-separated trigger phrases
  answer: string; // canned reply
};

type FaqRow = {
  id: string;
  questions: string[] | null; // text[]
  answer: string | null;
};

type FaqSettingsRow = {
  id: string;
  greeting: string | null;
};

type EditingState = {
  index: number;
  draft: FaqPair;
} | null;

// Simple emoji palette used in greeting + FAQ modals
const EMOJIS = ['👋', '😊', '⭐', '❓', '📦', '⏱️', '💬'];

function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      <span className="text-[10px] opacity-60 mr-1">Quick emojis:</span>
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className="rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-1.5 py-0.5 text-xs hover:bg-[var(--color-foreground)]/10"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

export default function ChatbotSettings() {
  // Current greeting used by the widget (backed by faq_bot_settings table)
  const [greeting, setGreeting] = useState<string>(
    'Hi! 👋 Ask me anything about our services.',
  );

  // Draft + modal state for editing greeting
  const [greetingDraft, setGreetingDraft] = useState<string>(greeting);
  const [showGreetingModal, setShowGreetingModal] = useState(false);

  // Extra confirm modal for greeting
  const [showGreetingConfirm, setShowGreetingConfirm] = useState(false);
  const [greetingConfirmText, setGreetingConfirmText] = useState('');

  // FAQ state (loaded from Supabase)
  const [faqs, setFaqs] = useState<FaqPair[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<EditingState>(null);

  // New FAQ modal
  const [showNewFaqModal, setShowNewFaqModal] = useState(false);
  const [newFaqDraft, setNewFaqDraft] = useState<FaqPair | null>(null);

  // Confirm modals inside edit flow
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saveConfirmText, setSaveConfirmText] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // ---------- Load FAQs from Supabase on mount ----------
  useEffect(() => {
    let cancelled = false;

    async function loadFaqs() {
      setLoading(true);

      const { data, error } = await supabase
        .from('faqs')
        .select('id, questions, answer')
        .order('id', { ascending: true });

      if (error) {
        console.error('Failed to load FAQs:', error.message);
        if (!cancelled) setLoading(false);
        return;
      }

      if (!cancelled && data) {
        const mapped: FaqPair[] = (data as FaqRow[]).map((row) => ({
          id: row.id,
          questions: (row.questions ?? [])
            .map((q) => q.trim())
            .filter((q) => q.length > 0)
            .join('\n'),
          answer: row.answer ?? '',
        }));
        setFaqs(mapped);
        setLoading(false);
      }
    }

    loadFaqs();

    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- Load greeting from faq_bot_settings ----------
  useEffect(() => {
    let cancelled = false;

    async function loadGreeting() {
      const { data, error } = await supabase
        .from('faq_bot_settings')
        .select('id, greeting')
        .eq('id', 'default')
        .maybeSingle?.();

      if (error) {
        console.warn(
          'No faq_bot_settings row yet or failed to load:',
          error.message,
        );
        return;
      }

      if (!cancelled && data) {
        const row = data as FaqSettingsRow;
        if (row.greeting) {
          setGreeting(row.greeting);
          setGreetingDraft(row.greeting);
        }
      }
    }

    loadGreeting();

    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- FAQ helpers ----------

  function updateFaqAtIndex(index: number, patch: Partial<FaqPair>) {
    setFaqs((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    );
  }

  function removeFaqLocal(index: number) {
    setFaqs((prev) => prev.filter((_, i) => i !== index));
  }

  function openEditModal(index: number) {
    const current = faqs[index];
    setEditing({
      index,
      draft: { ...current },
    });
    setShowSaveConfirm(false);
    setShowDeleteConfirm(false);
    setSaveConfirmText('');
    setDeleteConfirmText('');
  }

  function closeEditModal() {
    setEditing(null);
    setShowSaveConfirm(false);
    setShowDeleteConfirm(false);
    setSaveConfirmText('');
    setDeleteConfirmText('');
  }

  // Save with confirm (upsert to Supabase)
  function requestSave() {
    setSaveConfirmText('');
    setShowSaveConfirm(true);
  }

  async function confirmSave() {
    if (!editing) return;
    const { index, draft } = editing;

    const payload: FaqRow = {
      id: draft.id.trim(),
      questions: draft.questions
        .split('\n')
        .map((q) => q.trim())
        .filter((q) => q.length > 0),
      answer: draft.answer,
    };

    const { error } = await supabase.from('faqs').upsert(payload, {
      onConflict: 'id',
    });

    if (error) {
      console.error('Failed to save FAQ:', error.message);
      return;
    }

    updateFaqAtIndex(index, draft);
    setShowSaveConfirm(false);
    setEditing(null);
  }

  // Delete with confirm
  function requestDelete() {
    setDeleteConfirmText('');
    setShowDeleteConfirm(true);
  }

  async function confirmDelete() {
    if (!editing) return;
    const { index, draft } = editing;

    const { error } = await supabase
      .from('faqs')
      .delete()
      .eq('id', draft.id);

    if (error) {
      console.error('Failed to delete FAQ:', error.message);
      return;
    }

    removeFaqLocal(index);
    setShowDeleteConfirm(false);
    setEditing(null);
  }

  // New FAQ flow (insert to Supabase)
  function openNewFaqModal() {
    setNewFaqDraft({
      id: '',
      questions: '',
      answer: '',
    });
    setShowNewFaqModal(true);
  }

  function closeNewFaqModal() {
    setShowNewFaqModal(false);
    setNewFaqDraft(null);
  }

  async function createFaqFromDraft() {
    if (!newFaqDraft) return;

    const payload: FaqRow = {
      id: newFaqDraft.id.trim(),
      questions: newFaqDraft.questions
        .split('\n')
        .map((q) => q.trim())
        .filter((q) => q.length > 0),
      answer: newFaqDraft.answer,
    };

    const { error } = await supabase.from('faqs').insert(payload);

    if (error) {
      console.error('Failed to create FAQ:', error.message);
      return;
    }

    setFaqs((prev) => [...prev, newFaqDraft]);
    closeNewFaqModal();
  }

  // ---------- Greeting helpers (now persisted) ----------

  function openGreetingModal() {
    setGreetingDraft(greeting); // start from current live greeting
    setShowGreetingModal(true);
  }

  function cancelGreetingModal() {
    setShowGreetingModal(false);
    setShowGreetingConfirm(false);
    setGreetingConfirmText('');
  }

  // Final apply of greeting (after CONFIRM typed) – also saves to Supabase
  async function applyGreeting() {
    const text = greetingDraft.trim() || greeting;

    setGreeting(text);
    setShowGreetingConfirm(false);
    setShowGreetingModal(false);
    setGreetingConfirmText('');

    const payload: FaqSettingsRow = {
      id: 'default',
      greeting: text,
    };

    const { error } = await supabase
      .from('faq_bot_settings')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Failed to save greeting:', error.message);
    }
  }

  // ---------- Render helpers ----------

  const confirmWordOK = (value: string) =>
    value.trim().toUpperCase() === 'CONFIRM';

  return (
    <>
      {/* MAIN CARD */}
      <section className="rounded-xl border border-[var(--color-foreground)]/10 bg-[var(--color-foreground)]/[0.03] p-4 sm:p-5 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300">
            <FiMessageCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-medium">FAQ Chat Bot</h2>
            <p className="text-xs opacity-60">
              Manage the canned answers your FAQ widget can use.
            </p>
          </div>
        </div>

        {/* Scrollable FAQ list – sized to match neighbor cards */}
        <div className="rounded-md border border-[var(--color-foreground)]/15 bg-[var(--color-background)]/60 max-h-56 overflow-y-auto mt-1">
          {loading ? (
            <div className="text-[11px] opacity-60 px-3 py-3">
              Loading FAQ entries…
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-[11px] opacity-60 px-3 py-3">
              No Q&amp;A pairs yet. Add a few common questions so the bot has
              something to respond with.
            </div>
          ) : (
            <ul className="divide-y divide-[var(--color-foreground)]/10 text-xs">
              {faqs.map((faq, index) => {
                const title = faq.id || 'Untitled FAQ';
                const firstTrigger =
                  faq.questions.split('\n').map((s) => s.trim())[0] || '';

                return (
                  <li
                    key={faq.id || index}
                    className="flex items-center justify-between px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium truncate">
                          {title}
                        </span>
                      </div>
                      {firstTrigger && (
                        <p className="text-[10px] opacity-60 truncate">
                          {firstTrigger}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(index)}
                        className="inline-flex items-center justify-center rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)]/80 p-1 hover:bg-[var(--color-foreground)]/15"
                        aria-label="Edit FAQ"
                      >
                        <FiEdit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer row – like Services / Reviews */}
        <div className="flex items-center justify-between pt-2 text-xs">
          <button
            type="button"
            onClick={openNewFaqModal}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-3 py-1 text-[11px] hover:bg-[var(--color-foreground)]/10"
          >
            <FiPlus className="w-3 h-3" />
            New FAQ
          </button>

          <button
            type="button"
            onClick={openGreetingModal}
            className="inline-flex items-center justify-center rounded-md border border-[var(--color-foreground)]/25 bg-[var(--color-background)] px-3 py-1 text-[11px] hover:bg-[var(--color-foreground)]/10"
          >
            Edit greeting
          </button>
        </div>
      </section>

      {/* Greeting edit modal */}
      {showGreetingModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border border-[var(--color-foreground)]/30 bg-[var(--color-background)] p-4 shadow-xl text-xs">
            <h3 className="text-sm font-semibold mb-1">Update greeting</h3>
            <p className="text-[11px] opacity-70 mb-3">
              This message will appear at the top of the FAQ chat widget when it
              first opens.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] font-medium opacity-80">
                Greeting message
              </label>
              <input
                className="w-full rounded-md border border-[var(--color-foreground)]/25 bg-[var(--color-background)] px-2 py-1 text-[11px] outline-none focus:ring-2 focus:ring-teal-400/40"
                value={greetingDraft}
                onChange={(e) => setGreetingDraft(e.target.value)}
              />

              {/* Emoji picker for greeting */}
              <EmojiPicker
                onSelect={(emoji) =>
                  setGreetingDraft((prev) => `${prev}${emoji}`)
                }
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelGreetingModal}
                className="rounded-md border border-[var(--color-foreground)]/30 px-3 py-1 text-[11px] hover:bg-[var(--color-foreground)]/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setGreetingConfirmText('');
                  setShowGreetingConfirm(true);
                }}
                className="rounded-md border border-teal-400/60 bg-teal-500/20 px-3 py-1 text-[11px] font-medium text-teal-100 hover:bg-teal-500/30"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Greeting CONFIRM modal */}
      {showGreetingModal && showGreetingConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-xl border border-[var(--color-foreground)]/40 bg-[var(--color-background)] p-4 shadow-xl text-xs">
            <h3 className="text-sm font-semibold mb-2">Confirm greeting</h3>
            <p className="text-[11px] opacity-70 mb-2">
              To apply this new greeting, type{' '}
              <span className="font-semibold">CONFIRM</span> below.
            </p>
            <input
              className="w-full rounded-md border border-[var(--color-foreground)]/30 bg-[var(--color-background)] px-2 py-1 text-[11px] outline-none focus:ring-2 focus:ring-teal-400/40 mb-3"
              value={greetingConfirmText}
              onChange={(e) => setGreetingConfirmText(e.target.value)}
              placeholder="Type CONFIRM to continue"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowGreetingConfirm(false);
                  setGreetingConfirmText('');
                }}
                className="rounded-md border border-[var(--color-foreground)]/30 px-3 py-1 text-[11px] hover:bg-[var(--color-foreground)]/10"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!confirmWordOK(greetingConfirmText)}
                onClick={applyGreeting}
                className="rounded-md border border-teal-400/60 bg-teal-500/20 px-3 py-1 text-[11px] font-medium text-teal-100 hover:bg-teal-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ edit modal */}
      {editing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl border border-[var(--color-foreground)]/30 bg-[var(--color-background)] p-4 shadow-xl text-xs">
            <h3 className="text-sm font-semibold mb-2">
              Edit FAQ: {editing.draft.id || 'Untitled'}
            </h3>

            <div className="space-y-3">
              {/* ID / slug */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium opacity-80">
                  FAQ ID / slug
                </label>
                <input
                  className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-[11px] outline-none focus:ring-2 focus:ring-teal-400/40"
                  placeholder="e.g. turnaround, files, pricing"
                  value={editing.draft.id}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev
                        ? {
                            ...prev,
                            draft: { ...prev.draft, id: e.target.value },
                          }
                        : prev,
                    )
                  }
                />
              </div>

              {/* Trigger phrases */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium opacity-80">
                  Trigger phrases (one per line)
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-[11px] outline-none focus:ring-2 focus:ring-teal-400/40 resize-none"
                  placeholder={
                    'how long does a print take\nturnaround time\nwhen will my order be ready'
                  }
                  value={editing.draft.questions}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev
                        ? {
                            ...prev,
                            draft: { ...prev.draft, questions: e.target.value },
                          }
                        : prev,
                    )
                  }
                />
              </div>

              {/* Answer */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium opacity-80">
                  Answer
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-[11px] outline-none focus:ring-2 focus:ring-teal-400/40 resize-none"
                  placeholder="Canned response the bot will send."
                  value={editing.draft.answer}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev
                        ? {
                            ...prev,
                            draft: { ...prev.draft, answer: e.target.value },
                          }
                        : prev,
                    )
                  }
                />

                {/* Emoji picker for FAQ answer */}
                <EmojiPicker
                  onSelect={(emoji) =>
                    setEditing((prev) =>
                      prev
                        ? {
                            ...prev,
                            draft: {
                              ...prev.draft,
                              answer: `${prev.draft.answer}${emoji}`,
                            },
                          }
                        : prev,
                    )
                  }
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={requestDelete}
                className="rounded-md border border-red-500/60 bg-red-500/10 px-3 py-1 text-[11px] font-medium text-red-200 hover:bg-red-500/20"
              >
                Delete FAQ
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-md border border-[var(--color-foreground)]/30 px-3 py-1 text-[11px] hover:bg-[var(--color-foreground)]/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={requestSave}
                  className="rounded-md border border-teal-400/60 bg-teal-500/20 px-3 py-1 text-[11px] font-medium text-teal-100 hover:bg-teal-500/30"
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save confirm modal (with CONFIRM text) */}
      {editing && showSaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-xl border border-[var(--color-foreground)]/40 bg-[var(--color-background)] p-4 shadow-xl text-xs">
            <h3 className="text-sm font-semibold mb-2">Confirm changes</h3>
            <p className="text-[11px] opacity-70 mb-2">
              Apply these changes to this FAQ entry? Type{' '}
              <span className="font-semibold">CONFIRM</span> to continue.
            </p>
            <input
              className="w-full rounded-md border border-[var(--color-foreground)]/30 bg-[var(--color-background)] px-2 py-1 text-[11px] outline-none focus:ring-2 focus:ring-teal-400/40 mb-3"
              value={saveConfirmText}
              onChange={(e) => setSaveConfirmText(e.target.value)}
              placeholder="Type CONFIRM to continue"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowSaveConfirm(false);
                  setSaveConfirmText('');
                }}
                className="rounded-md border border-[var(--color-foreground)]/30 px-3 py-1 text-[11px] hover:bg-[var(--color-foreground)]/10"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!confirmWordOK(saveConfirmText)}
                onClick={confirmSave}
                className="rounded-md border border-teal-400/60 bg-teal-500/20 px-3 py-1 text-[11px] font-medium text-teal-100 hover:bg-teal-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal (with CONFIRM text) */}
      {editing && showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-xl border border-red-500/60 bg-[var(--color-background)] p-4 shadow-xl text-xs">
            <h3 className="text-sm font-semibold mb-2 text-red-200">
              Delete this FAQ?
            </h3>
            <p className="text-[11px] opacity-80 mb-2">
              This will permanently remove the FAQ from your bot configuration.
              Type <span className="font-semibold">CONFIRM</span> to proceed.
            </p>
            <input
              className="w-full rounded-md border border-[var(--color-foreground)]/30 bg-[var(--color-background)] px-2 py-1 text-[11px] outline-none focus:ring-2 focus:ring-red-400/40 mb-3"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type CONFIRM to continue"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                className="rounded-md border border-[var(--color-foreground)]/30 px-3 py-1 text-[11px] hover:bg-[var(--color-foreground)]/10"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!confirmWordOK(deleteConfirmText)}
                onClick={confirmDelete}
                className="rounded-md border border-red-500/70 bg-red-500/20 px-3 py-1 text-[11px] font-medium text-red-100 hover:bg-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New FAQ modal */}
      {showNewFaqModal && newFaqDraft && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl border border-[var(--color-foreground)]/30 bg-[var(--color-background)] p-4 shadow-xl text-xs">
            <h3 className="text-sm font-semibold mb-2">New FAQ</h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-medium opacity-80">
                  FAQ ID / slug
                </label>
                <input
                  className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-[11px] outline-none focus:ring-2 focus:ring-teal-400/40"
                  placeholder="e.g. pricing, materials, shipping"
                  value={newFaqDraft.id}
                  onChange={(e) =>
                    setNewFaqDraft({ ...newFaqDraft, id: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-medium opacity-80">
                  Trigger phrases (one per line)
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-[11px] outline-none focus:ring-2 focus:ring-teal-400/40 resize-none"
                  placeholder={
                    'how much does it cost\npricing\nwhat do you charge'
                  }
                  value={newFaqDraft.questions}
                  onChange={(e) =>
                    setNewFaqDraft({
                      ...newFaqDraft,
                      questions: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-medium opacity-80">
                  Answer
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-[11px] outline-none focus:ring-2 focus:ring-teal-400/40 resize-none"
                  placeholder="Canned response the bot will send."
                  value={newFaqDraft.answer}
                  onChange={(e) =>
                    setNewFaqDraft({ ...newFaqDraft, answer: e.target.value })
                  }
                />

                {/* Emoji picker for new FAQ answer */}
                <EmojiPicker
                  onSelect={(emoji) =>
                    setNewFaqDraft((prev) =>
                      prev ? { ...prev, answer: `${prev.answer}${emoji}` } : prev,
                    )
                  }
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeNewFaqModal}
                className="rounded-md border border-[var(--color-foreground)]/30 px-3 py-1 text-[11px] hover:bg-[var(--color-foreground)]/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createFaqFromDraft}
                className="rounded-md border border-teal-400/60 bg-teal-500/20 px-3 py-1 text-[11px] font-medium text-teal-100 hover:bg-teal-500/30"
              >
                Add FAQ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}