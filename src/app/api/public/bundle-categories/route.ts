import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await supabaseServer();

  // --------------------------------------------
  // 1. Load PUBLIC categories
  // --------------------------------------------
  const { data: cats, error: catErr } = await supabase
    .from('bundle_categories')
    .select('id,label,icon_slug,sort_order,is_public')
    .eq('is_public', true)
    .order('sort_order', { ascending: true });

  if (catErr) {
    console.error('bundle_categories public list error', catErr);
    return NextResponse.json({ categories: [] }, { status: 200 });
  }

  // --------------------------------------------
  // 2. Load BUNDLES for counts
  // IMPORTANT: bundles table has **is_active** but NOT is_public anymore
  // --------------------------------------------
  const { data: bundles, error: bundleErr } = await supabase
    .from('bundles')
    .select('id,category_id,is_active')   // ← removed is_public column
    .eq('is_active', true);

  if (bundleErr) {
    console.error('bundle_categories public count error', bundleErr);
  }

  // --------------------------------------------
  // 3. Build count map
  // --------------------------------------------
  const counts = new Map<string, number>();
  (bundles ?? []).forEach((b) => {
    const key = b.category_id || 'uncategorized';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  // --------------------------------------------
  // 4. Map the categories list
  // --------------------------------------------
  let categories = (cats ?? []).map((c) => ({
    id: c.id,
    label: c.label,
    icon_slug: c.icon_slug ?? 'bundle',  // fallback icon slug
    count: counts.get(c.id) ?? 0,
  }));

  // --------------------------------------------
  // 5. Inject UNCATEGORIZED if missing
  // --------------------------------------------
  if (!categories.some((c) => c.id === 'uncategorized')) {
    categories = [
      {
        id: 'uncategorized',
        label: 'Uncategorized',
        icon_slug: 'bundle',
        count: counts.get('uncategorized') ?? 0,
      },
      ...categories,
    ];
  }

  return NextResponse.json({ categories }, { status: 200 });
}