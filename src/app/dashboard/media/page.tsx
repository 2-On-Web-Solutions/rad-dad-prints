/**
 * /src/app/dashboard/media/page.tsx
 * Dashboard → Media Library manager
 */

import { supabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import MediaManager from './MediaManager';

export default async function MediaPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/dashboard');

  return <MediaManager />;
}