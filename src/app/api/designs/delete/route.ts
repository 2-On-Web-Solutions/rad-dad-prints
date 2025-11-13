import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

export async function DELETE(req: Request) {
  try {
    // we expect { id, thumb_storage_path } in body
    const { id, thumb_storage_path } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id' },
        { status: 400 }
      );
    }

    // delete row first
    const { error: rowError } = await admin
      .from('print_designs')
      .delete()
      .eq('id', id);

    if (rowError) {
      console.error('[designs/delete rowError]', rowError);
      return NextResponse.json(
        { error: 'Failed to delete row', details: rowError.message },
        { status: 500 }
      );
    }

    // try to delete thumbnail file from bucket
    if (thumb_storage_path) {
      const { error: storageError } = await admin.storage
        .from('print-designs')
        .remove([thumb_storage_path]);

      if (storageError) {
        // non-fatal: row is gone so don't 500
        console.warn(
          '[designs/delete] storage removal failed but row deleted:',
          storageError
        );
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error('[designs/delete] crash', err);
    return NextResponse.json(
      {
        error: 'Server error while deleting design',
        details: String(err),
      },
      { status: 500 }
    );
  }
}