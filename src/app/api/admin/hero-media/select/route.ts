import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

type HeroSlot = 'main' | 'side';

type Body = {
  slot?: HeroSlot;
  itemId?: string;
};

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();

    // Only logged-in dashboard users can change this
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as Body | null;

    if (!body?.slot || !body.itemId) {
      return NextResponse.json(
        { error: 'slot and itemId are required' },
        { status: 400 },
      );
    }

    // 1) Make sure the selected item exists and matches the slot
    const { data: item, error: itemError } = await supabase
      .from('hero_media_items')
      .select('id, slot')
      .eq('id', body.itemId)
      .single();

    if (itemError || !item || item.slot !== body.slot) {
      return NextResponse.json(
        { error: 'Invalid hero media selection' },
        { status: 400 },
      );
    }

    // 2) Load the latest config row (if any)
    const {
      data: existing,
      error: configError,
    } = await supabase
      .from('hero_media_config')
      .select('id, selected_main, selected_side')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (configError) {
      console.error('hero_media_config fetch error', configError);
      return NextResponse.json(
        { error: 'Failed to load hero media config' },
        { status: 500 },
      );
    }

    // 3) Build the new values, keeping the "other" slot from the existing row
    const newSelectedMain =
      body.slot === 'main'
        ? body.itemId
        : existing?.selected_main ?? null;

    const newSelectedSide =
      body.slot === 'side'
        ? body.itemId
        : existing?.selected_side ?? null;

    const now = new Date().toISOString();

    let result;

    if (existing?.id) {
      // Update the single existing config row
      const { data, error } = await supabase
        .from('hero_media_config')
        .update({
          selected_main: newSelectedMain,
          selected_side: newSelectedSide,
          updated_at: now,
        })
        .eq('id', existing.id)
        .select('id, selected_main, selected_side, updated_at')
        .maybeSingle();

      if (error) {
        console.error('hero_media_config update error', error);
        return NextResponse.json(
          { error: 'Failed to update hero media config' },
          { status: 500 },
        );
      }

      result = data;
    } else {
      // No row yet – insert one
      const { data, error } = await supabase
        .from('hero_media_config')
        .insert({
          selected_main: newSelectedMain,
          selected_side: newSelectedSide,
        })
        .select('id, selected_main, selected_side, updated_at')
        .maybeSingle();

      if (error) {
        console.error('hero_media_config insert error', error);
        return NextResponse.json(
          { error: 'Failed to create hero media config' },
          { status: 500 },
        );
      }

      result = data;
    }

    return NextResponse.json({ ok: true, config: result });
  } catch (err) {
    console.error('hero-media/select unexpected error', err);
    return NextResponse.json(
      { error: 'Unexpected error' },
      { status: 500 },
    );
  }
}