import test from "node:test";
import assert from "node:assert/strict";
import {
  performRoleUpdate,
  determineRoleReconciliation,
  computeAdminAccess,
} from "../lib/auth/role-sync.ts";
import { USER_ROLES } from "../lib/constants/statuses.ts";

test("Runtime Test 1: Authorized admin promoting another user updates both Clerk metadata and Supabase profile", async () => {
  const clerkCalls = [];
  const dbCalls = [];

  const result = await performRoleUpdate("target_user_001", USER_ROLES.ADMIN, {
    callerUserId: "admin_user_999",
    isCallerAdmin: true,
    getTargetProfileRole: async () => ({ role: USER_ROLES.USER }),
    updateClerkRole: async (clerkId, role) => {
      clerkCalls.push({ clerkId, role });
    },
    updateDbRole: async (clerkId, role) => {
      dbCalls.push({ clerkId, role });
      return { success: true };
    },
  });

  assert.equal(result.success, true);
  assert.equal(result.error, undefined);
  assert.deepEqual(clerkCalls, [{ clerkId: "target_user_001", role: USER_ROLES.ADMIN }]);
  assert.deepEqual(dbCalls, [{ clerkId: "target_user_001", role: USER_ROLES.ADMIN }]);
});

test("Runtime Test 2: Authorized admin revoking another user's admin role updates both Clerk and Supabase to user", async () => {
  const clerkCalls = [];
  const dbCalls = [];

  const result = await performRoleUpdate("target_admin_002", USER_ROLES.USER, {
    callerUserId: "admin_user_999",
    isCallerAdmin: true,
    getTargetProfileRole: async () => ({ role: USER_ROLES.ADMIN }),
    updateClerkRole: async (clerkId, role) => {
      clerkCalls.push({ clerkId, role });
    },
    updateDbRole: async (clerkId, role) => {
      dbCalls.push({ clerkId, role });
      return { success: true };
    },
  });

  assert.equal(result.success, true);
  assert.equal(result.error, undefined);
  assert.deepEqual(clerkCalls, [{ clerkId: "target_admin_002", role: USER_ROLES.USER }]);
  assert.deepEqual(dbCalls, [{ clerkId: "target_admin_002", role: USER_ROLES.USER }]);
});

test("Runtime Test 3: Unauthorized user attempting to change a role is rejected at runtime without touching stores", async () => {
  let clerkCalled = false;
  let dbCalled = false;

  const result = await performRoleUpdate("target_user_001", USER_ROLES.ADMIN, {
    callerUserId: "regular_user_111",
    isCallerAdmin: false, // NOT admin
    getTargetProfileRole: async () => ({ role: USER_ROLES.USER }),
    updateClerkRole: async () => { clerkCalled = true; },
    updateDbRole: async () => { dbCalled = true; return { success: true }; },
  });

  assert.equal(result.success, false);
  assert.equal(result.error, "Administrative privileges required");
  assert.equal(clerkCalled, false);
  assert.equal(dbCalled, false);
});

test("Runtime Test 4: Unauthenticated caller is rejected at runtime without touching stores", async () => {
  let clerkCalled = false;
  let dbCalled = false;

  const result = await performRoleUpdate("target_user_001", USER_ROLES.ADMIN, {
    callerUserId: null, // Unauthenticated
    isCallerAdmin: false,
    getTargetProfileRole: async () => ({ role: USER_ROLES.USER }),
    updateClerkRole: async () => { clerkCalled = true; },
    updateDbRole: async () => { dbCalled = true; return { success: true }; },
  });

  assert.equal(result.success, false);
  assert.equal(result.error, "Authentication required");
  assert.equal(clerkCalled, false);
  assert.equal(dbCalled, false);
});

test("Runtime Test 5: Self-demotion is strictly rejected at runtime without modifying stores", async () => {
  let clerkCalled = false;
  let dbCalled = false;

  const result = await performRoleUpdate("admin_user_999", USER_ROLES.USER, {
    callerUserId: "admin_user_999", // Current caller is target
    isCallerAdmin: true,
    getTargetProfileRole: async () => ({ role: USER_ROLES.ADMIN }),
    updateClerkRole: async () => { clerkCalled = true; },
    updateDbRole: async () => { dbCalled = true; return { success: true }; },
  });

  assert.equal(result.success, false);
  assert.equal(result.error, "You cannot revoke your own administrator privileges");
  assert.equal(clerkCalled, false);
  assert.equal(dbCalled, false);
});

