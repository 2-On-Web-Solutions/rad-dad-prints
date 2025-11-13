// /src/app/api/media/delete/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This MUST run server-side only.
// We use the service role key so we can bypass RLS safely.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // <-- make sure this is in .env.local (NEVER expose to client)

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
  },
});

export async function DELETE(req: Request) {
  try {
    const { id, storage_path } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required "id"' },
        { status: 400 }
      );
    }

    // 1. Delete DB row
    const { error: rowError } = await supabaseAdmin
      .from('media_assets')
      .delete()
      .eq('id', id);

    if (rowError) {
      console.error('Error deleting media_assets row:', rowError);
      return NextResponse.json(
        { error: 'Failed to delete row', details: rowError.message },
        { status: 500 }
      );
    }

    // 2. Delete file from Storage (optional but ideal)
    // Only attempt if we were given a storage_path like "uploads/some-file.png"
    if (storage_path) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('media') // <-- your bucket name
        .remove([storage_path]);

      if (storageError) {
        console.warn(
          'Row deleted but failed to delete file from storage:',
          storageError
        );
        // We do NOT fail the whole request for this. We just warn.
      }
    }

    return NextResponse.json(
      { ok: true },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('DELETE /api/media/delete crashed:', err);
    return NextResponse.json(
      { error: 'Server error while deleting media item' },
      { status: 500 }
    );
  }
}