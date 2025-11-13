/** 
 /src/middleware.ts
*/

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  // We'll attach any cookie writes to this response
  const res = NextResponse.next();
  const { pathname, searchParams } = req.nextUrl;

  // Build a Supabase client that reads/writes cookies via Next middleware APIs
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Normalize Next's cookies to { name, value }
          return req.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
        },
        setAll(cookies: { name: string; value: string; options: CookieOptions }[]) {
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Allow top-level /dashboard to render (it shows login when unauthenticated)
  const isDashboardRoot = pathname === '/dashboard';

  // For any deeper /dashboard/* routes, require a user
  const isProtectedDashboardSubroute =
    pathname.startsWith('/dashboard/') || (pathname === '/dashboard' && searchParams.get('force') === '1');

  if (!user && isProtectedDashboardSubroute && !isDashboardRoot) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    // optional: remember where they wanted to go
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  return res;
}

// Apply to /dashboard and all subpaths. Static files & Next internals are excluded by default.
export const config = {
  matcher: ['/dashboard/:path*'],
};