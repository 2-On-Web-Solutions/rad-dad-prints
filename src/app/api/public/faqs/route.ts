import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type FaqRow = {
  id: string;
  questions: string[] | null;
  answer: string | null;
};

export async function GET() {
  const supabase = await supabaseServer();

  const [
    { data: faqs, error: faqError },
    { data: settings, error: settingsError },
  ] = await Promise.all([
    supabase
      .from('faqs')
      .select('id, questions, answer')
      .order('id', { ascending: true }),
    supabase
      .from('faq_bot_settings')
      .select('greeting')
      .eq('id', 'default')
      .maybeSingle(),
  ]);

  if (faqError || settingsError) {
    console.error('Error loading FAQ config:', faqError ?? settingsError);
    return NextResponse.json(
      { error: 'Failed to load FAQ config' },
      { status: 500 },
    );
  }

  const greeting =
    settings?.greeting ?? 'Hi! 👋 Ask me anything about our services.';

  const faqsPayload = (faqs ?? []).map((row: FaqRow) => ({
    id: row.id,
    // we don't have a separate slug column now, so just reuse id
    slug: row.id,
    questions: row.questions ?? [],
    answer: row.answer ?? '',
  }));

  return NextResponse.json({
    greeting,
    faqs: faqsPayload,
  });
}