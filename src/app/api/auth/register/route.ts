import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, isDemoMode } from '@/lib/supabase';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z
    .string()
    .min(8, 'Passwort muss mindestens 8 Zeichen haben')
    .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
    .regex(/[0-9]/, 'Passwort muss mindestens eine Zahl enthalten'),
});

/** POST /api/auth/register — create a new Supabase user */
export async function POST(request: NextRequest) {
  if (isDemoMode) {
    return NextResponse.json(
      { error: 'Demo-Modus: Keine Supabase-Zugangsdaten konfiguriert.' },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const parsed = registerSchema.safeParse(body);

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

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ user: data.user?.email, success: true });
}
