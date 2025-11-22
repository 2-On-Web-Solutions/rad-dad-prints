// src/app/api/media/update/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function PATCH(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { id?: string; caption?: string; tags?: string[] }
      | null;

    if (!body || !body.id) {
      return NextResponse.json(
        { error: 'Invalid payload: missing id' },
        { status: 400 }
      );
    }

    const { id, caption, tags } = body;

    const supabase = await supabaseServer();

    const { error } = await supabase
      .from('media_assets')
      .update({
        caption: caption ?? '',
        tags: tags ?? [],
      })
      .eq('id', id);

    if (error) {
      console.error('Media update API: error', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Media update API: unexpected error', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}