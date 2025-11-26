// src/app/api/voice-note/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// If you have a generated Database type, you can import and use it here
// import type { Database } from '@/lib/supabase/types';

const VOICE_NOTE_API_KEY = (process.env.VOICE_NOTE_API_KEY ?? '').trim();
const VOICE_NOTE_USER_ID = (process.env.VOICE_NOTE_USER_ID ?? '').trim();

// 🚨 IMPORTANT: service role key – server-side ONLY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client bypasses RLS
const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
  // If you have a Database type:
  // <Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
);

export async function POST(req: Request) {
  if (!VOICE_NOTE_API_KEY || !VOICE_NOTE_USER_ID) {
    console.error('Voice note env vars missing', {
      hasKey: !!VOICE_NOTE_API_KEY,
      hasUser: !!VOICE_NOTE_USER_ID,
    });
    return NextResponse.json(
      { ok: false, error: 'Server is missing voice-note env vars' },
      { status: 500 },
    );
  }

  const headerKey = (req.headers.get('x-voice-note-key') ?? '').trim();

  if (!headerKey || headerKey !== VOICE_NOTE_API_KEY) {
    return NextResponse.json(
      { ok: false, error: 'Invalid voice-note key' },
      { status: 401 },
    );
  }

  const body = await req.json().catch(() => null);
  const text = body?.text?.trim?.();

  if (!text) {
    return NextResponse.json(
      { ok: false, error: 'Missing "text" in body' },
      { status: 400 },
    );
  }

  // Build date YYYY-MM-DD in Halifax time
  const now = new Date();
  const dateKey = now.toLocaleDateString('en-CA', {
    timeZone: 'America/Halifax',
  });

  // 👇 use admin client so RLS is ignored
  const { data, error } = await supabaseAdmin
    .from('dashboard_notes')
    .insert({
      user_id: VOICE_NOTE_USER_ID,
      note_date: dateKey,
      content: text,
      source: 'voice',
      folder_slug: null,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error inserting voice note', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to save note' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, saved: data });
}