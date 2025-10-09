'use client';

import { useState, useEffect, useMemo } from 'react';
import Script from 'next/script';
import { FaTimes } from 'react-icons/fa';

declare global {
  interface Window {
    turnstile: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: 'auto' | 'light' | 'dark';
          appearance?: 'always' | 'execute' | 'interaction-only';
          callback: (token: string) => void;
        }
      ) => void;
    };
  }
}

/* =========================
   Attachment limits
========================= */
const ACCEPTED_EXT = /\.(png|jpe?g|gif|webp|svg|stl|obj)$/i;
const MAX_FILE_MB   = 25;  // per file
const MAX_TOTAL_MB  = 50;  // sum of all files
const MAX_FILES     = 4;   // number of files

export default function ContactModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [files, setFiles] = useState<File[]>([]);
  const totalBytes = useMemo(
    () => files.reduce((sum, f) => sum + f.size, 0),
    [files]
  );
  const remainingSlots = Math.max(0, MAX_FILES - files.length);

  /* Turnstile init per open */
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const container = document.querySelector('.cf-turnstile') as HTMLElement | null;
      if (container && window.turnstile) {
        container.innerHTML = '';
        window.turnstile.render(container, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!,
          theme: 'auto',
          appearance: 'always',
          callback: (t: string) => setToken(t),
        });
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [isOpen]);

  /* Form helpers */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addFiles = (list: FileList | File[]) => {
    const incoming = Array.from(list);
    if (!incoming.length) return;
    if (files.length >= MAX_FILES) {
      alert(`You can attach up to ${MAX_FILES} files.`);
      return;
    }

    const next: File[] = [...files];
    let added = 0;

    for (const f of incoming) {
      if (next.length >= MAX_FILES) break;
      if (!ACCEPTED_EXT.test(f.name)) continue; // ext/type check
      if (next.some(n => n.name === f.name && n.lastModified === f.lastModified)) continue; // de-dupe
      if (f.size > MAX_FILE_MB * 1024 * 1024) {
        alert(`"${f.name}" is larger than ${MAX_FILE_MB} MB and was skipped.`);
        continue;
      }
      const projected = next.reduce((s, x) => s + x.size, 0) + f.size; // total size cap
      if (projected > MAX_TOTAL_MB * 1024 * 1024) {
        alert(`Adding "${f.name}" would exceed ${MAX_TOTAL_MB} MB total.`);
        continue;
      }
      next.push(f);
      added++;
    }

    if (!added) return;
    setFiles(next);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.currentTarget.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      alert('Please complete the human verification.');
      return;
    }

    try {
      setIsSending(true);
      const fd = new FormData();
      fd.append('name', formData.name);
      fd.append('email', formData.email);
      fd.append('subject', formData.subject);
      fd.append('message', formData.message);
      fd.append('token', token);
      files.forEach((f) => fd.append('files', f, f.name));

      const res = await fetch('/api/contact', { method: 'POST', body: fd });
      const data = await res.json();

      if (res.ok && data?.success) {
        setIsSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
        setFiles([]);
        setToken(null);
      } else {
        alert(data?.error || 'Error sending message.');
      }
    } catch (err) {
      console.error('❌ Error submitting contact form:', err);
      alert('An error occurred while sending your message.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        async
        defer
      />

      <div className="bg-neutral-900 text-white rounded-lg shadow-lg p-8 w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg"
          aria-label="Close"
        >
          <FaTimes />
        </button>

        {!isSubmitted ? (
          <>
            <h2 className="text-2xl font-semibold mb-6 text-center font-dancing">
              Let&rsquo;s Print Together
            </h2>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                required
                className="p-2 rounded bg-neutral-800"
                value={formData.name}
                onChange={handleChange}
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                required
                className="p-2 rounded bg-neutral-800"
                value={formData.email}
                onChange={handleChange}
              />
              <select
                name="subject"
                required
                className="p-2 rounded bg-neutral-800"
                value={formData.subject}
                onChange={handleChange}
              >
                <option value="">Select Subject</option>
                <option value="Custom 3D Print">Custom 3D Print</option>
                <option value="Prototype / Part">Prototype / Part</option>
                <option value="Resin Miniatures">Resin Miniatures</option>
                <option value="Bulk / Bundle Quote">Bulk / Bundle Quote</option>
                <option value="3D Model Help">3D Model Help</option>
                <option value="Other">Other</option>
              </select>
              <textarea
                name="message"
                rows={4}
                placeholder="Your Message"
                required
                className="p-2 rounded bg-neutral-800"
                value={formData.message}
                onChange={handleChange}
              />

              {/* ====== Drag & Drop / File input ====== */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`rounded-lg border-2 border-dashed px-4 pt-4 pb-3 text-sm transition
                  ${dragOver ? 'border-brand-500 bg-white/5' : 'border-white/20 bg-black/10'}
                `}
                style={{ height: 180 }}  // fixed height – previews scroll inside
              >
                <label className={`block ${remainingSlots === 0 ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}>
                  <input
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.gif,.webp,.svg,.stl,.obj"
                    onChange={onFileInput}
                    className="sr-only"
                    disabled={remainingSlots === 0}
                  />
                  <div className="text-center">
                    <div className="font-medium">Attach images or 3D files (.stl, .obj)</div>
                    <div className="opacity-70 mt-1">
                      Drag & drop files here, or <span className="underline">browse</span>
                    </div>
                    <div className="mt-2 opacity-60">
                      Max {MAX_FILE_MB} MB per file • {MAX_TOTAL_MB} MB total • {MAX_FILES} files max
                    </div>
                  </div>
                </label>

                {/* Previews — scrollable, small tiles */}
                {!!files.length && (
                  <div className="mt-3 h-[88px] overflow-y-auto pr-1">
                    <div className="grid grid-cols-4 gap-2">
                      {files.map((f, i) => {
                        const isImg =
                          /^image\//.test(f.type) || /\.(png|jpe?g|gif|webp|svg)$/i.test(f.name);
                        const objUrl = isImg ? URL.createObjectURL(f) : '';
                        return (
                          <div
                            key={`${f.name}-${f.lastModified}`}
                            className="relative w-[78px] h-[78px] rounded-md border border-white/15 bg-white/5 overflow-hidden"
                            title={f.name}
                          >
                            <button
                              type="button"
                              onClick={() => removeFile(i)}
                              className="absolute -top-1 -right-1 bg-black/70 text-white rounded-full w-5 h-5 text-xs leading-none flex items-center justify-center hover:bg-black/90"
                              aria-label={`Remove ${f.name}`}
                            >
                              ×
                            </button>

                            {isImg ? (
                              <img
                                src={objUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] px-1 text-center">
                                {f.name.split('.').pop()?.toUpperCase() || 'FILE'}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Totals */}
                {!!files.length && (
                  <div className="mt-2 text-right text-xs opacity-70">
                    Total: {(totalBytes / 1024 / 1024).toFixed(1)} MB • {files.length}/{MAX_FILES}
                  </div>
                )}
              </div>

              {/* ====== Turnstile ======
                  Increased top margin for space from drag/drop,
                  and verification line tucked tight below it. */}
              <div className="cf-turnstile mt-5 mb-1 flex justify-center" style={{ minHeight: 66 }} />
              <p className="mt-1 text-xs text-gray-400 text-center w-full">
                {token ? 'Human verification complete ✓' : 'Please verify you’re human.'}
              </p>

              {/* Button */}
              <div className="animated-link-wrapper self-center">
                <div className="animated-link-effect-2"><div /></div>
                <button type="submit" className="animated-link-3" disabled={isSending}>
                  {isSending ? 'Sending…' : 'Send Message'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center py-10">
            <h2 className="text-2xl font-dancing mb-4">Thank you!</h2>
            <p className="mb-6">Your message has been sent. We&rsquo;ll get back to you soon.</p>
            <div className="animated-link-wrapper self-center">
              <div className="animated-link-effect"><div /></div>
              <button onClick={onClose} className="animated-link-3">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}