test("Runtime Test 6: Invalid roles are strictly rejected with validation error", async () => {
  const invalidRoles = ["superadmin", "moderator", "owner", "", null, undefined, 123];

  for (const invalidRole of invalidRoles) {
    let clerkCalled = false;
    let dbCalled = false;

    const result = await performRoleUpdate("target_user_001", invalidRole, {
      callerUserId: "admin_user_999",
      isCallerAdmin: true,
      getTargetProfileRole: async () => ({ role: USER_ROLES.USER }),
      updateClerkRole: async () => { clerkCalled = true; },
      updateDbRole: async () => { dbCalled = true; return { success: true }; },
    });

    assert.equal(result.success, false);
    assert.equal(result.error, "Invalid role specified. Only 'admin' and 'user' roles are supported.");
    assert.equal(clerkCalled, false, `Clerk must not be called for invalid role '${invalidRole}'`);
    assert.equal(dbCalled, false, `Database must not be called for invalid role '${invalidRole}'`);
  }
});

test("Runtime Test 7: Clerk failure leaves database intact and returns clear error", async () => {
  let dbCalled = false;

  const result = await performRoleUpdate("target_user_001", USER_ROLES.ADMIN, {
    callerUserId: "admin_user_999",
    isCallerAdmin: true,
    getTargetProfileRole: async () => ({ role: USER_ROLES.USER }),
    updateClerkRole: async () => {
      throw new Error("Clerk API connection timeout");
    },
    updateDbRole: async () => {
      dbCalled = true;
      return { success: true };
    },
  });

  assert.equal(result.success, false);
  assert.match(result.error, /Clerk role synchronization failed: Clerk API connection timeout/);
  assert.equal(dbCalled, false, "Database update must not be attempted if Clerk update fails");
});

test("Runtime Test 8: Supabase failure triggers automatic rollback of Clerk metadata", async () => {
  const clerkHistory = [];

  const result = await performRoleUpdate("target_user_001", USER_ROLES.ADMIN, {
    callerUserId: "admin_user_999",
    isCallerAdmin: true,
    getTargetProfileRole: async () => ({ role: USER_ROLES.USER }),
    updateClerkRole: async (clerkId, role) => {
      clerkHistory.push({ clerkId, role });
    },
    updateDbRole: async () => {
      return { success: false, error: "Database lock conflict" };
    },
  });

  assert.equal(result.success, false);
  assert.equal(result.rollbackAttempted, true);
  assert.equal(result.rollbackSucceeded, true);
  assert.match(result.error, /Database role update failed: Database lock conflict/);

  // Expect: 1st call set role to admin, 2nd call rolled back to previousRole (user)
  assert.deepEqual(clerkHistory, [
    { clerkId: "target_user_001", role: USER_ROLES.ADMIN },
    { clerkId: "target_user_001", role: USER_ROLES.USER },
  ]);
});

test("Runtime Test 9: Supabase failure with failed rollback reports critical sync failure", async () => {
  let callCount = 0;

  const result = await performRoleUpdate("target_user_001", USER_ROLES.ADMIN, {
    callerUserId: "admin_user_999",
    isCallerAdmin: true,
    getTargetProfileRole: async () => ({ role: USER_ROLES.USER }),
    updateClerkRole: async () => {
      callCount++;
      if (callCount > 1) {
        throw new Error("Clerk rollback service unavailable");
      }
    },
    updateDbRole: async () => {
      return { success: false, error: "Postgres connection terminated" };
    },
  });

  assert.equal(result.success, false);
  assert.equal(result.rollbackAttempted, true);
  assert.equal(result.rollbackSucceeded, false);
  assert.match(result.error, /Critical sync failure: Database update failed/);
  assert.match(result.error, /authentication rollback failed/);
});

test("Runtime Test 10: Session reconciliation revokes stale DB admin role when Clerk says not admin", () => {
  // Scenario: Admin was revoked in Clerk Dashboard (isClerkAdmin = false), but DB profile still has role = 'admin'
  const action = determineRoleReconciliation(false, USER_ROLES.ADMIN);

  assert.deepEqual(action, {
    action: "RECONCILE_TO_USER",
    targetRole: USER_ROLES.USER,
  });
});

