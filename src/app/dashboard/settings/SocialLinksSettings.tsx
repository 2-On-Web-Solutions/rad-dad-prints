'use client';

import { useState } from 'react';
import { FiShare2, FiExternalLink } from 'react-icons/fi';

type SocialLink = {
  id: 'facebook' | 'instagram' | 'tiktok' | 'x';
  label: string;
  url: string;
};

const DEFAULT_LINKS: SocialLink[] = [
  { id: 'facebook', label: 'Facebook', url: 'https://facebook.com' },
  { id: 'instagram', label: 'Instagram', url: 'https://instagram.com' },
  { id: 'tiktok', label: 'TikTok', url: 'https://tiktok.com' },
  { id: 'x', label: 'X (Twitter)', url: 'https://x.com' },
];

export default function SocialLinksSettings() {
  const [links, setLinks] = useState<SocialLink[]>(DEFAULT_LINKS);

  function updateLink(id: SocialLink['id'], url: string) {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, url } : l)));
  }

  return (
    <section className="rounded-xl border border-[var(--color-foreground)]/10 bg-[var(--color-foreground)]/[0.03] p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-indigo-500/15 flex items-center justify-center text-indigo-300">
          <FiShare2 className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-medium">Social Media Links</h2>
          <p className="text-xs opacity-60">
            Control the icons & links in the footer.
          </p>
        </div>
      </div>

      <div className="mt-1 space-y-2 text-xs rounded-lg bg-[var(--color-background)]/40 border border-[var(--color-foreground)]/10 p-2">
        {links.map((link) => (
          <div key={link.id} className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{link.label}</span>
              <a
                href={link.url || '#'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[10px] opacity-70 hover:opacity-100"
              >
                <FiExternalLink className="w-3 h-3" />
                Preview
              </a>
            </div>
            <input
              className="w-full rounded-md border border-[var(--color-foreground)]/20 bg-[var(--color-background)] px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-teal-400/40"
              placeholder="https://"
              value={link.url}
              onChange={(e) => updateLink(link.id, e.target.value)}
            />
          </div>
        ))}
      </div>

      <p className="text-[10px] opacity-60">
        Later we’ll sync this with a `site_settings` row so these URLs drive the
        footer icons on every page.
      </p>
    </section>
  );
}