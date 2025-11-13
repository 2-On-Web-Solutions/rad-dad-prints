// src/app/api/public/designs/[id]/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await supabaseServer();
  const { id } = params;

  // 1) Base design
  const { data: d, error: dErr } = await supabase
    .from('print_designs')
    .select('id,title,blurb,price_from,thumb_url,category_id,is_active')
    .eq('id', id)
    .maybeSingle();

  if (dErr) {
    return NextResponse.json({ error: dErr.message }, { status: 500 });
  }
  if (!d || d.is_active === false) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // 2) Gallery images (public URLs expected in image_url)
  const { data: imgs, error: iErr } = await supabase
    .from('design_images')
    .select('image_url, sort_order')
    .eq('design_id', id)
    .order('sort_order', { ascending: true });

  if (iErr) {
    return NextResponse.json({ error: iErr.message }, { status: 500 });
  }

  // 3) Downloadable files (e.g., STL)
  const { data: files, error: fErr } = await supabase
    .from('design_files')
    .select('label, file_url, mime_type, sort_order')
    .eq('design_id', id)
    .order('sort_order', { ascending: true });

  if (fErr) {
    return NextResponse.json({ error: fErr.message }, { status: 500 });
  }

  // Normalize for the client
  return NextResponse.json({
    id: d.id,
    title: d.title ?? '',
    blurb: d.blurb ?? '',
    price_from: d.price_from ?? '',
    thumb_url: d.thumb_url ?? null,
    category_id: d.category_id ?? 'uncategorized',
    images: (imgs ?? []).map((r) => ({ url: r.image_url })),
    files: (files ?? []).map((r) => ({
      label: r.label ?? 'Download',
      file_url: r.file_url,
      mime_type: r.mime_type ?? '',
    })),
  });
}