// src/app/api/bundles/[id]/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const supabase = await supabaseServer();

    const payload = {
      title: body.title ?? null,
      blurb: body.blurb ?? null,
      price_from: body.price_from ?? null,
      category_id: body.category_id ?? 'uncategorized',
      thumb_url: body.thumb_url ?? null,
    };

    const { data, error } = await supabase
      .from('bundles')
      .update(payload)
      .eq('id', params.id)
      .select()
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data)  return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}