test("Runtime Test 11: Session reconciliation promotes DB to admin when Clerk metadata says admin", () => {
  // Scenario: User was promoted in Clerk (isClerkAdmin = true), but DB profile has role = 'user'
  const action = determineRoleReconciliation(true, USER_ROLES.USER);

  assert.deepEqual(action, {
    action: "PROMOTE_TO_ADMIN",
    targetRole: USER_ROLES.ADMIN,
  });
});

test("Runtime Test 12: Session reconciliation preserves role when Clerk and DB are aligned", () => {
  const normalUser = determineRoleReconciliation(false, USER_ROLES.USER);
  assert.deepEqual(normalUser, { action: "NONE", targetRole: USER_ROLES.USER });

  const adminUser = determineRoleReconciliation(true, USER_ROLES.ADMIN);
  assert.deepEqual(adminUser, { action: "NONE", targetRole: USER_ROLES.ADMIN });
});

// ---------------------------------------------------------------------------
// Step 1B: Double-failure and admin-access-denial tests
// ---------------------------------------------------------------------------

test("Runtime Test 13: computeAdminAccess requires both Clerk and DB to confirm 'admin'", () => {
  // Only when BOTH sources agree on 'admin' is access granted.
  assert.equal(computeAdminAccess("admin", "admin"), true,  "Both admin → granted");
  assert.equal(computeAdminAccess("user",  "admin"), false, "Clerk=user → denied (revocation applied)");
  assert.equal(computeAdminAccess("admin", "user"),  false, "DB=user → denied (stale or partial failure)");
  assert.equal(computeAdminAccess(null,    "admin"), false, "No Clerk identity → denied");
  assert.equal(computeAdminAccess("admin", null),   false, "No DB profile → denied");
  assert.equal(computeAdminAccess(undefined, undefined), false, "Both absent → denied");
});

test("Runtime Test 14: Revocation double-failure state (Clerk=user, DB=admin) denies admin access", () => {
  // Scenario: Step 1 set Clerk to 'user' (success). DB update failed. Clerk rollback
  // also failed. Final Clerk state = 'user' (rollback did not apply — it threw).
  // DB remains stale at 'admin'. isCurrentUserAdmin() reads Clerk='user' → returns
  // false immediately; computeAdminAccess confirms the same.
  const clerkRole = USER_ROLES.USER;  // Clerk revocation applied; rollback failed to restore
  const dbRole    = USER_ROLES.ADMIN; // DB stale

  assert.equal(
    computeAdminAccess(clerkRole, dbRole),
    false,
    "Stale DB 'admin' cannot grant access when Clerk has revoked the role"
  );
});

test("Runtime Test 15: Promotion double-failure state (Clerk=admin, DB=user) denies admin access", () => {
  // Scenario: Step 1 set Clerk to 'admin' (success). DB update failed. Clerk rollback
  // also failed. Clerk='admin', DB='user' — the DB confirmation is missing.
  // isCurrentUserAdmin() (after the Step 1B fix) does a read-only DB check and
  // returns false because DB='user'. Access is denied until ensureUserProfile()
  // reconciles the DB on the next session sync.
  const clerkRole = USER_ROLES.ADMIN; // Clerk promotion applied
  const dbRole    = USER_ROLES.USER;  // DB never updated

  assert.equal(
    computeAdminAccess(clerkRole, dbRole),
    false,
    "Clerk 'admin' alone cannot grant access; DB must independently confirm"
  );
});

