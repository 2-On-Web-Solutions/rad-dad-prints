/**
 * /src/app/dashboard/designs/page.tsx
 * Dashboard → Print Designs manager
 */

import { supabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DesignsManager from './DesignsManager';

export default async function DesignsPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/dashboard');

  // Later: fetch designs from Supabase and pass them in as props instead of using mockDesigns.
  // For now, DesignsManager uses local mock state so the UI works.

  return <DesignsManager />;
}