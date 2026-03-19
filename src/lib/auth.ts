/**
 * JWT-based session management for GrünBilanz.
 * Uses `jose` for JWT creation/verification and stores the token in an
 * HttpOnly cookie so it is inaccessible to client-side JavaScript.
 *
 * The session contains only { sub: userId, email } — no sensitive data.
 */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

/** Cookie name used to store the session JWT */
const SESSION_COOKIE = 'gb-session';

/** Return the signing secret as a Uint8Array, throwing if it is unset */
const getSecret = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET environment variable is not set');
  return new TextEncoder().encode(secret);
};

export interface SessionUser {
  id: string;
  email: string;
}

/**
 * Sign a new 7-day JWT for the given user.
 * The returned token is stored in a cookie by the caller.
 */
export async function createSession(user: SessionUser): Promise<string> {
  return new SignJWT({ sub: user.id, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(getSecret());
}

/**
 * Verify a JWT and return the session user, or null if invalid/expired.
 */
export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || typeof payload.email !== 'string') return null;
    return { id: payload.sub, email: payload.email };
  } catch {
    // Token is invalid, expired, or the secret changed — treat as unauthenticated
    return null;
  }
}

/**
 * Read the session cookie and verify the JWT.
 * Returns the authenticated user, or null if not logged in.
 */
export async function getUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Cookie options for setting the session after login/register */
export function sessionCookieOptions(token: string) {
  // maxAge matches the JWT expiration ('7d' = 604800 seconds) so both expire together
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days — must match createSession expiration above
    path: '/',
  };
}

/** Cookie options for clearing the session on logout (maxAge=0 deletes the cookie) */
export function clearSessionCookieOptions() {
  return {
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  };
}
