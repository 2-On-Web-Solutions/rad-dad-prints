/**
 * /src/app/dashboard/calendar/page.tsx
 */
import { supabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CalendarBoard from '../../components/calendar/CalendarBoard';

export default async function CalendarPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/dashboard');

  return (
    <section className="max-w-[1200px] mx-auto pb-24">
      <h1 className="text-3xl font-semibold mb-2">Calendar / Agenda</h1>
      <p className="opacity-70 mb-6">
        Track jobs, order deadlines, events, and print sessions. Click a day to add notes.
      </p>

      <div className="rounded-xl border border-[var(--color-foreground)]/10 overflow-hidden">
        <CalendarBoard userId={user.id} />
      </div>
    </section>
  );
}