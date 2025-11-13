/** 
 /src/lib/supabase/server.ts
*/

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Next 15: cookies() must be awaited. We normalize for both sync/async cases.
 * Uses the new cookies API: getAll / setAll.
 */
export async function supabaseServer() {
  // Works whether cookies() returns a value or a Promise
  const cookieStore: any = await Promise.resolve(cookies());

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const list = typeof cookieStore.getAll === 'function' ? cookieStore.getAll() : [];
          return list.map((c: any) => ({ name: c.name, value: c.value }));
        },
        setAll(_cookies: { name: string; value: string; options: CookieOptions }[]) {
          // In RSC this is generally read-only; keep as no-op but try if supported
          try {
            _cookies.forEach(({ name, value, options }) => {
              cookieStore?.set?.(name, value, options);
            });
          } catch { /* no-op */ }
        },
      },
    }
  );
}