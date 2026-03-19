/**
 * Auth middleware for GrünBilanz.
 *
 * Protects dashboard routes by verifying the Supabase JWT from the session cookie.
 * Unauthenticated requests to protected paths are redirected to /login.
 *
 * Gracefully handles missing env vars (build-time or misconfiguration) by
 * allowing the request through rather than crashing — the page itself will
 * handle auth state on the client side.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/** Routes that require an authenticated session */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/onboarding',
  '/energy',
  '/results',
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Allow request through if env vars are missing (avoids crashes in build/test envs)
  if (!supabaseUrl || !supabaseAnonKey ||
      supabaseUrl === 'https://placeholder.supabase.co') {
    return NextResponse.next();
  }

  // Extract the Supabase auth token from cookies
  const accessToken = request.cookies.get('sb-access-token')?.value
    ?? request.cookies.get('supabase-auth-token')?.value;

  if (!accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
  } catch {
    // On any unexpected error, redirect to login rather than crashing
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/energy/:path*',
    '/results/:path*',
  ],
};
