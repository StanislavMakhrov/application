import { NextResponse } from 'next/server';
import { clearSessionCookieOptions } from '@/lib/auth';

/** POST /api/auth/logout — clear the session cookie */
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(clearSessionCookieOptions());
  return response;
}
