/**
 * Supabase client re-exports.
 *
 * For Server Components, Server Actions, and Route Handlers:
 *   import { createServerSupabaseClient } from '@/lib/supabase/server';
 *
 * For Client Components:
 *   import { createClient } from '@/lib/supabase/client';
 *
 * This barrel file is kept for backwards compatibility but direct sub-path
 * imports are preferred to avoid bundling server-only code in the browser.
 */
export { createClient } from './supabase/client';
export { createServerSupabaseClient } from './supabase/server';
