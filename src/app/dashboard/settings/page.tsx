/** 
 * /src/app/dashboard/settings/page.tsx
 */

import { supabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SettingsShell from './SettingsShell';

export default async function SettingsPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/dashboard');

  return (
    <section className="max-w-[1400px] mx-auto pb-24">
      <SettingsShell />
    </section>
  );
}