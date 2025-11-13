import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await supabaseServer();

  // categories + count of designs in each
  const { data: cats, error } = await supabase
    .from('design_categories')
    .select('slug,label,sort_order,blurb,icon_slug,is_active')
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const activeCats = (cats || []).filter(c => c.is_active !== false);

  // counts by category
  const { data: counts } = await supabase
    .from('print_designs')
    .select('category_id, id');

  const byCat = new Map<string, number>();
  (counts || []).forEach((row) => {
    byCat.set(row.category_id, (byCat.get(row.category_id) || 0) + 1);
  });

  const categories = activeCats.map(c => ({
    id: c.slug,
    label: c.label,
    sort_order: c.sort_order ?? 0,
    blurb: c.blurb ?? '',
    icon_slug: c.icon_slug ?? c.slug, // default to slug
    count: byCat.get(c.slug) || 0,
  }));

  const total = (counts || []).length;

  return NextResponse.json({ total, categories });
}