import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

type JsonBody = {
  label?: string;
  slug?: string;
  icon_slug?: string | null;
  sort_order?: number;
  reassignTo?: string;
};

// Basic slugify helper (same pattern as in DesignsManager)
function slugifyLabel(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// POST  -> create a new design category
export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const body = (await req.json().catch(() => ({}))) as JsonBody;

  const rawLabel = (body.label ?? '').trim();
  if (!rawLabel) {
    return NextResponse.json(
      { error: 'Label is required.' },
      { status: 400 },
    );
  }

  // Figure out slug
  let slug = (body.slug ?? '').trim() || slugifyLabel(rawLabel);

  // Load existing slugs so we can avoid collisions
  const { data: existing, error: readErr } = await supabase
    .from('design_categories')
    .select('slug,sort_order')
    .order('sort_order', { ascending: true });

  if (readErr) {
    console.error('design_categories read error', readErr);
    return NextResponse.json(
      { error: 'Unable to read existing categories.' },
      { status: 500 },
    );
  }

  const existingSlugs = new Set((existing ?? []).map((r: any) => r.slug as string));

  // If slug already exists, suffix with -2, -3, ...
  if (existingSlugs.has(slug)) {
    const base = slug;
    let i = 2;
    while (existingSlugs.has(`${base}-${i}`)) i += 1;
    slug = `${base}-${i}`;
  }

  const icon_slug =
    typeof body.icon_slug === 'string' && body.icon_slug.trim()
      ? body.icon_slug.trim()
      : null;

  const nextSortOrder =
    typeof body.sort_order === 'number' && Number.isFinite(body.sort_order)
      ? body.sort_order
      : (existing?.[existing.length - 1]?.sort_order ?? 0) + 1;

  const { data: inserted, error: insErr } = await supabase
    .from('design_categories')
    .insert({
      slug,
      label: rawLabel,
      icon_slug,
      sort_order: nextSortOrder,
      is_active: true,
    })
    .select('slug,label,icon_slug,sort_order,is_active')
    .single();

  if (insErr || !inserted) {
    console.error('design_categories insert error', insErr);
    return NextResponse.json(
      { error: 'Unable to create category.' },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      category: {
        id: inserted.slug,
        label: inserted.label,
        icon_slug: inserted.icon_slug,
        sort_order: inserted.sort_order,
        is_active: inserted.is_active,
      },
    },
    { status: 201 },
  );
}

// DELETE -> delete a category and optionally reassign designs
export async function DELETE(req: Request) {
  const supabase = await supabaseServer();
  const body = (await req.json().catch(() => ({}))) as JsonBody & {
    slug?: string;
    id?: string;
  };

  const slugRaw = (body.slug || (body as any).id || '').toString().trim();
  if (!slugRaw) {
    return NextResponse.json(
      { error: 'slug is required.' },
      { status: 400 },
    );
  }

  const slug = slugRaw;
  const reassignTo = (body.reassignTo || 'uncategorized').toString().trim();

  if (reassignTo === slug) {
    return NextResponse.json(
      { error: 'Reassign target must differ from the category being deleted.' },
      { status: 400 },
    );
  }

  // 1) Reassign designs that used this category
  const { error: reassignErr } = await supabase
    .from('print_designs')
    .update({ category_id: reassignTo || 'uncategorized' })
    .eq('category_id', slug);

  if (reassignErr) {
    console.error('design_categories reassign error', reassignErr);
    return NextResponse.json(
      { error: 'Unable to reassign designs to new category.' },
      { status: 500 },
    );
  }

  // 2) Delete the category row itself
  const { error: delErr } = await supabase
    .from('design_categories')
    .delete()
    .eq('slug', slug);

  if (delErr) {
    console.error('design_categories delete error', delErr);
    return NextResponse.json(
      { error: 'Unable to delete category.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
