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

// POST /api/designs/add-file
// formData: { design_id, label, file }
export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const design_id = formData.get('design_id') as string | null;
    const label = (formData.get('label') as string) || 'File';
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

    const mime = file.type || 'application/octet-stream';
    const storagePath = uniquePath(file.name);

    // upload to Storage
    const { error: uploadError } = await admin.storage
      .from('print-designs')
      .upload(storagePath, file, {
        contentType: mime,
        upsert: false,
      });

    if (uploadError) {
      console.error('[add-file uploadError]', uploadError);
      return NextResponse.json(
        { error: 'Upload failed', details: uploadError.message },
        { status: 500 }
      );
    }

    // get public download URL for this STL / OBJ / etc
    const {
      data: { publicUrl },
    } = admin.storage.from('print-designs').getPublicUrl(storagePath);

    // insert into design_files
    const { data: fileRow, error: insertError } = await admin
      .from('design_files')
      .insert([
        {
          design_id,
          label,
          file_url: publicUrl,
          mime_type: mime,
          storage_path: storagePath,
        },
      ])
      .select('id,label,file_url,mime_type,storage_path,created_at')
      .single();

    if (insertError) {
      console.error('[add-file insertError]', insertError);
      return NextResponse.json(
        { error: 'DB insert failed', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      file: {
        id: fileRow.id,
        label: fileRow.label,
        file_url: fileRow.file_url,
        mime_type: fileRow.mime_type,
        storage_path: fileRow.storage_path,
        created_at: fileRow.created_at,
      },
    });
  } catch (err: any) {
    console.error('[designs/add-file] crash', err);
    return NextResponse.json(
      { error: 'Unhandled server error', details: String(err) },
      { status: 500 }
    );
  }
}