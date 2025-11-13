import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type Row = {
  id: string;
  design_id: string;
  file_url: string | null;
  storage_path?: string | null; // if you have it
  mime_type?: string | null;
};

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function parseStorageFromPublicUrl(url: string | null) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const idx = u.pathname.indexOf('/object/public/');
    if (idx === -1) return null;
    const rest = u.pathname.substring(idx + '/object/public/'.length);
    const firstSlash = rest.indexOf('/');
    if (firstSlash === -1) return null;
    const bucket = rest.substring(0, firstSlash);
    const path = rest.substring(firstSlash + 1);
    return { bucket, path };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    // 1) fetch the row
    const { data: row, error: selErr } = await supabaseAdmin
      .from('design_files')
      .select('id, design_id, file_url, storage_path, mime_type')
      .eq('id', id)
      .single<Row>();

    if (selErr || !row) {
      return NextResponse.json(
        { error: selErr?.message || 'Not found' },
        { status: 404 }
      );
    }

    // 2) figure storage target
    let bucket: string | null = null;
    let path: string | null = null;

    if (row.storage_path) {
      bucket = process.env.SUPABASE_PRINTS_BUCKET || 'print-designs';
      path = row.storage_path;
    } else {
      const parsed = parseStorageFromPublicUrl(row.file_url);
      if (parsed) {
        bucket = parsed.bucket;
        path = parsed.path;
      }
    }

    // 3) delete storage object (best-effort)
    if (bucket && path) {
      const { error: delStorageErr } = await supabaseAdmin.storage
        .from(bucket)
        .remove([path]);
      if (delStorageErr) {
        console.warn('Storage remove warning (file):', delStorageErr.message);
      }
    }

    // 4) delete DB row
    const { error: delRowErr } = await supabaseAdmin
      .from('design_files')
      .delete()
      .eq('id', id);

    if (delRowErr) {
      return NextResponse.json(
        { error: delRowErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Unexpected error' },
      { status: 500 }
    );
  }
}