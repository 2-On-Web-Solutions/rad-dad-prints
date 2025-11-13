// src/app/api/bundles/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const BUCKET = 'bundles';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

type ImgRow = { storage_path?: string | null; image_url?: string | null };
type FileRow = { storage_path?: string | null; file_url?: string | null };

function parseStorageFromPublicUrl(url: string | null | undefined) {
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

async function handle(body: any) {
  const id = (body?.id ?? '').trim();
  const deleteAssets = !!body?.deleteAssets;
  const thumb_storage_path: string | undefined = body?.thumb_storage_path;

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  // 1) (Optional) collect storage paths for purge
  const storagePaths: string[] = [];
  let otherBucketsAndPaths: Array<{ bucket: string; path: string }> = [];

  if (deleteAssets) {
    const [imgs, files] = await Promise.all([
      admin.from('bundle_images')
           .select('storage_path,image_url')
           .eq('bundle_id', id),
      admin.from('bundle_files')
           .select('storage_path,file_url')
           .eq('bundle_id', id),
    ]);

    if (!imgs.error && Array.isArray(imgs.data)) {
      for (const r of imgs.data as ImgRow[]) {
        if (r.storage_path) {
          storagePaths.push(r.storage_path);
        } else {
          const parsed = parseStorageFromPublicUrl(r.image_url ?? null);
          if (parsed) {
            if (parsed.bucket === BUCKET) storagePaths.push(parsed.path);
            else otherBucketsAndPaths.push({ bucket: parsed.bucket, path: parsed.path });
          }
        }
      }
    }

    if (!files.error && Array.isArray(files.data)) {
      for (const r of files.data as FileRow[]) {
        if (r.storage_path) {
          storagePaths.push(r.storage_path);
        } else {
          const parsed = parseStorageFromPublicUrl(r.file_url ?? null);
          if (parsed) {
            if (parsed.bucket === BUCKET) storagePaths.push(parsed.path);
            else otherBucketsAndPaths.push({ bucket: parsed.bucket, path: parsed.path });
          }
        }
      }
    }

    if (thumb_storage_path) {
      storagePaths.push(thumb_storage_path);
    }
  }

  // 2) Delete children first
  await admin.from('bundle_images').delete().eq('bundle_id', id);
  await admin.from('bundle_files').delete().eq('bundle_id', id);

  // 3) Delete the parent row
  const { error: rowError } = await admin.from('bundles').delete().eq('id', id);
  if (rowError) {
    console.error('[bundles/delete] rowError', rowError);
    return NextResponse.json(
      { error: 'Failed to delete bundle', details: rowError.message },
      { status: 500 }
    );
  }

  // 4) Best-effort storage cleanup (same-bucket first, then other buckets if any)
  if (deleteAssets) {
    if (storagePaths.length) {
      const { error: storageError } = await admin.storage
        .from(BUCKET)
        .remove(storagePaths);
      if (storageError) {
        console.warn('[bundles/delete] storage removal warning (same-bucket):', storageError.message);
      }
    }

    // Clean up any objects that resolve to non-default buckets (rare but supported)
    if (otherBucketsAndPaths.length) {
      const grouped = otherBucketsAndPaths.reduce<Record<string, string[]>>((acc, cur) => {
        (acc[cur.bucket] ||= []).push(cur.path);
        return acc;
      }, {});
      for (const [bucket, paths] of Object.entries(grouped)) {
        const { error } = await admin.storage.from(bucket).remove(paths);
        if (error) {
          console.warn(`[bundles/delete] storage removal warning (${bucket}):`, error.message);
        }
      }
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

// Current usage: DELETE with JSON body
export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    return handle(body);
  } catch (err: any) {
    console.error('[bundles/delete] crash', err);
    return NextResponse.json(
      { error: 'Server error while deleting bundle', details: String(err) },
      { status: 500 }
    );
  }
}

// Optional convenience: POST with same body (useful from forms or fetch POST)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    return handle(body);
  } catch (err: any) {
    console.error('[bundles/delete POST] crash', err);
    return NextResponse.json(
      { error: 'Server error while deleting bundle', details: String(err) },
      { status: 500 }
    );
  }
}