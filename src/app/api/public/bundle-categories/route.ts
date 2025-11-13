import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await supabaseServer();

  // 1) read public categories
  const { data: cats, error: catErr } = await supabase
    .from('bundle_categories')
    .select('id,label,icon,sort_order,is_public')
    .eq('is_public', true)                       // important for RLS!
    .order('sort_order', { ascending: true });

  if (catErr) {
    console.error('bundle_categories list error', catErr);
    // still return a shape the client understands, just empty
    return NextResponse.json({ categories: [] }, { status: 200 });
  }

  // 2) count bundles by category (keep it simple; RLS-safe)
  const { data: bundles, error: cntErr } = await supabase
    .from('bundles')
    .select('category_id');

  // if counting fails, we still return the list without counts
  const counts = new Map<string, number>();
  if (!cntErr) {
    (bundles ?? []).forEach(b => {
      const k = b?.category_id ?? 'uncategorized';
      counts.set(k, (counts.get(k) ?? 0) + 1);
    });
  } else {
    console.warn('bundle count error', cntErr?.message);
  }

  const categories = (cats ?? []).map(c => ({
    id: c.id,
    label: c.label,
    icon: c.icon ?? null,
    count: counts.get(c.id) ?? 0,
  }));

  // Always inject a single “Uncategorized” at the top
  if (!categories.some(c => c.id === 'uncategorized')) {
    categories.unshift({
      id: 'uncategorized',
      label: 'Uncategorized',
      icon: 'box',
      count: counts.get('uncategorized') ?? 0,
    });
  }

  return NextResponse.json({ categories }, { status: 200 });
}