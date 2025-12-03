// src/app/api/theme/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type ThemeKind = 'gradient' | 'solid' | 'custom-gradient' | 'custom-solid';

type ThemePayload = {
  kind: ThemeKind;
  solidColor?: string | null;
  from?: string | null;
  to?: string | null;
};

function validatePayload(body: any): { ok: boolean; message?: string } {
  const kind = body?.kind as ThemeKind | undefined;

  if (!kind) return { ok: false, message: 'Missing theme kind' };

  if (!['gradient', 'solid', 'custom-gradient', 'custom-solid'].includes(kind)) {
    return { ok: false, message: 'Invalid theme kind' };
  }

  // Solid modes need solidColor
  if ((kind === 'solid' || kind === 'custom-solid') && !body?.solidColor) {
    return { ok: false, message: 'solidColor is required for solid/custom-solid kind' };
  }

  // Gradient modes need from/to
  if ((kind === 'gradient' || kind === 'custom-gradient') && (!body?.from || !body?.to)) {
    return { ok: false, message: 'from and to are required for gradient kinds' };
  }

  return { ok: true };
}

export async function POST(req: Request) {
  const supabase = await supabaseServer();

  // Make sure user is logged in (dashboard only)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: ThemePayload;
  try {
    body = (await req.json()) as ThemePayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = validatePayload(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.message }, { status: 400 });
  }

  const { kind, solidColor, from, to } = body;

  // We keep hero_theme as a SINGLE ROW by nuking old rows then inserting the new one
  // (RLS "for all" with auth role = 'authenticated' allows this)
  const { error: deleteError } = await supabase
    .from('hero_theme')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // deletes all rows

  if (deleteError) {
    console.error('[theme] delete error:', deleteError.message);
    return NextResponse.json(
      { error: 'Failed to reset previous theme' },
      { status: 500 }
    );
  }

  const { data, error: insertError } = await supabase
    .from('hero_theme')
    .insert({
      kind,
      solid_color: solidColor ?? null,
      from_color: from ?? null,
      to_color: to ?? null,
      updated_by: user.id,
    })
    .select('id, kind, solid_color, from_color, to_color, updated_at')
    .single();

  if (insertError) {
    console.error('[theme] insert error:', insertError.message);
    return NextResponse.json(
      { error: 'Failed to apply theme' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, theme: data });
}