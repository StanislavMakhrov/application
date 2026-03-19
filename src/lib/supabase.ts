/**
 * Supabase client factory for GrünBilanz.
 *
 * We use a single shared client instance to avoid multiple GoTrue auth
 * instances, which can cause token refresh conflicts in Next.js.
 *
 * Gracefully handles missing env vars at build time (Docker build uses
 * placeholder values; real values are injected at runtime via environment).
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// These are set to placeholder values during Docker build to allow `next build`
// to succeed without a real Supabase project. At runtime, real values are required.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder';

/**
 * Shared Supabase client — use this for all browser and server component calls.
 * For server-side auth checks (middleware), use `createServerSupabaseClient` below.
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Create a fresh Supabase client for server-side use.
 * Useful in server components / API routes where you need isolation per request.
 */
export function createServerSupabaseClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey);
}
