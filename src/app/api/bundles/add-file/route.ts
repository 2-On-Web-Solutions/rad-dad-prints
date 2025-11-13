// src/app/api/bundles/add-file/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

function uniquePath(bundleId: string, originalName: string) {
  const clean = (originalName || 'file.bin').replace(/[^a-zA-Z0-9._-]+/g, '_');
  const ext = clean.includes('.') ? clean.split('.').pop()! : 'bin';
  const uid =
    (crypto as any).randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `files/${bundleId}/${uid}.${ext}`;
}

// formData: { bundle_id, label?, file }
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const bundle_id = (form.get('bundle_id') as string | null)?.trim();
    const label = ((form.get('label') as string) || '').trim();
    const file = form.get('file') as File | null;

    if (!bundle_id) return NextResponse.json({ error: 'Missing bundle_id' }, { status: 400 });
    if (!file)      return NextResponse.json({ error: 'Missing file' }, { status: 400 });

    const storage_path = uniquePath(bundle_id, (file as any).name || 'file.bin');
    const mime_type = file.type || 'application/octet-stream';

    // Upload to Storage
    const { error: uploadError } = await admin
      .storage
      .from('bundles')
      .upload(storage_path, file, { contentType: mime_type, upsert: false });

    if (uploadError) {
      console.error('[bundles/add-file uploadError]', uploadError);
      return NextResponse.json({ error: 'Upload failed', details: uploadError.message }, { status: 500 });
    }

    // Public URL (or swap to signed URL flow later)
    const { data: pub } = admin.storage.from('bundles').getPublicUrl(storage_path);
    const file_url = pub?.publicUrl || '';

    // Insert row (no user_id)
    const { data: row, error: insertError } = await admin
      .from('bundle_files')
      .insert([{
        bundle_id,
        label: label || (file as any).name || 'Download',
        file_url,
        mime_type,
        storage_path,       // keep if you added this column
        sort_order: 0,
      }])
      .select('id,bundle_id,label,file_url,mime_type,storage_path,sort_order,created_at')
      .single();

    if (insertError) {
      console.error('[bundles/add-file insertError]', insertError);
      return NextResponse.json({ error: 'DB insert failed', details: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ item: row });
  } catch (err: any) {
    console.error('[bundles/add-file] crash', err);
    return NextResponse.json({ error: 'Unhandled server error', details: String(err) }, { status: 500 });
  }
}