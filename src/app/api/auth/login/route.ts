import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, isDemoMode } from '@/lib/supabase';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen haben'),
});

/** POST /api/auth/login — authenticate user with Supabase */
export async function POST(request: NextRequest) {
  if (isDemoMode) {
    return NextResponse.json(
      { error: 'Demo-Modus: Keine Supabase-Zugangsdaten konfiguriert.' },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Ungültige Eingabe' },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Datenbankverbindung nicht verfügbar' }, { status: 503 });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return NextResponse.json(
      { error: 'E-Mail oder Passwort ist falsch.' },
      { status: 401 }
    );
  }

  return NextResponse.json({ user: data.user?.email, success: true });
}
