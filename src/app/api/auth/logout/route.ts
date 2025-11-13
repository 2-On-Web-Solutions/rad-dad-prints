/** 
 /src/app/api/auth/login/route.ts
*/

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST() {
  // supabaseServer is now async — make sure to await it
  const supabase = await supabaseServer();

  // Sign the user out
  await supabase.auth.signOut();

  // Adjust this if you commonly use port 3002 during dev
  const fallback = 'http://localhost:3001';

  // Redirect to dashboard after logout
  return NextResponse.redirect(
    new URL('/dashboard', process.env.NEXT_PUBLIC_SITE_URL || fallback)
  );
}