/**
 * Supabase client for use in browser/client components.
 *
 * Uses @supabase/ssr createBrowserClient which manages cookies automatically.
 * Import this in Client Components ("use client") only.
 */
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
