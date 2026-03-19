import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession, sessionCookieOptions } from '@/lib/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const registerSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z
    .string()
    .min(8, 'Passwort muss mindestens 8 Zeichen haben')
    .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
    .regex(/[0-9]/, 'Passwort muss mindestens eine Zahl enthalten'),
});

/** POST /api/auth/register — create a new user account */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Ungültige Eingabe' },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json(
      { error: 'Diese E-Mail-Adresse ist bereits registriert.' },
      { status: 409 }
    );
  }

  // bcrypt cost factor 12 — good balance of security and latency (~300 ms)
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({ data: { email: parsed.data.email, passwordHash } });

  const token = await createSession({ id: user.id, email: user.email });
  const response = NextResponse.json({ user: user.email, success: true });
  response.cookies.set(sessionCookieOptions(token));
  return response;
}