test("Runtime Test 16: Revocation - Supabase failure with successful Clerk rollback restores consistent admin state", async () => {
  // DB fails; rollback of Clerk succeeds → both stores consistent at 'admin'.
  // The revocation did not apply. The target retains admin legitimately.
  const clerkHistory = [];

  const result = await performRoleUpdate("target_admin_002", USER_ROLES.USER, {
    callerUserId: "admin_user_999",
    isCallerAdmin: true,
    getTargetProfileRole: async () => ({ role: USER_ROLES.ADMIN }),
    updateClerkRole: async (clerkId, role) => { clerkHistory.push({ clerkId, role }); },
    updateDbRole: async () => ({ success: false, error: "Database lock timeout" }),
  });

  assert.equal(result.success, false);
  assert.equal(result.rollbackAttempted, true);
  assert.equal(result.rollbackSucceeded, true);
  assert.match(result.error, /Database role update failed/);

  // Clerk was set to 'user' then rolled back to 'admin' (previousRole).
  assert.deepEqual(clerkHistory, [
    { clerkId: "target_admin_002", role: USER_ROLES.USER },
    { clerkId: "target_admin_002", role: USER_ROLES.ADMIN },
  ]);

  // After successful rollback: Clerk='admin', DB='admin' (never changed) — consistent.
  assert.equal(
    computeAdminAccess(USER_ROLES.ADMIN, USER_ROLES.ADMIN),
    true,
    "After successful rollback, consistent admin state is preserved"
  );
});

test("Runtime Test 17: Revocation double-failure (Clerk rollback throws) - Clerk stays 'user', admin access denied", async () => {
  // Supabase fails → rollback attempted → rollback throws → Clerk stays at 'user'.
  // This is the double-failure scenario. Clerk='user', DB='admin' (stale).
  const result = await performRoleUpdate("target_admin_002", USER_ROLES.USER, {
    callerUserId: "admin_user_999",
    isCallerAdmin: true,
    getTargetProfileRole: async () => ({ role: USER_ROLES.ADMIN }),
    updateClerkRole: async (_clerkId, role) => {
      // Only the revocation call (role='user') succeeds.
      // The rollback call (role='admin') throws — Clerk stays at 'user'.
      if (role === USER_ROLES.ADMIN) {
        throw new Error("Clerk rollback service unavailable");
      }
    },
    updateDbRole: async () => ({ success: false, error: "Database write failed" }),
  });

  assert.equal(result.success, false);
  assert.equal(result.rollbackAttempted, true);
  assert.equal(result.rollbackSucceeded, false);
  assert.match(result.error, /Critical sync failure/);

  // Clerk effective state: 'user' (rollback to 'admin' threw — never applied).
  // DB effective state:    'admin' (update failed — stale).
  // Admin access must be denied: stale DB cannot override Clerk's 'user' decision.
  assert.equal(
    computeAdminAccess(USER_ROLES.USER, USER_ROLES.ADMIN),
    false,
    "Double-failure: Clerk='user', DB stale 'admin' — access correctly denied"
  );
});

test("Runtime Test 18: Recovery - ensureUserProfile reconciles stale DB admin after revocation double-failure", () => {
  // After the double-failure (Clerk='user', DB='admin'), the next call to
  // ensureUserProfile() sees isClerkAdmin=false and currentDbRole='admin'.
  // determineRoleReconciliation drives the write that heals the stale record.
  const action = determineRoleReconciliation(false, USER_ROLES.ADMIN);
  assert.equal(action.action, "RECONCILE_TO_USER");
  assert.equal(action.targetRole, USER_ROLES.USER);

  // Post-reconciliation: Clerk='user', DB='user' — access denied.
  assert.equal(
    computeAdminAccess(USER_ROLES.USER, USER_ROLES.USER),
    false,
    "After DB reconciliation, admin access remains correctly denied"
  );
});

test("Runtime Test 19: Successful revocation sets both stores to 'user'; admin access permanently denied", async () => {
  // Simulate stateful stores to verify end-to-end revocation.
  const clerkStore = { "target_admin_002": USER_ROLES.ADMIN };
  const dbStore    = { "target_admin_002": USER_ROLES.ADMIN };

  const result = await performRoleUpdate("target_admin_002", USER_ROLES.USER, {
    callerUserId: "admin_user_999",
    isCallerAdmin: true,
    getTargetProfileRole: async (id) => ({ role: dbStore[id] }),
    updateClerkRole: async (clerkId, role) => { clerkStore[clerkId] = role; },
    updateDbRole:   async (clerkId, role) => { dbStore[clerkId] = role; return { success: true }; },
  });

  assert.equal(result.success, true);
  assert.equal(clerkStore["target_admin_002"], USER_ROLES.USER);
  assert.equal(dbStore["target_admin_002"],    USER_ROLES.USER);
  assert.equal(
    computeAdminAccess(clerkStore["target_admin_002"], dbStore["target_admin_002"]),
    false,
    "After successful revocation, both stores say 'user' — admin access denied"
  );
});
