/** 
 * Dashboard Overview Page (/dashboard)
 /src/app/dashboard/page.tsx
*/

import { supabaseServer } from '@/lib/supabase/server';
import LoginForm from './_parts/LoginForm';

export default async function DashboardHome() {
  // supabaseServer is async in Next 15 because cookies() can be async
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not signed in, show the login card
  if (!user) {
    return (
      <div className="min-h-[70vh] w-full grid place-items-center">
        <div
          className="
            w-full max-w-md rounded-2xl p-6 shadow-lg border
            bg-white border-black/10 text-neutral-900
            dark:bg-neutral-900 dark:border-white/10 dark:text-white
          "
        >
          <h1 className="text-center text-2xl mb-4">Login</h1>
          <LoginForm />
        </div>
      </div>
    );
  }

  // Signed in → placeholder overview (we’ll fill later)
  return (
    <div className="w-full h-full grid place-items-center">
      <div className="text-center">
        <h2 className="text-3xl font-semibold mb-2">Overview</h2>
        <p className="opacity-70">Traffic &amp; leads coming next.</p>
      </div>
    </div>
  );
}