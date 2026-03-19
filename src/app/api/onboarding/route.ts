import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, isDemoMode } from '@/lib/supabase';
import { upsertCompany } from '@/services/companies';
import { z } from 'zod';
import { BRANCHEN } from '@/types';

const onboardingSchema = z.object({
  name: z.string().min(2, 'Firmenname muss mindestens 2 Zeichen haben').max(100),
  branche: z.enum(BRANCHEN as [string, ...string[]]),
  mitarbeiter: z.number().int().min(1, 'Mindestens 1 Mitarbeiter').max(10000),
  standort: z.string().min(2, 'Standort muss mindestens 2 Zeichen haben').max(100),
});

/** POST /api/onboarding — save or update company profile */
export async function POST(request: NextRequest) {
  if (isDemoMode) {
    return NextResponse.json({ success: true, demo: true });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Datenbankverbindung nicht verfügbar' }, { status: 503 });
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = onboardingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Ungültige Eingabe' },
      { status: 400 }
    );
  }

  const company = await upsertCompany(supabase, {
    user_id: session.user.id,
    ...parsed.data,
    branche: parsed.data.branche as import('@/types').Branche,
  });

  return NextResponse.json({ company, success: true });
}
