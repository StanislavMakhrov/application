/**
 * Next.js middleware — authentication guard for protected routes.
 *
 * Runs on every request matched by the `config.matcher` below.
 * Unauthenticated users are redirected to /login; authenticated users
 * who visit /login or /register are redirected to /dashboard (/energy).
 *
 * Uses @supabase/ssr to refresh the Supabase session on every request
 * so that session tokens stay valid across page navigations.
 */
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Routes that require an authenticated session */
const PROTECTED_PATHS = ['/onboarding', '/energy', '/results', '/reports'];

/** Routes that should redirect authenticated users to the dashboard */
const AUTH_PATHS = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Create a Supabase client that can read/write cookies in the middleware context.
  // The response object is mutated so that refreshed session cookies are forwarded.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() refreshes the session if the access token is expired.
  // Using getUser() (not getSession()) so the token is validated server-side.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    // Redirect unauthenticated users to login, preserving the intended destination
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && user) {
    // Authenticated users don't need to see login/register again
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/energy';
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except Next.js internals and static assets.
     * This ensures the middleware runs for every page/API route.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
