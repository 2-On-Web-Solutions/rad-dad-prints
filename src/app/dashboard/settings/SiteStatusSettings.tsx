'use client';

import { FiInfo } from 'react-icons/fi';

export default function SiteStatusSettings() {
  return (
    <section className="rounded-xl border border-[var(--color-foreground)]/10 bg-[var(--color-foreground)]/[0.03] p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-300">
          <FiInfo className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-medium">Site Branding Status</h2>
          <p className="text-xs opacity-60">
            Quick overview of your current branding configuration.
          </p>
        </div>
      </div>

      <div className="text-xs space-y-2 rounded-lg bg-[var(--color-background)]/40 border border-[var(--color-foreground)]/10 p-3">
        <div className="flex justify-between">
          <span className="opacity-60">Current Gradient</span>
          <span className="font-medium">Rad Dad Purple</span>
        </div>

        <div className="flex justify-between">
          <span className="opacity-60">Font Style</span>
          <span className="font-medium">Clean Sans</span>
        </div>

        <div className="flex justify-between">
          <span className="opacity-60">Main Hero Block</span>
          <span className="font-medium">Video</span>
        </div>

        <div className="flex justify-between">
          <span className="opacity-60">Last Saved</span>
          <span className="font-medium">Just now</span>
        </div>
      </div>

      <p className="text-[10px] opacity-60">
        This block will later be connected to a `site_branding` table so it
        pulls live data from your actual public site settings.
      </p>
    </section>
  );
}