import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

type SavePayload = {
  // we’ll accept a few naming styles to keep the client flexible
  selected_main_id?: string | null;
  selected_side_id?: string | null;
  mainId?: string | null;
  sideId?: string | null;
};

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();

    // Make sure there is a logged-in user (owner / admin)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('hero-media/save auth error:', authError.message);
      return NextResponse.json(
        { error: 'Auth error' },
        { status: 401 },
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 },
      );
    }

    const body = (await req.json()) as SavePayload;

    const mainId =
      body.selected_main_id ?? body.mainId ?? null;
    const sideId =
      body.selected_side_id ?? body.sideId ?? null;

    if (mainId !== null && typeof mainId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid mainId' },
        { status: 400 },
      );
    }
    if (sideId !== null && typeof sideId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid sideId' },
        { status: 400 },
      );
    }

    // 1) Find the singleton config row (we only expect one)
    const { data: existing, error: fetchError } = await supabase
      .from('hero_media_config')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('hero-media/save fetchError:', fetchError.message);
      return NextResponse.json(
        { error: 'Failed to read config row' },
        { status: 500 },
      );
    }

    const payload = {
      selected_main: mainId,
      selected_side: sideId,
      updated_at: new Date().toISOString(),
    };

    let result;

    if (existing) {
      // 2a) Update the existing config row
      const { data, error } = await supabase
        .from('hero_media_config')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('hero-media/save update error:', error.message);
        return NextResponse.json(
          { error: 'Failed to update hero media config' },
          { status: 500 },
        );
      }

      result = data;
    } else {
      // 2b) If somehow no row exists, create one
      const { data, error } = await supabase
        .from('hero_media_config')
        .insert(payload)
        .select()
        .maybeSingle();

      if (error) {
        console.error('hero-media/save insert error:', error.message);
        return NextResponse.json(
          { error: 'Failed to create hero media config' },
          { status: 500 },
        );
      }

      result = data;
    }

    return NextResponse.json(
      {
        ok: true,
        config: result,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('hero-media/save unexpected error:', err);
    return NextResponse.json(
      { error: 'Unexpected error' },
      { status: 500 },
    );
  }
}