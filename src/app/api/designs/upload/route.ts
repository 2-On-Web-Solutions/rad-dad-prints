import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// --- Admin Supabase client (server-only) ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

// helper to generate a unique storage path
function uniquePath(originalName: string) {
  const ext = originalName.split('.').pop() || 'bin';
  const uid =
    (crypto as any).randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `designs/${uid}.${ext}`;
}

// POST /api/designs/upload
// This is used when creating a BRAND NEW design with its first thumbnail.
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // required thumbnail file
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    // meta from the editor panel
    const title = (formData.get('title') as string) ?? '';
    const blurb = (formData.get('blurb') as string) ?? '';
    const price_from = (formData.get('price_from') as string) ?? '';
    const category_id =
      (formData.get('category_id') as string) ?? 'uncategorized';

    // optional sort order input
    const sortOrderRaw = (formData.get('sort_order') as string) ?? '0';
    const sort_order = parseInt(sortOrderRaw, 10) || 0;

    if (!title.trim()) {
      return NextResponse.json(
        { error: 'Missing title' },
        { status: 400 }
      );
    }

    // --- upload thumbnail to Storage bucket `print-designs`
    const mime = file.type || 'application/octet-stream';
    const storagePath = uniquePath(file.name);

    const { error: uploadError } = await admin.storage
      .from('print-designs')
      .upload(storagePath, file, {
        contentType: mime,
        upsert: false,
      });

    if (uploadError) {
      console.error('[design uploadError]', uploadError);
      return NextResponse.json(
        { error: 'Upload failed', details: uploadError.message },
        { status: 500 }
      );
    }

    // public URL for thumbnail
    const {
      data: { publicUrl },
    } = admin.storage.from('print-designs').getPublicUrl(storagePath);

    // --- insert new design row
    const { data: inserted, error: insertError } = await admin
      .from('print_designs')
      .insert([
        {
          title,
          blurb,
          price_from,
          category_id,
          sort_order,
          is_active: true,
          thumb_url: publicUrl,
          thumb_storage_path: storagePath,
        },
      ])
      .select(
        'id,title,blurb,price_from,category_id,sort_order,is_active,created_at,thumb_url,thumb_storage_path'
      )
      .single();

    if (insertError) {
      console.error('[design insertError]', insertError);
      return NextResponse.json(
        { error: 'DB insert failed', details: insertError.message },
        { status: 500 }
      );
    }

    // shape to match the dashboard’s DesignRecord-ish expectation
    return NextResponse.json({
      item: {
        id: inserted.id,
        title: inserted.title || '',
        blurb: inserted.blurb || '',
        price_from: inserted.price_from || '',
        category_id: inserted.category_id || 'uncategorized',
        thumb_url: inserted.thumb_url || null,
        // first "image" is just the thumb for display
        images: inserted.thumb_url
          ? [
              {
                id: 'thumb',
                url: inserted.thumb_url,
              },
            ]
          : [],
        files: [],
        created_at: inserted.created_at,
        sort_order: inserted.sort_order ?? 0,
        is_active: inserted.is_active,
        thumb_storage_path: inserted.thumb_storage_path,
      },
    });
  } catch (err: any) {
    console.error('[designs/upload] crash', err);
    return NextResponse.json(
      { error: 'Unhandled server error', details: String(err) },
      { status: 500 }
    );
  }
}