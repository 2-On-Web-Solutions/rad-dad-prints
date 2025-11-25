// src/app/api/voice-note/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

const VOICE_NOTE_API_KEY = (process.env.VOICE_NOTE_API_KEY ?? '').trim();
const VOICE_NOTE_USER_ID = (process.env.VOICE_NOTE_USER_ID ?? '').trim();

export async function POST(req: Request) {
  // Validate envs
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

  // Build date YYYY-MM-DD
  const now = new Date();
  const dateKey = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');

  const supabase = await supabaseServer();

  const { data, error } = await supabase
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