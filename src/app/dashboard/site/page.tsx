/** 
 /src/app/dashboard/site/page.tsx
*/

import { supabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function SiteSettingsPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/dashboard');

  return (
    <section className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">Site Customization</h1>
        <p className="opacity-70">
          Choose gradients & theme colors, update hero image/video, and set your tagline.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 p-4">
        Theme presets & gradient picker coming soon…
      </div>
      <div className="rounded-xl border border-white/10 p-4">
        Hero media uploader & preview coming soon…
      </div>
      <div className="rounded-xl border border-white/10 p-4">
        Tagline & copy editor coming soon…
      </div>
    </section>
  );
}