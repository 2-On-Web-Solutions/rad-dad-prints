// src/app/api/public/bundles/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q         = (url.searchParams.get('q') || '').trim();
  const category  = url.searchParams.get('category') || '';
  const page      = Math.max(1, Number(url.searchParams.get('page') || 1));
  const pageSize  = Math.min(48, Math.max(1, Number(url.searchParams.get('pageSize') || 12)));
  const from = (page - 1) * pageSize;
  const to   = from + pageSize - 1;

  const supabase = await supabaseServer();

  // total (for pager)
  let total = 0;
  {
    let qb = supabase.from('bundles').select('id', { count: 'exact', head: true }).eq('is_active', true);
    if (category) qb = qb.eq('category_id', category);
    if (q) qb = qb.or(`title.ilike.%${q}%,blurb.ilike.%${q}%`);
    const { count } = await qb;
    total = count || 0;
  }

  // list + counts
  let listQ = supabase
    .from('bundles')
    .select(`
      id, title, blurb, price_from, category_id, thumb_url, thumb_storage_path, is_active, created_at,
      bundle_images(count),
      bundle_files(count)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (category) listQ = listQ.eq('category_id', category);
  if (q)        listQ = listQ.or(`title.ilike.%${q}%,blurb.ilike.%${q}%`);

  const { data, error } = await listQ;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = (data || []).map((row: any) => ({
    id: row.id,
    title: row.title ?? '',
    blurb: row.blurb ?? '',
    price_from: row.price_from ?? '',
    category_id: row.category_id ?? 'uncategorized',
    thumb_url: row.thumb_url ?? null,
    thumb_storage_path: row.thumb_storage_path ?? null,
    image_count: (row.thumb_url ? 1 : 0) + (row.bundle_images?.[0]?.count || 0),
    file_count: row.bundle_files?.[0]?.count || 0,
  }));

  return NextResponse.json({ items, total });
}