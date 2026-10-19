import { USER_ROLES, type UserRole } from "../constants/statuses.ts";

export interface RoleSyncDependencies {
  callerUserId: string | null;
  isCallerAdmin: boolean;
  getTargetProfileRole: (clerkId: string) => Promise<{ role: UserRole } | null>;
  updateClerkRole: (clerkId: string, role: UserRole) => Promise<void>;
  updateDbRole: (clerkId: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
}

export interface RoleUpdateResult {
  success: boolean;
  error?: string;
  rollbackAttempted?: boolean;
  rollbackSucceeded?: boolean;
}

/**
 * Validates and executes a role update across Clerk authentication metadata
 * and the Supabase profiles database table with rollback on partial failure.
 */
export async function performRoleUpdate(
  targetClerkId: string,
  role: unknown,
  deps: RoleSyncDependencies
): Promise<RoleUpdateResult> {
  // 1. Validate role input strictly to allowed roles ('admin' and 'user')
  if (role !== USER_ROLES.ADMIN && role !== USER_ROLES.USER) {
    return {
      success: false,
      error: "Invalid role specified. Only 'admin' and 'user' roles are supported.",
    };
  }

  // 2. Validate targetClerkId
  if (!targetClerkId || typeof targetClerkId !== "string" || !targetClerkId.trim()) {
    return { success: false, error: "Target user ID is required" };
  }

  // 3. Authentication check
  if (!deps.callerUserId) {
    return { success: false, error: "Authentication required" };
  }

  // 4. Authorization check (admin privilege only)
  if (!deps.isCallerAdmin) {
    return { success: false, error: "Administrative privileges required" };
  }

  // 5. Prevent self-demotion
  if (deps.callerUserId === targetClerkId && role !== USER_ROLES.ADMIN) {
    return { success: false, error: "You cannot revoke your own administrator privileges" };
  }

  // 6. Fetch current target user profile to capture previous role for rollback
  const targetProfile = await deps.getTargetProfileRole(targetClerkId);
  if (!targetProfile) {
    return { success: false, error: "Target user profile not found" };
  }

  const previousRole = targetProfile.role;

  // 7. Step 1: Update Clerk publicMetadata (source of authority for identity)
  try {
    await deps.updateClerkRole(targetClerkId, role as UserRole);
  } catch (clerkErr: unknown) {
    const errMsg = clerkErr instanceof Error ? clerkErr.message : "Failed to update authentication service metadata";
    return {
      success: false,
      error: `Clerk role synchronization failed: ${errMsg}`,
    };
  }

  // 8. Step 2: Update Supabase profiles table
  const dbResult = await deps.updateDbRole(targetClerkId, role as UserRole);
  if (!dbResult.success) {
    // Attempt rollback of Clerk metadata to previous role
    let rollbackSucceeded = false;
    try {
      await deps.updateClerkRole(targetClerkId, previousRole);
      rollbackSucceeded = true;
    } catch (rollbackErr) {
      console.error("Critical: Failed to rollback Clerk metadata following database error:", rollbackErr);
    }

    return {
      success: false,
      rollbackAttempted: true,
      rollbackSucceeded,
      error: rollbackSucceeded
        ? `Database role update failed: ${dbResult.error || "Unknown database error"}`
        : `Critical sync failure: Database update failed (${dbResult.error || "Unknown error"}) and authentication rollback failed. Please review user permissions immediately.`,
    };
  }

  return { success: true };
}

export type RoleReconciliationAction =
  | { action: "PROMOTE_TO_ADMIN"; targetRole: typeof USER_ROLES.ADMIN }
  | { action: "RECONCILE_TO_USER"; targetRole: typeof USER_ROLES.USER }
  | { action: "NONE"; targetRole: UserRole };

/**
 * Determines the reconciliation action for a profile based on authoritative Clerk metadata.
 * Clerk is the sole authority for admin identity; stale DB roles must never be preserved.
 */
export function determineRoleReconciliation(
  isClerkAdmin: boolean,
  currentDbRole: UserRole
): RoleReconciliationAction {
  if (isClerkAdmin && currentDbRole !== USER_ROLES.ADMIN) {
    return { action: "PROMOTE_TO_ADMIN", targetRole: USER_ROLES.ADMIN };
  }
  if (!isClerkAdmin && currentDbRole === USER_ROLES.ADMIN) {
    return { action: "RECONCILE_TO_USER", targetRole: USER_ROLES.USER };
  }
  return { action: "NONE", targetRole: currentDbRole };
}

/**
 * Pure function: determines whether admin access should be granted, based on
 * both the Clerk publicMetadata role and the Supabase profiles role.
 *
 * Security invariants:
 * - Both sources must independently confirm 'admin'; either alone is insufficient.
 * - A stale DB 'admin' record cannot grant access when Clerk says 'user'
 *   (revocation double-failure safe state: Clerk=user, DB=admin → denied).
 * - Clerk 'admin' alone cannot grant access when the DB has not been updated
 *   (promotion double-failure safe state: Clerk=admin, DB=user → denied until
 *   ensureUserProfile() reconciles the DB on the next session sync).
 *
 * This function is deliberately free of side effects and external service calls
 * so that it can be unit-tested without mocking. isCurrentUserAdmin() is the
 * async wrapper that fetches the two inputs and calls this function.
 */
export function computeAdminAccess(
  clerkRole: unknown,
  dbRole: unknown
): boolean {
  return clerkRole === USER_ROLES.ADMIN && dbRole === USER_ROLES.ADMIN;
}
