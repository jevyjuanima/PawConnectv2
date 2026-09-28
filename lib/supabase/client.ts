import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/**
 * Browser-side Supabase client for public queries and realtime listeners.
 * Uses the publishable key (formerly anon key) — safe to expose in the browser.
 */
export function createBrowserSupabaseClient() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be defined."
    );
  }

  return createClient(supabaseUrl, supabasePublishableKey);
}
