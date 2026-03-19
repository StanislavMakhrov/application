/**
 * Supabase client factory for GrünBilanz.
 * Uses @supabase/ssr for cookie-based session management.
 * Handles missing credentials gracefully for demo/dev mode.
 */

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** True when Supabase credentials are not configured (demo mode) */
export const isDemoMode = !SUPABASE_URL || !SUPABASE_ANON_KEY;

/**
 * Create a Supabase server client with cookie-based session support.
 * Used in Server Components and Route Handlers.
 * Returns null in demo mode (missing credentials).
 */
export async function createSupabaseServerClient() {
  if (isDemoMode) return null;

  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll called from a Server Component — cookies can't be set
          // The session is managed by the middleware/route handler instead
        }
      },
    },
  });
}

/**
 * Create a browser-side Supabase client.
 * Used only in client components (with "use client" directive).
 * Returns null in demo mode.
 */
export function createSupabaseBrowserClient() {
  if (isDemoMode) return null;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
