// src/app/api/public/hero-media/route.ts
import { NextResponse } from 'next/server';
import { fetchHeroMediaConfig, FALLBACK_HERO_MEDIA } from '@/lib/heroMedia';

export async function GET() {
  try {
    const config = await fetchHeroMediaConfig();
    return NextResponse.json(config, { status: 200 });
  } catch (err) {
    console.error('Error fetching hero media for public site:', err);
    // Worst-case: send the hard-coded fallback
    return NextResponse.json(FALLBACK_HERO_MEDIA, { status: 200 });
  }
}