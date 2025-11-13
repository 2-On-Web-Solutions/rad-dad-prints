import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { id, label, icon } = await req.json().catch(() => ({} as any));

  if (!id || !label) {
    return NextResponse.json({ error: 'id and label are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('bundle_categories')
    .insert({ id, label, icon: icon ?? null, is_public: true })
    .select()
    .maybeSingle();

  if (error) {
    console.error('bundle_categories create error', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ item: data }, { status: 200 });
}

export async function DELETE(req: Request) {
  const supabase = await supabaseServer();
  const { id, reassignTo = 'uncategorized' } = await req.json().catch(() => ({} as any));

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  // Move bundles off the category first
  const { error: upErr } = await supabase
    .from('bundles')
    .update({ category_id: reassignTo })
    .eq('category_id', id);

  if (upErr) {
    console.error('bundle reassign error', upErr);
    return NextResponse.json({ error: upErr.message }, { status: 400 });
  }

  const { error: delErr } = await supabase
    .from('bundle_categories')
    .delete()
    .eq('id', id);

  if (delErr) {
    console.error('bundle_categories delete error', delErr);
    return NextResponse.json({ error: delErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}