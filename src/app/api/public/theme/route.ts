// src/app/api/public/theme/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from('hero_theme')
    .select('kind, solid_color, from_color, to_color')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[public/theme] select error:', error.message);
  }

  // Fallback to your Rad Dad defaults if table is empty or errored
  const kind = data?.kind ?? 'gradient';

  const solidColor = data?.solid_color ?? '#432389';
  const from = data?.from_color ?? '#13c8df';
  const to = data?.to_color ?? '#6d44af';

  return NextResponse.json({
    kind,
    solidColor,
    from,
    to,
  });
}