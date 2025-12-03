import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from('site_tagline')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error loading public tagline:', error);
    // Fallback to null – Hero will keep its defaults
    return NextResponse.json(null, { status: 200 });
  }

  if (!data) {
    return NextResponse.json(null, { status: 200 });
  }

  return NextResponse.json(
    {
      main_text: data.main_text ?? null,
      sub_text: data.sub_text ?? null,
      font_id: data.font_id ?? 'sans',
    },
    { status: 200 }
  );
}