import { NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase/serverService';

export async function POST(req: Request) {
  try {
    // 1. Parse form data from the client
    const formData = await req.formData();

    const file = formData.get('file') as File | null;
    const caption = (formData.get('caption') as string) ?? '';
    const tagsRaw = (formData.get('tags') as string) ?? '';
    const sortOrderRaw = (formData.get('sort_order') as string) ?? '';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // derive file info
    const mime = file.type || 'application/octet-stream';
    const isVideo = mime.startsWith('video');

    // make unique path for storage
    const ext = file.name.split('.').pop() || 'bin';
    const uniqueBit =
      (crypto.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(16).slice(2)}`);
    const filename = `${uniqueBit}.${ext}`;

    // ✅ this is the path in the bucket we will now also store in the DB
    const storage_path = `uploads/${filename}`;

    // 2. Upload to Supabase Storage bucket "media"
    const { error: uploadError } = await supabaseService.storage
      .from('media')
      .upload(storage_path, file, {
        contentType: mime,
        upsert: false,
      });

    if (uploadError) {
      console.error('[uploadError]', uploadError);
      return NextResponse.json(
        { error: 'Upload failed', details: uploadError.message },
        { status: 500 }
      );
    }

    // 3. Get a public URL for that file
    const {
      data: { publicUrl },
    } = supabaseService.storage.from('media').getPublicUrl(storage_path);

    // 4. Insert DB row in media_assets
    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const sort_order = sortOrderRaw
      ? parseInt(sortOrderRaw, 10)
      : 0;

    const { data: inserted, error: insertError } = await supabaseService
      .from('media_assets')
      .insert([
        {
          public_url: publicUrl,
          storage_path,          // ✅ NEW: save storage path in DB
          type: isVideo ? 'video' : 'image',
          caption,
          tags,
          sort_order,
          is_published: true,
        },
      ])
      .select('*')
      .single();

    if (insertError) {
      console.error('[insertError]', insertError);

      // optional cleanup: delete the file we just uploaded since row failed
      await supabaseService.storage
        .from('media')
        .remove([storage_path]);

      return NextResponse.json(
        { error: 'DB insert failed', details: insertError.message },
        { status: 500 }
      );
    }

    // 5. Return the row back to the browser so UI can update
    return NextResponse.json({
      item: {
        id: inserted.id,
        url: inserted.public_url,
        type: inserted.type,
        caption: inserted.caption ?? '',
        tags: inserted.tags ?? [],
        created_at: inserted.created_at,
        sort_order: inserted.sort_order ?? sort_order,
        storage_path: inserted.storage_path ?? storage_path, // ✅ include this
      },
    });
  } catch (err: any) {
    console.error('[unhandled upload error]', err);
    return NextResponse.json(
      { error: 'Unhandled server error', details: String(err) },
      { status: 500 }
    );
  }
}