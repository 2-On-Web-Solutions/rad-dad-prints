'use client';

import { useEffect, useState } from 'react';
import { FiShare2, FiExternalLink } from 'react-icons/fi';
import { supabaseBrowser } from '@/lib/supabase/client';

type SocialLinkId = 'facebook' | 'instagram' | 'tiktok' | 'x';

type SocialLinkRow = {
  id: SocialLinkId;
  label: string | null;
  url: string | null;
  enabled: boolean | null;
  sort_order: number | null;
};

type SocialLink = {
  id: SocialLinkId;
  label: string;
  url: string;
  enabled: boolean;
};

const DEFAULT_LINKS: SocialLink[] = [
  { id: 'facebook', label: 'Facebook', url: 'https://facebook.com', enabled: true },
  { id: 'instagram', label: 'Instagram', url: 'https://instagram.com', enabled: true },
  { id: 'tiktok', label: 'TikTok', url: 'https://tiktok.com', enabled: true },
  { id: 'x', label: 'X (Twitter)', url: 'https://x.com', enabled: true },
];

export default function SocialLinksSettings() {
  const [links, setLinks] = useState<SocialLink[]>(DEFAULT_LINKS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // ---------------- LOAD FROM SUPABASE ----------------
  useEffect(() => {
    void loadLinks();
  }, []);

  async function loadLinks() {
    setLoading(true);
    setStatus(null);

    const supabase = supabaseBrowser;
    const { data, error } = await supabase
      .from('site_social_links')
      .select('id,label,url,enabled,sort_order')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error loading site_social_links', error);
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      // Nothing in DB yet – fall back to defaults
      setLinks(DEFAULT_LINKS);
      setLoading(false);
      return;
    }

    const defaultById = new Map(DEFAULT_LINKS.map((l) => [l.id, l]));

    const mapped: SocialLink[] = (data as SocialLinkRow[]).map((row, idx) => {
      const fallback = defaultById.get(row.id);
      return {
        id: row.id,
        label: row.label ?? fallback?.label ?? row.id,
        url: row.url ?? fallback?.url ?? '',
        enabled: row.enabled ?? false,
      };
    });

    setLinks(mapped);
    setDirty(false);
    setLoading(false);
  }

  // ---------------- EDIT HELPERS ----------------
  function updateLink(
    id: SocialLinkId,
    patch: Partial<Pick<SocialLink, 'url' | 'enabled'>>
  ) {
    setLinks((prev) =>
      prev.map((link) =>
        link.id === id ? { ...link, ...patch } : link
      )
    );
    setDirty(true);
    setStatus(null);
  }

  // ---------------- SAVE TO SUPABASE ----------------
  async function handleSave() {
    setSaving(true);
    setStatus(null);

    const supabase = supabaseBrowser;

    const rows = links.map((link, index) => ({
      id: link.id,
      label: link.label,
      url: link.url.trim() || null,
      enabled: link.enabled,
      sort_order: index,
    }));

    const { error } = await supabase
      .from('site_social_links')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error('Error saving site_social_links', error);
      setStatus('Could not save changes. Check console.');
    } else {
      setStatus('Social links saved.');
      setDirty(false);
    }

    setSaving(false);
  }

  // ---------------- RENDER ----------------
  return (
    <section className="rounded-xl border border-[var(--color-foreground)]/10 bg-[var(--color-foreground)]/[0.03] p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-indigo-500/15 flex items-center justify-center text-indigo-300">
          <FiShare2 className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-medium">Social Media Links</h2>
          <p className="text-xs opacity-60">
            Control the icons &amp; links in the footer (and header).
          </p>
        </div>
      </div>

      <div className="mt-1 space-y-2 text-xs rounded-lg bg-[var(--color-background)]/40 border border-[var(--color-foreground)]/10 p-2">
        {links.map((link) => (
          <div key={link.id} className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-3 w-3 rounded-sm accent-teal-400 cursor-pointer"
                  checked={link.enabled}
                  onChange={(e) =>
                    updateLink(link.id, { enabled: e.target.checked })
                  }
                />
                <span className="font-medium">{link.label}</span>
              </div>

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
              onChange={(e) =>
                updateLink(link.id, { url: e.target.value })
              }
            />
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium border border-[var(--color-foreground)]/20 ${
            !dirty || saving
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:bg-[var(--color-foreground)]/10 transition'
          }`}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>

        <p className="text-[10px] opacity-60 text-right">
          {loading
            ? 'Loading current social links…'
            : status ?? 'Only enabled links with a URL will appear on the site.'}
        </p>
      </div>
    </section>
  );
}