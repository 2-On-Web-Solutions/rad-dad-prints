/**
 * /src/app/api/auth/logout/route.ts
 */
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();

  // Use the current request's origin (works on localhost and Vercel)
  const { origin } = new URL(req.url);
  return NextResponse.redirect(new URL('/dashboard', origin));
}