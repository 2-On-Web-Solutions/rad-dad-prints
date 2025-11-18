/**
 * /src/app/dashboard/crm/page.tsx
 */

import { supabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CRMBoard from './CRMBoard';

export default async function CRMPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/dashboard');

  return (
    <section className="w-full px-4 pb-24 pt-4">
      <div className="max-w-[1400px] mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold mb-1">Customer / Job Tracker</h1>
          <p className="opacity-70 text-sm max-w-[80ch]">
            Leads from the contact form plus manually added customers. Track ref #, status,
            notes, files, and invoices.
          </p>
        </header>

        <div className="rounded-xl border border-[var(--color-foreground)]/15 bg-[var(--color-background)]/70 overflow-hidden">
          <CRMBoard />
        </div>
      </div>
    </section>
  );
}