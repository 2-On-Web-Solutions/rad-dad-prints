// /src/app/api/admin/hero-media/overview/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await supabaseServer();

  // 1) Load items
  const { data: items, error: itemsError } = await supabase
    .from('hero_media_items')
    .select('*')
    .order('slot', { ascending: true });

  if (itemsError) {
    console.error('hero_media_items error', itemsError);
    return NextResponse.json(
      { error: 'Failed to load hero media items' },
      { status: 500 },
    );
  }

  // 2) Load latest config row (what is currently selected)
  const { data: config, error: configError } = await supabase
    .from('hero_media_config')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (configError) {
    console.error('hero_media_config error', configError);
  }

  // 3) Attach public URLs for each storage_path
  const itemsWithUrls =
    items?.map((item) => {
      let publicUrl: string | null = null;

      if (item.storage_path) {
        const { data } = supabase
          .storage
          .from('site-hero-media')
          .getPublicUrl(item.storage_path);

        publicUrl = data.publicUrl ?? null;
      }

      return {
        ...item,
        public_url: publicUrl,
      };
    }) ?? [];

  return NextResponse.json({
    items: itemsWithUrls,
    config: config ?? null,
  });
}