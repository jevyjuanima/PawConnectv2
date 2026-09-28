import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

/**
 * Privileged Supabase Admin client for background tasks, cron jobs, webhooks,
 * and trusted server-side role elevation (e.g. syncing admin role from Clerk metadata).
 *
 * Uses SUPABASE_SECRET_KEY (formerly service_role key) — bypasses RLS entirely.
 * NEVER import or use this client in Client Components or expose it to the browser.
 */
export function createAdminSupabaseClient() {
  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      "Missing Supabase admin environment variables: SUPABASE_SECRET_KEY is required for admin operations."
    );
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
