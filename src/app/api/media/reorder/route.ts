// src/app/api/media/reorder/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

type SortPayloadItem = {
  id: string;
  sort_order: number;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { items?: SortPayloadItem[] }
      | null;

    if (!body || !Array.isArray(body.items)) {
      return NextResponse.json(
        {
          error:
            'Invalid payload: expected { items: [{ id, sort_order }] }',
        },
        { status: 400 }
      );
    }

    const supabase = await supabaseServer();
    const items = body.items as SortPayloadItem[];

    // Just UPDATE existing rows; no upsert / inserts.
    for (const item of items) {
      if (!item.id) continue;

      const { error } = await supabase
        .from('media_assets')
        .update({ sort_order: item.sort_order ?? 0 })
        .eq('id', item.id);

      if (error) {
        console.error('Reorder API: update error', { item, error });
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Reorder API: unexpected error', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}