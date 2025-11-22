import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * GET  /api/bundle-categories
 * Full list for the dashboard (no is_public filter, includes counts)
 */
export async function GET() {
  const supabase = await supabaseServer();

  // categories
  const { data: cats, error: catErr } = await supabase
    .from('bundle_categories')
    .select('id,label,icon_slug,sort_order,is_public')
    .order('sort_order', { ascending: true });

  if (catErr) {
    console.error('bundle_categories admin list error', catErr);
    return NextResponse.json({ categories: [] }, { status: 200 });
  }

  // bundle counts per category
  const { data: bundles, error: bundleErr } = await supabase
    .from('bundles')
    .select('id,category_id');

  if (bundleErr) {
    console.error('bundle_categories admin count error', bundleErr);
  }

  const counts = new Map<string, number>();
  (bundles ?? []).forEach((b) => {
    const key = b.category_id || 'uncategorized';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const categories = (cats ?? []).map((c) => ({
    id: c.id,
    label: c.label,
    icon_slug: c.icon_slug ?? null,
    sort_order: c.sort_order ?? 0,
    is_public: c.is_public ?? true,
    count: counts.get(c.id) ?? 0,
  }));

  return NextResponse.json({ categories }, { status: 200 });
}

/**
 * POST  /api/bundle-categories
 * Create a new category from the dashboard
 */
export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const body = await req.json().catch(() => ({} as any));

  const id = (body.id as string | undefined) ?? null;
  const label = (body.label as string | undefined) ?? null;
  const icon_slug = (body.icon_slug as string | undefined) ?? null;
  const sort_order = (body.sort_order as number | undefined) ?? 0;

  if (!id || !label) {
    return NextResponse.json(
      { error: 'id and label are required' },
      { status: 400 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const user_id = user?.id ?? null;

  const { data, error } = await supabase
    .from('bundle_categories')
    .insert({
      id,
      label,
      icon_slug,
      sort_order,
      is_public: true, // <— important so it never inserts NULL
      user_id,
    })
    .select('id,label,icon_slug,sort_order,is_public')
    .single();

  if (error) {
    console.error('bundle_categories create error', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ item: data }, { status: 201 });
}

/**
 * DELETE  /api/bundle-categories
 * Body: { id: string, reassignTo: string }
 * Reassigns bundles then deletes the category.
 */
export async function DELETE(req: Request) {
  const supabase = await supabaseServer();
  const body = await req.json().catch(() => ({} as any));

  const id = body.id as string | undefined;
  const reassignTo = (body.reassignTo as string | undefined) ?? 'uncategorized';

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }
  if (id === reassignTo) {
    return NextResponse.json(
      { error: 'reassignTo must be different from id' },
      { status: 400 },
    );
  }

  // 1) reassign bundles
  const { error: updErr } = await supabase
    .from('bundles')
    .update({ category_id: reassignTo })
    .eq('category_id', id);

  if (updErr) {
    console.error('bundle_categories reassign error', updErr);
    return NextResponse.json({ error: updErr.message }, { status: 400 });
  }

  // 2) delete category
  const { error: delErr } = await supabase
    .from('bundle_categories')
    .delete()
    .eq('id', id);

  if (delErr) {
    console.error('bundle_categories delete error', delErr);
    return NextResponse.json({ error: delErr.message }, { status: 400 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}