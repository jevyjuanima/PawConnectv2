import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/**
 * Server-side Supabase client for Server Components and Server Actions.
 *
 * Uses the official Supabase Third-Party Auth pattern with the `accessToken`
 * callback option (supported in @supabase/supabase-js v2.x). Supabase calls
 * this function before every request to get the current Clerk session JWT,
 * which is forwarded to PostgREST/Storage as a trusted third-party token.
 *
 * This resolves the "alg Header Parameter value not allowed" error that occurs
 * when the old Authorization-header approach causes PostgREST to attempt
 * HS256 verification of a Clerk RS256-signed token.
 *
 * Requires Clerk to be registered as a Third-Party Auth provider in the
 * Supabase Dashboard: Authentication → Providers → Third Party Auth → Clerk.
 *
 * References:
 *  - https://supabase.com/docs/guides/auth/third-party/clerk
 *  - https://clerk.com/docs/integrations/databases/supabase
 */
export async function createServerSupabaseClient() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be defined."
    );
  }

  const authObject = await auth();

  return createClient(supabaseUrl, supabasePublishableKey, {
    accessToken: async () => {
      // Returns the Clerk session JWT (RS256, signed by Clerk JWKS).
      // Supabase Third-Party Auth trusts this token via the configured Clerk issuer/JWKS
      // endpoint — no algorithm mismatch occurs since Supabase never re-verifies it
      // against its own HS256 JWT secret.
      return authObject.getToken();
    },
    auth: {
      persistSession: false,
    },
  });
}
