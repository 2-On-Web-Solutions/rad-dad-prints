// src/lib/heroMedia.ts
import { supabaseServer } from '@/lib/supabase/server';

export type MediaKind = 'video' | 'image';

export type HeroMediaConfig = {
  mainKind: MediaKind;
  mainSrc: string;
  mainLabel: string;
  sideKind: MediaKind;
  sideSrc: string;
  sideLabel: string;
};

// DB row shapes (just what we select)
type HeroMediaItemRow = {
  id: string;
  slot: 'main' | 'side';
  label: string;
  kind: MediaKind;
  storage_path: string | null;
  is_default: boolean | null;
};

type HeroMediaConfigRow = {
  selected_main: string | null;
  selected_side: string | null;
  updated_at?: string | null;
};

// 🔹 EXPORT this so the API route can import it
export const FALLBACK_HERO_MEDIA: HeroMediaConfig = {
  mainKind: 'video',
  mainSrc: '/assets/videos/rad-dad-prints-video02.mp4',
  mainLabel: 'Runway hero video',
  sideKind: 'image',
  sideSrc: '/assets/rad-dad-prints.png',
  sideLabel: 'Rad Dad logo loop',
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Same helper we used in the admin component
function buildPublicSrc(storagePath?: string | null): string | null {
  if (!storagePath || !SUPABASE_URL) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/site-hero-media/${storagePath}`;
}

export async function fetchHeroMediaConfig(): Promise<HeroMediaConfig> {
  const supabase = await supabaseServer();

  // 1) Load all hero media items
  const { data: rawItems, error: itemsError } = await supabase
    .from('hero_media_items')
    .select('id, slot, label, kind, storage_path, is_default');

  const items = (rawItems ?? []) as HeroMediaItemRow[];

  if (itemsError || items.length === 0) {
    console.error('hero_media_items error or empty, using fallback:', itemsError);
    return FALLBACK_HERO_MEDIA;
  }

  // 2) Load the *latest* config row
  const { data: configRows, error: configError } = await supabase
    .from('hero_media_config')
    .select('selected_main, selected_side, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (configError) {
    console.error('hero_media_config error, using defaults:', configError);
  }

  const config = (configRows?.[0] ?? null) as HeroMediaConfigRow | null;

  const pickForSlot = (slot: 'main' | 'side'): HeroMediaItemRow | undefined => {
    const selectedId =
      slot === 'main' ? config?.selected_main ?? null : config?.selected_side ?? null;

    // 1st: exact selected id for that slot
    const fromConfig = items.find(
      (item) => item.id === selectedId && item.slot === slot,
    );
    if (fromConfig) return fromConfig;

    // 2nd: default item for that slot
    const def = items.find(
      (item) => item.slot === slot && item.is_default === true,
    );
    if (def) return def;

    // 3rd: anything with that slot (should basically never happen)
    return items.find((item) => item.slot === slot);
  };

  const main = pickForSlot('main');
  const side = pickForSlot('side');

  if (!main || !side) {
    console.warn('Missing main/side hero items, using fallback');
    return FALLBACK_HERO_MEDIA;
  }

  const mainSrc = buildPublicSrc(main.storage_path) ?? FALLBACK_HERO_MEDIA.mainSrc;
  const sideSrc = buildPublicSrc(side.storage_path) ?? FALLBACK_HERO_MEDIA.sideSrc;

  return {
    mainKind: main.kind,
    mainSrc,
    mainLabel: main.label,
    sideKind: side.kind,
    sideSrc,
    sideLabel: side.label,
  };
}