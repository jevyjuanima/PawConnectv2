import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/**
 * Server-side Supabase client for Server Components and Server Actions.
 * Injects the authenticated Clerk JWT session token so PostgreSQL RLS policies
 * evaluate auth.jwt() ->> 'sub' properly (native Clerk Third-Party Auth integration).
 *
 * Uses NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY — the public key used for client connections,
 * with auth overridden per-request via the Clerk Bearer token in the Authorization header.
 */
export async function createServerSupabaseClient() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be defined."
    );
  }

  const { getToken } = await auth();
  // Native Clerk Third-Party Auth integration: uses the standard Clerk session token
  // NO template parameter — this is the current, non-deprecated approach.
  const token = await getToken();

  return createClient(supabaseUrl, supabasePublishableKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
    auth: {
      persistSession: false,
    },
  });
}
