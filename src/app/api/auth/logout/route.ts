/**
 * /src/app/api/auth/logout/route.ts
 */
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await supabaseServer();

  // Sign out the user
  await supabase.auth.signOut();

  // Detect base URL depending on environment
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';

  // ✅ Redirect to login (dashboard route shows login screen when signed out)
  return NextResponse.redirect(`${baseUrl}/dashboard`);
}