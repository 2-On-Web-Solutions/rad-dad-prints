import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from('media_assets')
    .select('id, public_url, caption')
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[gallery] error:', error);
    return NextResponse.json(
      { error: 'Failed to load gallery' },
      { status: 500 }
    );
  }

  const media = (data || []).map((row: any) => ({
    id: row.id,
    url: row.public_url,
    caption: row.caption ?? null,
  }));

  return NextResponse.json({ media });
}