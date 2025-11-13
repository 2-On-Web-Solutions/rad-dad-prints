// src/app/api/public/bundles/[id]/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

type Params = { id: string };

export async function GET(
  _req: Request,
  ctx: { params: Promise<Params> }        // 👈 params is a Promise
) {
  const { id } = await ctx.params;        // 👈 await it
  const supabase = await supabaseServer();

  // Base bundle
  const { data: d, error: dErr } = await supabase
    .from('bundles')
    .select('id,title,blurb,price_from,thumb_url,thumb_storage_path,category_id,is_active')
    .eq('id', id)
    .maybeSingle();

  if (dErr) return NextResponse.json({ error: dErr.message }, { status: 500 });
  if (!d || d.is_active === false) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Gallery images (include id)
  const { data: imgs, error: iErr } = await supabase
    .from('bundle_images')
    .select('id,image_url,sort_order')
    .eq('bundle_id', id)
    .order('sort_order', { ascending: true });

  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });

  // Files (include id)
  const { data: files, error: fErr } = await supabase
    .from('bundle_files')
    .select('id,label,file_url,mime_type,sort_order')
    .eq('bundle_id', id)
    .order('sort_order', { ascending: true });

  if (fErr) return NextResponse.json({ error: fErr.message }, { status: 500 });

  return NextResponse.json({
    id: d.id,
    title: d.title ?? '',
    blurb: d.blurb ?? '',
    price_from: d.price_from ?? '',
    thumb_url: d.thumb_url ?? null,
    thumb_storage_path: d.thumb_storage_path ?? null,
    category_id: d.category_id ?? 'uncategorized',
    images: (imgs ?? []).map(r => ({ id: r.id, url: r.image_url, sort_order: r.sort_order })),
    files: (files ?? []).map(r => ({
      id: r.id,
      label: r.label ?? 'Download',
      file_url: r.file_url,
      mime_type: r.mime_type ?? '',
      sort_order: r.sort_order,
    })),
  });
}