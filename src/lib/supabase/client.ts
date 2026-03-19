/**
 * Supabase browser client.
 *
 * Safe to import in Client Components. Uses the public anon key and stores
 * the session in the browser's cookie jar via @supabase/ssr.
 */
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
