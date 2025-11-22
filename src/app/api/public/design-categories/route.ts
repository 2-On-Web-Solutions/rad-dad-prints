import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

// Public, read-only list of design categories + counts
export async function GET() {
  const supabase = await supabaseServer();

  // 1) Read active categories
  const { data: cats, error: catErr } = await supabase
    .from('design_categories')
    .select('slug,label,icon_slug,sort_order,is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (catErr) {
    console.error('design_categories list error', catErr);
    return NextResponse.json({ categories: [] }, { status: 200 });
  }

  // 2) Count designs by category
  const { data: designs, error: cntErr } = await supabase
    .from('print_designs')
    .select('category_id');

  const counts = new Map<string, number>();

  if (!cntErr) {
    (designs ?? []).forEach((d: { category_id: string | null }) => {
      const k = d?.category_id ?? 'uncategorized';
      counts.set(k, (counts.get(k) ?? 0) + 1);
    });
  } else {
    console.warn('design count error', cntErr?.message);
  }

  const categories =
    (cats ?? []).map((c: any) => ({
      id: c.slug,
      label: c.label,
      icon_slug: c.icon_slug ?? null,
      count: counts.get(c.slug) ?? 0,
    })) ?? [];

  // Always inject a single “Uncategorized” at the top
  if (!categories.some((c) => c.id === 'uncategorized')) {
    categories.unshift({
      id: 'uncategorized',
      label: 'Uncategorized',
      icon_slug: 'box', // generic fallback icon slug
      count: counts.get('uncategorized') ?? 0,
    });
  }

  return NextResponse.json({ categories }, { status: 200 });
}
