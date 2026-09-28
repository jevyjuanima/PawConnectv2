import { auth, currentUser } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { USER_ROLES, type UserRole } from "@/lib/constants/statuses";

export interface UserProfile {
  id: string;
  clerk_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
}

/**
 * Ensures the authenticated user's profile is synchronized to the Supabase profiles table.
 *
 * Uses the admin client (SUPABASE_SECRET_KEY) exclusively for all profile read/write operations.
 * This is correct and secure because:
 * 1. This function only runs in Server Components / Server Actions — never in the browser.
 * 2. Identity is verified by Clerk server-side (auth().userId) before any DB operation.
 * 3. It avoids depending on Supabase Third-Party Auth JWT verification being configured,
 *    making profile sync reliable from the first sign-in.
 * 4. RLS is enforced at the row level for all user-facing queries; this sync function
 *    is an internal trusted server operation (equivalent to a webhook handler).
 */
export async function ensureUserProfile(): Promise<UserProfile | null> {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    // Always use admin client for profile sync — server-only, identity pre-verified by Clerk
    const adminSupabase = createAdminSupabaseClient();

    // Check if profile already exists
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("*")
      .eq("clerk_id", userId)
      .maybeSingle();

    const clerkUser = await currentUser();
    if (!clerkUser) return profile as UserProfile | null;

    const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
    const firstName = clerkUser.firstName ?? null;
    const lastName = clerkUser.lastName ?? null;
    const phone = clerkUser.phoneNumbers[0]?.phoneNumber ?? null;
    const avatarUrl = clerkUser.imageUrl ?? null;
    const isClerkAdmin = clerkUser.publicMetadata?.role === "admin";
    const assignedRole = isClerkAdmin ? USER_ROLES.ADMIN : USER_ROLES.USER;

    if (profile) {
      // Profile exists — sync role if Clerk metadata changed
      if (isClerkAdmin && profile.role !== USER_ROLES.ADMIN) {
        const { data: updated } = await adminSupabase
          .from("profiles")
          .update({ role: USER_ROLES.ADMIN, updated_at: new Date().toISOString() })
          .eq("clerk_id", userId)
          .select()
          .single();
        if (updated) return updated as UserProfile;
      }
      // Also sync back if somehow role is admin in DB but not in Clerk
      if (!isClerkAdmin && profile.role === USER_ROLES.ADMIN) {
        const { data: updated } = await adminSupabase
          .from("profiles")
          .update({ role: USER_ROLES.USER, updated_at: new Date().toISOString() })
          .eq("clerk_id", userId)
          .select()
          .single();
        if (updated) return updated as UserProfile;
      }
      return profile as UserProfile;
    }

    // Profile missing — create it (upsert for safety against race conditions)
    const { data: newProfile, error: insertError } = await adminSupabase
      .from("profiles")
      .upsert(
        {
          clerk_id: userId,
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          role: assignedRole,
          avatar_url: avatarUrl,
        },
        { onConflict: "clerk_id" }
      )
      .select()
      .single();

    if (insertError) {
      console.error("Failed to upsert profile in Supabase:", insertError.message);
      // Return a synthetic profile so the app doesn't crash
      return {
        id: "",
        clerk_id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        role: assignedRole,
        avatar_url: avatarUrl,
      };
    }

    return newProfile as UserProfile;
  } catch (err) {
    console.error("Error in ensureUserProfile:", err);
    return null;
  }
}

/**
 * Retrieves the current authenticated user's profile and database role.
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  return ensureUserProfile();
}

/**
 * Checks if the current requesting session has the admin role.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  return profile?.role === USER_ROLES.ADMIN;
}
