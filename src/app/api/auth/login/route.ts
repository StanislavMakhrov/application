import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession, sessionCookieOptions } from '@/lib/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen haben'),
});

/** POST /api/auth/login — authenticate user with email + password */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Ungültige Eingabe' },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // Always call bcrypt.compare to prevent timing-based user enumeration:
  // if user is null we compare against a dummy hash so the response time is
  // indistinguishable from a real (wrong-password) attempt.
  // The dummy hash is a valid bcrypt hash of a random string (never matches any real password).
  const DUMMY_HASH = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtGJ36dCPDe6jalmc8B8o5lTuSIu';
  const isValid = await bcrypt.compare(
    parsed.data.password,
    user?.passwordHash ?? DUMMY_HASH
  );

  if (!user || !isValid) {
    return NextResponse.json({ error: 'E-Mail oder Passwort ist falsch.' }, { status: 401 });
  }

  const token = await createSession({ id: user.id, email: user.email });
  const response = NextResponse.json({ user: user.email, success: true });
  response.cookies.set(sessionCookieOptions(token));
  return response;
}
