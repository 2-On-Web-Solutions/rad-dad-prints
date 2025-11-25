import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await supabaseServer();
    const body = await req.json();

    const {
      instagram_url,
      instagram_followers,
      facebook_url,
      facebook_followers,
      x_url,
      x_followers,
    } = body ?? {};

    // Upsert a single row in site_settings.
    // Adjust `id: 1` if your table uses a different PK / structure.
    const { error } = await supabase
      .from('site_settings')
      .upsert(
        {
          id: 1,
          instagram_url: instagram_url ?? null,
          instagram_followers:
            typeof instagram_followers === 'number'
              ? instagram_followers
              : instagram_followers
              ? Number(instagram_followers)
              : null,
          facebook_url: facebook_url ?? null,
          facebook_followers:
            typeof facebook_followers === 'number'
              ? facebook_followers
              : facebook_followers
              ? Number(facebook_followers)
              : null,
          x_url: x_url ?? null,
          x_followers:
            typeof x_followers === 'number'
              ? x_followers
              : x_followers
              ? Number(x_followers)
              : null,
          social_updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' } as any // helps TS; Supabase runtime will understand
      );

    if (error) {
      console.error('Error saving social settings:', error);
      return NextResponse.json(
        { ok: false, message: 'Failed to save social settings' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Unexpected error in social-reach route:', err);
    return NextResponse.json(
      { ok: false, message: 'Unexpected error' },
      { status: 500 },
    );
  }
}