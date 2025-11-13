/**
 * /src/lib/supabase/client.ts
 */

'use client';

import { createBrowserClient, type CookieOptions } from '@supabase/ssr';

// Create a reusable Supabase browser client instance
export const supabaseBrowser = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      // --- Read cookies in browser ---
      getAll() {
        if (typeof document === 'undefined') return [];
        return document.cookie
          .split('; ')
          .filter(Boolean)
          .map((part) => {
            const [name, ...rest] = part.split('=');
            return { name, value: rest.join('=') };
          });
      },

      // --- Write cookies (for session persistence) ---
      setAll(cookies: { name: string; value: string; options: CookieOptions }[]) {
        if (typeof document === 'undefined') return;
        cookies.forEach(({ name, value, options }) => {
          let cookieStr = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=${
            options?.path ?? '/'
          }`;

          if (options?.maxAge) cookieStr += `; Max-Age=${options.maxAge}`;
          if (options?.domain) cookieStr += `; Domain=${options.domain}`;
          if (options?.sameSite) cookieStr += `; SameSite=${options.sameSite}`;
          if (options?.secure) cookieStr += `; Secure`;

          document.cookie = cookieStr;
        });
      },
    },
  }
);
