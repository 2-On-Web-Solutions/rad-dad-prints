import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { supabaseServer } from '@/lib/supabase/server';

const COOKIE_NAME = 'rdp_session_id';

async function readSessionId(): Promise<string | null> {
  const store = await cookies();  // ✅ async
  const cookie = store.get(COOKIE_NAME);
  return cookie?.value ?? null;
}

async function writeSessionId(res: NextResponse, value: string) {
  const store = await cookies(); // ✅ async
  store.set({
    name: COOKIE_NAME,
    value,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();

  let json = {};
  try {
    json = await req.json();
  } catch {
    json = {};
  }

  const path =
    (json as any).path ||
    new URL(req.url).searchParams.get('path') ||
    '/';

  const res = NextResponse.json({ ok: true });

  // 🔹 Read or create session ID
  let sessionId = await readSessionId();

  if (!sessionId) {
    sessionId = randomUUID();
    await writeSessionId(res, sessionId);
    console.log('[analytics] new session created', { sessionId });
  }

  const userAgent = req.headers.get('user-agent') ?? null;

  const { error } = await supabase.from('analytics_sessions').insert({
    session_id: sessionId,
    path,
    user_agent: userAgent,
  });

  if (error) {
    console.error('[analytics] insert error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  console.log('[analytics] insert ok');
  return res;
}