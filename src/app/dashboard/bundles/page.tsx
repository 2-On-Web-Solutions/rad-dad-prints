/**
 * /src/app/dashboard/bundles/page.tsx
 * Dashboard → Bundles & Packages manager
*/

import { supabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BundlesManager from './BundlesManager';

export default async function BundlesPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/dashboard');

  return <BundlesManager />;
}