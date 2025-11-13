// src/app/api/bundles/remove-file/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

type Row = {
  id: string;
  bundle_id: string;
  file_url: string | null;
  storage_path?: string | null; // preferred
  mime_type?: string | null;
};

const BUCKET = 'bundles';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

// Fallback when we don’t have storage_path
function parseStorageFromPublicUrl(url: string | null) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const idx = u.pathname.indexOf('/object/public/');
    if (idx === -1) return null;
    const rest = u.pathname.substring(idx + '/object/public/'.length); // "<bucket>/<path>"
    const firstSlash = rest.indexOf('/');
    if (firstSlash === -1) return null;
    const bucket = rest.substring(0, firstSlash);
    const path   = rest.substring(firstSlash + 1);
    return { bucket, path };
  } catch {
    return null;
  }
}

// Shared core
async function handle(body: any) {
  const id        = (body?.id ?? '').trim();
  const bundle_id = (body?.bundle_id ?? '').trim();
  const file_url  = (body?.file_url ?? '').trim();

  if (!id && !(bundle_id && file_url)) {
    return NextResponse.json(
      { error: 'Provide { id } or { bundle_id, file_url }' },
      { status: 400 }
    );
  }

  // 1) Fetch the target row
  let row: Row | null = null;

  if (id) {
    const { data, error } = await admin
      .from('bundle_files')
      .select('id,bundle_id,file_url,storage_path,mime_type')
      .eq('id', id)
      .single<Row>();
    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || 'Not found' },
        { status: 404 }
      );
    }
    row = data;
  } else {
    const { data, error } = await admin
      .from('bundle_files')
      .select('id,bundle_id,file_url,storage_path,mime_type')
      .eq('bundle_id', bundle_id)
      .eq('file_url', file_url)
      .maybeSingle<Row>();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ ok: true }); // already gone
    row = data;
  }

  // 2) Figure out which storage object to delete (best effort)
  let bucket: string | null = null;
  let path:   string | null = null;

  if (row.storage_path) {
    bucket = BUCKET;
    path   = row.storage_path;
  } else {
    const parsed = parseStorageFromPublicUrl(row.file_url);
    if (parsed) {
      bucket = parsed.bucket;
      path   = parsed.path;
    }
  }

  if (bucket && path) {
    const { error: delStorageErr } = await admin.storage.from(bucket).remove([path]);
    if (delStorageErr) {
      // Non-fatal; continue with DB delete so UI stays consistent
      console.warn('[bundles/remove-file] storage remove warning:', delStorageErr.message);
    }
  }

  // 3) Delete DB row
  const { error: delRowErr } = await admin
    .from('bundle_files')
    .delete()
    .eq('id', row.id);
  if (delRowErr) {
    return NextResponse.json({ error: delRowErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/** Preferred: POST with { id } (or { bundle_id, file_url } as fallback) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    return handle(body);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}

/** Back-compat: DELETE with { id } OR { bundle_id, file_url } */
export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    return handle(body);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}