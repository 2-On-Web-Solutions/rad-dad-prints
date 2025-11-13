import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const supabase = await supabaseServer();
    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').trim();
    const rawCategory = url.searchParams.get('category') || '';
    const category = rawCategory === 'all' ? '' : rawCategory; // <-- ignore "all"
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const pageSize = Math.min(48, Math.max(1, parseInt(url.searchParams.get('pageSize') || '12', 10)));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('print_designs')
      .select('id,title,blurb,price_from,thumb_url,category_id,is_active', { count: 'exact' })
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (category) query = query.eq('category_id', category);
    if (q) query = query.or(`title.ilike.%${q}%,blurb.ilike.%${q}%`);

    const { data, error, count } = await query.range(from, to);
    if (error) throw error;

    const items = (data || []).map(d => ({
      id: d.id,
      title: d.title,
      blurb: d.blurb,
      price_from: d.price_from,
      thumb_url: d.thumb_url,
      category_id: d.category_id,
    }));

    return NextResponse.json({ total: count || 0, items });
  } catch (e: any) {
    // Always return JSON on error
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}