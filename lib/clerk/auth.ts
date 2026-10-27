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
  try {
    const { userId } = await auth();
    if (!userId) return null;
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
      // 1. If Clerk says admin and DB doesn't, promote DB profile to admin
      if (isClerkAdmin && profile.role !== USER_ROLES.ADMIN) {
        const { data: updated } = await adminSupabase
          .from("profiles")
          .update({ role: USER_ROLES.ADMIN, updated_at: new Date().toISOString() })
          .eq("clerk_id", userId)
          .select()
          .single();
        if (updated) return updated as UserProfile;
      }
      // 2. If Clerk says NOT admin but DB still says admin, reconcile stale DB profile back to 'user'.
      // Clerk publicMetadata.role is the authority for admin identity; stale database records must never
      // retain admin privileges or reverse-promote Clerk metadata.
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
 *
 * Requires BOTH Clerk publicMetadata.role AND Supabase profiles.role to equal
 * 'admin'. Either source alone is insufficient:
 * - Clerk 'admin' + DB 'user' → false (e.g. promotion double-failure — DB not
 *   yet reconciled; access is denied until ensureUserProfile() syncs the DB).
 * - Clerk 'user' + DB 'admin' → false (e.g. revocation double-failure — stale
 *   DB record cannot restore privileges that Clerk has revoked).
 *
 * IMPORTANT: Uses a direct read-only database query — NOT ensureUserProfile()
 * or getCurrentUserProfile(). Those functions write to the DB (reconciling
 * role mismatches), and calling them here would inadvertently complete a
 * partially-failed role update as a side effect of an authorization check.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  // Clerk is the primary authority: fail-fast if Clerk does not confirm admin.
  const clerkUser = await currentUser();
  if (clerkUser?.publicMetadata?.role !== USER_ROLES.ADMIN) {
    return false;
  }

  // Require the Supabase profile to independently confirm admin.
  // Read-only: does not trigger role reconciliation or any DB write.
  const { userId } = await auth();
  if (!userId) return false;

  const adminSupabase = createAdminSupabaseClient();
  const { data } = await adminSupabase
    .from("profiles")
    .select("role")
    .eq("clerk_id", userId)
    .maybeSingle();

  return data?.role === USER_ROLES.ADMIN;
}
