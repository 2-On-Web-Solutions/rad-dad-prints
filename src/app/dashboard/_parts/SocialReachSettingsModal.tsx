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
        border bg-white/80 text-[0.65rem] text-neutral-700
        hover:bg-white hover:border-neutral-500
        dark:border-white/20 dark:bg-black/70 dark:text-white
        dark:hover:border-white/60 dark:hover:bg-black
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
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
            {/* Outer click to close */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute inset-0 cursor-default"
              aria-label="Close social reach settings overlay"
            />

            <div
              className="
                relative w-full max-w-lg rounded-2xl border px-6 py-5 shadow-2xl
                bg-white text-neutral-900 border-black/10
                dark:bg-neutral-900 dark:text-white dark:border-white/20
              "
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold">Social Reach Settings</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="
                    p-1 rounded-full
                    hover:bg-neutral-200
                    dark:hover:bg-white/10
                  "
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-neutral-600 dark:text-neutral-300 mb-4">
                Add your social profile URLs and (optional) follower counts.
                These values are only used to calculate your total reach on the
                dashboard.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                {/* Instagram */}
                <div className="space-y-1">
                  <label className="text-[0.75rem] font-medium text-neutral-800 dark:text-neutral-200">
                    Instagram
                  </label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/yourname"
                    value={igUrl}
                    onChange={(e) => setIgUrl(e.target.value)}
                    className="
                      w-full rounded-lg border px-3 py-1.5 text-sm outline-none
                      bg-white border-neutral-300 text-neutral-900
                      focus:border-emerald-500
                      dark:bg-neutral-800 dark:border-white/20 dark:text-white
                      dark:focus:border-emerald-400
                    "
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[0.7rem] text-neutral-600 dark:text-neutral-300">
                      Followers (optional)
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={igFollowers}
                      onChange={(e) => setIgFollowers(e.target.value)}
                      className="
                        w-32 rounded-lg border px-2 py-1 text-sm outline-none
                        bg-white border-neutral-300 text-neutral-900
                        focus:border-emerald-500
                        dark:bg-neutral-800 dark:border-white/20 dark:text-white
                        dark:focus:border-emerald-400
                      "
                    />
                  </div>
                </div>

                {/* Facebook */}
                <div className="space-y-1">
                  <label className="text-[0.75rem] font-medium text-neutral-800 dark:text-neutral-200">
                    Facebook
                  </label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/yourpage"
                    value={fbUrl}
                    onChange={(e) => setFbUrl(e.target.value)}
                    className="
                      w-full rounded-lg border px-3 py-1.5 text-sm outline-none
                      bg-white border-neutral-300 text-neutral-900
                      focus:border-emerald-500
                      dark:bg-neutral-800 dark:border-white/20 dark:text-white
                      dark:focus:border-emerald-400
                    "
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[0.7rem] text-neutral-600 dark:text-neutral-300">
                      Followers (optional)
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={fbFollowers}
                      onChange={(e) => setFbFollowers(e.target.value)}
                      className="
                        w-32 rounded-lg border px-2 py-1 text-sm outline-none
                        bg-white border-neutral-300 text-neutral-900
                        focus:border-emerald-500
                        dark:bg-neutral-800 dark:border-white/20 dark:text-white
                        dark:focus:border-emerald-400
                      "
                    />
                  </div>
                </div>

                {/* X / Twitter */}
                <div className="space-y-1">
                  <label className="text-[0.75rem] font-medium text-neutral-800 dark:text-neutral-200">
                    X / Twitter
                  </label>
                  <input
                    type="url"
                    placeholder="https://x.com/yourhandle"
                    value={twUrl}
                    onChange={(e) => setTwUrl(e.target.value)}
                    className="
                      w-full rounded-lg border px-3 py-1.5 text-sm outline-none
                      bg-white border-neutral-300 text-neutral-900
                      focus:border-emerald-500
                      dark:bg-neutral-800 dark:border-white/20 dark:text-white
                      dark:focus:border-emerald-400
                    "
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[0.7rem] text-neutral-600 dark:text-neutral-300">
                      Followers (optional)
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={twFollowers}
                      onChange={(e) => setTwFollowers(e.target.value)}
                      className="
                        w-32 rounded-lg border px-2 py-1 text-sm outline-none
                        bg-white border-neutral-300 text-neutral-900
                        focus:border-emerald-500
                        dark:bg-neutral-800 dark:border-white/20 dark:text-white
                        dark:focus:border-emerald-400
                      "
                    />
                  </div>
                </div>

                {(error || success) && (
                  <div className="text-[0.75rem] pt-1">
                    {error && <p className="text-rose-500 dark:text-rose-300">{error}</p>}
                    {success && (
                      <p className="text-emerald-600 dark:text-emerald-300">
                        {success}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="
                      px-3 py-1.5 rounded-lg border text-xs
                      border-neutral-300 text-neutral-800 hover:bg-neutral-100
                      dark:border-white/20 dark:text-white dark:hover:bg-white/10
                    "
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="
                      px-3 py-1.5 rounded-lg text-xs font-medium
                      bg-emerald-500 text-black hover:bg-emerald-400
                      disabled:opacity-60
                    "
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