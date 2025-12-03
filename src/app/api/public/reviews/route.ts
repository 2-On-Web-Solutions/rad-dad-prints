// /src/app/api/public/reviews/route.ts

import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from('customer_reviews')
    .select('id,name,quote,stars,sort_order,is_published')
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Public reviews GET error:', error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }

  return NextResponse.json({
    items: (data ?? []).map((row) => ({
      id: row.id,
      name: row.name ?? '',
      quote: row.quote ?? '',
      stars: row.stars ?? 5,
    })),
  });
}