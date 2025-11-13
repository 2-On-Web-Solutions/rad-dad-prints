/**
 * /src/app/dashboard/crm/page.tsx
 */

import { supabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function CRMPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // redirect unauthenticated users back to main dashboard
  if (!user) redirect('/dashboard');

  return (
    <section className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-semibold mb-2">CRM / Client Management</h1>
      <p className="opacity-70 mb-6">
        Track leads, customers, jobs, and invoices. This section is coming soon.
      </p>

      <div className="rounded-xl border border-white/10 p-4">
        CRM dashboard and client tools coming soon...
      </div>
    </section>
  );
}