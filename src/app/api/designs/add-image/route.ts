import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

function uniquePath(originalName: string) {
  const ext = originalName.split('.').pop() || 'bin';
  const uid =
    (crypto as any).randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `designs/${uid}.${ext}`;
}

// POST /api/designs/add-image
// formData: { design_id, file }
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const design_id = formData.get('design_id') as string | null;
    const file = formData.get('file') as File | null;

    if (!design_id) {
      return NextResponse.json(
        { error: 'Missing design_id' },
        { status: 400 }
      );
    }
    if (!file) {
      return NextResponse.json(
        { error: 'Missing file' },
        { status: 400 }
      );
    }

    // upload into bucket
    const storagePath = uniquePath(file.name);
    const mime = file.type || 'application/octet-stream';

    const { error: uploadError } = await admin.storage
      .from('print-designs')
      .upload(storagePath, file, {
        contentType: mime,
        upsert: false,
      });

    if (uploadError) {
      console.error('[add-image uploadError]', uploadError);
      return NextResponse.json(
        { error: 'Upload failed', details: uploadError.message },
        { status: 500 }
      );
    }

    // get public URL
    const {
      data: { publicUrl },
    } = admin.storage.from('print-designs').getPublicUrl(storagePath);

    // insert design_images row
    const { data: imgRow, error: insertError } = await admin
      .from('design_images')
      .insert([
        {
          design_id,
          image_url: publicUrl,
          storage_path: storagePath,
        },
      ])
      .select('id,image_url,storage_path,created_at')
      .single();

    if (insertError) {
      console.error('[add-image insertError]', insertError);
      return NextResponse.json(
        { error: 'DB insert failed', details: insertError.message },
        { status: 500 }
      );
    }

    // Return minimal shape so the UI can append:
    return NextResponse.json({
      image: {
        id: imgRow.id,
        url: imgRow.image_url,
        storage_path: imgRow.storage_path,
        created_at: imgRow.created_at,
      },
    });
  } catch (err: any) {
    console.error('[designs/add-image] crash', err);
    return NextResponse.json(
      { error: 'Unhandled server error', details: String(err) },
      { status: 500 }
    );
  }
}