'use client';

import { useEffect, useState } from 'react';
import { FiSettings, FiX } from 'react-icons/fi';
import { createPortal } from 'react-dom';

type SiteSettingsSubset = {
  instagram_url: string | null;
  facebook_url: string | null;
  x_url: string | null;
  instagram_followers: number | null;
  facebook_followers: number | null;
  x_followers: number | null;
};

type Props = {
  siteSettings: SiteSettingsSubset | null;
};

export default function SocialReachSettingsModal({ siteSettings }: Props) {
  const [mounted, setMounted] = useState(false); // for safe portal
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Local form fields
  const [igUrl, setIgUrl] = useState('');
  const [igFollowers, setIgFollowers] = useState('');
  const [fbUrl, setFbUrl] = useState('');
  const [fbFollowers, setFbFollowers] = useState('');
  const [twUrl, setTwUrl] = useState('');
  const [twFollowers, setTwFollowers] = useState('');

  // mark as mounted so we can safely use document.body
  useEffect(() => {
    setMounted(true);
  }, []);

  // Whenever the modal opens, refresh from latest siteSettings
  useEffect(() => {
    if (!open) return;
    setError(null);
    setSuccess(null);

    setIgUrl(siteSettings?.instagram_url ?? '');
    setIgFollowers(
      siteSettings?.instagram_followers != null
        ? String(siteSettings.instagram_followers)
        : '',
    );

    setFbUrl(siteSettings?.facebook_url ?? '');
    setFbFollowers(
      siteSettings?.facebook_followers != null
        ? String(siteSettings.facebook_followers)
        : '',
    );

    setTwUrl(siteSettings?.x_url ?? '');
    setTwFollowers(
      siteSettings?.x_followers != null
        ? String(siteSettings.x_followers)
        : '',
    );
  }, [open, siteSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/dashboard/social-reach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instagram_url: igUrl || null,
          instagram_followers: igFollowers ? Number(igFollowers) : null,
          facebook_url: fbUrl || null,
          facebook_followers: fbFollowers ? Number(fbFollowers) : null,
          x_url: twUrl || null,
          x_followers: twFollowers ? Number(twFollowers) : null,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save social settings');
      }

      setSuccess('Saved!');
      setTimeout(() => setOpen(false), 700);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  // Trigger button that lives inside the KPI card
  const trigger = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="
        inline-flex items-center justify-center rounded-full
        border border-white/20 bg-black/70 p-1
        text-[0.65rem]
        hover:border-white/60 hover:bg-black
        transition
      "
    >
      <FiSettings className="h-3 w-3" />
    </button>
  );

  // If we’re not mounted yet (SSR pass), just render the trigger
  if (!mounted) return trigger;

  return (
    <>
      {trigger}

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80">
            {/* Outer click to close */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute inset-0 cursor-default"
              aria-label="Close social reach settings overlay"
            />

            <div className="relative w-full max-w-lg rounded-2xl border border-white/20 bg-neutral-900 px-6 py-5 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold">Social Reach Settings</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-full hover:bg-white/10"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs opacity-70 mb-4">
                Add your social profile URLs and (optional) follower counts.
                These values are only used to calculate your total reach on the
                dashboard.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                {/* Instagram */}
                <div className="space-y-1">
                  <label className="text-[0.75rem] font-medium">
                    Instagram
                  </label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/yourname"
                    value={igUrl}
                    onChange={(e) => setIgUrl(e.target.value)}
                    className="w-full rounded-lg bg-neutral-800 border border-white/20 px-3 py-1.5 text-sm outline-none focus:border-emerald-400"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[0.7rem] opacity-70">
                      Followers (optional)
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={igFollowers}
                      onChange={(e) => setIgFollowers(e.target.value)}
                      className="w-32 rounded-lg bg-neutral-800 border border-white/20 px-2 py-1 text-sm outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                {/* Facebook */}
                <div className="space-y-1">
                  <label className="text-[0.75rem] font-medium">
                    Facebook
                  </label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/yourpage"
                    value={fbUrl}
                    onChange={(e) => setFbUrl(e.target.value)}
                    className="w-full rounded-lg bg-neutral-800 border border-white/20 px-3 py-1.5 text-sm outline-none focus:border-emerald-400"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[0.7rem] opacity-70">
                      Followers (optional)
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={fbFollowers}
                      onChange={(e) => setFbFollowers(e.target.value)}
                      className="w-32 rounded-lg bg-neutral-800 border border-white/20 px-2 py-1 text-sm outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                {/* X / Twitter */}
                <div className="space-y-1">
                  <label className="text-[0.75rem] font-medium">
                    X / Twitter
                  </label>
                  <input
                    type="url"
                    placeholder="https://x.com/yourhandle"
                    value={twUrl}
                    onChange={(e) => setTwUrl(e.target.value)}
                    className="w-full rounded-lg bg-neutral-800 border border-white/20 px-3 py-1.5 text-sm outline-none focus:border-emerald-400"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[0.7rem] opacity-70">
                      Followers (optional)
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={twFollowers}
                      onChange={(e) => setTwFollowers(e.target.value)}
                      className="w-32 rounded-lg bg-neutral-800 border border-white/20 px-2 py-1 text-sm outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                {(error || success) && (
                  <div className="text-[0.75rem] pt-1">
                    {error && <p className="text-rose-300">{error}</p>}
                    {success && <p className="text-emerald-300">{success}</p>}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-white/20 text-xs hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-xs font-medium text-black hover:bg-emerald-400 disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}