// src/app/api/bundles/upload/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// Use the service role on the server so this works regardless of client state.
// (Your RLS already requires auth for app users.)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

// Create a unique storage path like: thumbs/20251104/uuid.png
function uniqueThumbPath(originalName: string) {
  const ext = (originalName.split('.').pop() || 'png').toLowerCase();
  const uid =
    (crypto as any).randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `thumbs/${ymd}/${uid}.${ext}`;
}

// POST /api/bundles/upload
export async function POST(req: Request) {
  try {
    const form = await req.formData();

    // required fields
    const file = form.get('file') as File | null;
    const title = String(form.get('title') || '').trim();

    // optional fields
    const blurb = String(form.get('blurb') || '');
    const price_from = String(form.get('price_from') || '');
    const category_id = String(form.get('category_id') || 'uncategorized');
    const sort_order = Number(String(form.get('sort_order') ?? '0')) || 0;

    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });
    if (!file)  return NextResponse.json({ error: 'thumbnail "file" required' }, { status: 400 });

    // 1) Upload thumbnail to Storage (bucket: bundles)
    const storagePath = uniqueThumbPath(file.name);
    const contentType = file.type || 'application/octet-stream';

    const { error: uploadError } = await admin
      .storage
      .from('bundles')
      .upload(storagePath, file, { contentType, upsert: false });

    if (uploadError) {
      console.error('[bundles/upload] uploadError', uploadError);
      return NextResponse.json(
        { error: 'Upload failed', details: uploadError.message },
        { status: 500 }
      );
    }

    const { data: { publicUrl: thumb_url } } =
      admin.storage.from('bundles').getPublicUrl(storagePath);

    // 2) Insert bundle row (no user_id anymore)
    const { data: inserted, error: insertError } = await admin
      .from('bundles')
      .insert([
        {
          title,
          blurb,
          price_from,
          category_id,
          sort_order,
          is_active: true,
          thumb_url,
          thumb_storage_path: storagePath,
        },
      ])
      .select(
        'id,title,blurb,price_from,category_id,sort_order,is_active,created_at,thumb_url,thumb_storage_path'
      )
      .single();

    if (insertError) {
      console.error('[bundles/upload] insertError', insertError);
      return NextResponse.json(
        { error: 'DB insert failed', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      item: {
        id: inserted.id,
        title: inserted.title ?? '',
        blurb: inserted.blurb ?? '',
        price_from: inserted.price_from ?? '',
        category_id: inserted.category_id ?? 'uncategorized',
        sort_order: inserted.sort_order ?? 0,
        is_active: inserted.is_active ?? true,
        created_at: inserted.created_at,
        thumb_url: inserted.thumb_url ?? null,
        thumb_storage_path: inserted.thumb_storage_path ?? null,
      },
    });
  } catch (err: any) {
    console.error('[bundles/upload] crash', err);
    return NextResponse.json(
      { error: 'Unhandled server error', details: String(err) },
      { status: 500 }
    );
  }
}