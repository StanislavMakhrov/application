/**
 * Supabase client for use in Server Components, Server Actions, and Route Handlers.
 *
 * Uses @supabase/ssr createServerClient which reads/writes cookies via the
 * Next.js `cookies()` API. The setAll implementation uses a try/catch because
 * Server Components cannot set cookies — only Route Handlers and Server Actions can.
 */
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll is called in Server Components where cookies are read-only.
            // The error is intentionally swallowed — auth state remains valid
            // because the middleware refreshes sessions before each request.
          }
        },
      },
    },
  );
}
